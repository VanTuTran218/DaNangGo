import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import placesRouter from '../src/modules/places/places.routes';
import { adminPlacesRouter } from '../src/modules/admin/admin.routes';
import { errorHandler } from '../src/middleware/error-handler';
import { updatePlaceStatus, type PlaceStatus } from '../src/modules/places/places.service';
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

async function runStep8ComprehensiveVerification() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TASK 8: MIGRATION 006');
  console.log('   (TRẠNG THÁI LOCKED, CỘT booking_url, RÀNG BUỘC CHECK & RBAC KHÓA QUÁN)');
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

  // Danh sách ID cần dọn dẹp sau khi kiểm thử
  const createdPlaceIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdPartnerIds: number[] = [];

  // Dựng Express test server
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/places', placesRouter);
  app.use('/api/admin/places', adminPlacesRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // CHUẨN BỊ TÀI KHOẢN VÀ DỮ LIỆU TEST
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Admin
    const adminRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, 'Admin Step8 Test', 'admin_step8@dananggo.vn', '$2b$12$dummyhash', 'ADM-S8-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);

    // 2. Partner 1 (Chủ cơ sở A)
    const p1UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner 1 Step8 Test', 'partner1_step8@dananggo.vn', '$2b$12$dummyhash', 'PT1-S8-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partner1UserId = p1UserRes.recordset[0].user_id;
    createdUserIds.push(partner1UserId);

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, approved_at)
      OUTPUT INSERTED.partner_id
      VALUES (${partner1UserId}, 'Doanh Nghiệp Đối Tác 1 Step8', '0905123456', 'APPROVED', GETDATE())
    `);
    const partner1Id = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(partner1Id);

    // 3. Partner 2 (Chủ cơ sở B)
    const p2UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner 2 Step8 Test', 'partner2_step8@dananggo.vn', '$2b$12$dummyhash', 'PT2-S8-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partner2UserId = p2UserRes.recordset[0].user_id;
    createdUserIds.push(partner2UserId);

    const p2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, approved_at)
      OUTPUT INSERTED.partner_id
      VALUES (${partner2UserId}, 'Doanh Nghiệp Đối Tác 2 Step8', '0905654321', 'APPROVED', GETDATE())
    `);
    const partner2Id = p2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(partner2Id);

    // 4. Regular User (Khách hàng thông thường)
    const normalUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, 'Khách Hàng Thường Step8', 'user_step8@dananggo.vn', '$2b$12$dummyhash', 'USR-S8-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const normalUserId = normalUserRes.recordset[0].user_id;
    createdUserIds.push(normalUserId);

    // Tokens
    const adminToken = generateTestToken(adminUserId, 'ADMIN');
    const partner1Token = generateTestToken(partner1UserId, 'PARTNER');
    const partner2Token = generateTestToken(partner2UserId, 'PARTNER');
    const normalUserToken = generateTestToken(normalUserId, 'USER');

    // =========================================================================
    // SUITE 1: KIỂM THỬ RÀNG BUỘC CHECK DATABASE (MIGRATION 006)
    // =========================================================================
    console.log('--- 🔒 SUITE 1: KIỂM THỬ RÀNG BUỘC CHECK DATABASE (MIGRATION 006) ---');

    // 1.1 Chặn booking_url sai định dạng (không bắt đầu bằng http:// hoặc https://)
    let blockedFtpUrl = false;
    try {
      await pool.request().query(`
        INSERT INTO places (place_type, name, booking_url, status, created_at)
        VALUES ('ATTRACTION', 'Test URL Invalid FTP', 'ftp://dananggo.vn/booking', 'ACTIVE', GETDATE())
      `);
    } catch (err: any) {
      if (err.message.includes('chk_places_booking_url')) {
        blockedFtpUrl = true;
      }
    }
    assert(blockedFtpUrl, '1.1 SQL Server chặn chèn booking_url bắt đầu bằng ftp://', 'Ràng buộc chk_places_booking_url kích hoạt chính xác');

    let blockedNoProtocolUrl = false;
    try {
      await pool.request().query(`
        INSERT INTO places (place_type, name, booking_url, status, created_at)
        VALUES ('ATTRACTION', 'Test URL No Protocol', 'www.dananggo.vn/booking', 'ACTIVE', GETDATE())
      `);
    } catch (err: any) {
      if (err.message.includes('chk_places_booking_url')) {
        blockedNoProtocolUrl = true;
      }
    }
    assert(blockedNoProtocolUrl, '1.2 SQL Server chặn chèn booking_url không có giao thức http(s)://', 'Ràng buộc chk_places_booking_url kích hoạt chính xác');

    // 1.3 Cho phép booking_url hợp lệ với http://
    const validHttpRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, booking_url, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', 'Test Valid HTTP URL', 'http://dananggo.vn/dat-cho', 'ACTIVE', GETDATE())
    `);
    const validHttpPlaceId = validHttpRes.recordset[0].place_id;
    createdPlaceIds.push(validHttpPlaceId);
    assert(validHttpPlaceId > 0, '1.3 SQL Server chấp nhận booking_url bắt đầu bằng http://', `Đã lưu thành công place_id=${validHttpPlaceId}`);

    // 1.4 Cho phép booking_url hợp lệ với https://
    const validHttpsRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, booking_url, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', 'Test Valid HTTPS URL', 'https://booking.dananggo.vn/reserve', 'ACTIVE', GETDATE())
    `);
    const validHttpsPlaceId = validHttpsRes.recordset[0].place_id;
    createdPlaceIds.push(validHttpsPlaceId);
    assert(validHttpsPlaceId > 0, '1.4 SQL Server chấp nhận booking_url bắt đầu bằng https://', `Đã lưu thành công place_id=${validHttpsPlaceId}`);

    // 1.5 Cho phép booking_url là NULL
    const nullUrlRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, booking_url, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', 'Test Null URL', NULL, 'ACTIVE', GETDATE())
    `);
    const nullUrlPlaceId = nullUrlRes.recordset[0].place_id;
    createdPlaceIds.push(nullUrlPlaceId);
    assert(nullUrlPlaceId > 0, '1.5 SQL Server chấp nhận booking_url là NULL', `Đã lưu thành công place_id=${nullUrlPlaceId}`);

    // 1.6 Kiểm tra chk_places_status cho phép trạng thái LOCKED
    const lockedPlaceRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', 'Test Locked Place DB', 'LOCKED', GETDATE())
    `);
    const lockedPlaceId = lockedPlaceRes.recordset[0].place_id;
    createdPlaceIds.push(lockedPlaceId);
    assert(lockedPlaceId > 0, '1.6 SQL Server cho phép trạng thái LOCKED trong chk_places_status', `Đã lưu thành công place_id=${lockedPlaceId}`);

    // 1.7 Kiểm tra chk_places_status chặn trạng thái không hợp lệ
    let blockedInvalidStatus = false;
    try {
      await pool.request().query(`
        INSERT INTO places (place_type, name, status, created_at)
        VALUES ('ATTRACTION', 'Test Invalid Status', 'DELETED', GETDATE())
      `);
    } catch (err: any) {
      if (err.message.includes('chk_places_status')) {
        blockedInvalidStatus = true;
      }
    }
    assert(blockedInvalidStatus, '1.7 SQL Server chặn trạng thái không hợp lệ (DELETED)', 'Ràng buộc chk_places_status kích hoạt chính xác');

    // =========================================================================
    // SUITE 2: KIỂM THỬ HÀM LÕI SERVICE updatePlaceStatus
    // =========================================================================
    console.log('\n--- ⚙️ SUITE 2: KIỂM THỬ HÀM LÕI SERVICE updatePlaceStatus ---');

    // Tạo địa điểm của Partner 1
    const p1PlaceRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, partner_id, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', 'Nhà Hàng Của Partner 1 Step8', ${partner1Id}, 'ACTIVE', GETDATE())
    `);
    const p1PlaceId = p1PlaceRes.recordset[0].place_id;
    createdPlaceIds.push(p1PlaceId);

    // 2.1 Admin khóa quán thành công
    const lockResult = await updatePlaceStatus(p1PlaceId, 'LOCKED', { role: 'ADMIN' });
    assert(
      lockResult.success === true && lockResult.data.status === 'LOCKED',
      '2.1 Admin khóa quán thành công qua updatePlaceStatus',
      `Message: ${lockResult.message}`
    );

    // Kiểm tra trực tiếp trong DB xem trạng thái đã thành LOCKED và có updated_at
    const checkDbLocked = await pool.request().query(`SELECT status, updated_at FROM places WHERE place_id = ${p1PlaceId}`);
    assert(
      checkDbLocked.recordset[0].status === 'LOCKED' && checkDbLocked.recordset[0].updated_at !== null,
      '2.2 Cơ sở dữ liệu ghi nhận status=LOCKED và updated_at được cập nhật',
      `updated_at: ${checkDbLocked.recordset[0].updated_at}`
    );

    // 2.3 Partner cố tình mở khóa quán đang LOCKED -> Bị chặn 403 Forbidden
    let partnerUnlockError: any = null;
    try {
      await updatePlaceStatus(p1PlaceId, 'ACTIVE', { role: 'PARTNER', partner_id: partner1Id });
    } catch (err: any) {
      partnerUnlockError = err;
    }
    assert(
      partnerUnlockError !== null && partnerUnlockError.status === 403,
      '2.3 Partner cố tình mở khóa quán đang LOCKED bị chặn 403 Forbidden',
      `Ném lỗi đúng: "${partnerUnlockError?.message}"`
    );

    // 2.4 Partner cố tình đổi quán đang LOCKED sang HIDDEN -> Cũng bị chặn 403 Forbidden
    let partnerHideLockedError: any = null;
    try {
      await updatePlaceStatus(p1PlaceId, 'HIDDEN', { role: 'PARTNER', partner_id: partner1Id });
    } catch (err: any) {
      partnerHideLockedError = err;
    }
    assert(
      partnerHideLockedError !== null && partnerHideLockedError.status === 403,
      '2.4 Partner cố đổi quán đang LOCKED sang bất kỳ trạng thái nào đều bị chặn 403 Forbidden',
      `Ném lỗi đúng: "${partnerHideLockedError?.message}"`
    );

    // 2.5 Admin mở khóa quán thành công
    const unlockResult = await updatePlaceStatus(p1PlaceId, 'ACTIVE', { role: 'ADMIN' });
    assert(
      unlockResult.success === true && unlockResult.data.status === 'ACTIVE',
      '2.5 Admin mở khóa quán LOCKED thành công trở lại ACTIVE',
      `Message: ${unlockResult.message}`
    );

    // 2.6 Partner cố tình khóa quán (set new_status = 'LOCKED') -> Bị chặn 403 Forbidden
    let partnerLockError: any = null;
    try {
      await updatePlaceStatus(p1PlaceId, 'LOCKED', { role: 'PARTNER', partner_id: partner1Id });
    } catch (err: any) {
      partnerLockError = err;
    }
    assert(
      partnerLockError !== null && partnerLockError.status === 403,
      '2.6 Partner cố tình khóa quán (set status=LOCKED) bị chặn 403 Forbidden',
      `Ném lỗi đúng: "${partnerLockError?.message}"`
    );

    // 2.7 Partner đổi trạng thái quán của mình giữa ACTIVE và HIDDEN (khi không bị LOCKED) -> Thành công
    const partnerHideResult = await updatePlaceStatus(p1PlaceId, 'HIDDEN', { role: 'PARTNER', partner_id: partner1Id });
    assert(
      partnerHideResult.success === true && partnerHideResult.data.status === 'HIDDEN',
      '2.7a Partner đổi trạng thái quán của mình sang HIDDEN thành công'
    );

    const partnerActiveResult = await updatePlaceStatus(p1PlaceId, 'ACTIVE', { role: 'PARTNER', partner_id: partner1Id });
    assert(
      partnerActiveResult.success === true && partnerActiveResult.data.status === 'ACTIVE',
      '2.7b Partner mở lại quán của mình sang ACTIVE thành công'
    );

    // 2.8 Partner 2 cố tình can thiệp quán của Partner 1 -> Bị chặn 403 Forbidden
    let crossPartnerError: any = null;
    try {
      await updatePlaceStatus(p1PlaceId, 'HIDDEN', { role: 'PARTNER', partner_id: partner2Id });
    } catch (err: any) {
      crossPartnerError = err;
    }
    assert(
      crossPartnerError !== null && crossPartnerError.status === 403,
      '2.8 Partner 2 cố sửa quán của Partner 1 bị chặn 403 Forbidden',
      `Ném lỗi đúng: "${crossPartnerError?.message}"`
    );

    // 2.9 Khách hàng thông thường (USER) cố đổi trạng thái quán -> Bị chặn 403 Forbidden
    let normalUserError: any = null;
    try {
      await updatePlaceStatus(p1PlaceId, 'HIDDEN', { role: 'USER' });
    } catch (err: any) {
      normalUserError = err;
    }
    assert(
      normalUserError !== null && normalUserError.status === 403,
      '2.9 Khách hàng thường (USER) cố thay đổi trạng thái địa điểm bị chặn 403 Forbidden',
      `Ném lỗi đúng: "${normalUserError?.message}"`
    );

    // 2.10 ID không tồn tại -> Trả về 404 Not Found
    let notFoundError: any = null;
    try {
      await updatePlaceStatus(999999, 'ACTIVE', { role: 'ADMIN' });
    } catch (err: any) {
      notFoundError = err;
    }
    assert(
      notFoundError !== null && notFoundError.status === 404,
      '2.10 Cập nhật trạng thái ID không tồn tại ném lỗi 404 Not Found'
    );

    // 2.11 Trạng thái không hợp lệ -> Trả về 400 Bad Request
    let badStatusError: any = null;
    try {
      await updatePlaceStatus(p1PlaceId, 'UNKNOWN' as any, { role: 'ADMIN' });
    } catch (err: any) {
      badStatusError = err;
    }
    assert(
      badStatusError !== null && badStatusError.status === 400,
      '2.11 Truyền trạng thái không hợp lệ ném lỗi 400 Bad Request'
    );

    // =========================================================================
    // SUITE 3: KIỂM THỬ ENDPOINTS REST API QUA HTTP
    // =========================================================================
    console.log('\n--- 🌐 SUITE 3: KIỂM THỬ ENDPOINTS REST API QUA HTTP ---');

    // 3.1 PATCH /api/admin/places/:id/status (Dành riêng cho Admin)
    const adminApiLockRes = await fetch(`${baseUrl}/api/admin/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'LOCKED' }),
    });
    const adminApiLockJson = (await adminApiLockRes.json()) as any;
    assert(
      adminApiLockRes.status === 200 && adminApiLockJson.success === true && adminApiLockJson.data.status === 'LOCKED',
      '3.1 PATCH /api/admin/places/:id/status: Admin khóa quán thành công (200 OK)',
      `Response message: "${adminApiLockJson.message}"`
    );

    // 3.2 Khách vãng lai gọi /api/admin/places/:id/status không có token -> 401 Unauthorized
    const guestAdminApiRes = await fetch(`${baseUrl}/api/admin/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(
      guestAdminApiRes.status === 401,
      '3.2 Khách vãng lai gọi API admin nhận HTTP 401 Unauthorized'
    );

    // 3.3 Partner gọi /api/admin/places/:id/status -> 403 Forbidden
    const partnerAdminApiRes = await fetch(`${baseUrl}/api/admin/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partner1Token}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(
      partnerAdminApiRes.status === 403,
      '3.3 Partner gọi API admin nhận HTTP 403 Forbidden'
    );

    // 3.4 PATCH /api/places/:id/status: Partner gọi gỡ LOCKED qua HTTP -> 403 Forbidden
    const partnerUnlockApiRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partner1Token}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const partnerUnlockApiJson = (await partnerUnlockApiRes.json()) as any;
    assert(
      partnerUnlockApiRes.status === 403 && partnerUnlockApiJson.success === false,
      '3.4 PATCH /api/places/:id/status: Partner cố gỡ LOCKED bị chặn 403 Forbidden',
      `Server phản hồi: "${partnerUnlockApiJson.message}"`
    );

    // 3.5 Admin mở khóa qua /api/places/:id/status (hỗ trợ Bearer Token) -> 200 OK
    const adminUnlockApiRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const adminUnlockApiJson = (await adminUnlockApiRes.json()) as any;
    assert(
      adminUnlockApiRes.status === 200 && adminUnlockApiJson.data.status === 'ACTIVE',
      '3.5 PATCH /api/places/:id/status: Admin mở khóa quán thành công (200 OK)'
    );

    // 3.6 Partner tạm ẩn quán của mình qua /api/places/:id/status -> 200 OK
    const partnerHideApiRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partner1Token}`,
      },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    assert(
      partnerHideApiRes.status === 200,
      '3.6 PATCH /api/places/:id/status: Partner ẩn quán của mình thành công (200 OK)'
    );

    // 3.7 Endpoint PUT /api/places/:id/status cũng hoạt động tương đương PATCH
    const partnerPutRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partner1Token}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(
      partnerPutRes.status === 200,
      '3.7 PUT /api/places/:id/status: Hỗ trợ cả phương thức PUT thành công (200 OK)'
    );

    // 3.8 Gửi ID chữ cái không hợp lệ -> 400 Bad Request
    const invalidIdRes = await fetch(`${baseUrl}/api/places/abc/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(
      invalidIdRes.status === 400,
      '3.8 ID không phải số nguyên dương trả về HTTP 400 Bad Request'
    );

    // 3.9 Gửi status rỗng hoặc không hợp lệ -> 400 Bad Request
    const invalidStatusRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'INVALID_STATUS' }),
    });
    assert(
      invalidStatusRes.status === 400,
      '3.9 Body thiếu status hoặc status không hợp lệ trả về HTTP 400 Bad Request'
    );

    // =========================================================================
    // SUITE 4: KIỂM THỬ HIỂN THỊ CÔNG KHAI KHI QUÁN BỊ LOCKED
    // =========================================================================
    console.log('\n--- 👁️ SUITE 4: HIỂN THỊ CÔNG KHAI KHI QUÁN BỊ LOCKED ---');

    // Khóa quán p1PlaceId lại để kiểm tra
    await updatePlaceStatus(p1PlaceId, 'LOCKED', { role: 'ADMIN' });

    // 4.1 Khách vãng lai tìm kiếm công khai (GET /api/places) tuyệt đối không thấy quán LOCKED
    const publicSearchRes = await fetch(`${baseUrl}/api/places?q=Step8`);
    const publicSearchJson = (await publicSearchRes.json()) as any;
    const foundLockedInPublic = (publicSearchJson.data?.items || []).some((item: any) => item.place_id === p1PlaceId);
    assert(
      !foundLockedInPublic,
      '4.1 Khách vãng lai tìm kiếm không thấy quán đang LOCKED',
      'API GET /api/places tự động loại bỏ các địa điểm LOCKED'
    );

    // 4.2 Khách vãng lai xem chi tiết quán LOCKED (GET /api/places/:id) -> 404 Not Found
    const guestDetailRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}`);
    assert(
      guestDetailRes.status === 404,
      '4.2a Khách vãng lai xem chi tiết quán LOCKED nhận HTTP 404 Not Found'
    );

    // 4.3 Người dùng thường (USER) xem chi tiết quán LOCKED -> 404 Not Found
    const userDetailRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert(
      userDetailRes.status === 404,
      '4.2b Người dùng thường (USER) xem chi tiết quán LOCKED nhận HTTP 404 Not Found'
    );

    // 4.4 Partner khác xem chi tiết quán LOCKED -> 404 Not Found
    const otherPartnerDetailRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}`, {
      headers: { Authorization: `Bearer ${partner2Token}` },
    });
    assert(
      otherPartnerDetailRes.status === 404,
      '4.2c Partner khác xem chi tiết quán LOCKED nhận HTTP 404 Not Found'
    );

    // 4.5 Partner sở hữu xem chi tiết quán LOCKED của mình -> 200 OK (để biết thông tin)
    const ownerDetailRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}`, {
      headers: { Authorization: `Bearer ${partner1Token}` },
    });
    const ownerDetailJson = (await ownerDetailRes.json()) as any;
    assert(
      ownerDetailRes.status === 200 && ownerDetailJson.data?.status === 'LOCKED',
      '4.2d Partner chủ sở hữu xem chi tiết quán LOCKED của mình nhận HTTP 200 OK'
    );

    // 4.6 Admin xem chi tiết quán LOCKED -> 200 OK
    const adminDetailRes = await fetch(`${baseUrl}/api/places/${p1PlaceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminDetailRes.status === 200,
      '4.2e Admin xem chi tiết quán LOCKED nhận HTTP 200 OK'
    );

    // =========================================================================
    // TỔNG KẾT
    // =========================================================================
    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH KIỂM THỬ TASK 8: ${passedTests}/${totalTests} ca kiểm thử PASSED (100%)`);
    console.log('========================================================================\n');
  } finally {
    server.close();

    console.log('🧹 Đang dọn dẹp các bản ghi test Task 8 trong CSDL...');
    if (createdPlaceIds.length > 0) {
      await pool.request().query(`
        DELETE FROM places WHERE place_id IN (${createdPlaceIds.join(',')})
      `);
      console.log(`✅ Đã dọn dẹp an toàn các place_id test: [${createdPlaceIds.join(',')}]`);
    }

    if (createdPartnerIds.length > 0) {
      await pool.request().query(`
        DELETE FROM partner_profiles WHERE partner_id IN (${createdPartnerIds.join(',')})
      `);
      console.log(`✅ Đã dọn dẹp an toàn các partner_id test: [${createdPartnerIds.join(',')}]`);
    }

    if (createdUserIds.length > 0) {
      await pool.request().query(`
        DELETE FROM users WHERE user_id IN (${createdUserIds.join(',')})
      `);
      console.log(`✅ Đã dọn dẹp an toàn các user_id test: [${createdUserIds.join(',')}]`);
    }

    await closeDB();
  }
}

runStep8ComprehensiveVerification().catch((err) => {
  console.error('❌ Kiểm thử thất bại với lỗi nghiêm trọng:', err);
  process.exit(1);
});
