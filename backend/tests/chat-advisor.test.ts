import test from "node:test";
import assert from "node:assert/strict";
import { connectDB, closeDB, sql } from "../src/config/db";
import {
  ruleIntent,
  resolveChatRequest,
  tripBrief,
} from "../src/modules/chat/chat.intent";
import { buildTravelPlan } from "../src/modules/chat/chat.advisor";
import {
  searchPlacesForChat,
  type PlaceSearchRow,
} from "../src/modules/chat/chat.repository";
import { processUserMessage } from "../src/modules/chat/chat.service";
import {
  readAdvisorTurn,
  writeAdvisorTurn,
} from "../src/modules/chat/chat.advisor-state";

const makePlace = (
  id: number,
  type: PlaceSearchRow["placeType"],
  price: number | null,
  name: string,
): PlaceSearchRow => ({
  placeId: id,
  name,
  placeType: type,
  address: "Địa chỉ từ DB",
  districtName: "Hải Châu",
  priceMin: price,
  priceMax: price,
  priceText: price === null ? null : price === 0 ? "Miễn phí" : `${price}đ`,
  description: null,
  rating: 4,
  reviewCount: 2,
  detailUrl: `/places/${id}`,
  latitude: 16.06,
  longitude: 108.22,
  roomCapacity: type === "ACCOMMODATION" ? 2 : null,
});

test("Không nhận nhầm chữ “tham quan” và “Đà Nẵng” thành quán ăn", () => {
  for (const query of [
    "Gợi ý các điểm tham quan miễn phí ở Đà Nẵng.",
    "Các điểm tham quan",
    "Điểm check-in chụp hình",
    "Địa điểm miễn phí vé",
  ]) {
    assert.equal(ruleIntent(query).category, "sight", query);
  }
  assert.equal(
    ruleIntent("Gợi ý các điểm tham quan miễn phí ở Đà Nẵng.").budget,
    0,
  );
  assert.equal(ruleIntent("Quán hải sản gần biển Mỹ Khê").category, "food");
  assert.equal(ruleIntent("Khách sạn gần biển Mỹ Khê").category, "stay");
  assert.equal(ruleIntent("Viết code Python").category, "off_topic");
});

test("Chuyển chủ đề không kéo ngân sách/quận từ quán ăn sang tham quan", () => {
  const result = resolveChatRequest(
    "Gợi ý các điểm tham quan miễn phí ở Đà Nẵng.",
    ["Quán hải sản ở Hải Châu dưới 300k"],
  );
  assert.equal(result.intent.category, "sight");
  assert.equal(result.intent.district, null);
  assert.equal(result.intent.budget, 0);
  const followup = resolveChatRequest("Có chỗ nào rẻ hơn không?", [
    "Khách sạn ở Sơn Trà dưới 1 triệu",
  ]);
  assert.equal(followup.intent.category, "stay");
  assert.equal(followup.intent.district, "Sơn Trà");
  assert.equal(followup.cheap, true);
});

test("Hiểu câu đi 3N2Đ và giữ thông tin khi đổi khách sạn/điểm tham quan", () => {
  const original =
    "Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai.";
  assert.equal(resolveChatRequest(original, []).trip, true);
  assert.equal(
    resolveChatRequest("Đổi khách sạn tiết kiệm hơn", [original]).trip,
    true,
  );
  const brief = tripBrief(
    "Thêm điểm check-in chụp hình",
    [original, "Đổi sang các điểm tham quan miễn phí"],
    "2026-11-04",
  );
  assert.equal(brief.request.days, 3);
  assert.equal(brief.request.guests, 2);
  assert.equal(brief.request.budget, 5500000);
  assert.equal(brief.request.start_date, "2026-11-05");
  assert.equal(brief.freeOnly, true);
  assert.equal(
    tripBrief("Có phí cũng được", [
      original,
      "Đổi sang các điểm tham quan miễn phí",
    ]).freeOnly,
    false,
  );
  const fresh = tripBrief("Lên lịch trình 1 ngày cho 4 người", [original]);
  assert.equal(fresh.request.days, 1);
  assert.equal(fresh.request.guests, 4);
  assert.equal(fresh.request.budget, null);
});

test("Lịch ba ngày có bốn buổi, đúng loại địa điểm, vé/tiền phòng tính từ DB", () => {
  const brief = tripBrief(
    "Đi 3N2Đ cùng bạn gái, tổng ngân sách 5tr5 ngày mai",
    [],
    "2026-11-04",
  );
  const sights = Array.from({ length: 6 }, (_, i) =>
    makePlace(i + 1, "ATTRACTION", i === 0 ? 100000 : 0, `Điểm DB ${i + 1}`),
  );
  const food = Array.from({ length: 9 }, (_, i) =>
    makePlace(i + 20, "RESTAURANT", 30000, `Mì Quảng DB ${i + 1}`),
  );
  const plan = buildTravelPlan(brief.request, brief.text, {
    sights,
    food,
    stays: [makePlace(50, "ACCOMMODATION", 400000, "Khách sạn DB")],
  });
  assert.equal(plan.days.length, 3);
  assert.equal(plan.guestCount, 2);
  assert.equal(plan.budget, 5500000);
  assert.equal(plan.days[0]!.date, "2026-11-05");
  assert.equal(plan.days[2]!.date, "2026-11-07");
  const visits: number[] = [];
  for (const day of plan.days) {
    assert.deepEqual(
      day.periods.map((p) => p.label),
      ["Sáng", "Trưa", "Chiều", "Tối"],
    );
    for (const period of day.periods)
      for (const item of period.items) {
        if (item.place) {
          assert.equal(item.place.detailUrl, `/places/${item.place.placeId}`);
          if (item.title.includes("Ăn"))
            assert.equal(item.place.placeType, "RESTAURANT");
          if (item.title.includes("chụp") || item.title.includes("check-in")) {
            assert.equal(item.place.placeType, "ATTRACTION");
            visits.push(item.place.placeId);
          }
        }
      }
  }
  assert.equal(new Set(visits).size, 6);
  assert.equal(plan.costs.accommodation, 800000);
  assert.equal(plan.costs.tickets, 200000);
  assert.equal(plan.costs.knownSubtotal, 1000000);
  assert.match(plan.costs.roomNote, /1 phòng × 2 đêm/);
  assert.ok(plan.notes.some((n) => n.includes("không phải chi phí một bữa")));
  assert.equal(
    plan.groups.find((g) => g.title.startsWith("Lưu trú"))?.places[0]
      ?.placeType,
    "ACCOMMODATION",
  );
});

test("Thiếu dữ liệu phải để trống, không bịa địa điểm hoặc tổng giá", () => {
  const brief = tripBrief("Lên lịch trình Đà Nẵng", []);
  const plan = buildTravelPlan(brief.request, brief.text, {
    sights: [],
    food: [],
    stays: [],
  });
  assert.equal(plan.dayCount, 1);
  assert.equal(plan.guestCount, null);
  assert.equal(plan.costs.tickets, null);
  assert.equal(plan.groups.length, 0);
  assert.ok(plan.assumptions.length >= 3);
  assert.ok(plan.notes.some((n) => n.includes("0/2")));
  assert.ok(
    plan.days[0]!.periods.flatMap((p) => p.items).every((i) => !i.place),
  );
});

test("Điểm cần cả ngày không bị nhét vào buổi chiều; không ghép hai điểm quá xa", () => {
  const brief = tripBrief("Lịch trình 1 ngày ở Bà Nà, 2 người", []);
  const remote = {
    ...makePlace(1, "ATTRACTION", 500000, "Bà Nà từ DB"),
    latitude: 15.99,
    longitude: 107.99,
    visitDurationMinutes: 360,
  };
  const central = makePlace(2, "ATTRACTION", 0, "Điểm trung tâm");
  const plan = buildTravelPlan(brief.request, brief.text, {
    sights: [central, remote],
    food: [],
    stays: [],
  });
  assert.equal(plan.days[0]?.periods[0]?.items.at(-1)?.place?.placeId, 1);
  assert.equal(plan.days[0]?.periods[2]?.items[0]?.place?.placeId, 1);
  assert.equal(plan.costs.tickets, 1000000);
  const centralFirst = buildTravelPlan(brief.request, "Thích biển", {
    sights: [{ ...central, name: "Bãi biển" }, remote],
    food: [],
    stays: [],
  });
  assert.equal(centralFirst.days[0]?.periods[2]?.items[0]?.place, undefined);
});

test("So tiền cả nhóm và đổi khách sạn thực sự, giữ trạng thái trong AI turn", () => {
  const brief = tripBrief("Đi 3N2Đ, 2 người, tổng ngân sách 5 triệu", []);
  const single = {
    ...makePlace(1, "ACCOMMODATION", 210000, "Phòng đơn"),
    roomCapacity: 1,
  };
  const double = {
    ...makePlace(2, "ACCOMMODATION", 300000, "Phòng đôi"),
    roomCapacity: 2,
  };
  const pools = { sights: [], food: [], stays: [single, double] };
  const first = buildTravelPlan(brief.request, brief.text, pools);
  assert.equal(first.costs.accommodation, 600000);
  assert.equal(first.groups[0]?.places[0]?.placeId, 2);
  const encoded = writeAdvisorTurn("Nội dung công khai", {
    stayId: 2,
    excludedStayIds: [],
  });
  const saved = readAdvisorTurn(encoded);
  assert.equal(saved.content, "Nội dung công khai");
  assert.equal(saved.state?.stayId, 2);
  const second = buildTravelPlan(brief.request, brief.text, pools, {
    excludeStayIds: [saved.state!.stayId!],
  });
  assert.equal(second.groups[0]?.places[0]?.placeId, 1);
  assert.equal(readAdvisorTurn("Tin nhắn cũ không có state").state, undefined);
});

test("Lịch miễn phí loại vé trả tiền/giá chưa rõ; không âm thầm thay bằng quán ăn", () => {
  const brief = tripBrief("Lịch trình 1 ngày chỉ tham quan miễn phí", []);
  const plan = buildTravelPlan(brief.request, brief.text, {
    sights: [
      makePlace(1, "ATTRACTION", 0, "Điểm miễn phí"),
      makePlace(2, "ATTRACTION", 100000, "Có vé"),
      makePlace(3, "ATTRACTION", null, "Chưa rõ giá"),
      makePlace(4, "RESTAURANT", 0, "Quán ăn"),
    ],
    food: [],
    stays: [],
  });
  const ids = plan.days.flatMap((d) =>
    d.periods.flatMap((p) =>
      p.items.flatMap((i) => (i.place ? [i.place.placeId] : [])),
    ),
  );
  assert.deepEqual(ids, [1]);
});

test("API chat trả đúng tham quan miễn phí và lịch trình ngay cả khi Gemini tắt", async (t) => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
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
          if (text.includes("SELECT * FROM (")) {
            const type = params.placeType as PlaceSearchRow["placeType"];
            const rows = Array.from({ length: 6 }, (_, i) => ({
              place_id:
                (type === "ATTRACTION"
                  ? 100
                  : type === "RESTAURANT"
                    ? 200
                    : 300) + i,
              name: type === "RESTAURANT" ? `Mì Quảng ${i}` : `Địa điểm ${i}`,
              place_type: type,
              address: "DB",
              district_name: "Hải Châu",
              avg_rating: 4,
              review_count: 1,
              description: null,
              image_url: null,
              price_min: type === "ATTRACTION" ? 0 : 40000,
              price_max: 40000,
              latitude: 16,
              longitude: 108,
              room_capacity: 2,
            }));
            // A wrong row must be rejected even if accidentally returned by SQL.
            return {
              recordset: [
                ...rows,
                {
                  ...rows[0],
                  place_id: 999,
                  place_type: "RESTAURANT",
                  price_min: 0,
                },
              ],
            };
          }
          return { recordset: [] };
        },
      };
    },
    async close() {},
  };
  t.mock.method(sql, "connect", async () => pool as never);
  const old = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  await connectDB();
  try {
    const result = await processUserMessage({
      guestId: "advisor-test",
      message: "Gợi ý các điểm tham quan miễn phí ở Đà Nẵng.",
    });
    assert.ok(result.message.places?.length);
    assert.ok(
      result.message.places?.every(
        (p) => p.placeType === "ATTRACTION" && p.placeId !== 999,
      ),
    );
    assert.equal(queries[0]!.params.budget, 0);
    assert.match(queries[0]!.text, /WHERE x.price_min <= @budget/);
    assert.match(result.message.content, /giá vé 0đ/);
    const trip = await processUserMessage({
      guestId: "advisor-test",
      sessionId: result.sessionId,
      message: "Đi 3N2Đ cùng bạn gái, tổng ngân sách 5tr5 ngày mai",
    });
    assert.equal(trip.message.travelPlan?.days.length, 3);
    assert.equal(trip.message.places, undefined);
    assert.equal(trip.message.travelPlan?.budget, 5500000);
    const updated = await processUserMessage({
      guestId: "advisor-test",
      sessionId: result.sessionId,
      message: "Đổi sang các điểm tham quan miễn phí",
    });
    assert.equal(updated.message.travelPlan?.dayCount, 3);
    assert.equal(updated.message.travelPlan?.guestCount, 2);
    for (let i = 0; i < 9; i++) {
      const again = await processUserMessage({
        guestId: "advisor-test",
        sessionId: result.sessionId,
        message:
          i % 2
            ? "Ưu tiên điểm check-in chụp hình"
            : "Tôi muốn đổi khách sạn trong lịch trình vừa tạo",
      });
      assert.equal(again.message.travelPlan?.dayCount, 3);
      assert.equal(again.message.travelPlan?.guestCount, 2);
      assert.equal(again.message.travelPlan?.budget, 5500000);
      assert.doesNotMatch(JSON.stringify(again.message), /DANANGGO_ADVISOR/);
    }
    const seven = await processUserMessage({
      guestId: "unsupported-test",
      message: "Lên lịch trình 7 ngày cho 2 người",
    });
    assert.equal(seven.message.travelPlan, undefined);
    assert.match(seven.message.content, /1 đến 3 ngày/);
    const weather = await processUserMessage({
      guestId: "weather-test",
      message: "Thời tiết Đà Nẵng hôm nay thế nào?",
    });
    assert.match(weather.message.content, /chưa tích hợp dữ liệu thời tiết/);
    const noResults = await processUserMessage({
      guestId: "advisor-test-empty",
      message: "Điểm tham quan dưới 1 đồng mỗi người",
    });
    assert.ok(
      noResults.message.places?.every((p) => p.placeType === "ATTRACTION"),
    );
  } finally {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
    await closeDB();
  }
});
