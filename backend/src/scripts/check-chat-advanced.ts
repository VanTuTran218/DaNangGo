import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDB, closeDB } from "../config/db";
import { processUserMessage } from "../modules/chat/chat.service";
import { conversationMessages } from "../modules/chat/chat.history";
import { itineraryDraft } from "../modules/chat/chat.saved-plan";
import type { ChatMessageDto } from "../modules/chat/chat.types";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  process.env.GEMINI_API_KEY = "";
  await connectDB();
  const results: { test: string; question: string; answer: string; plan: boolean; comparison: boolean; durationMs: number }[] = [];
  try {
    const guestId = randomUUID();
    let sessionId: number | undefined;
    const ask = async (test: string, message: string): Promise<ChatMessageDto> => {
      const start = Date.now();
      const result = await processUserMessage({ message, guestId, sessionId });
      sessionId = result.sessionId;
      results.push({ test, question: message, answer: result.message.content, plan: Boolean(result.message.travelPlan), comparison: Boolean(result.message.comparison), durationMs: Date.now() - start });
      return result.message;
    };
    const comparison = await ask("So sánh cơ sở thật, không bịa giá", "So sánh Hilton với Furama");
    assert.equal(comparison.comparison?.places.length, 2);
    assert.match(comparison.comparison!.places[0]!.name, /Hilton/);
    assert.match(comparison.comparison!.places[1]!.name, /Furama/);
    assert.ok(comparison.comparison!.rows.find(row => row.label === "Giá trong catalog")?.values.every(value => value === "Chưa có dữ liệu"));
    const referred = await ask("So sánh tham chiếu hai cơ sở ở lượt trước", "So sánh hai chỗ này");
    assert.deepEqual(referred.comparison?.places.map(place => place.placeId), comparison.comparison?.places.map(place => place.placeId));
    assert.equal((await ask("Tên không tồn tại không tạo địa điểm", "So sánh Khách Sạn Không Tồn Tại với Hilton")).comparison, undefined);
    const first = await ask("Lập lịch nền từ SQL thật", "Đi 3N2Đ cho 2 người, tổng ngân sách 6 triệu, khởi hành 2026-12-01, đến 8h, về 22h, giữ 500k dự phòng");
    const original = first.travelPlan!;
    assert.ok(original);
    const target = original.days[1]!.periods.flatMap(period => period.items).find(item => item.place?.placeType === "ATTRACTION");
    assert.ok(target?.place);
    const removed = await ask("Bỏ mục ngày 2, giữ nguyên ngày 1 và 3", `Giữ ngày 1, bỏ ${target.place.name} ngày 2`);
    assert.ok(removed.travelPlan, removed.content);
    assert.deepEqual(removed.travelPlan.days[0], original.days[0]);
    assert.deepEqual(removed.travelPlan.days[2], original.days[2]);
    assert.ok(removed.travelPlan.days[1]!.periods.every(period => period.items.every(item => item.place?.placeId !== target.place!.placeId)));
    assert.equal(removed.travelPlan.costs.contingencyAllowance, 500000);
    const transport = await ask("Đổi phương tiện không làm lại lịch đã chỉnh", "Đi taxi");
    assert.deepEqual(transport.travelPlan?.days, removed.travelPlan.days);
    assert.equal(transport.travelPlan?.preferences?.transport, "taxi");
    const replaced = await ask("Chỉ thay bữa trưa ngày 2", "Thay quán ăn ngày 2 buổi trưa bằng quán khác");
    assert.ok(replaced.travelPlan, replaced.content);
    assert.deepEqual(replaced.travelPlan.days[0], transport.travelPlan!.days[0]);
    assert.deepEqual(replaced.travelPlan.days[2], transport.travelPlan!.days[2]);
    assert.deepEqual(replaced.travelPlan.days[1]!.periods[2], transport.travelPlan!.days[1]!.periods[2]);
    assert.notEqual(replaced.travelPlan.days[1]!.periods[1]!.items.find(item => item.place)?.place?.placeId, transport.travelPlan!.days[1]!.periods[1]!.items.find(item => item.place)?.place?.placeId);
    const sourceEntry = replaced.travelPlan.days.filter(day => day.day !== 2).flatMap(day => day.periods.flatMap(period => period.items.map(item => ({ day: day.day, item })))).find(entry => entry.item.place?.placeType === "ATTRACTION" && (entry.item.durationMinutes ?? 90) <= 150);
    assert.ok(sourceEntry?.item.place);
    const source = sourceEntry.item;
    const targetSlot = original.days[1]!.periods.findIndex(period => period.items.some(item => item.id === target.id));
    {
      const moved = await ask("Chuyển mục cụ thể sang buổi trống", `Chuyển ${source.place!.name} từ ngày ${sourceEntry.day} sang ngày 2 buổi ${original.days[1]!.periods[targetSlot]!.label.toLowerCase()}`);
      assert.ok(moved.travelPlan, moved.content);
      const untouchedDay = sourceEntry.day === 1 ? 2 : 0;
      assert.deepEqual(moved.travelPlan.days[untouchedDay], replaced.travelPlan.days[untouchedDay]);
      assert.ok(moved.travelPlan.days[1]!.periods[targetSlot]!.items.some(item => item.place?.placeId === source.place!.placeId));
    }
    assert.equal((await ask("Tham chiếu mơ hồ phải hỏi lại", "Bỏ cái đó")).travelPlan, undefined);
    assert.equal((await ask("Ngày ngoài phạm vi không sửa lịch", "Thêm Mỹ Khê ngày 9 buổi chiều")).travelPlan, undefined);
    const history = await conversationMessages(sessionId!, { guestId });
    assert.ok(!JSON.stringify(history).includes("DANANGGO_ADVISOR"));
    const latest = [...history].reverse().find(turn => turn.travelPlan)!.travelPlan!;
    const saved = itineraryDraft(latest);
    assert.equal(saved.output.summary.costs.attractions, latest.costs.tickets ?? 0);
    await assert.rejects(conversationMessages(sessionId!, { guestId: randomUUID() }));
    await ask("Reset bỏ điều kiện/chỉnh sửa cũ", "Bắt đầu lại");
    assert.equal((await ask("Sau reset chưa có lịch mới để chỉnh", "Bỏ Cầu Rồng ngày 2")).travelPlan, undefined);
    const report = { status: "PASS", dataMode: "SQL catalog read-only; provider disabled; guest memory only", tests: results.length, results };
    writeFileSync(resolve(__dirname, "../../../docs/ai-knowledge/advanced-test-results.json"), JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    writeFileSync(resolve(__dirname, "../../../docs/ai-knowledge/advanced-test-results.json"), JSON.stringify({ status: "FAIL", error: error instanceof Error ? error.message : "Unknown error", results }, null, 2) + "\n");
    throw error;
  } finally { await closeDB(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
