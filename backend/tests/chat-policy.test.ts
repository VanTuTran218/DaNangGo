import { todayVietnam } from "../src/modules/ai/ai.rules";
import test from "node:test";
import assert from "node:assert/strict";
import { understand } from "../src/modules/chat/chat.understanding";
import { conversationalText, requestedNeeds } from "../src/modules/chat/chat.language";
import { explicitPreferences, mergePreferences, profileWriteSchema } from "../src/modules/chat/chat.profile";
import { profileCommand } from "../src/modules/chat/chat.profile-command";

test("4 triệu + đi ăn và tham quan: giữ đủ hai nhu cầu, không tự đoán phạm vi ngân sách", () => {
  const result = understand("tôi đang có 4 triệu và tôi muốn đi ăn và tham quan bạn hãy gợi ý cho tôi");
  assert.deepEqual(result.needs, ["food", "sight"]);
  assert.equal(result.context.budget, 4_000_000);
  assert.equal(result.context.budgetScope, null);
  assert.equal(result.pendingQuestions.length, 3);
});
test("Trả lời câu hỏi tiếp nối giữ ngân sách, đủ điều kiện mới hết hỏi", () => {
  const first = understand("Có 4 triệu muốn đi ăn và tham quan");
  const second = understand("2 người, tổng cả nhóm, 1 ngày, không qua đêm, ngày mai", first, [], "2026-11-05");
  assert.deepEqual(second.needs, ["food", "sight"]);
  assert.equal(second.context.budget, 4_000_000);
  assert.equal(second.context.budgetScope, "total");
  assert.equal(second.context.guests, 2);
  assert.equal(second.context.days, 1);
  assert.equal(second.context.nights, 0);
  assert.equal(second.context.startDate, "2026-11-06");
  assert.equal(second.pendingQuestions.length, 0);
  const third = understand("đi taxi, giữ 500k dự phòng", second);
  assert.equal(third.context.budget, 4_000_000);
  assert.equal(third.context.reserve, 500_000);
  assert.equal(third.context.transport, "taxi");
});
test("Cách nói mới và mốc vị trí: không coi gần biển là nhu cầu tham quan riêng", () => {
  assert.deepEqual(requestedNeeds("Khách sạn gần biển"), ["stay"]);
  assert.deepEqual(requestedNeeds("quán ăn gần khách sạn"), ["food"]);
  assert.deepEqual(requestedNeeds("Tôi chỉ có buổi chiều rảnh, muốn ăn món địa phương và chụp vài tấm hình"), ["food", "sight"]);
  assert.deepEqual(requestedNeeds("toi muon di an va tham quan"), ["food", "sight"]);
});
test("Số tiền và ngày đời thường: không lỗi replace, không tự đoán cuối tuần", () => {
  assert.match(todayVietnam(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(conversationalText("mai đi"), "ngay mai di");
  assert.equal(conversationalText("ngày mai"), "ngay mai");
  assert.equal(understand("2 triệu rưỡi đi ăn").context.budget, 2_500_000);
  assert.equal(understand("5tr5 đi chơi").context.budget, 5_500_000);
  assert.equal(understand("500k đi ăn").context.budget, 500_000);
  assert.equal(understand("mốt đi biển", undefined, [], "2026-11-05").context.startDate, "2026-11-07");
  assert.equal(understand("cuối tuần đi biển").context.startDate, null);
});
test("Ưu tiên phiên mới thắng sở thích cũ; không tự lưu, không suy ra bệnh lý", () => {
  const result = understand("Tôi không ăn cay", undefined, ["food_spicy"]);
  assert.ok(result.context.preferences.includes("food_mild"));
  assert.ok(!result.context.preferences.includes("food_spicy"));
  assert.deepEqual(result.profilePending, []);
  assert.deepEqual(explicitPreferences("Tôi không thích ăn cay, thu nhập 50 triệu, bị bệnh, theo tôn giáo riêng"), ["food_mild"]);
  assert.deepEqual(mergePreferences(["taxi", "food_spicy"], ["motorbike", "food_mild"]), ["motorbike", "food_mild"]);
});
test("Reset bỏ điều kiện chuyến; bỏ dùng sở thích cũ không xóa tài khoản", () => {
  const old = understand("Có tổng 4 triệu đi biển 2 ngày cho 2 người");
  const fresh = understand("Bắt đầu chuyến mới", old, ["quiet"]);
  assert.equal(fresh.context.budget, null);
  assert.deepEqual(fresh.context.preferences, ["quiet"]);
  const ignoring = understand("Không dùng sở thích cũ", old, ["quiet"]);
  assert.equal(ignoring.ignoreSaved, true);
  assert.ok(!ignoring.context.preferences.includes("quiet"));
});
test("Sở thích lưu phải đồng ý, whitelist; không nhận userId hoặc thông tin tự do", () => {
  assert.equal(profileWriteSchema.safeParse({ keys: ["beach"], consent: true }).success, true);
  for (const body of [{ keys: ["beach"] }, { keys: ["beach"], consent: false }, { keys: ["beach"], consent: true, userId: 10 }, { keys: ["income_50m"], consent: true }]) assert.equal(profileWriteSchema.safeParse(body).success, false);
});
test("Khách không thể lưu lâu dài; đồng ý không có ưu tiên chờ thì không ghi SQL", async () => {
  const dialogue = understand("Tôi thích biển");
  assert.match((await profileCommand("Hãy lưu tôi thích biển", null, dialogue, []))!.content, /phiên khách/);
  assert.equal(await profileCommand("Đồng ý", 1, dialogue, []), null);
  dialogue.profilePending = ["beach"];
  assert.match((await profileCommand("Không lưu", 1, dialogue, []))!.content, /không lưu/);
  assert.deepEqual(dialogue.profilePending, []);
});

test("Phạm vi giá phòng được giữ ở lượt sau; ưu tiên phương tiện mới không bị taxi cũ ghi đè", () => {
  const first = understand("Khách sạn mỗi phòng mỗi đêm 500k");
  assert.equal(first.context.budgetScope, "perRoomPerNight");
  const next = understand("gần biển hơn", first);
  assert.equal(next.context.budgetScope, "perRoomPerNight");
  assert.equal(next.context.budget, 500_000);
});

test("Mốc khách sạn không đổi loại; câu tìm nơi có view biển giữ ngữ cảnh lưu trú", async () => {
  const { explicitCategory, resolveChatRequest } = await import("../src/modules/chat/chat.intent");
  assert.equal(explicitCategory("Tìm quán ăn gần khách sạn của tôi"), "food");
  assert.equal(explicitCategory("Tìm điểm tham quan gần khách sạn của tôi"), "sight");
  assert.equal(resolveChatRequest("Tìm nơi có view biển", ["Tìm khách sạn Hilton Đà Nẵng"]).intent.category, "stay");
  assert.equal(resolveChatRequest("Tìm nơi gần biển và gần quán ăn", ["Tìm khách sạn Hilton Đà Nẵng"]).intent.category, "stay");
});
test("Không nhầm dấu hoặc từ con khi tìm món Việt", async () => {
  const { catalogFoodMatch } = await import("../src/modules/chat/chat.food-match");
  assert.equal(catalogFoodMatch("Quán lâu đời, chế biến món kèm cơm", "lẩu"), false);
  assert.equal(catalogFoodMatch("Quán lâu đời, chế biến món kèm cơm", "chè"), false);
  assert.equal(catalogFoodMatch("Quán lâu đời, chế biến món kèm cơm", "kem"), false);
  assert.equal(catalogFoodMatch("Lẩu hải sản", "lẩu"), true);
  assert.equal(catalogFoodMatch("Chè đậu xanh", "chè"), true);
  assert.equal(catalogFoodMatch("Kem dừa", "kem"), true);
});


test("Xóa điều kiện của chuyến trước bỏ ngân sách và giờ cũ", () => {
  const old = understand("Đi 3 ngày 2 đêm cho 2 người, tổng 6 triệu, đến 18h");
  const reset = understand("Xóa điều kiện của chuyến trước", old);
  assert.equal(reset.context.budget, null);
  assert.equal(reset.context.days, null);
  assert.equal(reset.context.arrivalTime, null);
});
