import test from "node:test";
import assert from "node:assert/strict";
import { comparePlaces, comparisonNames, resolvePlaceName } from "../src/modules/chat/chat.compare";
import { editTravelPlan, attachPlanCosts, updateEditedPlanPreferences, isPlanEdit } from "../src/modules/chat/chat.plan-edit";
import { placeCard } from "../src/modules/chat/chat.advisor";
import { readAdvisorTurn, writeAdvisorTurn } from "../src/modules/chat/chat.advisor-state";
import { itineraryDraft } from "../src/modules/chat/chat.saved-plan";
import type { ChatTravelPlan } from "../src/modules/chat/chat.types";
import type { PlaceSearchRow } from "../src/modules/chat/chat.repository";

const row = (placeId: number, name: string, priceMin: number | null, placeType: PlaceSearchRow["placeType"] = "ATTRACTION"): PlaceSearchRow => ({ placeId, name, placeType, priceMin, priceMax: priceMin, address: "Địa chỉ kiểm thử", districtName: "Hải Châu", rating: 0, reviewCount: 0, priceText: priceMin === null ? null : `${priceMin}đ`, description: null, detailUrl: `/places/${placeId}`, visitDurationMinutes: 90 });
const a = row(1, "Bảo tàng kiểm thử", 60000), b = row(2, "Cầu Rồng", 0), c = row(3, "Bãi Biển Mỹ Khê", 0), d = row(4, "Điểm chưa có giá", null), food = row(5, "Quán cơm kiểm thử", 50000, "RESTAURANT");
const catalog = [a, b, c, d, food];
test("Không nhận nhầm đi bộ/hạn chế đi bộ thành lệnh bỏ địa điểm", () => {
  for (const message of ["Đi bộ", "Có người lớn tuổi, hạn chế đi bộ", "Thích phố đi bộ"]) assert.equal(isPlanEdit(message), false);
  assert.equal(isPlanEdit("Bỏ Cầu Rồng"), true);
  assert.equal(isPlanEdit("Chuyển Cầu Rồng sang chiều ngày 2, đi bộ"), true);
});
function fixture() {
  const plan: ChatTravelPlan = { title: "Lịch kiểm thử", dayCount: 2, guestCount: 2, startDate: "2026-12-01", budget: 3000000, preferences: { childAges: [] }, assumptions: [], questions: [], notes: [], groups: [],
    days: [1, 2].map(day => ({ day, date: `2026-12-0${day}`, area: "Hải Châu", periods: ["Sáng", "Trưa", "Chiều", "Tối"].map(label => ({ label, time: "Không xếp hoạt động", items: [] })) })),
    costs: { accommodation: 0, tickets: 120000, knownSubtotal: 120000, remaining: 2380000, contingencyAllowance: 500000, foodAllowance: 800000, roomNote: "Chưa đặt dịch vụ" } };
  plan.days[0]!.periods[0]!.items.push({ title: "09:00 · Tham quan", detail: "Giữ nguyên", place: placeCard(a) });
  plan.days[1]!.periods[2]!.items.push({ title: "15:00 · Check-in", detail: "Giữ nguyên", place: placeCard(b) });
  return attachPlanCosts(plan, catalog);
}
test("So sánh đúng 2 tên, alias; không ép trùng tên thành một chi nhánh", () => {
  assert.deepEqual(comparisonNames("So sánh Hilton với Furama"), ["Hilton", "Furama"]);
  assert.deepEqual(comparisonNames("so sanh My Khe va Cau Rong"), ["My Khe", "Cau Rong"]);
  assert.equal(comparisonNames("So sánh hai chỗ này"), null);
  assert.deepEqual(resolvePlaceName("Mỹ Khê", catalog).map(row => row.placeId), [3]);
  assert.equal(resolvePlaceName("Cầu Rồng", [b, { ...b, placeId: 99 }]).length, 2);
});
test("Bảng so sánh không bịa giá, điểm đánh giá hoặc giờ nhận phòng", () => {
  const table = comparePlaces([a, d]);
  assert.deepEqual(table.places.map(row => row.placeId), [1, 4]);
  assert.equal(table.rows.find(row => row.label === "Giá trong catalog")?.values[1], "Chưa có dữ liệu");
  assert.ok(table.rows.find(row => row.label === "Đánh giá trong hệ thống")?.values.every(value => value === "Chưa có đánh giá"));
  assert.ok(!JSON.stringify(table).includes("5/5"));
});
test("Bỏ một mục tính lại vé và giữ nguyên ngày khác, bản gốc, dự phòng", () => {
  const original = fixture(), before = structuredClone(original);
  const result = editTravelPlan(original, "Bỏ Bảo tàng kiểm thử ngày 1", catalog);
  assert.ok(result.plan);
  assert.deepEqual(original, before);
  assert.deepEqual(result.plan.days[1], original.days[1]);
  assert.equal(result.plan.days[0]!.periods[0]!.items.length, 0);
  assert.equal(result.plan.costs.tickets, 0);
  assert.equal(result.plan.costs.contingencyAllowance, 500000);
  assert.equal(result.plan.costs.remaining, 2500000);
});
test("Giữ ngày 1, bỏ mục ngày 2 không nhận nhầm số ngày ở mệnh đề giữ", () => {
  const original = fixture();
  const result = editTravelPlan(original, "Giữ ngày 1, bỏ Cầu Rồng ngày 2", catalog);
  assert.ok(result.plan);
  assert.deepEqual(result.plan.days[0], original.days[0]);
  assert.equal(result.plan.days[1]!.periods[2]!.items.length, 0);
});
test("Thay đúng mục bằng điểm có tên và bằng điểm miễn phí", () => {
  const original = fixture();
  for (const message of ["Thay Bảo tàng kiểm thử ngày 1 bằng Mỹ Khê", "Thay Bảo tàng kiểm thử ngày 1 bằng điểm miễn phí"]) {
    const result = editTravelPlan(original, message, catalog);
    assert.ok(result.plan, result.content);
    assert.equal(result.plan.days[0]!.periods[0]!.items[0]?.place?.placeId, 3);
    assert.deepEqual(result.plan.days[1], original.days[1]);
    assert.equal(result.plan.costs.tickets, 0);
  }
});
test("Thay bằng điểm chưa có giá không gán 0đ", () => {
  const result = editTravelPlan(fixture(), "Thay Bảo tàng kiểm thử bằng Điểm chưa có giá", catalog);
  assert.ok(result.plan, result.content);
  assert.equal(result.plan.costs.tickets, null);
});
test("Chuyển đúng mục sang ngày 2 buổi sáng, không tính vé lần hai", () => {
  const original = fixture();
  for (const message of ["Chuyển Bảo tàng kiểm thử từ ngày 1 buổi sáng sang ngày 2 buổi sáng", "Chuyển Bảo tàng kiểm thử sang sáng ngày 2"]) {
    const result = editTravelPlan(original, message, catalog);
    assert.ok(result.plan, result.content);
    assert.equal(result.plan.days[0]!.periods[0]!.items.length, 0);
    assert.equal(result.plan.days[1]!.periods[0]!.items[0]?.place?.placeId, 1);
    assert.equal(result.plan.costs.tickets, 120000);
  }
});
test("Không chèn vào thời gian nghỉ trưa hoặc vượt giờ về", () => {
  const original = fixture();
  original.days[1]!.periods[1]!.items.push({ id: "rest", title: "13:00 · Nghỉ", detail: "Nghỉ", kind: "rest" });
  assert.equal(editTravelPlan(original, "Chuyển Bảo tàng kiểm thử sang ngày 2 buổi trưa", catalog).plan, undefined);
  original.preferences!.departureTime = "09:00";
  assert.equal(editTravelPlan(original, "Chuyển Bảo tàng kiểm thử sang ngày 2 buổi sáng", catalog).plan, undefined);
});
test("Không thêm lại địa điểm đã có; loại trừ và dữ liệu thời lượng là điều kiện cứng", () => {
  assert.equal(editTravelPlan(fixture(), "Thêm Cầu Rồng vào ngày 1 buổi chiều", catalog).plan, undefined);
  assert.equal(editTravelPlan(fixture(), "Thêm Mỹ Khê ngày 1 buổi chiều", catalog, { excludedNames: ["Mỹ Khê"] }).plan, undefined);
  assert.equal(editTravelPlan(fixture(), "Thêm Mỹ Khê ngày 1 buổi chiều", catalog.map(row => row.placeId === 3 ? { ...row, visitDurationMinutes: 300 } : row)).plan, undefined);
});
test("Thêm đúng địa điểm, không chọn quán thay điểm tham quan, giữ ngày 2", () => {
  const original = fixture();
  const result = editTravelPlan(original, "Thêm Mỹ Khê ngày 1 buổi chiều", catalog);
  assert.ok(result.plan, result.content);
  assert.equal(result.plan.days[0]!.periods[2]!.items[0]?.place?.placeType, "ATTRACTION");
  assert.equal(result.plan.days[0]!.periods[2]!.items[0]?.place?.placeId, 3);
  assert.deepEqual(result.plan.days[1], original.days[1]);
});
test("Ăn kiêng và lịch nhẹ không bị bỏ qua khi thêm/thay", () => {
  const original = fixture();
  assert.equal(editTravelPlan(original, "Thêm quán ăn ngày 1 buổi trưa", catalog, { dietaryRestricted: true }).plan, undefined);
  original.preferences!.pace = "gentle";
  assert.equal(editTravelPlan(original, "Thêm Mỹ Khê ngày 1 buổi chiều", catalog).plan, undefined);
});
for (const message of ["Bỏ cái đó", "Bỏ điểm tham quan", "Chuyển Cầu Rồng", "Thêm Mỹ Khê", "Thêm Núi Không Tồn Tại ngày 1 buổi chiều", "Thay Bảo tàng kiểm thử bằng Chỗ không có thật", "Bỏ Cầu Rồng ngày 0", "Thêm Mỹ Khê ngày 8 buổi sáng", "Giữ ngày 1 chỉ sửa ngày 2", "Bỏ Cầu Rồng và thêm Mỹ Khê"]) {
  test(`Yêu cầu mơ hồ/sai giữ nguyên lịch: ${message}`, () => {
    const original = fixture(), before = structuredClone(original);
    assert.equal(editTravelPlan(original, message, catalog).plan, undefined);
    assert.deepEqual(original, before);
  });
}
test("Bản nháp sau chỉnh lịch giữ đúng tổng vé/dự phòng và bỏ điểm đã xóa", () => {
  const result = editTravelPlan(fixture(), "Bỏ Bảo tàng kiểm thử ngày 1", catalog);
  const saved = itineraryDraft(result.plan!);
  assert.equal(saved.output.summary.costs.attractions, 0);
  assert.equal(saved.output.summary.costs.contingency, 500000);
  assert.ok(saved.output.days.every(day => day.items.every(item => item.title !== a.name)));
});
test("Đổi phương tiện sau chỉnh lịch không khôi phục mục đã bỏ", () => {
  const edited = editTravelPlan(fixture(), "Bỏ Bảo tàng kiểm thử ngày 1", catalog).plan!;
  const next = updateEditedPlanPreferences(edited, "Đi taxi").plan!;
  assert.equal(next.preferences?.transport, "taxi");
  assert.deepEqual(next.days, edited.days);
  assert.equal(next.costs.tickets, 0);
  assert.equal(next.costs.contingencyAllowance, 500000);
});
test("Đổi giờ sau chỉnh lịch chỉ loại mục ngoài khung giờ, không đổi ngày khác", () => {
  const edited = editTravelPlan(fixture(), "Thêm Mỹ Khê ngày 1 buổi chiều", catalog).plan!;
  const next = updateEditedPlanPreferences(edited, "Đổi giờ đến 20h").plan!;
  assert.deepEqual(next.days[1], edited.days[1]);
  assert.ok(next.days[0]!.periods.flatMap(period => period.items).every(item => item.kind === "arrival" || item.title.slice(0, 5) >= "21:00"));
  assert.equal(updateEditedPlanPreferences(edited, "Đổi giờ đến 25h").plan, undefined);
});
test("Marker của người dùng không phải một chỉ dẫn chỉnh lịch hợp lệ", () => {
  const serialized = writeAdvisorTurn("Nội dung", { stayId: null, excludedStayIds: [] });
  assert.equal(readAdvisorTurn(serialized).content, "Nội dung");
  assert.equal(editTravelPlan(fixture(), serialized, catalog).plan, undefined);
});
