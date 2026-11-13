import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import bcrypt from 'bcryptjs';
import { connectDB, getPool, closeDB, sql } from '../config/db';

async function seedPartner() {
  console.log('🚀 Đang khởi tạo dữ liệu tài khoản Đối tác (Partner)...');
  await connectDB();
  const pool = getPool();

  const partnerEmail = 'doitac@dananggo.vn';
  const rawPassword = 'Partner@123456';
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  // 1. Tìm role_id của PARTNER
  const roleResult = await pool.request().query<{ role_id: number }>(`
    SELECT role_id FROM dbo.roles WHERE UPPER(role_name) = 'PARTNER'
  `);
  let partnerRoleId = roleResult.recordset[0]?.role_id;
  if (!partnerRoleId) {
    partnerRoleId = 2; // Default fallback
  }

  // 2. Tìm hoặc tạo user đối tác
  let userId: number;
  const existingUser = await pool.request()
    .input('email', sql.VarChar(150), partnerEmail)
    .query<{ user_id: number }>(`
      SELECT user_id FROM dbo.users WHERE email = @email
    `);

  if (existingUser.recordset.length > 0) {
    userId = existingUser.recordset[0].user_id;
    console.log(`ℹ️ Tài khoản ${partnerEmail} đã tồn tại (ID: ${userId}). Cập nhật mật khẩu và kích hoạt...`);
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .input('roleId', sql.Int, partnerRoleId)
      .query(`
        UPDATE dbo.users
        SET password_hash = @passwordHash,
            role_id = @roleId,
            status = 'ACTIVE',
            email_verified = 1,
            failed_login_count = 0,
            locked_until = NULL
        WHERE user_id = @userId
      `);
  } else {
    console.log(`✨ Đang tạo tài khoản mới: ${partnerEmail}...`);
    const insertUserRes = await pool.request()
      .input('roleId', sql.Int, partnerRoleId)
      .input('fullName', sql.NVarChar(50), 'Đối Tác Mẫu DanangGo')
      .input('email', sql.VarChar(150), partnerEmail)
      .input('passwordHash', sql.VarChar(255), passwordHash)
      .input('publicId', sql.NVarChar(20), 'NCC-2026-DOITAC01')
      .input('phone', sql.VarChar(20), '0905123456')
      .query<{ user_id: number }>(`
        INSERT INTO dbo.users
          (role_id, full_name, email, password_hash, public_id, email_verified, status, phone, created_at)
        OUTPUT INSERTED.user_id
        VALUES
          (@roleId, @fullName, @email, @passwordHash, @publicId, 1, 'ACTIVE', @phone, GETDATE())
      `);
    userId = insertUserRes.recordset[0].user_id;
    console.log(`✅ Đã tạo user thành công (ID: ${userId})`);
  }

  // 3. Tìm hoặc tạo partner profile
  let partnerId: number;
  const existingProfile = await pool.request()
    .input('userId', sql.Int, userId)
    .query<{ partner_id: number }>(`
      SELECT partner_id FROM dbo.partner_profiles WHERE user_id = @userId
    `);

  if (existingProfile.recordset.length > 0) {
    partnerId = existingProfile.recordset[0].partner_id;
    console.log(`ℹ️ Hồ sơ đối tác đã tồn tại (Partner ID: ${partnerId}). Đảm bảo trạng thái APPROVED...`);
    await pool.request()
      .input('partnerId', sql.Int, partnerId)
      .query(`
        UPDATE dbo.partner_profiles
        SET approval_status = 'APPROVED',
            business_name = N'DanangGo Luxury Boutique Hotel & Seafood',
            service_type = 'TABLE',
            address = N'120 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng',
            contact_phone = '0905123456',
            approved_at = ISNULL(approved_at, GETDATE())
        WHERE partner_id = @partnerId
      `);
  } else {
    console.log(`✨ Đang tạo hồ sơ đối tác (APPROVED)...`);
    const insertProfileRes = await pool.request()
      .input('userId', sql.Int, userId)
      .input('businessName', sql.NVarChar(100), 'DanangGo Luxury Boutique Hotel & Seafood')
      .input('serviceType', sql.NVarChar(20), 'TABLE')
      .input('contactPhone', sql.VarChar(20), '0905123456')
      .input('address', sql.NVarChar(200), '120 Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng')
      .query<{ partner_id: number }>(`
        INSERT INTO dbo.partner_profiles
          (user_id, business_name, service_type, contact_phone, address, approval_status, approved_at, created_at)
        OUTPUT INSERTED.partner_id
        VALUES
          (@userId, @businessName, @serviceType, @contactPhone, @address, 'APPROVED', GETDATE(), GETDATE())
      `);
    partnerId = insertProfileRes.recordset[0].partner_id;
    console.log(`✅ Đã tạo partner profile thành công (Partner ID: ${partnerId})`);
  }

  // 4. Đảm bảo có ít nhất 1 cơ sở thuộc về đối tác này để hiển thị trên Dashboard
  const placeCheck = await pool.request()
    .input('partnerId', sql.Int, partnerId)
    .query<{ count: number }>(`
      SELECT COUNT(*) AS count FROM dbo.places WHERE partner_id = @partnerId
    `);

  if (placeCheck.recordset[0].count === 0) {
    // Thử liên kết một địa điểm chưa có chủ hoặc cập nhật địa điểm mẫu
    const availablePlace = await pool.request().query<{ place_id: number }>(`
      SELECT TOP 1 place_id FROM dbo.places WHERE partner_id IS NULL ORDER BY place_id
    `);

    if (availablePlace.recordset.length > 0) {
      const pid = availablePlace.recordset[0].place_id;
      await pool.request()
        .input('pid', sql.Int, pid)
        .input('partnerId', sql.Int, partnerId)
        .query(`
          UPDATE dbo.places
          SET partner_id = @partnerId, status = 'ACTIVE'
          WHERE place_id = @pid
        `);
      console.log(`🏢 Đã liên kết cơ sở place_id=${pid} cho đối tác.`);
    } else {
      console.log(`ℹ️ Đối tác đã sẵn sàng tạo mới cơ sở đầu tiên trên giao diện.`);
    }
  } else {
    console.log(`🏢 Đối tác hiện có ${placeCheck.recordset[0].count} cơ sở kinh doanh.`);
  }

  // 5. Gói đăng ký hoạt động (Subscription)
  try {
    const pkgCheck = await pool.request().query<{ package_id: number }>(`
      SELECT TOP 1 package_id FROM dbo.subscription_packages WHERE package_code = '1_YEAR'
    `);
    const packageId = pkgCheck.recordset[0]?.package_id;

    if (packageId) {
      const txCode = `DNG-SEED-PTN-${partnerId}`;
      await pool.request()
        .input('txCode', sql.NVarChar(50), txCode)
        .input('partnerId', sql.Int, partnerId)
        .input('packageId', sql.Int, packageId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.partner_subscriptions WHERE partner_id = @partnerId AND subscription_status = 'ACTIVE')
          BEGIN
            INSERT INTO dbo.partner_subscriptions (
              transaction_code, partner_id, package_id, package_name, duration_months, price,
              subscription_status, payment_status, payment_method, start_date, end_date,
              confirmed_at, is_renewal
            )
            VALUES (
              @txCode, @partnerId, @packageId, N'Gói Đối Tác VIP 1 Năm', 12, 12000000,
              'ACTIVE', 'PAID', N'BANK_TRANSFER', GETDATE(), DATEADD(year, 1, GETDATE()),
              GETDATE(), 0
            );
          END
        `);
      console.log(`💎 Đã kích hoạt gói dịch vụ VIP cho đối tác.`);
    }
  } catch (subErr) {
    console.log(`ℹ️ Bỏ qua kích hoạt subscription: ${(subErr as any)?.message}`);
  }

  console.log('\n======================================================');
  console.log('🎉 KHỞI TẠO TÀI KHOẢN ĐỐI TÁC THÀNH CÔNG!');
  console.log('------------------------------------------------------');
  console.log(`📧 Email đăng nhập : ${partnerEmail}`);
  console.log(`🔑 Mật khẩu        : ${rawPassword}`);
  console.log(`🌐 Link đăng nhập  : http://localhost:3000/dang-nhap?redirect=/partner`);
  console.log(`🏢 Trang quản lý   : http://localhost:3000/partner`);
  console.log('======================================================\n');
}

seedPartner()
  .catch((err) => {
    console.error('❌ Lỗi khởi tạo đối tác:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB();
  });
