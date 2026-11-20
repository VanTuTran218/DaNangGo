import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, closeDB, getPool } from '../config/db';

async function executeSqlFile(filePath: string, label: string) {
  const content = readFileSync(filePath, 'utf8');
  const batches = content
    .split(/^\s*GO\s*$/gim)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const pool = getPool();
  for (const batch of batches) {
    // Loại bỏ lệnh USE DaNangGo; nếu có để tránh lỗi khi DB đã được connect
    const cleanBatch = batch.replace(/^USE\s+\[?DaNangGo\]?\s*;?/gim, '').trim();
    if (cleanBatch.length > 0) {
      await pool.request().query(cleanBatch);
    }
  }
  console.log(`✅ ${label} thành công.`);
}

async function main() {
  await connectDB();
  try {
    const isSeedOnly = process.argv.includes('--seed-only');
    
    if (!isSeedOnly) {
      const migrationPath = resolve(__dirname, '../../../database/migrations/019_create_events.sql');
      console.log('Đang chạy migration 019_create_events.sql...');
      await executeSqlFile(migrationPath, 'Tạo bảng dbo.events và Index');

      const migrationPhase2Path = resolve(__dirname, '../../../database/migrations/020_events_phase2.sql');
      console.log('Đang chạy migration 020_events_phase2.sql...');
      await executeSqlFile(migrationPhase2Path, 'Tạo các bảng Đợt 2 (Favorites, Calendar, Notifications)');

      const migrationPhase3Path = resolve(__dirname, '../../../database/migrations/021_events_phase3.sql');
      console.log('Đang chạy migration 021_events_phase3.sql...');
      await executeSqlFile(migrationPhase3Path, 'Cập nhật Đợt 3 (Phê duyệt BTC, Tiếng Anh & Gợi ý lân cận)');
    }

    const seedPath = resolve(__dirname, '../../../database/seeds/060_events_sample.sql');
    console.log('Đang nạp dữ liệu mẫu 060_events_sample.sql...');
    await executeSqlFile(seedPath, 'Nạp dữ liệu mẫu sự kiện');

    console.log('🎉 Hoàn tất chuẩn bị module Sự kiện (Events) cho DaNangGo!');
  } catch (error) {
    console.error('❌ Lỗi khi thực thi migration/seed Sự kiện:', error);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

main().catch((err) => {
  console.error('Lỗi ngoại lệ:', err);
  process.exitCode = 1;
});
