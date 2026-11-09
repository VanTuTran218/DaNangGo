import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  publicStayFacts,
  stayDetailsSchema,
} from "../src/modules/chat/chat.stay-facts";
import { ruleIntent } from "../src/modules/chat/chat.intent";

const manifest = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../database/seeds/verified-stay-details.json"),
    "utf8",
  ),
);
const furama = manifest.find(
  (row: { key: string }) => row.key === "furama-resort-danang",
);
test("Giá niêm yết giữ điều kiện, số khách trong giá và thời hạn; không có tồn phòng", () => {
  const facts = publicStayFacts(JSON.stringify(furama), "2026-11-05")!;
  assert.equal(facts.publicRates[0]?.nightlyVnd, 8186000);
  assert.equal(facts.publicRates[0]?.includedGuests, 2);
  assert.match(facts.publicRates[0]!.conditions, /không phải sức chứa tối đa/);
  assert.equal((facts as Record<string, unknown>).priceMin, undefined);
  assert.equal((facts as Record<string, unknown>).roomCapacity, undefined);
});
test("Giá hết hạn hoặc chưa tới ngày hiệu lực không được dùng làm giá hiện tại", () => {
  assert.equal(
    publicStayFacts(JSON.stringify(furama), "2027-01-01")!.publicRates.length,
    0,
  );
  const notYet = structuredClone(furama);
  notYet.publicRates[0].validFrom = "2026-12-01";
  assert.equal(
    publicStayFacts(JSON.stringify(notYet), "2026-11-05")!.publicRates.length,
    0,
  );
});
test("Giá cần đối chiếu sau 30 ngày; giờ và sức chứa sau 180 ngày", () => {
  assert.equal(
    publicStayFacts(JSON.stringify(furama), "2026-12-06")!.publicRates.length,
    0,
  );
  assert.ok(
    publicStayFacts(JSON.stringify(furama), "2026-12-05")!.publicRates.length,
  );
  assert.equal(
    publicStayFacts(JSON.stringify(furama), "2027-06-01")!.hours,
    undefined,
  );
  const sala = manifest.find(
    (row: { key: string }) => row.key === "sala-danang-beach",
  );
  assert.equal(
    publicStayFacts(JSON.stringify(sala), "2027-06-01")!.rooms.length,
    0,
  );
});
test("Không chấp nhận dữ liệu sai tọa độ Đà Nẵng, giờ, giá âm hoặc nguồn javascript", () => {
  for (const modify of [
    (row: any) => (row.hours.checkIn = "25:00"),
    (row: any) => (row.publicRates[0].nightlyVnd = -1),
    (row: any) => (row.hours.sourceUrl = "javascript:alert(1)"),
    (row: any) =>
      (row.coordinates = {
        latitude: 0,
        longitude: 0,
        note: "Sai khu vực",
        sourceUrl: "https://example.com",
        checkedOn: "2026-11-05",
      }),
    (row: any) => (row.publicRates[0].validTo = "2025-01-01"),
  ]) {
    const row = structuredClone(furama);
    modify(row);
    assert.equal(stayDetailsSchema.safeParse(row).success, false);
  }
  assert.equal(publicStayFacts("{broken", "2026-11-05"), undefined);
});
test("Nguồn có ngày đối chiếu ở tương lai chưa được sử dụng", () => {
  const facts = publicStayFacts(JSON.stringify(furama), "2026-11-04")!;
  assert.equal(facts.publicRates.length, 0);
  assert.equal(facts.hours, undefined);
});
test("Hỏi tên cụ thể phải giữ đúng khách sạn, không trộn dữ liệu giá/sức chứa", () => {
  for (const name of ["Furama", "Hilton", "Hyatt", "HAIAN", "Sala"]) {
    const intent = ruleIntent(`${name} nhận phòng mấy giờ?`);
    assert.equal(intent.category, "stay");
    assert.ok(intent.keywords.includes(name));
  }
  assert.equal(ruleIntent("Nhà hàng hải sản ở HAIAN").category, "food");
});
