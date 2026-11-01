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

async function runStep95Tests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TASK 9.5: ERROR HANDLING & USER FEEDBACK MECHANISM');
  console.log('   (Kiểm định xử lý chuẩn các mã lỗi 400, 401, 403, 404 & Envelope phản hồi)');
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

  function assertErrorEnvelope(data: any, expectedStatus: number, testName: string) {
    assert(
      data && data.success === false && typeof data.message === 'string' && data.message.length > 0,
      `[Envelope] ${testName} trả về cấu trúc chuẩn { success: false, message: string }`,
      `Message nhận được: "${data?.message}"`
    );
  }

  const createdUserIds: number[] = [];
  const createdPartnerIds: number[] = [];
  const createdPlaceIds: number[] = [];
  const createdMenuItemIds: number[] = [];

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. TẠO TÀI KHOẢN VÀ DỮ LIỆU TEST
    // ─────────────────────────────────────────────────────────────────────────
    // 1.1 Partner 1 (Chính chủ quán A)
    const p1UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Chủ Quán 9.5', 'p1_step95@dananggo.vn', 'hash', 'P1-95', 1, 'ACTIVE', GETDATE())
    `);
    const p1UserId = p1UserRes.recordset[0].user_id;
    createdUserIds.push(p1UserId);
    const p1Token = generateTestToken(p1UserId, 'PARTNER');

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p1UserId}, N'Nhà Hàng A 9.5', '0905111195', 'APPROVED', N'12 Bạch Đằng', 'TABLE', GETDATE(), GETDATE())
    `);
    const p1PartnerId = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p1PartnerId);

    // 1.2 Partner 2 (Người lạ, không sở hữu quán A)
    const p2UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Khác 9.5', 'p2_step95@dananggo.vn', 'hash', 'P2-95', 1, 'ACTIVE', GETDATE())
    `);
    const p2UserId = p2UserRes.recordset[0].user_id;
    createdUserIds.push(p2UserId);
    const p2Token = generateTestToken(p2UserId, 'PARTNER');

    const p2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p2UserId}, N'Nhà Hàng B 9.5', '0905222295', 'APPROVED', N'34 Lê Duẩn', 'TABLE', GETDATE(), GETDATE())
    `);
    const p2PartnerId = p2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p2PartnerId);

    // 1.3 Khách thông thường (Role USER, không có quyền Partner)
    const normUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, N'Khách Hàng 9.5', 'user_step95@dananggo.vn', 'hash', 'U-95', 1, 'ACTIVE', GETDATE())
    `);
    const normUserId = normUserRes.recordset[0].user_id;
    createdUserIds.push(normUserId);
    const normUserToken = generateTestToken(normUserId, 'USER');

    // 1.4 Admin
    const adminUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Admin Hệ Thống 9.5', 'admin_step95@dananggo.vn', 'hash', 'ADM-95', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminUserRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);
    const adminToken = generateTestToken(adminUserId, 'ADMIN');

    // Lấy district và category hợp lệ qua API
    const distRes = await fetch(`${baseUrl}/api/districts`);
    const distData = await distRes.json();
    const districtId = distData.data[0].id;

    const cuisRes = await fetch(`${baseUrl}/api/cuisines`);
    const cuisData = await cuisRes.json();
    const cuisineId = cuisData.data[0].id;

    // 1.5 Tạo quán hợp lệ cho Partner 1
    const createPlaceRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Quán Test Lỗi 9.5',
        address: '12 Bạch Đằng, Hải Châu, Đà Nẵng',
        district_id: districtId,
        cuisine_id: cuisineId,
        price_min: 30000,
        price_max: 150000,
        booking_url: 'https://dananggo.vn/booking/quan-95',
      }),
    });
    const createPlaceData = await createPlaceRes.json();
    assert(createPlaceRes.status === 201, 'Khởi tạo quán test ban đầu thành công');
    const placeId = createPlaceData.data.place_id;
    createdPlaceIds.push(placeId);

    // Tạo món ăn mẫu cho quán
    const createDishRes = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Món Bún Bò Huế Test',
        price: 55000,
        category: 'Món chính',
      }),
    });
    const createDishData = await createDishRes.json();
    assert(createDishRes.status === 201, 'Khởi tạo món ăn test ban đầu thành công');
    const menuItemId = createDishData.data.menu_item_id;
    createdMenuItemIds.push(menuItemId);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. KIỂM THỬ MÃ LỖI 400: BAD REQUEST (DỮ LIỆU ĐẦU VÀO KHÔNG HỢP LỆ)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. KIỂM THỬ HTTP 400: BAD REQUEST ---');

    // 2.1 Thiếu tên nhà hàng
    const resNoName = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        address: '12 Bạch Đằng',
        district_id: districtId,
        cuisine_id: cuisineId,
      }),
    });
    const dataNoName = await resNoName.json();
    assert(resNoName.status === 400, '400 khi thiếu tên nhà hàng bắt buộc');
    assertErrorEnvelope(dataNoName, 400, 'Thiếu tên nhà hàng');

    // 2.2 Thiếu địa chỉ nhà hàng
    const resNoAddr = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Quán Không Địa Chỉ',
        district_id: districtId,
        cuisine_id: cuisineId,
      }),
    });
    const dataNoAddr = await resNoAddr.json();
    assert(resNoAddr.status === 400, '400 khi thiếu địa chỉ nhà hàng bắt buộc');
    assertErrorEnvelope(dataNoAddr, 400, 'Thiếu địa chỉ nhà hàng');

    // 2.3 Link đặt bàn không hợp lệ (không có http:// hoặc https://)
    const resInvalidBooking = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Quán Link Lỗi',
        address: '12 Bạch Đằng',
        district_id: districtId,
        cuisine_id: cuisineId,
        booking_url: 'invalid-url-without-protocol',
      }),
    });
    const dataInvalidBooking = await resInvalidBooking.json();
    assert(resInvalidBooking.status === 400, '400 khi link đặt bàn không đúng định dạng URL');
    assertErrorEnvelope(dataInvalidBooking, 400, 'Link đặt bàn không hợp lệ');

    // 2.4 Khoảng giá vô lý: price_max < price_min
    const resInvalidPriceRange = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Quán Giá Lộn Ngược',
        address: '12 Bạch Đằng',
        district_id: districtId,
        cuisine_id: cuisineId,
        price_min: 100000,
        price_max: 30000,
      }),
    });
    const dataInvalidPriceRange = await resInvalidPriceRange.json();
    assert(resInvalidPriceRange.status === 400, '400 khi giá cao nhất nhỏ hơn giá thấp nhất');
    assertErrorEnvelope(dataInvalidPriceRange, 400, 'Khoảng giá nghịch lý (max < min)');

    // 2.5 Giá món ăn âm
    const resNegativePrice = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Món Giá Âm',
        price: -25000,
      }),
    });
    const dataNegativePrice = await resNegativePrice.json();
    assert(resNegativePrice.status === 400, '400 khi giá món ăn là số âm');
    assertErrorEnvelope(dataNegativePrice, 400, 'Giá món ăn âm');

    // 2.6 Tên món ăn rỗng
    const resEmptyDishName = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: '   ',
        price: 35000,
      }),
    });
    const dataEmptyDishName = await resEmptyDishName.json();
    assert(resEmptyDishName.status === 400, '400 khi tên món ăn chỉ gồm khoảng trắng');
    assertErrorEnvelope(dataEmptyDishName, 400, 'Tên món ăn rỗng');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. KIỂM THỬ MÃ LỖI 401: UNAUTHORIZED (CHƯA ĐĂNG NHẬP HOẶC TOKEN KHÔNG HỢP LỆ)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. KIỂM THỬ HTTP 401: UNAUTHORIZED ---');

    // 3.1 Gọi tạo quán không có Header Authorization hay Cookie
    const resNoTokenCreate = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Quán Vô Danh' }),
    });
    const dataNoTokenCreate = await resNoTokenCreate.json();
    assert(resNoTokenCreate.status === 401, '401 khi tạo nhà hàng mà không đăng nhập');
    assertErrorEnvelope(dataNoTokenCreate, 401, 'Không gửi token khi tạo nhà hàng');

    // 3.2 Sửa nhà hàng với token rác / giả mạo
    const resBadTokenUpdate = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-tam-gia-mao-12345' },
      body: JSON.stringify({ name: 'Sửa Trộm' }),
    });
    const dataBadTokenUpdate = await resBadTokenUpdate.json();
    assert(resBadTokenUpdate.status === 401, '401 khi dùng token không hợp lệ để sửa quán');
    assertErrorEnvelope(dataBadTokenUpdate, 401, 'Token giả mạo');

    // 3.3 Thêm món ăn không có token
    const resNoTokenMenu = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Món Vô Danh', price: 20000 }),
    });
    const dataNoTokenMenu = await resNoTokenMenu.json();
    assert(resNoTokenMenu.status === 401, '401 khi thêm món ăn mà không đăng nhập');
    assertErrorEnvelope(dataNoTokenMenu, 401, 'Không có token khi thêm món');

    // 3.4 Ẩn/hiện cơ sở không có token
    const resNoTokenStatus = await fetch(`${baseUrl}/api/places/${placeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    const dataNoTokenStatus = await resNoTokenStatus.json();
    assert(resNoTokenStatus.status === 401, '401 khi cập nhật trạng thái mà không đăng nhập');
    assertErrorEnvelope(dataNoTokenStatus, 401, 'Không có token khi đổi trạng thái');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. KIỂM THỬ MÃ LỖI 403: FORBIDDEN (SAI QUYỀN / SAI CHỦ SỞ HỮU / QUÁN LOCKED)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. KIỂM THỬ HTTP 403: FORBIDDEN ---');

    // 4.1 Khách thường (USER) cố tình tạo quán
    const resUserCreate = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${normUserToken}` },
      body: JSON.stringify({
        name: 'Quán Của Khách Hàng',
        address: '12 Bạch Đằng',
        district_id: districtId,
        cuisine_id: cuisineId,
      }),
    });
    const dataUserCreate = await resUserCreate.json();
    assert(resUserCreate.status === 403, '403 khi tài khoản USER thông thường cố tạo quán');
    assertErrorEnvelope(dataUserCreate, 403, 'Quyền USER không được tạo quán');

    // 4.2 Đối tác khác (Partner 2) cố sửa quán của Partner 1
    const resOtherPartnerUpdate = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p2Token}` },
      body: JSON.stringify({ name: 'Tên Chiếm Đoạt' }),
    });
    const dataOtherPartnerUpdate = await resOtherPartnerUpdate.json();
    assert(resOtherPartnerUpdate.status === 403, '403 khi Partner khác cố sửa quán không phải của mình');
    assertErrorEnvelope(dataOtherPartnerUpdate, 403, 'Partner khác sửa quán');

    // 4.3 Đối tác khác (Partner 2) cố thêm món vào quán của Partner 1
    const resOtherPartnerAddMenu = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p2Token}` },
      body: JSON.stringify({ name: 'Món Ké', price: 30000 }),
    });
    const dataOtherPartnerAddMenu = await resOtherPartnerAddMenu.json();
    assert(resOtherPartnerAddMenu.status === 403, '403 khi Partner khác cố thêm món vào quán không phải của mình');
    assertErrorEnvelope(dataOtherPartnerAddMenu, 403, 'Partner khác thêm món');

    // 4.4 Đối tác khác (Partner 2) cố sửa/xóa món ăn của Partner 1
    const resOtherPartnerEditDish = await fetch(`${baseUrl}/api/menu-items/${menuItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p2Token}` },
      body: JSON.stringify({ price: 99000 }),
    });
    const dataOtherPartnerEditDish = await resOtherPartnerEditDish.json();
    assert(resOtherPartnerEditDish.status === 403, '403 khi Partner khác cố sửa món của người khác');
    assertErrorEnvelope(dataOtherPartnerEditDish, 403, 'Partner khác sửa món');

    const resOtherPartnerDelDish = await fetch(`${baseUrl}/api/menu-items/${menuItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${p2Token}` },
    });
    const dataOtherPartnerDelDish = await resOtherPartnerDelDish.json();
    assert(resOtherPartnerDelDish.status === 403, '403 khi Partner khác cố xóa món của người khác');
    assertErrorEnvelope(dataOtherPartnerDelDish, 403, 'Partner khác xóa món');

    // 4.5 QUÁN BỊ LOCKED: Admin khóa quán
    await pool.request().query(`UPDATE places SET status = 'LOCKED' WHERE place_id = ${placeId}`);

    // Partner chính chủ sửa thông tin quán khi bị LOCKED -> 403
    const resLockedUpdate = await fetch(`${baseUrl}/api/restaurants/${placeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Quán Sửa Khi Bị Khóa' }),
    });
    const dataLockedUpdate = await resLockedUpdate.json();
    assert(resLockedUpdate.status === 403, '403 khi Partner cố sửa quán đang bị LOCKED');
    assertErrorEnvelope(dataLockedUpdate, 403, 'Partner sửa quán bị khóa');

    // Partner chính chủ thêm món khi bị LOCKED -> 403
    const resLockedAddDish = await fetch(`${baseUrl}/api/restaurants/${placeId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Món Thêm Khi Khóa', price: 40000 }),
    });
    const dataLockedAddDish = await resLockedAddDish.json();
    assert(resLockedAddDish.status === 403, '403 khi Partner cố thêm món vào quán đang bị LOCKED');
    assertErrorEnvelope(dataLockedAddDish, 403, 'Partner thêm món khi quán bị khóa');

    // Partner chính chủ cố tự mở khóa (chuyển sang ACTIVE khi đang LOCKED) -> 403
    const resLockedPartnerUnlock = await fetch(`${baseUrl}/api/places/${placeId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const dataLockedPartnerUnlock = await resLockedPartnerUnlock.json();
    assert(resLockedPartnerUnlock.status === 403, '403 khi Partner cố tự ý mở khóa quán đang bị LOCKED');
    assertErrorEnvelope(dataLockedPartnerUnlock, 403, 'Partner tự mở khóa');

    // Mở khóa lại bằng Admin để tiếp tục các kiểm thử khác
    await pool.request().query(`UPDATE places SET status = 'ACTIVE' WHERE place_id = ${placeId}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. KIỂM THỬ MÃ LỖI 404: NOT FOUND (TÀI NGUYÊN KHÔNG TỒN TẠI)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. KIỂM THỬ HTTP 404: NOT FOUND ---');

    // 5.1 Quán không tồn tại
    const fakePlaceId = 99999999;
    const resNotFoundGet = await fetch(`${baseUrl}/api/restaurants/${fakePlaceId}`);
    const dataNotFoundGet = await resNotFoundGet.json();
    assert(resNotFoundGet.status === 404, '404 khi truy vấn nhà hàng không tồn tại');
    assertErrorEnvelope(dataNotFoundGet, 404, 'Nhà hàng không tồn tại');

    const resNotFoundPut = await fetch(`${baseUrl}/api/restaurants/${fakePlaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Tên Mới' }),
    });
    const dataNotFoundPut = await resNotFoundPut.json();
    assert(resNotFoundPut.status === 404, '404 khi sửa nhà hàng không tồn tại');
    assertErrorEnvelope(dataNotFoundPut, 404, 'Sửa nhà hàng không tồn tại');

    // 5.2 Món ăn không tồn tại
    const fakeMenuItemId = 99999999;
    const resNotFoundDishPut = await fetch(`${baseUrl}/api/menu-items/${fakeMenuItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ price: 50000 }),
    });
    const dataNotFoundDishPut = await resNotFoundDishPut.json();
    assert(resNotFoundDishPut.status === 404, '404 khi sửa món ăn không tồn tại');
    assertErrorEnvelope(dataNotFoundDishPut, 404, 'Sửa món ăn không tồn tại');

    const resNotFoundDishDel = await fetch(`${baseUrl}/api/menu-items/${fakeMenuItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    const dataNotFoundDishDel = await resNotFoundDishDel.json();
    assert(resNotFoundDishDel.status === 404, '404 khi xóa món ăn không tồn tại');
    assertErrorEnvelope(dataNotFoundDishDel, 404, 'Xóa món ăn không tồn tại');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TẤT CẢ TEST TASK 9.5: ${passedTests}/${totalTests} PASSED (100%)`);
    console.log('   Tất cả mã lỗi (400, 401, 403, 404) đều trả về định dạng Envelope chuẩn!');
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

runStep95Tests().catch((err) => {
  console.error('Lỗi thực thi test Task 9.5:', err);
  process.exit(1);
});
