import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { connectDB, closeDB, getPool, sql } from "../config/db";
import { stayDetailsSchema } from "../modules/chat/chat.stay-facts";

export async function syncVerifiedStayDetails() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Chỉ đồng bộ trên database development.");
  const root = resolve(__dirname, "../../..");
  const details = z
    .array(stayDetailsSchema)
    .parse(
      JSON.parse(
        readFileSync(
          resolve(root, "database/seeds/verified-stay-details.json"),
          "utf8",
        ),
      ),
    );
  if (new Set(details.map((row) => row.key)).size !== details.length)
    throw new Error("Trùng mã cơ sở.");
  const migration = readFileSync(
    resolve(root, "database/migrations/017_public_stay_details.sql"),
    "utf8",
  );
  for (const batch of migration
    .split(/^\s*GO\s*$/gim)
    .filter((value) => value.trim()))
    await getPool().request().query(batch);
  const tx = new sql.Transaction(getPool());
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    for (const row of details) {
      const result = await new sql.Request(tx).input(
        "key",
        sql.VarChar(100),
        row.key,
      ).query(`
        SELECT p.place_id,p.partner_id,p.latitude,p.longitude,d.facts_json,
          CONVERT(varchar(5),a.check_in_time,108) AS check_in,
          CONVERT(varchar(5),a.check_out_time,108) AS check_out
        FROM dbo.places p WITH(UPDLOCK,HOLDLOCK)
        JOIN dbo.accommodations a ON a.place_id=p.place_id
        LEFT JOIN dbo.public_stay_details d ON d.place_id=p.place_id
        WHERE p.reference_key=@key AND p.place_type='ACCOMMODATION'`);
      const saved = result.recordset[0];
      if (result.recordset.length !== 1 || saved.partner_id != null)
        throw new Error(
          "Thiếu hồ sơ tham khảo hoặc cơ sở đã có đối tác: " + row.key,
        );
      const previous = saved.facts_json
        ? stayDetailsSchema.parse(JSON.parse(saved.facts_json))
        : undefined;
      if (row.coordinates) {
        const owned =
          (saved.latitude == null && saved.longitude == null) ||
          (previous?.coordinates &&
            Math.abs(Number(saved.latitude) - previous.coordinates.latitude) <
              0.000001 &&
            Math.abs(Number(saved.longitude) - previous.coordinates.longitude) <
              0.000001);
        if (!owned)
          throw new Error(
            "Tọa độ đã được sửa riêng, cần đối chiếu: " + row.key,
          );
        await new sql.Request(tx)
          .input("id", sql.Int, saved.place_id)
          .input("lat", sql.Decimal(10, 7), row.coordinates.latitude)
          .input("lng", sql.Decimal(10, 7), row.coordinates.longitude)
          .query(
            "UPDATE dbo.places SET latitude=@lat,longitude=@lng,updated_at=SYSUTCDATETIME() WHERE place_id=@id AND partner_id IS NULL",
          );
      }
      if (row.hours) {
        if (
          (saved.check_in != null &&
            saved.check_in !== previous?.hours?.checkIn) ||
          (saved.check_out != null &&
            saved.check_out !== previous?.hours?.checkOut)
        )
          throw new Error("Giờ lưu trú đã được sửa riêng: " + row.key);
        await new sql.Request(tx)
          .input("id", sql.Int, saved.place_id)
          .input("ci", sql.VarChar(5), row.hours.checkIn)
          .input("co", sql.VarChar(5), row.hours.checkOut)
          .query(
            "UPDATE dbo.accommodations SET check_in_time=CAST(@ci AS time),check_out_time=CAST(@co AS time) WHERE place_id=@id",
          );
      }
      await new sql.Request(tx)
        .input("id", sql.Int, saved.place_id)
        .input("facts", sql.NVarChar(sql.MAX), JSON.stringify(row)).query(`
        MERGE dbo.public_stay_details WITH(HOLDLOCK) AS target
        USING(SELECT @id AS place_id) AS source ON target.place_id=source.place_id
        WHEN MATCHED THEN UPDATE SET facts_json=@facts,updated_at=SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT(place_id,facts_json) VALUES(@id,@facts);`);
    }
    await tx.commit();
    return {
      properties: details.length,
      coordinates: details.filter((r) => r.coordinates).length,
      hours: details.filter((r) => r.hours).length,
      roomDescriptions: details.reduce((n, r) => n + r.rooms.length, 0),
      publicRates: details.reduce((n, r) => n + r.publicRates.length, 0),
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
if (require.main === module)
  connectDB()
    .then(syncVerifiedStayDetails)
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(
        error instanceof Error
          ? error.message
          : "Không đồng bộ được dữ liệu lưu trú.",
      );
      process.exitCode = 1;
    })
    .finally(closeDB);
