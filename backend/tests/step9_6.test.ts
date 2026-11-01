import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import jwt from 'jsonwebtoken';
import categoriesRouter from '../src/modules/categories/categories.routes';
import restaurantRouter from '../src/modules/restaurants/restaurants.routes';
import menuItemsRouter from '../src/modules/menu-items/menu-items.routes';
import placesRouter from '../src/modules/places/places.routes';
import { errorHandler } from '../src/middleware/error-handler';

function generateTestToken(userId: number, role: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runStep96Tests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TASK 9.6: TÁI SỬ DỤNG PLACEFORM CHO ADMIN PORTAL');
  console.log('   (Đặc quyền Admin: can thiệp quán LOCKED, đổi Partner sở hữu & menu)');
  console.log('========================================================================\n');

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', categoriesRouter);
  app.use('/api/restaurants', restaurantRouter);
  app.use('/api/menu-items', menuItemsRouter);
  app.use('/api/places', placesRouter);
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
  const createdMenuItemIds: number[] = [];

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. TẠO TÀI KHOẢN VÀ DỮ LIỆU ĐỐI TÁC & ADMIN
    // ─────────────────────────────────────────────────────────────────────────
    // Partner 1: Chủ sở hữu ban đầu
    const p1UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Một 9.6', 'p1_step96@dananggo.vn', 'hash', 'P1-96', 1, 'ACTIVE', GETDATE())
    `);
    const p1UserId = p1UserRes.recordset[0].user_id;
    createdUserIds.push(p1UserId);
    const p1Token = generateTestToken(p1UserId, 'PARTNER');

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p1UserId}, N'Nhà Hàng Đối Tác 1 (9.6)', '0905111196', 'APPROVED', N'10 Nguyễn Văn Linh', 'TABLE', GETDATE(), GETDATE())
    `);
    const p1PartnerId = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p1PartnerId);

    // Partner 2: Đối tác mới để Admin chuyển nhượng quán sang
    const p2UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Hai 9.6', 'p2_step96@dananggo.vn', 'hash', 'P2-96', 1, 'ACTIVE', GETDATE())
    `);
    const p2UserId = p2UserRes.recordset[0].user_id;
    createdUserIds.push(p2UserId);
    const p2Token = generateTestToken(p2UserId, 'PARTNER');

    const p2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p2UserId}, N'Nhà Hàng Đối Tác 2 (9.6)', '0905222296', 'APPROVED', N'20 Lê Duẩn', 'TABLE', GETDATE(), GETDATE())
    `);
    const p2PartnerId = p2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p2PartnerId);

    // Admin: Quản trị viên hệ thống DanangGo
    const adminUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Admin Quản Trị Viên 9.6', 'admin_step96@dananggo.vn', 'hash', 'ADM-96', 1, 'ACTIVE', GETDATE())
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
    // 2. KHỞI TẠO NHÀ HÀNG CHO PARTNER 1
    // ─────────────────────────────────────────────────────────────────────────
    const createRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Quán Ẩm Thực Ban Đầu (Chủ P1)',
        address: '10 Nguyễn Văn Linh, Đà Nẵng',
        district_id: districtId,
        cuisine_id: cuisineId,
        price_min: 40000,
        price_max: 120000,
        booking_url: 'https://dananggo.vn/booking/p1',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Partner 1 tạo nhà hàng thành công');
    const placeId = createData.data.place_id;
    createdPlaceIds.push(placeId);

    // Thêm món ăn ban đầu
    const addDishRes = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Món Mì Quảng P1', price: 45000 }),
    });
    const addDishData = await addDishRes.json();
    assert(addDishRes.status === 201, 'Partner 1 thêm món ăn thành công');
    const dishId = addDishData.data.menu_item_id;
    createdMenuItemIds.push(dishId);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ADMIN PORTAL TRUY VẤN VÀ ĐỌC DỮ LIỆU ĐỊA ĐIỂM (GET /api/restaurants/:id)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 1. ADMIN TRUY VẤN CHI TIẾT NHÀ HÀNG ---');
    const getAdminRes = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getAdminData = await getAdminRes.json();
    assert(getAdminRes.status === 200, 'Admin truy vấn GET /api/restaurants/:id thành công (200)');
    assert(getAdminData.data.name === 'Quán Ẩm Thực Ban Đầu (Chủ P1)', 'Dữ liệu tên quán chính xác');
    assert(getAdminData.data.partner_id === p1PartnerId, 'partner_id ban đầu thuộc về Partner 1');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. ADMIN KHÓA QUÁN SANG TRẠNG THÁI "LOCKED" (TÍNH NĂNG ADMINSECTION)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. ADMIN KHÓA CƠ SỞ (STATUS = LOCKED) ---');
    const lockRes = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'LOCKED',
        name: 'Quán Đã Bị Admin Khóa (Vi phạm quy định)',
      }),
    });
    const lockData = await lockRes.json();
    assert(lockRes.status === 200, 'Admin đổi trạng thái quán sang LOCKED thành công (status 200)');
    assert(lockData.data.status === 'LOCKED', 'Trạng thái quán trong CSDL đã chuyển thành LOCKED');

    // Partner 1 (chính chủ) cố sửa khi bị LOCKED -> BỊ CHẶN 403
    const p1EditLockedRes = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Partner Cố Sửa' }),
    });
    assert(p1EditLockedRes.status === 403, 'Partner bị chặn 403 khi cố sửa quán đang LOCKED');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. ĐẶC QUYỀN ADMIN: SỬA QUÁN VÀ QUẢN LÝ MENU KHI QUÁN ĐANG LOCKED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. ĐẶC QUYỀN ADMIN: CAN THIỆP KHI QUÁN ĐANG LOCKED ---');
    // Admin chỉnh sửa thông tin nhà hàng dù quán đang LOCKED
    const adminEditLockedRes = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        description: 'Mô tả được Quản trị viên cập nhật trực tiếp trong thời gian cơ sở bị tạm khóa.',
      }),
    });
    const adminEditLockedData = await adminEditLockedRes.json();
    assert(adminEditLockedRes.status === 200, 'Admin có đặc quyền cập nhật thông tin quán ngay cả khi LOCKED');
    assert(adminEditLockedData.data.description.includes('Quản trị viên'), 'Mô tả mới đã được cập nhật');

    // Admin thêm món ăn vào quán đang LOCKED
    const adminAddDishRes = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Món Đặc Sản Admin Bổ Sung',
        price: 80000,
      }),
    });
    const adminAddDishData = await adminAddDishRes.json();
    assert(adminAddDishRes.status === 201, 'Admin có quyền thêm món ăn vào quán đang bị LOCKED (status 201)');
    const dishId2 = adminAddDishData.data.menu_item_id;
    createdMenuItemIds.push(dishId2);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. ĐẶC QUYỀN ADMIN: CHUYỂN NHƯỢNG ĐỐI TÁC SỞ HỮU (PARTNER_ID)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. ĐẶC QUYỀN ADMIN: ĐỔI PARTNER SỞ HỮU (PARTNER_ID) ---');
    const transferRes = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        partner_id: p2PartnerId,
        status: 'ACTIVE', // Mở khóa và kích hoạt cho chủ mới
        name: 'Quán Ẩm Thực Chuyển Nhượng (Chủ Mới P2)',
      }),
    });
    const transferData = await transferRes.json();
    assert(transferRes.status === 200, 'Admin chuyển nhượng partner_id và mở khóa quán thành công');
    assert(transferData.data.partner_id === p2PartnerId, 'partner_id đã chuyển sang Partner 2');
    assert(transferData.data.status === 'ACTIVE', 'Trạng thái quán đã mở khóa sang ACTIVE');

    // Xác nhận Partner 2 giờ đây là chủ mới hợp pháp
    const p2EditRes = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p2Token}` },
      body: JSON.stringify({ address: '20 Lê Duẩn, Hải Châu, Đà Nẵng' }),
    });
    assert(p2EditRes.status === 200, 'Chủ mới (Partner 2) đã có toàn quyền chỉnh sửa nhà hàng này');

    // Xác nhận Partner 1 (chủ cũ) đã mất quyền truy cập sửa
    const p1EditAfterTransfer = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Chủ Cũ Cố Đổi' }),
    });
    assert(p1EditAfterTransfer.status === 403, 'Chủ cũ (Partner 1) bị từ chối 403 Forbidden do không còn là chủ sở hữu');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TẤT CẢ TEST TASK 9.6: ${passedTests}/${totalTests} PASSED (100%)`);
    console.log('   PlaceForm & Backend đáp ứng hoàn hảo yêu cầu tái sử dụng cho Admin Portal!');
    console.log('========================================================================\n');
  } finally {
    server.close();

    // DỌN DẸP DỮ LIỆU TEST
    try {
      if (createdMenuItemIds.length > 0) {
        await pool.request().query(`
          DELETE FROM menu_item_tastes WHERE menu_item_id IN (${createdMenuItemIds.join(',')});
          DELETE FROM menu_items WHERE menu_item_id IN (${createdMenuItemIds.join(',')});
        `);
      }
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

runStep96Tests().catch((err) => {
  console.error('Lỗi thực thi test Task 9.6:', err);
  process.exit(1);
});
