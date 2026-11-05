import test from "node:test";
import assert from "node:assert/strict";
import {
  tripPreferences,
  tripQuestions,
  minutes,
} from "../src/modules/chat/chat.trip-preferences";
import {
  tripBrief,
  tripContext,
  resolveChatRequest,
} from "../src/modules/chat/chat.intent";
import { buildTravelPlan } from "../src/modules/chat/chat.advisor";
import { itineraryDraft } from "../src/modules/chat/chat.saved-plan";
import type { PlaceSearchRow } from "../src/modules/chat/chat.repository";

const make = (
  id: number,
  type: PlaceSearchRow["placeType"],
  name: string,
  price: number,
): PlaceSearchRow => ({
  placeId: id,
  name,
  placeType: type,
  rating: 4,
  reviewCount: 2,
  address: "Địa chỉ kiểm thử",
  districtName: "Hải Châu",
  detailUrl: `/places/${id}`,
  priceMin: price,
  priceMax: price,
  priceText: `${price}đ`,
  description: null,
  latitude: 16.06 + id * 0.0001,
  longitude: 108.22 + id * 0.0001,
  roomCapacity: type === "ACCOMMODATION" ? 2 : null,
  visitDurationMinutes: type === "ATTRACTION" ? 90 : null,
});
const pools = {
  sights: [
    make(1, "ATTRACTION", "Công viên ven sông", 50000),
    make(2, "ATTRACTION", "Bãi biển", 0),
    { ...make(3, "ATTRACTION", "Điểm bậc thang leo núi", 80000), rating: 5 },
    {
      ...make(4, "ATTRACTION", "Điểm xa", 100000),
      latitude: 16.2,
      longitude: 108.3,
    },
  ],
  food: [make(11, "RESTAURANT", "Mì Quảng", 40000)],
  stays: [make(21, "ACCOMMODATION", "Khách sạn kiểm thử", 400000)],
};
const base = "Đi 3N2Đ cho 2 người, tổng ngân sách 5 triệu, khởi hành 2026-12-01";
test("Số người lớn tuổi trong lượt sau không ghi đè tổng khách/người lớn", () => {
  const single = tripBrief("Có 1 người lớn tuổi", [base], "2026-11-05");
  assert.equal(single.request.guests, 2);
  assert.equal(single.preferences.adults, undefined);
  assert.equal(single.preferences.seniors, true);
  const family = tripBrief(
    "Có 1 người lớn tuổi",
    ["Đi 3 ngày, 2 người lớn và 1 bé 6 tuổi"],
    "2026-11-05",
  );
  assert.equal(family.request.guests, 3);
  assert.equal(family.preferences.adults, 2);
  assert.deepEqual(family.issues, []);
});
const planFor = (text: string) => {
  const brief = tripBrief(text, [], "2026-11-05");
  assert.deepEqual(brief.issues, []);
  return buildTravelPlan(brief.request, brief.text, pools, {
    preferences: brief.preferences,
  });
};

test("Hiểu giờ 24h, giờ chiều và sửa lại giờ đến/về", () => {
  const parsed = tripPreferences(["Đến 6h chiều, về 08:30, đi taxi"]);
  assert.equal(parsed.value.arrivalTime, "18:00");
  assert.equal(parsed.value.departureTime, "08:30");
  assert.equal(parsed.value.transport, "taxi");
  assert.equal(
    tripPreferences(["đến 25h", "đổi giờ đến 19:30"]).issues.length,
    0,
  );
  assert.equal(tripPreferences(["đến 18:75"]).issues.length, 1);
  assert.equal(
    tripPreferences(["Đến Đà Nẵng 3 ngày"]).value.arrivalTime,
    undefined,
  );
  assert.equal(
    tripPreferences(["Ăn tối lúc 19h"]).value.arrivalTime,
    undefined,
  );
  assert.equal(
    tripPreferences(["Tới Đà Nẵng lúc 19h"]).value.arrivalTime,
    "19:00",
  );
});
test("Giữ giờ, phương tiện và nhóm khách qua lượt chỉnh lịch và state tóm tắt", () => {
  const original = base + ", đến 18h30, về 9h, đi taxi, có người lớn tuổi";
  assert.equal(resolveChatRequest("Đến 20h nhé", [original]).trip, true);
  const brief = tripBrief("Đổi sang xe máy", [original], "2026-11-05");
  assert.equal(brief.preferences.arrivalTime, "18:30");
  assert.equal(brief.preferences.transport, "motorbike");
  const restored = tripBrief(
    "Thêm check-in",
    [tripContext(brief)],
    "2026-11-05",
  );
  assert.deepEqual(restored.preferences, brief.preferences);
  assert.equal(restored.request.guests, 2);
});
test("Chuyến mới không kéo giờ và người lớn tuổi từ chuyến cũ", () => {
  const brief = tripBrief(
    "Lên lịch trình 1 ngày cho 1 người",
    [base + ", đến 18h, có người lớn tuổi"],
    "2026-11-05",
  );
  assert.equal(brief.preferences.arrivalTime, undefined);
  assert.equal(brief.preferences.seniors, undefined);
});
test("Tính đúng tổng người lớn và trẻ em, không coi số tuổi là số khách", () => {
  const brief = tripBrief(
    "Đi 3 ngày, 2 người lớn và 1 bé 6 tuổi, tổng ngân sách 5 triệu",
    [],
    "2026-11-05",
  );
  assert.equal(brief.request.guests, 3);
  assert.equal(brief.preferences.children, 1);
  assert.deepEqual(brief.preferences.childAges, [6]);
  assert.deepEqual(brief.issues, []);
  assert.ok(
    tripBrief(
      "Đi 2 ngày cho 4 người, gồm 2 người lớn và 1 bé 6 tuổi",
      [],
      "2026-11-05",
    ).issues.length,
  );
  const perPerson = tripBrief(
    "Đi 2 ngày, 2 người lớn và 1 bé 6 tuổi, 500k mỗi người",
    [],
    "2026-11-05",
  );
  assert.equal(perPerson.request.budget, 1500000);
});
test("Hỏi tuổi còn thiếu; hiểu trẻ dưới 1 tuổi và phủ định trẻ/người lớn tuổi", () => {
  const p = tripPreferences(["Có 2 trẻ em và người lớn tuổi"]).value;
  assert.ok(tripQuestions(p).some((q) => q.includes("tuổi của từng bé")));
  assert.ok(tripQuestions(p).some((q) => q.includes("bậc thang")));
  assert.deepEqual(tripPreferences(["Có 1 bé 6 tháng"]).value.childAges, [0.5]);
  const removed = tripPreferences([
    "Có 1 bé 6 tuổi và người lớn tuổi",
    "không có trẻ nhỏ, không có người lớn tuổi",
  ]).value;
  assert.equal(removed.hasChildren, false);
  assert.equal(removed.seniors, false);
});
test("Một ngày có giờ về trước giờ đến phải hỏi lại", () => {
  assert.ok(
    tripBrief(
      "Đi 1 ngày cho 2 người, đến 18h, về 9h",
      [],
      "2026-11-05",
    ).issues.some((q) => q.includes("Giờ về phải sau")),
  );
});
test("Đến muộn/về sớm: không có hoạt động trước khi đến hoặc sau khoảng chuẩn bị về", () => {
  const plan = planFor(base + ", đến 18:30, về 09:00, đi taxi");
  assert.equal(plan.days[0]!.periods[0]!.items.length, 0);
  for (const item of plan.days[0]!.periods.flatMap((p) => p.items))
    assert.ok(minutes(item.title.slice(0, 5)) >= 18 * 60 + 30);
  for (const item of plan.days[2]!.periods.flatMap((p) => p.items))
    assert.ok(minutes(item.title.slice(0, 5)) <= 7 * 60 + 30);
  assert.ok(
    plan.days[0]!.periods.flatMap((p) => p.items).some(
      (i) => i.kind === "arrival",
    ),
  );
  assert.equal(
    plan.days[2]!.periods.flatMap((p) => p.items).filter((i) => i.place).length,
    0,
  );
});
test("Đến 23:30 chỉ xếp đến thành phố/nghỉ, không thêm quán ăn hoặc điểm tham quan", () => {
  const plan = planFor(base + ", đến 23:30, về 18h, đi ô tô");
  const items = plan.days[0]!.periods.flatMap((p) => p.items);
  assert.equal(items.length, 1);
  assert.equal(items[0]!.kind, "arrival");
});
test("Lịch nhẹ tối đa một điểm chính mỗi ngày, không chọn điểm mô tả bậc thang", () => {
  const plan = planFor(base + ", có người lớn tuổi, hạn chế đi bộ, đi taxi");
  for (const day of plan.days) {
    const sights = day.periods
      .flatMap((p) => p.items)
      .filter((i) => i.place?.placeType === "ATTRACTION");
    assert.ok(sights.length <= 1);
    assert.ok(sights.every((i) => i.place!.placeId !== 3));
  }
  assert.ok(
    plan.notes.some((note) =>
      note.includes("Chưa xác minh đầy đủ khả năng tiếp cận"),
    ),
  );
});
test("Đi bộ chỉ ghép điểm gần có tọa độ, không suy ra khoảng cách từ cùng quận", () => {
  const brief = tripBrief(base + ", đi bộ", [], "2026-11-05");
  const plan = buildTravelPlan(
    brief.request,
    brief.text,
    {
      ...pools,
      sights: [
        pools.sights[0]!,
        pools.sights[3]!,
        { ...pools.sights[1]!, latitude: null, longitude: null },
      ],
    },
    { preferences: brief.preferences },
  );
  const ids = plan.days[0]!.periods.flatMap((p) => p.items).flatMap((i) =>
    i.place?.placeType === "ATTRACTION" ? [i.place.placeId] : [],
  );
  assert.deepEqual(ids, [1]);
});
test("Có trẻ em không nhân giá vé người lớn và sức chứa chung thành chi phí chắc chắn", () => {
  const plan = planFor(
    "Đi 3 ngày, 2 người lớn và 1 bé 6 tuổi, tổng ngân sách 5 triệu, khởi hành 2026-12-01",
  );
  assert.equal(plan.guestCount, 3);
  assert.equal(plan.costs.tickets, null);
  assert.equal(plan.costs.accommodation, null);
});
test("Lưu bản nháp giữ giờ đến muộn và thời gian chuẩn bị về; không tự thêm 08:00/14:00 ngày đầu", () => {
  const plan = planFor(base + ", đến 18:30, về 09:00, đi taxi");
  const saved = itineraryDraft(plan);
  assert.ok(saved.output.days[0]!.items.every((i) => i.time >= "18:30"));
  assert.ok(saved.output.days[2]!.items.every((i) => i.time <= "07:30"));
  assert.ok(saved.output.days[0]!.items.some((i) => i.type === "transport"));
});
