import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import { once } from "node:events";
import { z } from "zod";
import { connectDB, closeDB, sql } from "../src/config/db";
import {
  parseTrip,
  finalizeTrip,
  validDate,
  anonymize,
  moderateRules,
  safeDraft,
  safeRewrite,
  cosine,
} from "../src/modules/ai/ai.rules";
import * as service from "../src/modules/ai/ai.service";
import * as repo from "../src/modules/ai/ai.repository";
import { aiRouter } from "../src/modules/ai/ai.routes";
import {
  cached,
  structured,
  aiMetrics,
  geminiClient,
  fingerprint,
} from "../src/Ai/runtime";

test("Mô tả 3N2Đ, 5tr5, hai khách và ngày mai được điền đúng; không tự đặt ngày", () => {
  const trip = parseTrip(
    "Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, ngày mai",
    "2026-11-03",
  );
  assert.equal(trip.days, 3);
  assert.equal(trip.guests, 2);
  assert.equal(trip.budget, 5500000);
  assert.equal(trip.start_date, "2026-11-04");
  assert.deepEqual(trip.missing, []);
  assert.ok(trip.needs.includes("food"));
  assert.ok(trip.needs.includes("sight"));
  assert.equal(
    parseTrip("Đi du lịch 2 ngày ngân sách 5 triệu").start_date,
    null,
  );
  assert.equal(parseTrip("Viết code Python").off_topic, true);
});

test("Ngân sách mỗi khách/mỗi ngày chỉ quy đổi khi biết số khách/số ngày", () => {
  assert.equal(parseTrip("Đi 2 ngày, 3 người, 500k mỗi người").budget, 1500000);
  assert.equal(parseTrip("Đi 2 ngày, 500k mỗi ngày").budget, 1000000);
  assert.equal(parseTrip("Đi du lịch 500k mỗi người").budget, null);
  assert.equal(parseTrip("Đi 1 ngày ngân sách 100.000 đồng").budget, 100000);
});

test("Ngày không tồn tại, ngày quá khứ và dữ liệu âm/lẻ không hợp lệ", () => {
  assert.equal(validDate("2026-02-30"), null);
  assert.equal(parseTrip("Đi 7 ngày").days, null);
  assert.equal(validDate("2028-02-29"), "2028-02-29");
  const result = finalizeTrip(
    {
      ...parseTrip("Đi 1 ngày"),
      days: 1.5,
      guests: -2,
      budget: -100,
      start_date: "2026-01-01",
    },
    "2026-11-03",
  );
  assert.deepEqual(result.missing, ["days", "guests", "budget", "start_date"]);
});

test("Ẩn tên và thông tin liên hệ trước khi gửi ý kiến khảo sát cho model", () => {
  const text = anonymize(
    "Nguyễn Văn An, email an@example.com, 0901234567. địa chỉ: số 12 đường ABC",
  );
  assert.doesNotMatch(text, /Nguyễn Văn An|an@example.com|0901234567|số 12/);
});

test("Nhận xét tiêu cực hợp lệ không bị đánh đồng với spam", () => {
  assert.deepEqual(
    moderateRules([
      {
        id: 1,
        rating: 1,
        content: "Món ăn nguội, phục vụ chậm, tôi không hài lòng.",
      },
    ]).items,
    [],
  );
  const result = moderateRules([
    {
      id: 2,
      rating: 5,
      content: "Mua ngay https://spam.test liên hệ 0901234567",
    },
  ]);
  assert.ok(result.items[0]!.flags.includes("personal_info"));
  assert.ok(result.items[0]!.flags.includes("advertising"));
});

test("Không dùng nháp có hứa hoàn tiền, bịa tiện ích, giá hay thông tin liên hệ", () => {
  for (const draft of [
    "Chúng tôi sẽ hoàn tiền",
    "Có hồ bơi riêng",
    "Giá chỉ 10.000đ",
    "Gọi 0901234567",
    "Gửi tới a@example.com",
  ])
    assert.equal(safeDraft(draft), false);
  assert.equal(safeDraft("Có hồ bơi", "Có hồ bơi"), true);
  assert.equal(safeDraft("Cảm ơn quý khách đã chia sẻ trải nghiệm."), true);
});

test("Viết lại từ khóa giữ con số, quận và điều kiện ban đầu", () => {
  assert.equal(
    safeRewrite("hai san 100k son tra", "hải sản 100k Sơn Trà"),
    true,
  );
  assert.equal(safeRewrite("hai san 100k", "hải sản 200k"), false);
  assert.equal(safeRewrite("hai san", "hải sản tại Hải Châu"), false);
  assert.equal(safeRewrite("khach san", "khách sạn view biển miễn phí"), false);
});

test("Cosine chịu được vector lỗi và chỉ so sánh cùng chiều", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  for (const values of [[], [0, 0], [NaN, 1], [1]])
    assert.equal(cosine([1, 0], values), 0);
});

test("Cache gộp yêu cầu trùng, sao chép dữ liệu và không cache lỗi", async () => {
  let calls = 0;
  const load = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 5));
    return { items: [1] };
  };
  const [a, b] = await Promise.all([
    cached("test-singleflight", 1, 1000, load),
    cached("test-singleflight", 1, 1000, load),
  ]);
  a.items.push(2);
  assert.deepEqual(b.items, [1]);
  assert.equal(calls, 1);
  let attempts = 0;
  await assert.rejects(
    cached("test-failure", 1, 1000, async () => {
      attempts++;
      throw new Error("failed");
    }),
  );
  await cached("test-failure", 1, 1000, async () => {
    attempts++;
    return true;
  });
  assert.equal(attempts, 2);
});

test("API mới từ chối khách ở các vùng cần quyền, kiểm tra schema trước SQL", async () => {
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/ai", aiRouter);
  app.use((error: any, _req: any, res: any, _next: any) =>
    res.status(error.statusCode || 500).json({ message: error.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/ai`;
  try {
    for (const path of [
      "/itinerary",
      "/partner/reviews/1/draft",
      "/partner/reviews/1/reply",
      "/admin/moderation",
      "/admin/embeddings/sync",
    ]) {
      assert.equal(
        (
          await fetch(base + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          })
        ).status,
        401,
      );
    }
    assert.equal((await fetch(base + "/admin/metrics")).status, 401);
    assert.equal((await fetch(base + "/places/not-an-id/similar")).status, 400);
    assert.equal(
      (
        await fetch(base + "/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "hai san", userId: 1 }),
        })
      ).status,
      400,
    );
  } finally {
    server.close();
    server.closeAllConnections();
  }
});

test("Tóm tắt và khảo sát đếm bằng dữ liệu thật, trả dự phòng khi không có khóa", async (t) => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
  const reviews = Array.from({ length: 5 }, (_, i) => ({
    review_id: i + 1,
    rating: i < 3 ? 5 : 1,
    comment: i < 3 ? "Món ngon, giá hợp lý" : "Phục vụ chậm",
    updated_at: null,
  }));
  const pool = {
    request() {
      const params: Record<string, unknown> = {};
      return {
        input(name: string, _type: unknown, value: unknown) {
          params[name] = value;
          return this;
        },
        async query(text: string) {
          queries.push({ text, params });
          if (
            text.includes("status='ACTIVE'") &&
            text.includes("WHERE place_id=@id")
          )
            return {
              recordset:
                params.id === 404
                  ? []
                  : [
                      {
                        place_id: params.id,
                        name: "Cơ sở thật",
                        place_type: "RESTAURANT",
                        description: "",
                        district_id: 1,
                      },
                    ],
            };
          if (text.includes("SELECT TOP (100) review_id"))
            return {
              recordset: params.id === 2 ? reviews.slice(0, 4) : reviews,
            };
          if (text.includes("COUNT(*) AS total"))
            return { recordset: [{ total: params.id === 2 ? 4 : 50 }] };
          if (text.includes("SELECT title FROM dbo.surveys"))
            return { recordset: [{ title: "Khảo sát thật" }] };
          if (text.includes("SELECT TOP (100) a.answer_id"))
            return {
              recordset: [
                {
                  answer_id: 11,
                  answer_text: "Phục vụ chậm. An email an@example.com",
                  content: "Ý kiến",
                },
                {
                  answer_id: 12,
                  answer_text: "Phục vụ thân thiện",
                  content: "Ý kiến",
                },
              ],
            };
          if (text.includes("AS average_score"))
            return {
              recordset: [
                { responses: 20, rating_count: 18, average_score: 4.25 },
              ],
            };
          if (text.includes("MERGE dbo.partner_review_replies"))
            return {
              recordset:
                params.partnerId === 10 ? [{ review_id: params.reviewId }] : [],
            };
          return { recordset: [] };
        },
      };
    },
    async close() {},
  };
  t.mock.method(sql, "connect", async () => pool as never);
  const oldKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  await connectDB();
  try {
    assert.equal((await service.reviewSummary(2)).mode, "insufficient");
    await assert.rejects(
      service.reviewSummary(404),
      (error: any) => error.status === 404,
    );
    const summary = await service.reviewSummary(1);
    assert.equal(summary.mode, "fallback");
    assert.equal(summary.totalReviews, 50);
    assert.equal(summary.sampleCount, 5);
    assert.deepEqual(summary.sentiment, {
      positive: 3,
      neutral: 0,
      negative: 2,
    });
    assert.ok(summary.strengths.some((s) => s.includes("3 đánh giá")));
    assert.ok(summary.weaknesses.some((s) => s.includes("2 đánh giá")));
    const report = await service.surveyReport(1);
    assert.equal(report.stats.responses, 20);
    assert.equal(report.stats.average_score, 4.25);
    assert.equal(
      report.themes.find((theme) => theme.name === "phục vụ")?.mentions,
      2,
    );
    assert.equal(await repo.saveReply(1, 10, "Nháp' thật"), true);
    assert.equal(await repo.saveReply(1, 99, "Không có quyền"), false);
    const merge = queries.find((q) =>
      q.text.includes("MERGE dbo.partner_review_replies"),
    )!;
    assert.match(merge.text, /p.partner_id=@partnerId/);
    assert.match(merge.text, /r.status='APPROVED'/);
    assert.match(merge.text, /pp.approval_status='APPROVED'/);
    assert.equal(merge.params.text, "Nháp' thật");
    assert.ok(!merge.text.includes("Nháp' thật"));
    await repo.ownedReview(1, 42);
    assert.match(queries[queries.length - 1]!.text, /pp.user_id=@userId/);
    const trip = await service.itinerary(
      "Đi 3N2Đ cùng bạn gái, ngân sách 5tr5 ngày mai",
    );
    assert.equal(trip.request.budget, 5500000);
    const schema = z.object({ ok: z.boolean() });
    assert.equal(
      await structured(
        "test-no-key",
        {
          system: "",
          user: "",
          history: [],
          config: { temperature: 0, maxOutputTokens: 20 },
        } as never,
        schema,
      ),
      null,
    );
    assert.equal(aiMetrics().keyConfigured, false);
    assert.ok(!JSON.stringify(aiMetrics()).includes("Nháp"));
  } finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
    await closeDB();
  }
});

test("Bỏ ID do model bịa, không dùng lời tóm tắt tự sinh, chỉ lưu embedding hợp lệ", async (t) => {
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key-no-network";
  const client = await geminiClient();
  let response = "";
  t.mock.method(client.models, "generateContent", async () => ({
    text: response,
  }));
  let badVector = true,
    embedCalls = 0,
    vectorWrites = 0;
  t.mock.method(client.models, "embedContent", async (input: any) => {
    embedCalls++;
    assert.equal(input.config.outputDimensionality, 768);
    return {
      embeddings: input.contents.map(() => ({
        values: badVector
          ? [1, 2]
          : Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0)),
      })),
    };
  });
  const active = {
    place_id: 701,
    name: "Địa điểm công khai",
    place_type: "RESTAURANT",
    description: "Mì Quảng",
    district_id: 1,
  };
  let stored: any[] = [];
  const pool = {
    request() {
      const params: Record<string, unknown> = {};
      return {
        input(name: string, _type: unknown, value: unknown) {
          params[name] = value;
          return this;
        },
        async query(text: string) {
          if (
            text.includes("FROM dbo.places WHERE") &&
            text.includes("ORDER BY place_id")
          )
            return { recordset: [active] };
          if (text.includes("SELECT v.place_id")) return { recordset: stored };
          if (text.includes("MERGE dbo.ai_place_vectors")) {
            vectorWrites++;
            stored = [
              {
                place_id: params.id,
                content_hash: params.hash,
                model: params.model,
                embedding_json: params.vector,
              },
            ];
            return { recordset: [] };
          }
          if (text.includes("FROM dbo.places WHERE place_id=@id"))
            return { recordset: [active] };
          if (text.includes("TOP (100) review_id"))
            return {
              recordset: Array.from({ length: 5 }, (_, i) => ({
                review_id: i + 1,
                rating: 5,
                comment: "Món ngon",
                updated_at: null,
              })),
            };
          if (text.includes("COUNT(*) AS total"))
            return { recordset: [{ total: 5 }] };
          if (text.includes("SELECT title FROM"))
            return { recordset: [{ title: "Ý kiến" }] };
          if (text.includes("TOP (100) a.answer_id"))
            return {
              recordset: [
                {
                  answer_id: 1,
                  content: "Ý kiến",
                  answer_text: "Phục vụ chậm",
                },
              ],
            };
          if (text.includes("AS average_score"))
            return {
              recordset: [
                { responses: 1, rating_count: 0, average_score: null },
              ],
            };
          return { recordset: [] };
        },
      };
    },
    async close() {},
  };
  t.mock.method(sql, "connect", async () => pool as never);
  await connectDB();
  try {
    response = JSON.stringify({
      strengths: ["Buffet miễn phí"],
      weaknesses: [],
      summary: "Bịa giá và địa chỉ",
      labels: [
        { review_id: 999, sentiment: "negative", topics: ["gia"] },
        {
          review_id: 1,
          sentiment: "positive",
          topics: ["huong_vi", "huong_vi"],
        },
      ],
    });
    const summary = await service.reviewSummary(701);
    assert.deepEqual(summary.sentiment, {
      positive: 5,
      negative: 0,
      neutral: 0,
    });
    assert.doesNotMatch(JSON.stringify(summary), /Buffet|Bịa|999/);
    assert.equal(summary.strengths.length, 1);
    assert.match(summary.strengths[0]!, /5 đánh giá/);
    response = JSON.stringify({
      overview: "Bịa 999 lượt",
      themes: [
        {
          name: "Phục vụ",
          sentiment: "negative",
          summary: "",
          answer_ids: [1, 1, 999],
        },
      ],
      top_issues: ["Giá 1đ"],
    });
    const report = await service.surveyReport(701);
    assert.equal(report.themes[0]?.mentions, 1);
    assert.deepEqual(report.themes[0]?.answerIds, [1]);
    assert.doesNotMatch(JSON.stringify(report), /999|Giá 1đ/);
    response = JSON.stringify({ draft: "Chúng tôi sẽ hoàn tiền và tặng quà" });
    // Description has a different schema: invalid model JSON must use the notes, not crash.
    const description = await service.description(
      "Quán thật",
      "food",
      "Bán mì Quảng. Không gian nhỏ.",
    );
    assert.equal(description.mode, "fallback");
    assert.doesNotMatch(description.description, /hoàn tiền/);
    response = JSON.stringify({ query: "Hải sản miễn phí tại Sơn Trà 200k" });
    assert.equal((await service.rewrite("hai san 100k")).query, "hải sản 100k");
    await assert.rejects(
      service.syncEmbeddings(),
      (e: any) => e.status === 503,
    );
    assert.equal(vectorWrites, 0);
    badVector = false;
    assert.equal((await service.syncEmbeddings()).saved, 1);
    assert.equal(vectorWrites, 1);
    assert.equal(
      stored[0].content_hash,
      fingerprint("RESTAURANT\nĐịa điểm công khai\nMì Quảng\n1"),
    );
    assert.equal((await service.syncEmbeddings()).saved, 0);
    assert.equal(embedCalls, 2);
  } finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
    await closeDB();
  }
});
