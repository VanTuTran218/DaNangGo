import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import jwt from 'jsonwebtoken';
import categoriesRouter from '../src/modules/categories/categories.routes';
import restaurantRouter from '../src/modules/restaurants/restaurants.routes';
import menuItemsRouter from '../src/modules/menu-items/menu-items.routes';
import placesRouter from '../src/modules/places/places.routes';
import partnerRouter from '../src/modules/partner/partner.routes';
import adminPartnersRouter, { adminPlacesRouter } from '../src/modules/admin/admin.routes';
import { errorHandler } from '../src/middleware/error-handler';

function generateTestToken(userId: number, role: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runPartnerAdminSyncTests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TƯƠNG TÁC GỬI DUYỆT & ĐỒNG BỘ 2 CHIỀU: PARTNER <-> ADMIN');
  console.log('   (Partner gửi duyệt PENDING -> Admin thấy & duyệt ACTIVE -> Partner nhận ACTIVE)');
  console.log('   (Admin GET /api/admin/places, PATCH status, DELETE /api/admin/places/:id)');
  console.log('========================================================================\n');

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', categoriesRouter);
  app.use('/api/partner', partnerRouter);
  app.use('/api/restaurants', restaurantRouter);
  app.use('/api/menu-items', menuItemsRouter);
  app.use('/api/places', placesRouter);
  app.use('/api/admin/partners', adminPartnersRouter);
  app.use('/api/admin/places', adminPlacesRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

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
  const createdPlaceIds: number[] = [];

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. TẠO TÀI KHOẢN ĐỐI TÁC VÀ ADMIN
    // ─────────────────────────────────────────────────────────────────────────
    const pUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Đối Tác Tương Tác', 'partner_sync@dananggo.vn', 'hash', 'P-SYNC', 1, 'ACTIVE', GETDATE())
    `);
    const pUserId = pUserRes.recordset[0].user_id;
    createdUserIds.push(pUserId);
    const pToken = generateTestToken(pUserId, 'PARTNER');

    const pProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${pUserId}, N'Nhà Hàng Bếp Miền Trung Sync', '0905999888', 'APPROVED', N'123 Nguyễn Tất Thành', 'TABLE', GETDATE(), GETDATE())
    `);
    const pPartnerId = pProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(pPartnerId);

    const adminUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Admin Duyệt Cơ Sở', 'admin_sync@dananggo.vn', 'hash', 'ADM-SYNC', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminUserRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);
    const adminToken = generateTestToken(adminUserId, 'ADMIN');

    // Lấy district và category
    const distRes = await fetch(`${baseUrl}/api/districts`);
    const distData = await distRes.json();
    const districtId = distData.data[0].id;

    const cuisRes = await fetch(`${baseUrl}/api/cuisines`);
    const cuisData = await cuisRes.json();
    const cuisineId = cuisData.data[0].id;

    // ─────────────────────────────────────────────────────────────────────────
    // 2. BƯỚC 1: PARTNER TẠO QUÁN VÀ GỬI DUYỆT (STATUS = PENDING)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BƯỚC 1: ĐỐI TÁC GỬI DUYỆT NHÀ HÀNG (STATUS = PENDING) ---');
    const createRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pToken}` },
      body: JSON.stringify({
        name: 'Quán Hải Sản Gửi Duyệt Test',
        address: '123 Nguyễn Tất Thành, Thanh Khê, Đà Nẵng',
        district_id: districtId,
        cuisine_id: cuisineId,
        price_min: 50000,
        price_max: 200000,
        booking_url: 'https://dananggo.vn/booking/quan-gui-duyet',
        status: 'PENDING', // Partner bấm "Gửi duyệt"
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Đối tác tạo quán ở trạng thái PENDING thành công');
    const placeId = createData.data.place_id;
    createdPlaceIds.push(placeId);
    assert(createData.data.status === 'PENDING', 'Quán mới tạo có trạng thái đúng là PENDING');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. BƯỚC 2: ADMIN GỌI GET /api/admin/places VÀ THẤY QUÁN CHỜ DUYỆT CỦA PARTNER
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BƯỚC 2: ADMIN TRUY VẤN VÀ THẤY QUÁN ĐỐI TÁC GỬI DUYỆT ---');
    const adminListRes = await fetch(`${baseUrl}/api/admin/places`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200, 'Admin lấy danh sách địa điểm GET /api/admin/places thành công (200)');
    assert(Array.isArray(adminListData.data), 'Dữ liệu trả về là mảng danh sách địa điểm');

    const foundPlaceInAdmin = adminListData.data.find((p: any) => p.id === String(placeId));
    assert(Boolean(foundPlaceInAdmin), 'Admin nhìn thấy quán mà Đối tác vừa gửi duyệt trong bảng quản lý');
    assert(foundPlaceInAdmin.name === 'Quán Hải Sản Gửi Duyệt Test', 'Tên quán hiển thị chính xác bên Admin');
    assert(foundPlaceInAdmin.partnerName === 'Nhà Hàng Bếp Miền Trung Sync', 'Tên doanh nghiệp của đối tác hiển thị chính xác');
    assert(foundPlaceInAdmin.status === 'PENDING', 'Trạng thái quán bên Admin hiển thị đúng là PENDING (Chờ duyệt)');

    // Lọc theo status=PENDING
    const adminPendingFilterRes = await fetch(`${baseUrl}/api/admin/places?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminPendingFilterData = await adminPendingFilterRes.json();
    const hasInPendingFilter = adminPendingFilterData.data.some((p: any) => p.id === String(placeId));
    assert(hasInPendingFilter, 'Bộ lọc trạng thái status=PENDING của Admin lọc ra đúng quán vừa gửi duyệt');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. BƯỚC 3: ADMIN BẤM PHÊ DUYỆT (PATCH /api/admin/places/:id/status -> ACTIVE)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BƯỚC 3: ADMIN BẤM DUYỆT QUÁN (CHUYỂN SANG ACTIVE) ---');
    const approveRes = await fetch(`${baseUrl}/api/admin/places/${placeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Admin phê duyệt cơ sở thành công (200)');
    assert(approveData.success === true, 'Response báo success: true');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. BƯỚC 4: ĐỐI TÁC THẤY QUÁN ĐÃ CHUYỂN SANG ĐANG HOẠT ĐỘNG (ACTIVE)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BƯỚC 4: ĐỐI TÁC THẤY QUÁN ĐÃ ĐƯỢC DUYỆT SANG ACTIVE ---');
    const partnerListRes = await fetch(`${baseUrl}/api/partner/places`, {
      headers: { Authorization: `Bearer ${pToken}` },
    });
    const partnerListData = await partnerListRes.json();
    assert(partnerListRes.status === 200, 'Đối tác lấy danh sách cơ sở thành công');
    const foundPlaceInPartner = partnerListData.data.find((p: any) => p.placeId === placeId || p.id === String(placeId));
    assert(Boolean(foundPlaceInPartner), 'Tìm thấy cơ sở trong danh sách của đối tác');
    assert(foundPlaceInPartner.status === 'ACTIVE', 'Trạng thái quán bên phía Đối tác đã tự động chuyển sang ACTIVE');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. BƯỚC 5: ĐỐI TÁC ẨN QUÁN -> ADMIN CŨNG THẤY QUÁN ĐÃ ẨN (HIDDEN)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BƯỚC 5: ĐỐI TÁC ẨN QUÁN -> ADMIN CẬP NHẬT ĐỒNG BỘ ---');
    const partnerHideRes = await fetch(`${baseUrl}/api/places/${placeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pToken}` },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    assert(partnerHideRes.status === 200, 'Đối tác tạm ẩn quán thành công');

    const adminCheckHidden = await fetch(`${baseUrl}/api/admin/places`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminCheckHiddenData = await adminCheckHidden.json();
    const hiddenPlaceInAdmin = adminCheckHiddenData.data.find((p: any) => p.id === String(placeId));
    assert(hiddenPlaceInAdmin.status === 'HIDDEN', 'Admin thấy cơ sở đã chuyển sang trạng thái HIDDEN');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. BƯỚC 6: ADMIN XÓA ĐỊA ĐIỂM (DELETE /api/admin/places/:id)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BƯỚC 6: ADMIN XÓA ĐỊA ĐIỂM (DELETE /api/admin/places/:id) ---');
    const adminDelRes = await fetch(`${baseUrl}/api/admin/places/${placeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminDelData = await adminDelRes.json();
    assert(adminDelRes.status === 200, 'Admin xóa địa điểm thành công (200)');
    assert(adminDelData.success === true, 'Response báo xóa thành công');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TẤT CẢ TEST ĐỒNG BỘ: ${passedTests}/${totalTests} PASSED (100%)`);
    console.log('   Luồng gửi duyệt và phê duyệt 2 chiều Partner <-> Admin hoạt động hoàn hảo!');
    console.log('========================================================================\n');
  } finally {
    server.close();

    // DỌN DẸP DỮ LIỆU TEST
    try {
      if (createdPlaceIds.length > 0) {
        await pool.request().query(`
          DELETE FROM restaurants WHERE place_id IN (${createdPlaceIds.join(',')});
          DELETE FROM places WHERE place_id IN (${createdPlaceIds.join(',')});
        `);
      }
      if (createdPartnerIds.length > 0) {
        await pool.request().query(`
          DELETE FROM partner_profiles WHERE partner_id IN (${createdPartnerIds.join(',')});
        `);
      }
      if (createdUserIds.length > 0) {
        await pool.request().query(`
          DELETE FROM users WHERE user_id IN (${createdUserIds.join(',')});
        `);
      }
    } catch (cleanErr) {
      console.error('Lỗi dọn dẹp test data:', cleanErr);
    }

    await closeDB();
  }
}

runPartnerAdminSyncTests().catch((err) => {
  console.error('Lỗi thực thi test Partner-Admin Sync:', err);
  process.exit(1);
});
