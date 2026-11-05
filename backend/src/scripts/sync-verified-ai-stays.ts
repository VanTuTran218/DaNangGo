import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { connectDB, closeDB, getPool, sql } from "../config/db";
export const referenceSchema = z
  .array(
    z
      .object({
        key: z
          .string()
          .regex(/^[a-z0-9-]+$/)
          .max(100),
        name: z.string().min(1).max(200),
        kind: z.enum(["HOTEL", "RESORT"]),
        address: z.string().max(255),
        legacyDistrict: z.string(),
        phone: z.string().max(20),
        website: z.url().max(255),
        summary: z.string().min(1).max(500),
        sources: z.array(z.url()).min(1),
        checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        image: z
          .object({
            path: z
              .string()
              .regex(/^\/places\/real-stays\/[a-z0-9-]+\.(jpg|webp|png)$/),
            source: z.url(),
            checkedOn: z.string(),
          })
          .optional(),
      })
      .strict(),
  )
  .min(1);
const root = resolve(__dirname, "../../..");
export async function syncVerifiedStays() {
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Chỉ chạy đồng bộ đã duyệt trên database development của dự án.",
    );
  const rows = referenceSchema.parse(
    JSON.parse(
      readFileSync(
        resolve(root, "database/seeds/verified-ai-stays.json"),
        "utf8",
      ),
    ),
  );
  if (new Set(rows.map((r) => r.key)).size !== rows.length)
    throw new Error("Trùng mã nguồn tham khảo.");
  for (const row of rows)
    if (
      row.image &&
      !existsSync(resolve(root, "frontend/public" + row.image.path))
    )
      throw new Error("Thiếu ảnh đúng cơ sở: " + row.key);
  const migration = readFileSync(
    resolve(root, "database/migrations/016_public_place_provenance.sql"),
    "utf8",
  );
  for (const batch of migration.split(/^\s*GO\s*$/gim).filter((s) => s.trim()))
    await getPool().request().query(batch);
  const tx = new sql.Transaction(getPool());
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const batchId = randomUUID();
    const imported: number[] = [];
    for (const row of rows) {
      const district = await new sql.Request(tx)
        .input("name", sql.NVarChar(100), row.legacyDistrict)
        .query("SELECT district_id FROM dbo.districts WHERE name=@name");
      if (district.recordset.length !== 1)
        throw new Error("Không khớp danh mục khu vực: " + row.legacyDistrict);
      const found = await new sql.Request(tx)
        .input("key", sql.VarChar(100), row.key)
        .input("name", sql.NVarChar(200), row.name)
        .query(
          "SELECT place_id,partner_id,reference_key,status FROM dbo.places WITH(UPDLOCK,HOLDLOCK) WHERE reference_key=@key OR name=@name",
        );
      if (
        found.recordset.length > 1 ||
        found.recordset.some(
          (r) => r.partner_id != null || r.reference_key !== row.key,
        )
      )
        throw new Error(
          "Cơ sở trùng tên hoặc có chủ quản; cần đối chiếu riêng: " + row.name,
        );
      const old = found.recordset[0];
      const description =
        row.summary +
        "\n\nHồ sơ thông tin công khai để tham khảo, không xác nhận cơ sở là đối tác DaNangGo. Giá đặt phòng và phòng trống cần xác nhận trực tiếp với cơ sở. Thông tin lưu trú bổ sung có nguồn và phạm vi đối chiếu riêng.\nNguồn chính thức: " +
        row.sources.join("\n") +
        "\nNgày đối chiếu tên, địa chỉ, liên hệ: " +
        row.checkedOn;
      const request = new sql.Request(tx)
        .input("key", sql.VarChar(100), row.key)
        .input("name", sql.NVarChar(200), row.name)
        .input("address", sql.NVarChar(255), row.address)
        .input("district", sql.Int, district.recordset[0].district_id)
        .input("description", sql.NVarChar(sql.MAX), description)
        .input("phone", sql.VarChar(20), row.phone)
        .input("website", sql.VarChar(255), row.website)
        .input("source", sql.NVarChar(1000), row.sources[0])
        .input("checked", sql.Date, row.checkedOn);
      let id: number;
      if (old) {
        id = old.place_id;
        await request
          .input("id", sql.Int, id)
          .query(
            "UPDATE dbo.places SET name=@name,address=@address,district_id=@district,description=@description,phone=@phone,website=@website,reference_source_url=@source,reference_checked_at=@checked,updated_at=SYSUTCDATETIME() WHERE place_id=@id AND partner_id IS NULL AND reference_key=@key",
          );
      } else {
        const saved = await request.query(
          "INSERT INTO dbo.places(place_type,name,address,district_id,description,phone,website,partner_id,status,reference_key,reference_source_url,reference_checked_at) OUTPUT INSERTED.place_id VALUES('ACCOMMODATION',@name,@address,@district,@description,@phone,@website,NULL,'ACTIVE',@key,@source,@checked)",
        );
        id = saved.recordset[0].place_id;
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("kind", sql.VarChar(20), row.kind)
          .query(
            "INSERT INTO dbo.accommodations(place_id,place_type,accommodation_type,star_rating,check_in_time,check_out_time,accepts_cash,accepts_bank_transfer) VALUES(@id,'ACCOMMODATION',@kind,NULL,NULL,NULL,NULL,NULL)",
          );
      }
      if (row.image)
        await new sql.Request(tx)
          .input("id", sql.Int, id)
          .input("image", sql.VarChar(255), row.image.path)
          .query(
            "IF NOT EXISTS(SELECT 1 FROM dbo.place_images WHERE place_id=@id) INSERT INTO dbo.place_images(place_id,image_url,is_cover) VALUES(@id,@image,1)",
          );
      await new sql.Request(tx)
        .input("id", sql.Int, id)
        .input(
          "facts",
          sql.NVarChar(sql.MAX),
          JSON.stringify({
            verifiedFields: ["name", "address", "phone", "website"],
            ...row,
            notVerifiedByThisImport: [
              "latitude",
              "longitude",
              "room_prices",
              "room_capacity",
              "availability",
              "ratings",
              "payment_methods",
            ],
            legacyDistrictNote:
              "Ánh xạ vào danh mục khu vực hiện có của dự án; không thay đổi tên đơn vị hành chính mới trong địa chỉ nguồn.",
          }),
        )
        .query(
          "MERGE dbo.public_place_provenance WITH(HOLDLOCK) AS target USING(SELECT @id AS place_id) AS source ON target.place_id=source.place_id WHEN MATCHED THEN UPDATE SET facts_json=@facts,updated_at=SYSUTCDATETIME() WHEN NOT MATCHED THEN INSERT(place_id,facts_json) VALUES(@id,@facts);",
        );
      imported.push(id);
    }
    // Exact fixture IDs/names only. Retain their inventory, ratings, and every foreign key.
    const fixtures = [
      [330, "[Mẫu] Khách sạn Biển Xanh"],
      [331, "[Mẫu] Homestay Sông Hàn"],
      [332, "[Mẫu] Resort Ngũ Hành Sơn"],
      [333, "[Mẫu] Khách sạn Thanh Khê"],
      [334, "[Mẫu] Homestay Hòa Vang"],
    ] as const;
    let hidden = 0;
    for (const [id, name] of fixtures) {
      const changed = await new sql.Request(tx)
        .input("id", sql.Int, id)
        .input("name", sql.NVarChar(200), name)
        .input("batch", sql.UniqueIdentifier, batchId)
        .query(
          "UPDATE dbo.places SET status='HIDDEN',updated_at=SYSUTCDATETIME() OUTPUT DELETED.status AS previous_status WHERE place_id=@id AND name=@name AND partner_id IS NULL AND status='ACTIVE' AND reference_key IS NULL",
        );
      if (changed.recordset.length) {
        await new sql.Request(tx)
          .input("batch", sql.UniqueIdentifier, batchId)
          .input("id", sql.Int, id)
          .input(
            "previous",
            sql.VarChar(20),
            changed.recordset[0].previous_status,
          )
          .query(
            "INSERT INTO dbo.public_catalog_change_log(batch_id,place_id,previous_status,new_status,reason) VALUES(@batch,@id,@previous,'HIDDEN',N'Ẩn hồ sơ mẫu khỏi danh sách công khai và AI')",
          );
        hidden++;
      }
    }
    await tx.commit();
    return { batchId, imported, hidden };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
if (require.main === module) {
  connectDB()
    .then(syncVerifiedStays)
    .then((result) => console.log(JSON.stringify(result)))
    .catch((e) => {
      console.error(
        e instanceof Error ? e.message : "Không đồng bộ được hồ sơ nguồn.",
      );
      process.exitCode = 1;
    })
    .finally(closeDB);
}
