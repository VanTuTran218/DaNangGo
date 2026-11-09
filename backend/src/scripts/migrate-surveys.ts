import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectDB, closeDB, getPool } from "../config/db";
import { seedSurveyCatalog } from "../modules/surveys/surveys.repository";
async function main() {
  await connectDB();
  try {
    const text = readFileSync(
      resolve(
        __dirname,
        "../../../database/migrations/015_survey_submission.sql",
      ),
      "utf8",
    );
    for (const batch of text.split(/^\s*GO\s*$/gim).filter((s) => s.trim()))
      await getPool().request().query(batch);
    await seedSurveyCatalog();
    console.log(
      "Đã chuẩn bị khảo sát đầy đủ và khảo sát nhanh; không tạo câu trả lời giả.",
    );
  } finally {
    await closeDB();
  }
}
main().catch(() => {
  console.error("Không thể chuẩn bị dữ liệu khảo sát.");
  process.exitCode = 1;
});
