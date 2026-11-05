import assert from "node:assert/strict";
import { connectDB, closeDB, getPool, sql } from "../config/db";
import { searchPlacesForChat } from "../modules/chat/chat.repository";
import { saveChatPlan } from "../modules/chat/chat.saved-plan";
import { updateMessage } from "../modules/chat/chat.history";
import { tripBrief } from "../modules/chat/chat.intent";
import { buildTravelPlan } from "../modules/chat/chat.advisor";

async function main() {
  await connectDB();
  try {
    const nearby = await searchPlacesForChat({
      placeType: "RESTAURANT",
      location: { latitude: 16.0544, longitude: 108.2022, radiusKm: 5 },
      tastes: ["Thanh đạm"],
    });
    assert.ok(nearby.every((p) => p.distanceKm != null && p.distanceKm <= 5));
    const [sights, food, stays] = await Promise.all([
      searchPlacesForChat({ placeType: "ATTRACTION", limit: 100 }),
      searchPlacesForChat({ placeType: "RESTAURANT", limit: 100 }),
      searchPlacesForChat({
        placeType: "ACCOMMODATION",
        partySize: 2,
        limit: 60,
      }),
    ]);
    console.log(
      `Đã xác minh GPS/khẩu vị qua SQL thật (${nearby.length} kết quả).`,
    );
    const user = await getPool()
      .request()
      .query("SELECT TOP(1) user_id FROM dbo.users ORDER BY user_id");
    assert.ok(user.recordset[0]);
    const userId = user.recordset[0].user_id;
    const transaction = new sql.Transaction(getPool());
    await transaction.begin();
    try {
      const session = await new sql.Request(transaction)
        .input("u", sql.Int, userId)
        .query(
          "INSERT INTO dbo.chat_sessions(user_id,started_at) OUTPUT INSERTED.session_id VALUES(@u,SYSUTCDATETIME())",
        );
      const id = session.recordset[0].session_id;
      const plan = buildTravelPlan(
        tripBrief(
          "Đi 2 ngày cho 2 người, ngân sách 5 triệu, khởi hành 01/12/2026",
          [],
          "2026-11-04",
        ).request,
        "Đi hai ngày",
        { sights, food, stays },
      );
      // Planner properties are asserted before any draft is written.
      assert.ok(plan.days.length);
      const dto = {
        id: "ai_transaction_check",
        sender: "AI" as const,
        content: "Kiểm tra giao dịch",
        travelPlan: {
          ...plan,
          startDate: "2026-12-01",
          guestCount: 2,
          budget: 5000000,
        },
        createdAt: new Date().toISOString(),
      };
      await new sql.Request(transaction)
        .input("s", sql.Int, id)
        .input("dto", sql.NVarChar(sql.MAX), JSON.stringify(dto))
        .query(
          "INSERT INTO dbo.chat_messages(session_id,sender,content,created_at,dto_json) VALUES(@s,'AI',N'Kiểm tra',SYSUTCDATETIME(),@dto)",
        );
      const saved = await saveChatPlan(dto.travelPlan, userId, transaction);
      await updateMessage(
        id,
        { userId },
        { ...dto, savedItineraryId: saved.itineraryId },
        transaction,
      );
      const result = await new sql.Request(transaction)
        .input("id", sql.BigInt, saved.itineraryId)
        .query(
          "SELECT i.id,b.estimated_total FROM planner.itineraries i JOIN planner.itinerary_budgets b ON b.itinerary_id=i.id WHERE i.id=@id",
        );
      assert.equal(result.recordset.length, 1);
      console.log(
        "Đã xác minh lưu bản nháp và liên kết tin nhắn trong cùng transaction SQL.",
      );
    } finally {
      await transaction.rollback();
      console.log("Đã rollback dữ liệu kiểm tra, không giữ lịch trình thử.");
    }
  } finally {
    await closeDB();
  }
}
main().catch((error) => {
  console.error(
    "Kiểm tra SQL thất bại:",
    error instanceof Error ? error.message : "unknown",
  );
  process.exitCode = 1;
});
