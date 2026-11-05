import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDB, closeDB, getPool } from "../config/db";
import { syncVerifiedStays } from "./sync-verified-ai-stays";
import { searchPlacesForChat } from "../modules/chat/chat.repository";
import { processUserMessage } from "../modules/chat/chat.service";

async function main() {
  await connectDB();
  // Exercise grounded answers without depending on a paid provider or creating user records.
  process.env.GEMINI_API_KEY = "";
  try {
    const first = await syncVerifiedStays();
    const second = await syncVerifiedStays();
    assert.deepEqual(second.imported, first.imported);
    assert.equal(second.hidden, 0);
    const facts = await getPool().request().query(`
      SELECT p.place_id,p.partner_id,p.latitude,p.longitude,p.avg_rating,p.review_count,
        a.accepts_cash,a.accepts_bank_transfer,
        (SELECT COUNT(*) FROM dbo.room_types rt WHERE rt.place_id=p.place_id) AS rooms,
        (SELECT COUNT(*) FROM dbo.reviews r WHERE r.place_id=p.place_id) AS reviews
      FROM dbo.places p JOIN dbo.accommodations a ON a.place_id=p.place_id
      WHERE p.reference_key IS NOT NULL;
      SELECT p.status,(SELECT COUNT(*) FROM dbo.room_types rt WHERE rt.place_id=p.place_id) AS rooms
      FROM dbo.places p WHERE p.place_id IN (330,331,332,333,334);
    `);
    const sets = facts.recordsets as import("mssql").IRecordSet<any>[];
    assert.equal(sets[0].length, 5);
    for (const row of sets[0]) {
      assert.equal(row.partner_id, null);
      assert.equal(row.latitude == null, row.longitude == null);
      assert.equal(row.avg_rating, 0);
      assert.equal(row.review_count, 0);
      assert.equal(row.accepts_cash, null);
      assert.equal(row.accepts_bank_transfer, null);
      assert.equal(row.rooms, 0);
      assert.equal(row.reviews, 0);
    }
    assert.equal(sets[1].length, 5);
    assert.ok(
      sets[1].every((row) => row.status === "HIDDEN" && row.rooms === 3),
    );
    console.log(
      "PASS 1: Đồng bộ lặp không trùng; không chuyển giá/đánh giá giả; giữ nguyên phòng của 5 hồ sơ mẫu đã ẩn.",
    );

    const stays = await searchPlacesForChat({
      placeType: "ACCOMMODATION",
      limit: 60,
    });
    assert.equal(stays.length, 5);
    assert.ok(
      stays.every(
        (p) =>
          !p.name.includes("[Mẫu]") &&
          p.priceMin === null &&
          p.roomCapacity === null,
      ),
    );
    const cheap = await searchPlacesForChat({
      placeType: "ACCOMMODATION",
      budget: 500000,
    });
    assert.equal(cheap.length, 0);
    const nearby = await searchPlacesForChat({
      placeType: "ACCOMMODATION",
      location: { latitude: 16.0683, longitude: 108.2468, radiusKm: 2 },
    });
    assert.ok(nearby.every((p) => p.distanceKm != null && p.distanceKm <= 2));
    console.log(
      "PASS 2: Giá chưa biết không được coi là miễn phí; tọa độ thiếu không lọt bộ lọc GPS.",
    );

    const ask = async (message: string) =>
      (await processUserMessage({ message, guestId: randomUUID() })).message;
    const beach = await ask("Khách sạn gần biển Mỹ Khê");
    assert.ok(beach.places?.length);
    assert.ok(
      beach.places.every(
        (p) =>
          /HAIAN|Sala/.test(p.name) &&
          (p.distanceKm == null || p.distanceKm <= 2),
      ),
    );
    if (beach.places.every((p) => p.distanceKm == null))
      assert.match(beach.content, /Chưa đủ tọa độ/);
    assert.match(beach.content, /chưa có giá đặt phòng/);
    console.log(
      "PASS 3: Hỏi khách sạn Mỹ Khê → HAIAN/Sala, chỉ ghi khoảng cách khi có tọa độ.",
    );

    const budget = await ask("Khách sạn dưới 500k một đêm");
    assert.equal(budget.places?.length ?? 0, 0);
    console.log(
      "PASS 4: Hỏi dưới 500k → không tự gán giá cho khách sạn chưa xác minh giá.",
    );

    const trip = await ask(
      "Đi 3N2Đ cùng bạn gái, thích biển và hải sản, tổng ngân sách 5tr5, khởi hành ngày mai.",
    );
    assert.equal(trip.travelPlan?.days.length, 3);
    assert.equal(trip.travelPlan?.costs.accommodation, null);
    const lodging = trip.travelPlan?.groups.find((g) =>
      g.title.startsWith("Lưu trú"),
    );
    assert.ok(lodging?.places.length);
    assert.ok(lodging.places.every((p) => first.imported.includes(p.placeId)));
    console.log(
      "PASS 5: Lịch 3N2Đ dùng cơ sở thật, chi phí lưu trú để chưa xác định.",
    );
  } finally {
    await closeDB();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
