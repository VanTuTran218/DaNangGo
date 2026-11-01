import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import attractionsRouter from '../src/modules/attractions/attractions.routes';
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

async function runStep3ComprehensiveVerification() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TASK 4: ĐIỂM DU LỊCH (ATTRACTIONS MODULE)');
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

  // Khai báo danh sách ID cần dọn dẹp
  const createdPlaceIds: number[] = [];
  const createdUserIds: number[] = [];

  // Dựng Express server test
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/attractions', attractionsRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/attractions`;

  try {
    // ─── Chuẩn bị tài khoản kiểm thử ─────────────────────────────────────────
    // 1. Admin (role_id = 3)
    const adminRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, 'Admin Kiểm Thử', 'admin_step3_test@dananggo.vn', '$2b$12$dummyhash', 'ADM-S3-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);

    // 2. Partner (role_id = 2)
    const partnerRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner Kiểm Thử', 'partner_step3_test@dananggo.vn', '$2b$12$dummyhash', 'PT-S3-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partnerUserId = partnerRes.recordset[0].user_id;
    createdUserIds.push(partnerUserId);

    // 3. User thường (role_id = 1)
    const normalUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, 'Khách Thường Kiểm Thử', 'user_step3_test@dananggo.vn', '$2b$12$dummyhash', 'USR-S3-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const normalUserId = normalUserRes.recordset[0].user_id;
    createdUserIds.push(normalUserId);

    const adminToken = generateTestToken(adminUserId, 'ADMIN');
    const partnerToken = generateTestToken(partnerUserId, 'PARTNER');
    const normalUserToken = generateTestToken(normalUserId, 'USER');

    console.log('--- KHỐI 1: BẢO MẬT & PHÂN QUYỀN (AUTHENTICATION & AUTHORIZATION) ---');

    // 1. Khách vãng lai gọi POST không có token -> 401
    const resNoAuth = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bà Nà Hills', address: 'Hòa Vang', district_id: 1, ticket_price: 900000 }),
    });
    assert(resNoAuth.status === 401, 'POST /api/attractions chặn 401 khi không đăng nhập');

    // 2. Khách thường (role USER) gọi POST -> 403
    const resUserAuth = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `access_token=${normalUserToken}` },
      body: JSON.stringify({ name: 'Bà Nà Hills', address: 'Hòa Vang', district_id: 1, ticket_price: 900000 }),
    });
    assert(resUserAuth.status === 403, 'POST /api/attractions chặn 403 khi role là USER');

    // 3. Partner (role PARTNER) gọi POST -> 403
    const resPartnerAuth = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `access_token=${partnerToken}` },
      body: JSON.stringify({ name: 'Bà Nà Hills', address: 'Hòa Vang', district_id: 1, ticket_price: 900000 }),
    });
    assert(resPartnerAuth.status === 403, 'POST /api/attractions chặn 403 khi role là PARTNER');

    console.log('\n--- KHỐI 2: VALIDATION RÀNG BUỘC DỮ LIỆU ĐẦU VÀO (400 BAD REQUEST) ---');

    // 4. Thiếu tên điểm du lịch
    const resMissName = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ address: 'Hải Châu', district_id: 1, ticket_price: 0 }),
    });
    assert(resMissName.status === 400, 'POST /api/attractions báo 400 khi thiếu name');

    // 5. Thiếu địa chỉ
    const resMissAddress = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', district_id: 1, ticket_price: 0 }),
    });
    assert(resMissAddress.status === 400, 'POST /api/attractions báo 400 khi thiếu address');

    // 6. Thiếu district_id
    const resMissDistrict = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', address: 'Hải Châu', ticket_price: 0 }),
    });
    assert(resMissDistrict.status === 400, 'POST /api/attractions báo 400 khi thiếu district_id');

    // 7. Giá vé âm (ticket_price < 0)
    const resNegPrice = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', address: 'Hải Châu', district_id: 1, ticket_price: -5000 }),
    });
    assert(resNegPrice.status === 400, 'POST /api/attractions báo 400 khi giá vé âm');

    // 8. Thời lượng tham quan không hợp lệ (visit_duration_minutes <= 0)
    const resInvDuration = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', address: 'Hải Châu', district_id: 1, ticket_price: 0, visit_duration_minutes: 0 }),
    });
    assert(resInvDuration.status === 400, 'POST /api/attractions báo 400 khi thời lượng <= 0');

    // 9. Tọa độ vĩ độ ngoài phạm vi [-90, 90]
    const resInvLat = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', address: 'Hải Châu', district_id: 1, ticket_price: 0, latitude: 120.5 }),
    });
    assert(resInvLat.status === 400, 'POST /api/attractions báo 400 khi vĩ độ ngoài phạm vi [-90, 90]');

    // 10. Foreign key district_id không tồn tại trong hệ thống
    const resInvalidFkDistrict = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', address: 'Hải Châu', district_id: 999999, ticket_price: 0 }),
    });
    assert(resInvalidFkDistrict.status === 400, 'POST /api/attractions báo 400 khi district_id không tồn tại');

    // 11. Foreign key category_id không tồn tại trong hệ thống
    const resInvalidFkCategory = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify({ name: 'Cầu Rồng', address: 'Hải Châu', district_id: 1, category_id: 999999, ticket_price: 0 }),
    });
    assert(resInvalidFkCategory.status === 400, 'POST /api/attractions báo 400 khi category_id không tồn tại');

    console.log('\n--- KHỐI 3: TRANSACTION CRUD VỚI QUYỀN ADMIN & PUBLIC ACCESS ---');

    // 12. Thêm mới điểm du lịch với quyền ADMIN (Transaction ghi places + attractions)
    const createPayload = {
      name: 'Bảo tàng Điêu khắc Chăm - Step3 Test',
      description: 'Bảo tàng lưu giữ hiện vật văn hóa Chăm pa quy mô lớn nhất Việt Nam',
      address: 'Số 02 đường 2 Tháng 9, Bình Hiên, Hải Châu, Đà Nẵng',
      district_id: 1, // Hải Châu
      category_id: 1, // Văn hóa - Lịch sử
      ticket_price: 60000,
      visit_duration_minutes: 90,
      phone: '02363574801',
      website: 'https://chammuseum.vn',
      booking_url: 'https://chammuseum.vn/dat-ve',
      promo_label: 'Di tích văn hóa',
    };
    const resCreate = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify(createPayload),
    });
    const createdJson = await resCreate.json();
    assert(resCreate.status === 201, 'POST /api/attractions tạo thành công trả về 201 Created');
    assert(createdJson.data?.place_id > 0, 'Điểm du lịch mới nhận place_id tự tăng hợp lệ');
    const testPlaceId = createdJson.data?.place_id;
    createdPlaceIds.push(testPlaceId);

    // 13. Kiểm tra DB: bảng places và attractions được ghi đồng bộ trong Transaction
    const dbPlace = await pool.request().input('id', testPlaceId).query(`
      SELECT p.place_id, p.place_type, p.partner_id, p.status, a.category_id, a.ticket_price, a.visit_duration_minutes
      FROM places p
      INNER JOIN attractions a ON a.place_id = p.place_id
      WHERE p.place_id = @id
    `);
    const dbRow = dbPlace.recordset[0];
    assert(dbRow !== undefined, 'Bản ghi tồn tại đồng thời trên cả 2 bảng places và attractions');
    assert(dbRow.place_type === 'ATTRACTION', 'places.place_type chuẩn xác là ATTRACTION');
    assert(dbRow.partner_id === null, 'places.partner_id là NULL (tài nguyên công cộng do Admin quản lý)');
    assert(dbRow.status === 'ACTIVE', 'places.status khởi tạo mặc định là ACTIVE');
    assert(Number(dbRow.ticket_price) === 60000, 'attractions.ticket_price lưu chính xác 60.000 VNĐ');

    // 14. Lấy chi tiết điểm du lịch (GET /api/attractions/:id - Public)
    const resDetail = await fetch(`${baseUrl}/${testPlaceId}`);
    const detailJson = await resDetail.json();
    assert(resDetail.status === 200, 'GET /api/attractions/:id trả về 200 OK');
    assert(detailJson.data?.name === createPayload.name, 'Chi tiết trả về đúng tên điểm du lịch');
    assert(detailJson.data?.ticket_price === 60000, 'Chi tiết trả về đúng giá vé');
    assert(detailJson.data?.district_name !== undefined, 'Chi tiết kèm district_name (JOIN bảng districts)');

    // 15. Kiểm tra tự động tăng view_count
    await new Promise((r) => setTimeout(r, 200)); // Chờ fire-and-forget query cập nhật
    const viewCheck = await pool.request().input('id', testPlaceId).query<{ view_count: number }>(`
      SELECT view_count FROM places WHERE place_id = @id
    `);
    assert(viewCheck.recordset[0].view_count >= 1, 'Lượt xem (view_count) tự động tăng khi người dùng xem chi tiết');

    // 16. Phân quyền cập nhật: Partner gọi PUT -> 403
    const resPartnerPut = await fetch(`${baseUrl}/${testPlaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `access_token=${partnerToken}` },
      body: JSON.stringify({ ticket_price: 70000 }),
    });
    assert(resPartnerPut.status === 403, 'PUT /api/attractions/:id chặn 403 khi role là PARTNER');

    // 17. Cập nhật thành công với quyền ADMIN
    const updatePayload = {
      name: 'Bảo tàng Điêu khắc Chăm (Đã nâng cấp) - Step3 Test',
      ticket_price: 70000,
      visit_duration_minutes: 100,
      promo_label: 'Vé ưu đãi mùa thu',
    };
    const resAdminPut = await fetch(`${baseUrl}/${testPlaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `admin_access=${adminToken}` },
      body: JSON.stringify(updatePayload),
    });
    const updatedJson = await resAdminPut.json();
    assert(resAdminPut.status === 200, 'PUT /api/attractions/:id cập nhật thành công trả về 200 OK');
    assert(updatedJson.data?.name === updatePayload.name, 'Tên mới được cập nhật trên bảng places');
    assert(updatedJson.data?.ticket_price === 70000, 'Giá vé mới được cập nhật trên bảng attractions');
    assert(updatedJson.data?.visit_duration_minutes === 100, 'Thời lượng tham quan mới được cập nhật');

    console.log('\n--- KHỐI 4: TÌM KIẾM, BỘ LỌC VÀ PHÂN TRANG (PAGINATION & FILTERS) ---');

    // 18. Lọc theo keyword
    const resFilterKeyword = await fetch(`${baseUrl}?keyword=Bảo tàng Điêu khắc Chăm`);
    const kwJson = await resFilterKeyword.json();
    assert(resFilterKeyword.status === 200, 'GET /api/attractions với keyword trả về 200 OK');
    assert(kwJson.data?.data.some((p: any) => p.place_id === testPlaceId), 'Tìm thấy điểm du lịch theo keyword');

    // 19. Lọc theo district_id
    const resFilterDistrict = await fetch(`${baseUrl}?district_id=1`);
    const distJson = await resFilterDistrict.json();
    assert(resFilterDistrict.status === 200, 'GET /api/attractions theo district_id trả về 200 OK');
    assert(distJson.data?.data.every((p: any) => p.district_id === 1), 'Tất cả kết quả lọc đúng district_id = 1');

    // 20. Phân trang chuẩn xác
    const resPagination = await fetch(`${baseUrl}?page=1&limit=2`);
    const pageJson = await resPagination.json();
    assert(pageJson.data?.page === 1, 'Trang hiện tại là page 1');
    assert(pageJson.data?.limit === 2, 'Số phần tử tối đa theo limit = 2');
    assert(pageJson.data?.total >= 1, 'Tổng số bản ghi total >= 1');
    assert(pageJson.data?.total_pages >= 1, 'Tính toán total_pages chính xác');

    console.log('\n--- KHỐI 5: XÓA MỀM (SOFT DELETE) & ẨN KHỎI KHÁCH VÃNG LAI ---');

    // 21. Partner gọi DELETE -> 403
    const resPartnerDel = await fetch(`${baseUrl}/${testPlaceId}`, {
      method: 'DELETE',
      headers: { Cookie: `access_token=${partnerToken}` },
    });
    assert(resPartnerDel.status === 403, 'DELETE /api/attractions/:id chặn 403 khi role là PARTNER');

    // 22. ADMIN gọi DELETE -> 200 OK (Chuyển status = 'HIDDEN')
    const resAdminDel = await fetch(`${baseUrl}/${testPlaceId}`, {
      method: 'DELETE',
      headers: { Cookie: `admin_access=${adminToken}` },
    });
    const delJson = await resAdminDel.json();
    assert(resAdminDel.status === 200, 'DELETE /api/attractions/:id trả về 200 OK');
    assert(delJson.data?.status === 'HIDDEN', 'Response xác nhận status đã đổi thành HIDDEN');

    // 23. Kiểm tra DB: bản ghi vẫn còn nguyên vẹn trong DB, không bị xóa vật lý
    const softDelDb = await pool.request().input('id', testPlaceId).query<{ status: string }>(`
      SELECT status FROM places WHERE place_id = @id
    `);
    assert(softDelDb.recordset.length === 1, 'Bản ghi vẫn tồn tại trong database (không xóa thật)');
    assert(softDelDb.recordset[0].status === 'HIDDEN', 'Trạng thái bản ghi trong DB là HIDDEN');

    // 24. Khách vãng lai xem chi tiết điểm du lịch HIDDEN -> 404 Not Found
    const resPublicHidden = await fetch(`${baseUrl}/${testPlaceId}`);
    assert(resPublicHidden.status === 404, 'Khách vãng lai xem điểm du lịch HIDDEN nhận 404 Not Found');

    // 25. Khách vãng lai tìm kiếm danh sách không thấy điểm du lịch HIDDEN
    const resListHidden = await fetch(`${baseUrl}?keyword=Bảo tàng Điêu khắc Chăm`);
    const listHiddenJson = await resListHidden.json();
    const isHiddenFoundByPublic = listHiddenJson.data?.data.some((p: any) => p.place_id === testPlaceId);
    assert(!isHiddenFoundByPublic, 'Khách vãng lai không nhìn thấy điểm HIDDEN trong danh sách');

    // 26. ADMIN xem chi tiết điểm du lịch HIDDEN -> Vẫn xem được 200 OK
    const resAdminViewHidden = await fetch(`${baseUrl}/${testPlaceId}`, {
      headers: { Cookie: `admin_access=${adminToken}` },
    });
    const adminHiddenDetail = await resAdminViewHidden.json();
    assert(resAdminViewHidden.status === 200, 'ADMIN xem điểm HIDDEN vẫn nhận 200 OK');
    assert(adminHiddenDetail.data?.status === 'HIDDEN', 'Dữ liệu trả về cho ADMIN có status là HIDDEN');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH KIỂM THỬ: ${passedTests}/${totalTests} ca kiểm thử PASSED (100%)`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('❌ Có lỗi nghiêm trọng trong quá trình kiểm thử:', err);
    throw err;
  } finally {
    server.close();

    // ─── Dọn dẹp dữ liệu kiểm thử ───────────────────────────────────────────
    console.log('🧹 Đang dọn dẹp dữ liệu kiểm thử trong Database...');
    for (const pid of createdPlaceIds) {
      await pool.request().input('id', pid).query('DELETE FROM attractions WHERE place_id = @id');
      await pool.request().input('id', pid).query('DELETE FROM places WHERE place_id = @id');
    }
    for (const uid of createdUserIds) {
      await pool.request().input('id', uid).query('DELETE FROM users WHERE user_id = @id');
    }
    console.log('✅ Đã dọn dẹp toàn bộ dữ liệu test an toàn!');
    await closeDB();
  }
}

runStep3ComprehensiveVerification().catch(() => {
  process.exit(1);
});
