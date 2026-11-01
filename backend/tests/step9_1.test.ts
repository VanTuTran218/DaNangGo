import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import partnerRouter from '../src/modules/partner/partner.routes';
import adminPartnersRouter from '../src/modules/admin/admin.routes';
import { errorHandler } from '../src/middleware/error-handler';
import http from 'http';
import jwt from 'jsonwebtoken';

function generateTestToken(userId: number, role: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runStep91Tests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TASK 9.1: BẢO VỆ TRUY CẬP PARTNER VÀ HỒ SƠ PHÊ DUYỆT');
  console.log('   (KIỂM TRA CHẶN TRANG THEO CÁCH CỦA TUẤN, API PROFILE & APPROVAL_STATUS)');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ [FAILED] ${testName}`);
      if (detail) console.error(`   Chi tiết: ${detail}`);
      throw new Error(`Test failed: ${testName}`);
    } else {
      passedTests++;
      console.log(`✅ [PASSED] ${testName}`);
      if (detail) console.log(`   ${detail}`);
    }
  }

  const createdUserIds: number[] = [];
  const createdPartnerIds: number[] = [];

  // Setup Express App
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/partner', partnerRouter);
  app.use('/api/admin/partners', adminPartnersRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TẠO TÀI KHOẢN TEST: ADMIN, USER THƯỜNG, PARTNER CHỜ DUYỆT, PARTNER ĐÃ DUYỆT
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Admin
    const adminRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Test Admin 9.1', 'admin_step91@dananggo.vn', 'hash', 'ADM-91', 1, 'ACTIVE', GETDATE())
    `);
    const adminId = adminRes.recordset[0].user_id;
    createdUserIds.push(adminId);
    const adminToken = generateTestToken(adminId, 'ADMIN');

    // 2. User thường (không phải Partner)
    const userRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, N'Normal User 9.1', 'user_step91@dananggo.vn', 'hash', 'USR-91', 1, 'ACTIVE', GETDATE())
    `);
    const normalUserId = userRes.recordset[0].user_id;
    createdUserIds.push(normalUserId);
    const normalUserToken = generateTestToken(normalUserId, 'USER');

    // 3. Partner Chờ Duyệt (PENDING)
    const pendingUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Pending Partner 9.1', 'pending_p91@dananggo.vn', 'hash', 'PTN-PENDING-91', 1, 'ACTIVE', GETDATE())
    `);
    const pendingUserId = pendingUserRes.recordset[0].user_id;
    createdUserIds.push(pendingUserId);
    const pendingPartnerToken = generateTestToken(pendingUserId, 'PARTNER');

    const pendingProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${pendingUserId}, N'Nhà Hàng Biển Đông (Chờ duyệt)', '0905111222', 'PENDING', N'12 Võ Nguyên Giáp', 'TABLE', GETDATE())
    `);
    const pendingPartnerId = pendingProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(pendingPartnerId);

    // 4. Partner Đã Duyệt (APPROVED)
    const approvedUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Approved Partner 9.1', 'approved_p91@dananggo.vn', 'hash', 'PTN-APPROVED-91', 1, 'ACTIVE', GETDATE())
    `);
    const approvedUserId = approvedUserRes.recordset[0].user_id;
    createdUserIds.push(approvedUserId);
    const approvedPartnerToken = generateTestToken(approvedUserId, 'PARTNER');

    const approvedProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${approvedUserId}, N'Nhà Hàng Hải Sản Phố (Đã duyệt)', '0905333444', 'APPROVED', N'51 Võ Nguyên Giáp', 'TABLE', GETDATE(), GETDATE())
    `);
    const approvedPartnerId = approvedProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(approvedPartnerId);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 1: BẢO VỆ ROUTE AUTHENTICATION & ROLE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 1: BẢO VỆ ROUTE AUTHENTICATION & RBAC ---');

    // 1.1 Khách vãng lai gọi GET /api/partner/profile không có token -> 401
    const resNoAuth = await fetch(`${baseUrl}/api/partner/profile`);
    assert(resNoAuth.status === 401, '1.1 Không có token đăng nhập gọi profile phải bị 401');

    // 1.2 User thường gọi GET /api/partner/profile -> 403 Forbidden
    const resNormalUser = await fetch(`${baseUrl}/api/partner/profile`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert(resNormalUser.status === 403, '1.2 Tài khoản User thường truy cập profile đối tác phải bị 403');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 2: ĐỐI TÁC CHỜ DUYỆT (PENDING)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 2: TRẠNG THÁI HỒ SƠ ĐỐI TÁC CHỜ DUYỆT (PENDING) ---');

    const resPending = await fetch(`${baseUrl}/api/partner/profile`, {
      headers: { Authorization: `Bearer ${pendingPartnerToken}` },
    });
    const pendingJson = await resPending.json();
    assert(resPending.status === 200, '2.1 Đối tác PENDING lấy thông tin profile thành công');
    assert(pendingJson.data.status === 'PENDING', '2.2 approval_status trả về chính xác là PENDING');
    assert(pendingJson.data.businessName === 'Nhà Hàng Biển Đông (Chờ duyệt)', '2.3 Tên doanh nghiệp khớp với CSDL');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 3: ĐỐI TÁC ĐÃ DUYỆT (APPROVED)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 3: TRẠNG THÁI HỒ SƠ ĐỐI TÁC ĐÃ DUYỆT (APPROVED) ---');

    const resApproved = await fetch(`${baseUrl}/api/partner/profile`, {
      headers: { Authorization: `Bearer ${approvedPartnerToken}` },
    });
    const approvedJson = await resApproved.json();
    assert(resApproved.status === 200, '3.1 Đối tác APPROVED lấy thông tin profile thành công');
    assert(approvedJson.data.status === 'APPROVED', '3.2 approval_status trả về chính xác là APPROVED');
    assert(approvedJson.data.businessName === 'Nhà Hàng Hải Sản Phố (Đã duyệt)', '3.3 Tên doanh nghiệp chính xác');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 4: ADMIN DUYỆT HỒ SƠ TỪ PENDING SANG APPROVED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 4: ADMIN DUYỆT ĐỐI TÁC PENDING -> APPROVED ---');

    // 4.1 Admin duyệt partner
    const resApprove = await fetch(`${baseUrl}/api/admin/partners/${pendingPartnerId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Cookie: `admin_access=${adminToken}`,
      },
    });
    const approveJson = await resApprove.json();
    assert(resApprove.status === 200 && approveJson.success === true, '4.1 Admin duyệt đối tác PENDING thành công');

    // 4.2 Kiểm tra lại profile của partner vừa được duyệt: phải đổi sang APPROVED
    const resAfterApprove = await fetch(`${baseUrl}/api/partner/profile`, {
      headers: { Authorization: `Bearer ${pendingPartnerToken}` },
    });
    const afterApproveJson = await resAfterApprove.json();
    assert(afterApproveJson.data.status === 'APPROVED', '4.2 Sau khi duyệt, profile đối tác lập tức chuyển sang APPROVED');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 5: CẬP NHẬT THÔNG TIN HỒ SƠ DOANH NGHIỆP (PUT /profile)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 5: CẬP NHẬT HỒ SƠ DOANH NGHIỆP (PUT /profile) ---');

    const resUpdate = await fetch(`${baseUrl}/api/partner/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedPartnerToken}`,
      },
      body: JSON.stringify({
        businessName: 'Nhà Hàng Hải Sản Phố VIP',
        phone: '0905999888',
        address: '51-53 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
      }),
    });
    const updateJson = await resUpdate.json();
    assert(resUpdate.status === 200, '5.1 Cập nhật thông tin hồ sơ doanh nghiệp thành công');
    assert(updateJson.data.businessName === 'Nhà Hàng Hải Sản Phố VIP', '5.2 Tên doanh nghiệp đã được cập nhật');
    assert(updateJson.data.phone === '0905999888', '5.3 Số điện thoại đã được cập nhật');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TOÀN BỘ KIỂM THỬ TASK 9.1: ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log('========================================================================\n');
  } finally {
    server.close();
    // Dọn dẹp dữ liệu test
    for (const pid of createdPartnerIds) {
      await pool.request().query(`DELETE FROM partner_profiles WHERE partner_id = ${pid}`);
    }
    for (const uid of createdUserIds) {
      await pool.request().query(`DELETE FROM users WHERE user_id = ${uid}`);
    }
    await closeDB();
  }
}

runStep91Tests().catch((err) => {
  console.error('Lỗi khi chạy test 9.1:', err);
  process.exit(1);
});
