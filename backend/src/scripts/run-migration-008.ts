import { readFileSync } from 'fs';
import { resolve } from 'path';
import { connectDB, getPool, closeDB } from '../config/db';

export async function runMigration008(): Promise<void> {
  console.log('🚀 Đang thực thi Migration 008 (Index Optimization) vào SQL Server...');
  await connectDB();
  const pool = getPool();

  const migrationPath = resolve(__dirname, '../../../database/migrations/008_optimize_indexes.sql');
  const sqlContent = readFileSync(migrationPath, 'utf-8');

  // Tách các lệnh bởi GO (cú pháp batch của MSSQL)
  const batches = sqlContent
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !b.startsWith('USE '));

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      await pool.request().query(batch);
    } catch (err: any) {
      console.error(`❌ Lỗi tại batch ${i + 1}:`, err.message);
      console.error(`Nội dung batch: \n${batch}`);
      throw err;
    }
  }

  console.log('✅ Migration 008 đã được thực thi thành công!');
  await closeDB();
}

if (require.main === module) {
  runMigration008()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error in Migration 008:', err);
      process.exit(1);
    });
}
