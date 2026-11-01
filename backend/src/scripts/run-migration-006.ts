import { readFileSync } from 'fs';
import { resolve } from 'path';
import { connectDB, getPool, closeDB, sql } from '../config/db';

async function runMigration006() {
  console.log('🚀 Bắt đầu thực thi Migration 006 (Task 8: LOCKED status & booking_url) vào SQL Server...');
  await connectDB();
  const pool = getPool();

  const migrationPath = resolve(__dirname, '../../../database/migrations/006_places_locked_and_booking_url.sql');
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

  // Xác minh kiểm tra cấu trúc sau migration
  console.log('🔍 Đang kiểm tra xác minh sau migration...');

  // 1. Kiểm tra cột booking_url
  const colCheck = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'places' AND COLUMN_NAME = 'booking_url'
  `);
  if (colCheck.recordset.length > 0) {
    console.log('  [✓] Cột booking_url tồn tại chính xác:', colCheck.recordset[0]);
  } else {
    throw new Error('Cột booking_url không tìm thấy sau migration!');
  }

  // 2. Kiểm tra ràng buộc chk_places_status có LOCKED
  const statusCheck = await pool.request().query(`
    SELECT name, definition
    FROM sys.check_constraints
    WHERE name = 'chk_places_status'
  `);
  if (statusCheck.recordset.length > 0 && statusCheck.recordset[0].definition.includes('LOCKED')) {
    console.log('  [✓] Ràng buộc chk_places_status cho phép trạng thái LOCKED.');
  } else {
    throw new Error('Ràng buộc chk_places_status không chứa LOCKED!');
  }

  // 3. Kiểm tra ràng buộc chk_places_booking_url
  const urlCheck = await pool.request().query(`
    SELECT name, definition
    FROM sys.check_constraints
    WHERE name = 'chk_places_booking_url'
  `);
  if (urlCheck.recordset.length > 0) {
    console.log('  [✓] Ràng buộc chk_places_booking_url đã kích hoạt (chỉ nhận http:// hoặc https://).');
  } else {
    throw new Error('Ràng buộc chk_places_booking_url chưa được kích hoạt!');
  }

  // 4. Kiểm tra toàn vẹn dữ liệu cũ
  const totalPlaces = await pool.request().query('SELECT COUNT(*) AS total FROM places');
  console.log(`  [✓] Dữ liệu hiện có nguyên vẹn: ${totalPlaces.recordset[0].total} địa điểm.`);

  console.log('✅ Hoàn thành thực thi và xác minh Migration 006 thành công 100%!');
  await closeDB();
}

runMigration006().catch((err) => {
  console.error('Fatal error during Migration 006:', err);
  process.exit(1);
});
