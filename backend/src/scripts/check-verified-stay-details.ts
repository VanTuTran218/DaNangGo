import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connectDB, closeDB, getPool } from "../config/db";
import { syncVerifiedStayDetails } from "./sync-verified-stay-details";
import { searchPlacesForChat } from "../modules/chat/chat.repository";
import { processUserMessage } from "../modules/chat/chat.service";

async function main() {
  await connectDB();
  process.env.GEMINI_API_KEY = "";
  try {
    assert.deepEqual(
      await syncVerifiedStayDetails(),
      await syncVerifiedStayDetails(),
    );
    const count = await getPool().request()
      .query(`SELECT COUNT(*) AS count FROM dbo.public_stay_details;
      SELECT COUNT(*) AS count FROM dbo.room_types rt JOIN dbo.places p ON p.place_id=rt.place_id WHERE p.reference_key IS NOT NULL;`);
    const sets = count.recordsets as import("mssql").IRecordSet<{
      count: number;
    }>[];
    assert.equal(sets[0][0]!.count, 5);
    assert.equal(sets[1][0]!.count, 0);
    console.log(
      "PASS 1: Đồng bộ lặp giữ 5 hồ sơ chi tiết, không tạo phòng có thể đặt hoặc giá giả.",
    );
    const nearby = await searchPlacesForChat({
      placeType: "ACCOMMODATION",
      location: { latitude: 16.0530442, longitude: 108.2475282, radiusKm: 2 },
    });
    assert.ok(nearby.some((row) => row.name.includes("HAIAN")));
    assert.ok(
      nearby.every((row) => row.distanceKm != null && row.distanceKm <= 2),
    );
    assert.ok(nearby.every((row) => !row.name.includes("Sala")));
    console.log(
      "PASS 2: GPS lấy được HAIAN, lọc đúng 2km; Sala thiếu tọa độ không lọt kết quả.",
    );
    const ask = async (message: string) =>
      (await processUserMessage({ message, guestId: randomUUID() })).message;
    const hilton = await ask("Hilton nhận phòng mấy giờ?");
    assert.equal(hilton.places?.length, 1);
    assert.equal(hilton.places[0]!.stayFacts?.hours?.checkIn, "15:00");
    assert.match(hilton.content, /15:00/);
    assert.match(hilton.content, /12:00/);
    console.log("PASS 3: Hỏi Hilton → đúng một cơ sở, nhận 15:00 / trả 12:00.");
    const sala = await ask("Sala có phòng cho gia đình không?");
    assert.equal(sala.places?.length, 1);
    assert.equal(sala.places[0]!.stayFacts?.rooms.length, 2);
    assert.match(sala.content, /Tối đa 4 khách/);
    console.log(
      "PASS 4: Hỏi Sala → phân biệt phòng 2 và 4 khách; không khẳng định còn phòng.",
    );
    const hyatt = await ask("Hyatt có phòng cho 2 người lớn và trẻ em không?");
    assert.equal(hyatt.places?.length, 1);
    assert.match(hyatt.content, /trẻ dưới 12 tuổi/);
    console.log(
      "PASS 5: Hyatt giữ điều kiện tuổi trẻ em; không tính 2 người lớn + trẻ thành phòng cho 3 người lớn.",
    );
    const furama = await ask("Furama giá phòng bao nhiêu?");
    assert.equal(furama.places?.length, 1);
    assert.equal(
      furama.places[0]!.stayFacts?.publicRates[0]?.nightlyVnd,
      8186000,
    );
    assert.match(furama.content, /giá niêm yết tham khảo/);
    assert.ok(furama.places.every((row) => row.priceText == null));
    const cheap = await ask("Khách sạn dưới 500k một đêm");
    assert.equal(cheap.places?.length ?? 0, 0);
    console.log(
      "PASS 6: Furama hiển thị giá tham khảo 8.186.000đ, có thời hạn/điều kiện; không đưa vào bộ lọc giá đặt phòng dưới 500k.",
    );
  } finally {
    await closeDB();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
