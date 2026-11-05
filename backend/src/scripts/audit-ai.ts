/** Read-only live audit. Chat data uses a separate, temporary guest identity. */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { connectDB, closeDB, getPool } from "../config/db";
import { processUserMessage } from "../modules/chat/chat.service";
import { guests } from "../modules/chat/chat.sessions";
import * as ai from "../modules/ai/ai.service";
import * as repo from "../modules/ai/ai.repository";
import { runEmbedding, aiMetrics } from "../Ai/runtime";
import type { ChatMessageDto } from "../modules/chat/chat.types";

type Row = {
  id: number;
  name: string;
  input: string;
  status: "PASS" | "FAIL" | "LIMITED";
  ms: number;
  result: unknown;
  error?: string;
};
const rows: Row[] = [];
async function check(name: string, input: string, run: () => Promise<unknown>) {
  const start = Date.now();
  try {
    const result = await run();
    rows.push({
      id: rows.length + 1,
      name,
      input,
      status: "PASS",
      ms: Date.now() - start,
      result,
    });
  } catch (e) {
    rows.push({
      id: rows.length + 1,
      name,
      input,
      status: "FAIL",
      ms: Date.now() - start,
      result: null,
      error: e instanceof Error ? e.message : "Lỗi chưa xác định",
    });
  }
  console.log(JSON.stringify(rows[rows.length - 1]));
}
function expect(ok: unknown, why: string): asserts ok {
  if (!ok) throw new Error(why);
}
async function chat(
  message: string,
  sessionId?: number,
  guestId = randomUUID(),
) {
  const r = await processUserMessage({ message, sessionId, guestId });
  return r;
}
const compact = (m: ChatMessageDto) => ({
  text: m.content,
  places: m.places?.map((p) => ({
    id: p.placeId,
    name: p.name,
    type: p.placeType,
    price: p.priceText,
    distanceKm: p.distanceKm,
  })),
  plan: m.travelPlan
    ? {
        days: m.travelPlan.dayCount,
        guests: m.travelPlan.guestCount,
        budget: m.travelPlan.budget,
        date: m.travelPlan.startDate,
        periods: m.travelPlan.days.map((d) => d.periods.map((p) => p.label)),
        costs: m.travelPlan.costs,
      }
    : undefined,
});
async function main() {
  await connectDB();
  try {
    await check(
      "Tham quan miễn phí",
      "Gợi ý các điểm tham quan miễn phí ở Đà Nẵng",
      async () => {
        const r = await chat("Gợi ý các điểm tham quan miễn phí ở Đà Nẵng");
        expect(r.message.places?.length, "Không tìm thấy thẻ tham quan");
        expect(
          r.message.places.every(
            (p) => p.placeType === "ATTRACTION" && p.priceText === "Miễn phí",
          ),
          "Sai loại hoặc có vé trả phí",
        );
        return compact(r.message);
      },
    );
    await check(
      "Ẩm thực/quận/giá",
      "Quán hải sản Sơn Trà dưới 300k",
      async () => {
        const r = await chat("Quán hải sản Sơn Trà dưới 300k");
        expect(r.message.places?.length, "Không có quán trong dữ liệu");
        expect(
          r.message.places.every(
            (p) => p.placeType === "RESTAURANT" && p.districtName === "Sơn Trà",
          ),
          "Lọc sai loại/quận",
        );
        return compact(r.message);
      },
    );
    await check("Khẩu vị", "Gợi ý món ăn thanh đạm", async () => {
      const r = await chat("Gợi ý món ăn thanh đạm");
      expect(r.message.places?.length, "Không có món gắn nhãn");
      return compact(r.message);
    });
    await check("Khách sạn", "Khách sạn gần biển Mỹ Khê", async () => {
      const r = await chat("Khách sạn gần biển Mỹ Khê");
      expect(
        r.message.places?.every((p) => p.placeType === "ACCOMMODATION") &&
          r.message.places.length,
        "Sai loại hoặc không tìm thấy khách sạn",
      );
      return compact(r.message);
    });
    const owner = randomUUID();
    let planSession: number;
    await check(
      "Lịch trình đầy đủ",
      "Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai.",
      async () => {
        const r = await chat(
          "Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai.",
          undefined,
          owner,
        );
        planSession = r.sessionId;
        const p = r.message.travelPlan;
        expect(
          p && p.dayCount === 3 && p.guestCount === 2 && p.budget === 5500000,
          "Đọc sai thông tin chuyến đi",
        );
        expect(
          p.days.every((d) => d.periods.length === 4),
          "Thiếu buổi",
        );
        return compact(r.message);
      },
    );
    await check(
      "Đổi khách sạn giữ ngữ cảnh",
      "Đổi khách sạn tiết kiệm hơn",
      async () => {
        const r = await chat("Đổi khách sạn tiết kiệm hơn", planSession, owner);
        expect(
          r.message.travelPlan?.dayCount === 3 &&
            r.message.travelPlan.guestCount === 2,
          "Mất ngữ cảnh",
        );
        return compact(r.message);
      },
    );
    await check(
      "Nhớ lịch trình sau nhiều lượt",
      "8 lần điều chỉnh liên tiếp rồi đổi khách sạn",
      async () => {
        let last;
        for (let i = 0; i < 8; i++)
          last = await chat(
            i % 2
              ? "Ưu tiên điểm check-in chụp hình"
              : "Đổi khách sạn tiết kiệm hơn",
            planSession,
            owner,
          );
        expect(
          last?.message.travelPlan?.dayCount === 3 &&
            last.message.travelPlan.guestCount === 2 &&
            last.message.travelPlan.budget === 5500000,
          "Mất số ngày/số khách/ngân sách sau nhiều lượt",
        );
        return compact(last!.message);
      },
    );
    await check("Lịch thiếu thông tin", "Tôi muốn đi biển 2 ngày", async () => {
      const r = await chat("Tôi muốn đi biển 2 ngày");
      const p = r.message.travelPlan;
      expect(
        p && p.guestCount === null && p.budget === null && p.startDate === null,
        "Tự điền thông tin chưa cung cấp",
      );
      return compact(r.message);
    });
    await check(
      "Vượt phạm vi 3 ngày",
      "Lên lịch trình 7 ngày cho 2 người",
      async () => {
        const r = await chat("Lên lịch trình 7 ngày cho 2 người");
        expect(
          !r.message.travelPlan,
          "Yêu cầu 7 ngày bị âm thầm biến thành lịch 1 ngày",
        );
        return compact(r.message);
      },
    );
    await check("GPS chưa cấp", "Quán ăn quanh vị trí tôi", async () => {
      const r = await chat("Quán ăn quanh vị trí tôi");
      expect(
        !r.message.places?.length &&
          r.message.content.includes("Quanh vị trí tôi"),
        "Không yêu cầu vị trí hoặc gợi ý xa khi chưa có GPS",
      );
      return compact(r.message);
    });
    await check(
      "GPS dùng tọa độ công khai",
      "Quán ăn quanh vị trí tôi, tâm Đà Nẵng, 2km",
      async () => {
        const r = await processUserMessage({
          message: "Quán ăn quanh vị trí tôi",
          guestId: randomUUID(),
          location: { latitude: 16.0544, longitude: 108.2022, radiusKm: 2 },
        });
        expect(r.message.places?.length, "Không có kết quả 2km");
        expect(
          r.message.places.every(
            (p) => p.distanceKm != null && p.distanceKm <= 2,
          ),
          "Kết quả ngoài bán kính",
        );
        return compact(r.message);
      },
    );
    await check("Ngoài chủ đề", "Viết hàm Python giải Dijkstra", async () => {
      const r = await chat("Viết hàm Python giải Dijkstra");
      expect(
        !r.message.places?.length && !r.message.travelPlan,
        "Từ chối ngoài chủ đề không đúng",
      );
      return compact(r.message);
    });
    await check(
      "Không bịa dữ liệu trực tiếp",
      "Thời tiết Đà Nẵng hôm nay thế nào?",
      async () => {
        const r = await chat("Thời tiết Đà Nẵng hôm nay thế nào?");
        expect(
          r.message.content.includes("chưa tích hợp dữ liệu thời tiết"),
          "Không giải thích thiếu dữ liệu thời tiết",
        );
        return compact(r.message);
      },
    );
    await check("Hiểu lại từ khóa", "homstay Mỹ Khê dưới 500k", async () => {
      const r = await ai.rewrite("homstay Mỹ Khê dưới 500k");
      expect(
        r.query.includes("homestay") && r.query.includes("500"),
        "Không sửa đúng lỗi chính tả/giữ giá",
      );
      return r;
    });
    await check(
      "Wizard điền lịch trình",
      "Đi 3N2Đ cùng bạn gái, ngân sách 5tr5 ngày mai",
      async () => {
        const r = await ai.itinerary(
          "Đi 3N2Đ cùng bạn gái, ngân sách 5tr5 ngày mai",
        );
        expect(
          r.request.days === 3 &&
            r.request.guests === 2 &&
            r.request.budget === 5500000,
          "Wizard đọc sai",
        );
        return r;
      },
    );
    await check(
      "Nháp mô tả",
      "Quán kiểm thử, bán mì Quảng, không gian nhỏ, có chỗ ngồi trong nhà.",
      async () => {
        const r = await ai.description(
          "Quán kiểm thử",
          "food",
          "Bán mì Quảng. Không gian nhỏ. Có chỗ ngồi trong nhà.",
        );
        expect(
          !/24\/7|hoàn tiền|wifi miễn phí/i.test(r.description),
          "Bịa tiện ích",
        );
        return r;
      },
    );
    const places = await getPool()
      .request()
      .query(
        "SELECT TOP(1) p.place_id,COUNT(r.review_id) AS n FROM dbo.places p LEFT JOIN dbo.reviews r ON r.place_id=p.place_id AND r.status='APPROVED' WHERE p.status='ACTIVE' GROUP BY p.place_id ORDER BY COUNT(r.review_id) DESC",
      );
    const placeId = places.recordset[0]?.place_id;
    await check("Tổng hợp đánh giá", `Địa điểm #${placeId}`, async () => {
      const r = await ai.reviewSummary(placeId);
      if (r.mode === "insufficient")
        return {
          ...r,
          limited:
            "Chưa có ít nhất 5 đánh giá đã duyệt để kiểm tra tổng hợp thật",
        };
      expect(
        r.sentiment.positive + r.sentiment.neutral + r.sentiment.negative ===
          r.sampleCount,
        "Tổng đếm sai",
      );
      return r;
    });
    await check("Địa điểm tương tự", `Địa điểm #${placeId}`, async () => {
      const r = await ai.similar(placeId);
      expect(!r.items.some((p) => p.placeId === placeId), "Tự gợi ý chính nó");
      expect(
        r.items.every((p) => p.placeType === r.items[0]?.placeType),
        "Khác loại",
      );
      return {
        method: r.method,
        items: r.items.map((p) => ({
          id: p.placeId,
          name: p.name,
          type: p.placeType,
        })),
      };
    });
    const reviews = await getPool()
      .request()
      .query(
        "SELECT TOP(1) r.review_id,pp.user_id FROM dbo.reviews r JOIN dbo.places p ON p.place_id=r.place_id JOIN dbo.partner_profiles pp ON pp.partner_id=p.partner_id WHERE r.status='APPROVED' ORDER BY r.review_id",
      );
    await check(
      "Nháp trả lời đối tác",
      "Đọc đánh giá thuộc đối tác, không gửi phản hồi",
      async () => {
        if (!reviews.recordset.length)
          return {
            limited: "Không có đánh giá gắn đối tác để thử dữ liệu thật",
          };
        const x = reviews.recordset[0];
        const r = await ai.replyDraft(x.review_id, x.user_id);
        return { mode: r.mode, notice: r.notice, draftLength: r.draft.length };
      },
    );
    await check(
      "Kiểm duyệt không tự đổi trạng thái",
      "Phân tích 1 đánh giá có sẵn",
      async () => {
        if (!reviews.recordset.length)
          return { limited: "Chưa có dữ liệu đánh giá gắn đối tác" };
        return ai.moderation([reviews.recordset[0].review_id]);
      },
    );
    await check(
      "Khảo sát thật",
      "Đọc danh sách và báo cáo khảo sát",
      async () => {
        const list = await repo.surveys();
        if (!list.length)
          return { limited: "Không có khảo sát SQL để phân tích" };
        const r = await ai.surveyReport(list[0]!.survey_id);
        return { mode: r.mode, stats: r.stats, sampleCount: r.sampleCount };
      },
    );
    await check(
      "Embedding nhà cung cấp",
      "Một văn bản công khai, không lưu vector SQL",
      async () => {
        const r = await runEmbedding(
          process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
          ["Du lịch Đà Nẵng"],
        );
        if (!r)
          return {
            limited:
              "Nhà cung cấp chưa trả embedding. Không xác nhận đồng bộ vector thành công.",
          };
        expect(r.embeddings?.[0]?.values?.length === 768, "Vector sai chiều");
        return { dimensions: r.embeddings[0].values.length };
      },
    );
    await check(
      "Lịch sử khách cách ly",
      "Người khác không đọc được phiên thử",
      async () => {
        let denied = false;
        try {
          guests.messages(planSession!, randomUUID());
        } catch {
          denied = true;
        }
        expect(denied, "Lộ lịch sử");
        return {
          ownConversations: guests.list(owner).length,
          otherConversations: guests.list(randomUUID()).length,
        };
      },
    );
  } finally {
    await closeDB();
    for (const row of rows)
      if (
        row.status === "PASS" &&
        row.result &&
        typeof row.result === "object" &&
        "limited" in row.result
      )
        row.status = "LIMITED";
    const report = {
      createdAt: new Date().toISOString(),
      environment:
        "SQL local, tạm guest, không gửi phản hồi/đặt dịch vụ/lưu lịch trình",
      metrics: aiMetrics(),
      rows,
    };
    writeFileSync(
      "../docs/AI-AUDIT-RESULTS.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    if(rows.some(row=>row.status==="FAIL"))process.exitCode=1;
    console.log(
      "REPORT",
      rows.reduce(
        (a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a),
        {} as Record<string, number>,
      ),
    );
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Audit thất bại");
  process.exitCode = 1;
});
