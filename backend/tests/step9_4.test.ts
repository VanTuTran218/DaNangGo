import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import jwt from 'jsonwebtoken';
import categoriesRouter from '../src/modules/categories/categories.routes';
import restaurantRouter from '../src/modules/restaurants/restaurants.routes';
import menuItemsRouter from '../src/modules/menu-items/menu-items.routes';
import { errorHandler } from '../src/middleware/error-handler';

function generateTestToken(userId: number, role: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runStep94Tests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TASK 9.4: QUẢN LÝ THỰC ĐƠN & ĐỒNG BỘ KHOẢNG GIÁ TỰ ĐỘNG');
  console.log('   (GET/POST /api/restaurants/:id/menu-items, PUT/DELETE /api/menu-items/:id)');
  console.log('   (Đồng bộ price_min, price_max, khẩu vị món ăn, quyền Partner & trạng thái LOCKED)');
  console.log('========================================================================\n');

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', categoriesRouter);
  app.use('/api/restaurants', restaurantRouter);
  app.use('/api/menu-items', menuItemsRouter);
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
    // 1. TẠO TÀI KHOẢN VÀ DỮ LIỆU ĐỐI TÁC TEST
    // ─────────────────────────────────────────────────────────────────────────
    // Partner 1: Sở hữu nhà hàng test
    const p1UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Một 9.4', 'p1_step94@dananggo.vn', 'hash', 'P1-94', 1, 'ACTIVE', GETDATE())
    `);
    const p1UserId = p1UserRes.recordset[0].user_id;
    createdUserIds.push(p1UserId);
    const p1Token = generateTestToken(p1UserId, 'PARTNER');

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p1UserId}, N'Nhà Hàng Món Ăn 94', '0905111194', 'APPROVED', N'88 Hoàng Diệu', 'TABLE', GETDATE(), GETDATE())
    `);
    const p1PartnerId = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p1PartnerId);

    // Partner 2: Đối tác khác (không sở hữu nhà hàng của Partner 1)
    const p2UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Hai 9.4', 'p2_step94@dananggo.vn', 'hash', 'P2-94', 1, 'ACTIVE', GETDATE())
    `);
    const p2UserId = p2UserRes.recordset[0].user_id;
    createdUserIds.push(p2UserId);
    const p2Token = generateTestToken(p2UserId, 'PARTNER');

    const p2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p2UserId}, N'Đối Tác Khác 94', '0905222294', 'APPROVED', N'99 Trần Phú', 'TABLE', GETDATE(), GETDATE())
    `);
    const p2PartnerId = p2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p2PartnerId);

    // Admin
    const adminUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Admin Test 9.4', 'admin_step94@dananggo.vn', 'hash', 'AD-94', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminUserRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);
    const adminToken = generateTestToken(adminUserId, 'ADMIN');

    // ─────────────────────────────────────────────────────────────────────────
    // 2. TẠO NHÀ HÀNG TEST CHO PARTNER 1 (price_min và price_max ban đầu NULL)
    // ─────────────────────────────────────────────────────────────────────────
    const placeInsert = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (partner_id, name, description, address, district_id, latitude, longitude, place_type, status, view_count, created_at, updated_at)
      OUTPUT INSERTED.place_id
      VALUES (${p1PartnerId}, N'Quán Cơm Niêu 9.4', N'Mô tả quán 94', N'88 Hoàng Diệu, Hải Châu', 1, 16.0612, 108.2185, 'RESTAURANT', 'ACTIVE', 0, GETDATE(), GETDATE())
    `);
    const testPlaceId = placeInsert.recordset[0].place_id;
    createdPlaceIds.push(testPlaceId);

    await pool.request().query(`
      INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
      VALUES (${testPlaceId}, 'RESTAURANT', 1, NULL, NULL)
    `);

    // Lấy khẩu vị thực tế từ database
    const tastesRes = await pool.request().query<{ taste_id: number; name: string }>(`
      SELECT TOP 2 taste_id, name FROM tastes ORDER BY taste_id ASC
    `);
    assert(tastesRes.recordset.length >= 2, 'DB có ít nhất 2 khẩu vị trong bảng tastes');
    const taste1 = tastesRes.recordset[0].taste_id;
    const taste2 = tastesRes.recordset[1].taste_id;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Khách vãng lai xem thực đơn ban đầu (trống)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 1: LẤY THỰC ĐƠN KHI CHƯA CÓ MÓN ---');
    const resEmpty = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`);
    const dataEmpty = await resEmpty.json();
    assert(resEmpty.status === 200, 'GET /api/restaurants/:id/menu-items trả về 200 cho khách');
    assert(Array.isArray(dataEmpty.data) && dataEmpty.data.length === 0, 'Danh sách món ăn ban đầu rỗng');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Validate khi thêm món ăn
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 2: VALIDATE THÊM MÓN ĂN ---');
    // Thiếu tên món
    const resNoName = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ price: 45000 }),
    });
    assert(resNoName.status === 400, 'Thêm món thiếu tên trả về 400 Bad Request');

    // Giá âm
    const resNegPrice = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Món Giá Âm', price: -1000 }),
    });
    assert(resNegPrice.status === 400, 'Thêm món với giá âm trả về 400 Bad Request');

    // Khẩu vị không tồn tại
    const resInvalidTaste = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Món Khẩu Vị Ảo', price: 50000, taste_ids: [999999] }),
    });
    assert(resInvalidTaste.status === 400, 'Thêm món với taste_id không tồn tại trả về 400');

    // Người dùng chưa đăng nhập không được thêm món
    const resNoAuth = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cơm Niêu Thố', price: 65000 }),
    });
    assert(resNoAuth.status === 401, 'Chưa đăng nhập trả về 401');

    // Partner khác không sở hữu quán không được thêm món
    const resOtherPartner = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p2Token}` },
      body: JSON.stringify({ name: 'Cơm Niêu Thố', price: 65000 }),
    });
    assert(resOtherPartner.status === 403, 'Partner khác không sở hữu quán bị từ chối 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Thêm món ăn thứ nhất (Cơm Niêu Sườn - 55.000₫)
    //         Kiểm tra auto-sync: price_min = 55.000, price_max = 55.000
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 3: THÊM MÓN & TỰ ĐỘNG ĐỒNG BỘ KHOẢNG GIÁ ---');
    const resAdd1 = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Cơm Niêu Sườn Nướng',
        description: 'Cơm niêu cháy giòn ăn kèm sườn rim đậm đà',
        price: 55000,
        is_available: true,
        image_url: 'https://images.unsplash.com/photo-dish-1',
        taste_ids: [taste1],
      }),
    });
    assert(resAdd1.status === 201, 'Partner 1 tạo món thứ nhất thành công (201 Created)');
    const dish1 = (await resAdd1.json()).data;
    createdMenuItemIds.push(dish1.menu_item_id);
    assert(dish1.name === 'Cơm Niêu Sườn Nướng', 'Tên món chính xác');
    assert(dish1.price === 55000, 'Giá món chính xác 55.000₫');
    assert(dish1.tastes.length === 1 && dish1.tastes[0].taste_id === taste1, 'Gán đúng khẩu vị món');

    // Kiểm tra DB: restaurants.price_min và price_max phải được tự động cập nhật là 55.000
    const checkRest1 = await pool.request().query<{ price_min: number; price_max: number }>(`
      SELECT price_min, price_max FROM restaurants WHERE place_id = ${testPlaceId}
    `);
    assert(
      Number(checkRest1.recordset[0].price_min) === 55000 &&
      Number(checkRest1.recordset[0].price_max) === 55000,
      'Tự động đồng bộ: price_min = 55.000 và price_max = 55.000'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Thêm món thứ hai (Cá Kho Tộ - 80.000₫) & thứ ba (Canh Cua - 35.000₫)
    //         Khoảng giá kỳ vọng: price_min = 35.000, price_max = 80.000
    // ─────────────────────────────────────────────────────────────────────────
    const resAdd2 = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Cá Bống Kho Tộ',
        description: 'Cá bống kho tiêu cay nồng truyền thống',
        price: 80000,
        is_available: true,
        taste_ids: [taste1, taste2],
      }),
    });
    const dish2 = (await resAdd2.json()).data;
    createdMenuItemIds.push(dish2.menu_item_id);

    const resAdd3 = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Canh Cua Rau Đay',
        description: 'Bát canh thanh mát mùa hè',
        price: 35000,
        is_available: true,
      }),
    });
    const dish3 = (await resAdd3.json()).data;
    createdMenuItemIds.push(dish3.menu_item_id);

    const checkRest2 = await pool.request().query<{ price_min: number; price_max: number }>(`
      SELECT price_min, price_max FROM restaurants WHERE place_id = ${testPlaceId}
    `);
    assert(
      Number(checkRest2.recordset[0].price_min) === 35000 &&
      Number(checkRest2.recordset[0].price_max) === 80000,
      'Tự động đồng bộ: price_min = 35.000₫ và price_max = 80.000₫ sau khi thêm 3 món'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: Cập nhật món ăn (PUT /api/menu-items/:id) & tự động đồng bộ giá
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 4: CHỈNH SỬA MÓN ĂN & ĐỒNG BỘ GIÁ ---');
    // Partner 2 không thể sửa món của Partner 1
    const resP2Edit = await fetch(`${baseUrl}/api/menu-items/${dish3.menu_item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p2Token}` },
      body: JSON.stringify({ price: 30000 }),
    });
    assert(resP2Edit.status === 403, 'Partner 2 không có quyền sửa món của Partner 1 (403)');

    // Partner 1 giảm giá Canh Cua từ 35.000 -> 25.000₫
    const resP1Edit = await fetch(`${baseUrl}/api/menu-items/${dish3.menu_item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({
        name: 'Canh Cua Cà Pháo Mướp Hương',
        price: 25000,
        taste_ids: [taste2],
      }),
    });
    assert(resP1Edit.status === 200, 'Partner 1 sửa món ăn thành công');
    const updatedDish3 = (await resP1Edit.json()).data;
    assert(updatedDish3.price === 25000, 'Giá món sau cập nhật là 25.000₫');
    assert(updatedDish3.tastes.length === 1 && updatedDish3.tastes[0].taste_id === taste2, 'Khẩu vị được cập nhật');

    // Kiểm tra DB: price_min cập nhật thành 25.000
    const checkRest3 = await pool.request().query<{ price_min: number; price_max: number }>(`
      SELECT price_min, price_max FROM restaurants WHERE place_id = ${testPlaceId}
    `);
    assert(
      Number(checkRest3.recordset[0].price_min) === 25000 &&
      Number(checkRest3.recordset[0].price_max) === 80000,
      'Tự động đồng bộ: price_min giảm xuống 25.000₫ sau khi sửa giá món'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6: Ẩn món rẻ nhất (Canh Cua 25.000₫) -> price_min nhảy lên món rẻ kế tiếp (55.000₫)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 5: ẨN MÓN / SOFT DELETE & TÍNH LẠI GIÁ TỪ MÓN ĐANG BÁN ---');
    const resDelete = await fetch(`${baseUrl}/api/menu-items/${dish3.menu_item_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    assert(resDelete.status === 200, 'Ẩn món ăn (DELETE /api/menu-items/:id) thành công');

    // price_min mới phải là 55.000 (món Cơm Niêu), không còn tính món đã ẩn 25.000
    const checkRest4 = await pool.request().query<{ price_min: number; price_max: number }>(`
      SELECT price_min, price_max FROM restaurants WHERE place_id = ${testPlaceId}
    `);
    assert(
      Number(checkRest4.recordset[0].price_min) === 55000 &&
      Number(checkRest4.recordset[0].price_max) === 80000,
      'Sau khi ẩn món 25.000, price_min tự động nhảy lên 55.000 từ món còn đang bán'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7: Kiểm tra hiển thị công khai vs Chủ quán (Optional Auth)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 6: OPTIONAL AUTH TRONG GET /MENU-ITEMS ---');
    // Khách vãng lai chỉ thấy 2 món đang bán (không thấy món đã ẩn)
    const resGuest = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`);
    const guestData = (await resGuest.json()).data;
    assert(guestData.length === 2, 'Khách vãng lai chỉ thấy 2 món is_available = 1');
    assert(guestData.every((d: any) => d.is_available === true), 'Tất cả món khách thấy đều đang bán');

    // Chủ quán (Partner 1) gửi token -> thấy cả 3 món (gồm cả món đã ẩn)
    const resOwner = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    const ownerData = (await resOwner.json()).data;
    assert(ownerData.length === 3, 'Chủ sở hữu thấy toàn bộ 3 món (cả món đã ẩn)');
    const hiddenFound = ownerData.find((d: any) => d.menu_item_id === dish3.menu_item_id);
    assert(hiddenFound && hiddenFound.is_available === false, 'Món ẩn có is_available = false');

    // Admin cũng thấy cả 3 món
    const resAdminView = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminData = (await resAdminView.json()).data;
    assert(adminData.length === 3, 'Admin thấy toàn bộ 3 món');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8: Mở bán lại món (PUT is_available = true) -> price_min trở lại 25.000₫
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 7: MỞ BÁN LẠI MÓN ĂN (RE-ACTIVATE) ---');
    const resReactivate = await fetch(`${baseUrl}/api/menu-items/${dish3.menu_item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ is_available: true }),
    });
    assert(resReactivate.status === 200, 'Mở bán lại món ăn thành công');
    const checkRest5 = await pool.request().query<{ price_min: number; price_max: number }>(`
      SELECT price_min, price_max FROM restaurants WHERE place_id = ${testPlaceId}
    `);
    assert(
      Number(checkRest5.recordset[0].price_min) === 25000 &&
      Number(checkRest5.recordset[0].price_max) === 80000,
      'Khi mở bán lại, price_min tự động phục hồi về 25.000₫'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 9: Quán bị Admin khóa (LOCKED) -> Partner bị chặn thêm/sửa/ẩn món
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 8: BẢO VỆ KHI NHÀ HÀNG BỊ KHÓA (LOCKED) ---');
    await pool.request().query(`
      UPDATE places SET status = 'LOCKED' WHERE place_id = ${testPlaceId}
    `);

    // Partner thêm món -> 403
    const resLockedAdd = await fetch(`${baseUrl}/api/restaurants/${testPlaceId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ name: 'Món Mới Khi Khóa', price: 90000 }),
    });
    assert(resLockedAdd.status === 403, 'Quán bị LOCKED: Partner bị từ chối 403 khi thêm món');

    // Partner sửa món -> 403
    const resLockedEdit = await fetch(`${baseUrl}/api/menu-items/${dish1.menu_item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p1Token}` },
      body: JSON.stringify({ price: 60000 }),
    });
    assert(resLockedEdit.status === 403, 'Quán bị LOCKED: Partner bị từ chối 403 khi sửa món');

    // Partner ẩn món -> 403
    const resLockedDelete = await fetch(`${baseUrl}/api/menu-items/${dish1.menu_item_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    assert(resLockedDelete.status === 403, 'Quán bị LOCKED: Partner bị từ chối 403 khi ẩn món');

    // Admin có quyền can thiệp ngay cả khi quán bị LOCKED
    const resAdminEdit = await fetch(`${baseUrl}/api/menu-items/${dish1.menu_item_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ description: 'Mô tả được admin cập nhật khi quán bị khóa' }),
    });
    assert(resAdminEdit.status === 200, 'Admin vẫn có quyền cập nhật món ăn khi quán LOCKED');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TẤT CẢ TEST TASK 9.4: ${passedTests}/${totalTests} PASSED (100%)`);
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

runStep94Tests().catch((err) => {
  console.error('Lỗi thực thi test Task 9.4:', err);
  process.exit(1);
});
