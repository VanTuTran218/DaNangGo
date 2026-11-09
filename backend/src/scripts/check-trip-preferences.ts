import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDB, closeDB } from "../config/db";
import { processUserMessage } from "../modules/chat/chat.service";
import { conversationMessages } from "../modules/chat/chat.history";
import { itineraryDraft } from "../modules/chat/chat.saved-plan";
import type { ChatTravelPlan } from "../modules/chat/chat.types";

async function main() {
  await connectDB();
  process.env.GEMINI_API_KEY = "";
  try {
    const guestId = randomUUID();
    let sessionId: number | undefined;
    const ask = async (message: string) => {
      const response = await processUserMessage({
        message,
        guestId,
        sessionId,
      });
      sessionId = response.sessionId;
      return response.message;
    };
    const first = await ask(
      "Đi 3N2Đ, 2 người lớn và 1 bé 6 tuổi, tổng ngân sách 6 triệu, khởi hành ngày mai, đến 18h30, về 9h, đi taxi.",
    );
    const plan = first.travelPlan!;
    assert.ok(plan);
    assert.equal(plan.guestCount, 3);
    assert.equal(plan.preferences?.arrivalTime, "18:30");
    assert.equal(plan.preferences?.departureTime, "09:00");
    assert.ok(
      plan.days[0]!.periods.flatMap((p) => p.items).every(
        (i) => i.title.slice(0, 5) >= "18:30",
      ),
    );
    assert.ok(
      plan.days[2]!.periods.flatMap((p) => p.items).every(
        (i) => i.title.slice(0, 5) <= "07:30",
      ),
    );
    assert.equal(plan.costs.accommodation, null);
    console.log(
      "PASS 1: SQL thật → lịch 3 ngày / 3 khách, đến 18:30, về 09:00; không xếp hoạt động sáng ngày đầu/tối ngày cuối.",
    );
    const changed = await ask("Đổi giờ đến 20h, đi ô tô");
    assert.equal(changed.travelPlan?.preferences?.arrivalTime, "20:00");
    assert.equal(changed.travelPlan?.preferences?.transport, "car");
    assert.deepEqual(changed.travelPlan?.preferences?.childAges, [6]);
    const light = await ask("Có người lớn tuổi, hạn chế đi bộ");
    assert.equal(light.travelPlan?.preferences?.seniors, true);
    for (const day of light.travelPlan!.days)
      assert.ok(
        day.periods
          .flatMap((p) => p.items)
          .filter((i) => i.place?.placeType === "ATTRACTION").length <= 1,
      );
    console.log(
      "PASS 2: Chỉnh giờ và phương tiện giữ số ngày, số khách, tuổi bé; thêm người lớn tuổi chuyển sang lịch nhẹ.",
    );
    for (let i = 0; i < 10; i++)
      await ask(
        i % 2
          ? "Ưu tiên điểm check-in chụp hình"
          : "Đổi sang các điểm tham quan miễn phí",
      );
    const retained = await ask("Đổi giờ về 10h30");
    assert.equal(retained.travelPlan?.preferences?.arrivalTime, "20:00");
    assert.equal(retained.travelPlan?.preferences?.departureTime, "10:30");
    assert.equal(retained.travelPlan?.guestCount, 3);
    const history = await conversationMessages(sessionId!, { guestId });
    const last = history[history.length - 1]!;
    assert.deepEqual(
      last.travelPlan?.preferences,
      retained.travelPlan?.preferences,
    );
    console.log(
      "PASS 3: Sau hơn 10 lượt, thông tin giờ/nhóm khách vẫn còn trong lịch và lịch sử; không lộ state nội bộ.",
    );
    assert.ok(!JSON.stringify(history).includes("DANANGGO_ADVISOR"));
    const invalid = await ask("Đổi giờ đến 25h");
    assert.equal(invalid.travelPlan, undefined);
    assert.match(invalid.content, /chưa hợp lệ/);
    const corrected = await ask("Đổi giờ đến 19h");
    assert.equal(corrected.travelPlan?.preferences?.arrivalTime, "19:00");
    console.log(
      "PASS 4: Giờ 25h hỏi lại, không tạo lịch sai; sửa sang 19h tiếp tục được.",
    );
    const current = corrected.travelPlan as ChatTravelPlan;
    const draft = itineraryDraft(current);
    assert.ok(draft.output.days[0]!.items.every((i) => i.time >= "19:00"));
    assert.ok(
      draft.output.notices.some((n) => n.includes("Thông tin chuyến đi")),
    );
    const reset = await ask(
      "Lên lịch trình 1 ngày 0 đêm cho 1 người, ngân sách 1 triệu, khởi hành ngày mai",
    );
    assert.equal(reset.travelPlan?.preferences?.arrivalTime, undefined);
    assert.equal(reset.travelPlan?.preferences?.hasChildren, undefined);
    assert.ok(reset.travelPlan?.questions?.some((q) => q.includes("mấy giờ")));
    console.log(
      "PASS 5: Bản nháp giữ giới hạn giờ; chuyến mới bỏ dữ kiện cũ và hỏi giờ/phương tiện còn thiếu.",
    );
  } finally {
    await closeDB();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
