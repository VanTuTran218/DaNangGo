import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectDB, closeDB, getPool } from "../config/db";
export const AI_MIGRATION = `
IF COL_LENGTH('dbo.chat_messages','dto_json') IS NULL
ALTER TABLE dbo.chat_messages ADD dto_json NVARCHAR(MAX) NULL;

IF OBJECT_ID('dbo.partner_review_replies','U') IS NULL
CREATE TABLE dbo.partner_review_replies(
 review_id INT NOT NULL PRIMARY KEY REFERENCES dbo.reviews(review_id),
 partner_id INT NOT NULL REFERENCES dbo.partner_profiles(partner_id),
 reply_text NVARCHAR(800) NOT NULL,updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('dbo.ai_place_vectors','U') IS NULL
CREATE TABLE dbo.ai_place_vectors(
 place_id INT NOT NULL PRIMARY KEY REFERENCES dbo.places(place_id),content_hash VARCHAR(64) NOT NULL,
 model NVARCHAR(100) NOT NULL,embedding_json NVARCHAR(MAX) NOT NULL,updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());`;
async function main() {
  await connectDB();
  try {
    await getPool().request().query(AI_MIGRATION);
    for (const file of [
      "013_chat_planner_storage.sql",
      "014_planner_catalog_preferences.sql",
      "016_public_place_provenance.sql",
      "017_public_stay_details.sql",
      "018_ai_user_preferences.sql",
    ]) {
      const migration = readFileSync(
        resolve(__dirname, "../../../database/migrations", file),
        "utf8",
      );
      for (const batch of migration
        .split(/^\s*GO\s*$/gim)
        .filter((value) => value.trim()))
        await getPool().request().query(batch);
    }
    console.log(
      "Đã chuẩn bị dữ liệu lịch sử hội thoại, phản hồi đối tác và embedding AI.",
    );
  } finally {
    await closeDB();
  }
}
if (require.main === module)
  main().catch(() => {
    console.error("Không thể chuẩn bị bảng AI.");
    process.exitCode = 1;
  });
