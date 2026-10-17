import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import { createPlaceCommon } from '../src/modules/places/places.service';
import { createRestaurantTx, findRestaurantById } from '../src/modules/restaurants/restaurants.repository';
import * as menuService from '../src/modules/menu-items/menu-items.service';
import * as menuRepo from '../src/modules/menu-items/menu-items.repository';
import express from 'express';
import cookieParser from 'cookie-parser';
import restaurantRouter from '../src/modules/restaurants/restaurants.routes';
import menuItemsRouter from '../src/modules/menu-items/menu-items.routes';
import placesRouter from '../src/modules/places/places.routes';
import http from 'http';
import jwt from 'jsonwebtoken';

function generateTestToken(userId: number, role: string, partnerId?: number) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runStep2ComprehensiveVerification() {
  await connectDB();
  const pool = getPool();

  console.log('===============================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN BƯỚC 2 (TẤT CẢ LUỒNG & BẢO MẬT)');
  console.log('===============================================================\n');

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

  // Khai báo ID dọn dẹp
  const createdPlaceIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdPartnerIds: number[] = [];

  try {
    // Tạo 2 tài khoản partner test trong DB để kiểm thử phân quyền chuẩn xác
    const u1 = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner Test Chủ Quán', 'partner_owner_test@dananggo.vn', '$2b$12$dummyhash', 'PT-TEST-OWNER', 1, 'ACTIVE', GETDATE())
    `);
    const ownerUserId = u1.recordset[0].user_id;
    createdUserIds.push(ownerUserId);

    const p1 = await pool.request().input('uid', sql.Int, ownerUserId).query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, approval_status, service_type, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (@uid, 'Cơ sở Quán Ăn Test 1', 'APPROVED', 'TABLE', GETDATE())
    `);
    const ownerPartnerId = p1.recordset[0].partner_id;
    createdPartnerIds.push(ownerPartnerId);

    const u2 = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner Test Khác', 'partner_other_test@dananggo.vn', '$2b$12$dummyhash', 'PT-TEST-OTHER', 1, 'ACTIVE', GETDATE())
    `);
    const otherUserId = u2.recordset[0].user_id;
    createdUserIds.push(otherUserId);

    const p2 = await pool.request().input('uid', sql.Int, otherUserId).query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, approval_status, service_type, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (@uid, 'Cơ sở Quán Ăn Test 2', 'APPROVED', 'TABLE', GETDATE())
    `);
    const otherPartnerId = p2.recordset[0].partner_id;
    createdPartnerIds.push(otherPartnerId);

    // =========================================================================
    // SUITE 1: HÀM TẠO PLACES DÙNG CHUNG (createPlaceCommon)
    // =========================================================================
    console.log('\n--- 📦 SUITE 1: Kiểm thử hàm createPlaceCommon (Tú + Tin dùng chung) ---');

    // 1.1 Tạo place độc lập
    const place1Id = await createPlaceCommon({
      place_type: 'RESTAURANT',
      name: 'Quán Bún Chả Test Suite 1',
      address: '100 Lê Duẩn',
      district_id: 1,
      phone: '0905111222',
      booking_url: 'https://dananggo.vn/bun-cha',
      partner_id: ownerPartnerId,
      status: 'ACTIVE',
    });
    createdPlaceIds.push(place1Id);

    const place1Check = (await pool.request().input('id', sql.Int, place1Id).query('SELECT * FROM places WHERE place_id = @id')).recordset[0];
    assert(
      place1Check && place1Check.name === 'Quán Bún Chả Test Suite 1' && place1Check.place_type === 'RESTAURANT',
      '1.1 Tạo place độc lập thành công',
      `ID: ${place1Id}, status: ${place1Check.status}, booking_url: ${place1Check.booking_url}`
    );

    // 1.2 Tạo place trong Transaction & Rollback
    const txRollback = pool.transaction();
    await txRollback.begin();
    const rollbackPlaceId = await createPlaceCommon({
      place_type: 'ACCOMMODATION',
      name: 'Khách sạn Rollback Test',
      address: '99 Võ Nguyên Giáp',
      district_id: 1,
      partner_id: ownerPartnerId,
    }, txRollback);
    await txRollback.rollback();

    const rollbackCheck = (await pool.request().input('id', sql.Int, rollbackPlaceId).query('SELECT 1 as f FROM places WHERE place_id = @id')).recordset[0];
    assert(
      !rollbackCheck,
      '1.2 Hỗ trợ Transaction & Rollback đúng chuẩn khi gặp lỗi',
      `Place ID ${rollbackPlaceId} đã được rollback hoàn toàn khỏi DB`
    );

    // 1.3 Tích hợp vào createRestaurantTx (Transaction 2 bảng)
    const newRestaurant = await createRestaurantTx({
      name: 'Nhà Hàng Mì Quảng Test Suite 2',
      address: '200 Nguyễn Văn Linh',
      district_id: 1,
      phone: '0905333444',
      booking_url: 'https://dananggo.vn/mi-quang',
      cuisine_id: 1,
    }, ownerPartnerId);
    createdPlaceIds.push(newRestaurant.place_id);

    const restDbCheck = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query(`
      SELECT p.place_id, p.name, p.place_type, r.cuisine_id, r.price_min, r.price_max
      FROM places p
      INNER JOIN restaurants r ON r.place_id = p.place_id
      WHERE p.place_id = @id
    `)).recordset[0];

    assert(
      restDbCheck && restDbCheck.place_type === 'RESTAURANT',
      '1.3 createRestaurantTx tái sử dụng createPlaceCommon thành công',
      `Restaurant ID: ${newRestaurant.place_id}, Liên kết 2 bảng places + restaurants đồng bộ`
    );

    // =========================================================================
    // SUITE 2: THỰC ĐƠN MÓN ĂN & TỰ TÍNH PRICE_MIN / PRICE_MAX
    // =========================================================================
    console.log('\n--- 🍜 SUITE 2: Thực đơn món ăn & Tự động tính khoảng giá (price_min/max) ---');

    const adminUser = { role: 'ADMIN' };
    const ownerPartner = { role: 'PARTNER', partner_id: ownerPartnerId };
    const otherPartner = { role: 'PARTNER', partner_id: otherPartnerId };

    // 2.1 Thêm món 1: Giá 40,000đ, khẩu vị Cay (1) và Béo (6)
    const dish1 = await menuService.createMenuItem(newRestaurant.place_id, {
      name: 'Mì Quảng Gà Ta',
      price: 40000,
      description: 'Gà quê thơm ngon',
      taste_ids: [1, 6],
    }, ownerPartner);

    let priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    assert(
      dish1.menu_item_id > 0 && Number(priceRange.price_min) === 40000 && Number(priceRange.price_max) === 40000,
      '2.1 Thêm món 1 & Tự tính khoảng giá ban đầu (40,000đ - 40,000đ)',
      `Món: ${dish1.name}, Tastes: ${dish1.tastes.map(t => t.name).join(', ')}`
    );

    // 2.2 Thêm món 2: Giá 70,000đ, khẩu vị Ngọt (2)
    const dish2 = await menuService.createMenuItem(newRestaurant.place_id, {
      name: 'Mì Quảng Tôm Hùm Đặc Biệt',
      price: 70000,
      taste_ids: [2],
    }, ownerPartner);

    priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    assert(
      Number(priceRange.price_min) === 40000 && Number(priceRange.price_max) === 70000,
      '2.2 Thêm món 2 & Khoảng giá mở rộng (40,000đ - 70,000đ)',
      `Món 2: 70k -> price_min: ${priceRange.price_min}, price_max: ${priceRange.price_max}`
    );

    // 2.3 Thêm món 3: Giá 55,000đ (ở giữa)
    const dish3 = await menuService.createMenuItem(newRestaurant.place_id, {
      name: 'Mì Quảng Ếch Đồng',
      price: 55000,
      taste_ids: [1],
    }, ownerPartner);

    priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    assert(
      Number(priceRange.price_min) === 40000 && Number(priceRange.price_max) === 70000,
      '2.3 Thêm món 3 giá ở giữa (55k) -> Khoảng giá giữ nguyên (40,000đ - 70,000đ)'
    );

    // 2.4 Cập nhật món 1: Giảm giá xuống 30,000đ và đổi khẩu vị sang [1, 2]
    const updatedDish1 = await menuService.updateMenuItem(dish1.menu_item_id, {
      price: 30000,
      taste_ids: [1, 2],
    }, ownerPartner);

    priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    assert(
      Number(priceRange.price_min) === 30000 && Number(priceRange.price_max) === 70000 && updatedDish1.tastes.length === 2,
      '2.4 Sửa giá món 1 (30k) & Khẩu vị mới -> price_min tự động hạ xuống 30,000đ',
      `Tastes mới: ${updatedDish1.tastes.map(t => t.name).join(', ')}`
    );

    // 2.5 Ẩn món 1 (Món có giá rẻ nhất) -> is_available = 0
    await menuService.deleteMenuItem(dish1.menu_item_id, ownerPartner);
    priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    const dish1Db = (await pool.request().input('id', sql.Int, dish1.menu_item_id).query('SELECT is_available FROM menu_items WHERE menu_item_id = @id')).recordset[0];
    assert(
      dish1Db.is_available === false && Number(priceRange.price_min) === 55000 && Number(priceRange.price_max) === 70000,
      '2.5 Ẩn món rẻ nhất (Soft delete) -> price_min tự động lấy món còn bán rẻ nhất tiếp theo (55,000đ)',
      `Món 1 is_available: false, Khoảng giá mới: 55k - 70k`
    );

    // 2.6 Khôi phục lại món 1 (is_available = true)
    await menuService.updateMenuItem(dish1.menu_item_id, { is_available: true }, ownerPartner);
    priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    assert(
      Number(priceRange.price_min) === 30000 && Number(priceRange.price_max) === 70000,
      '2.6 Mở bán lại món 1 -> price_min tự động hạ lại 30,000đ',
      `Khoảng giá phục hồi: 30k - 70k`
    );

    // 2.7 Ẩn toàn bộ thực đơn
    await menuService.deleteMenuItem(dish1.menu_item_id, ownerPartner);
    await menuService.deleteMenuItem(dish2.menu_item_id, ownerPartner);
    await menuService.deleteMenuItem(dish3.menu_item_id, ownerPartner);

    priceRange = (await pool.request().input('id', sql.Int, newRestaurant.place_id).query('SELECT price_min, price_max FROM restaurants WHERE place_id = @id')).recordset[0];
    assert(
      priceRange.price_min === null && priceRange.price_max === null,
      '2.7 Khi tất cả món đều bị ẩn -> price_min và price_max tự động reset về NULL',
      `price_min: ${priceRange.price_min}, price_max: ${priceRange.price_max}`
    );

    // Khôi phục lại món 2 và món 3 để tiếp tục test
    await menuService.updateMenuItem(dish2.menu_item_id, { is_available: true }, ownerPartner);
    await menuService.updateMenuItem(dish3.menu_item_id, { is_available: true }, ownerPartner);

    // =========================================================================
    // SUITE 3: BẢO MẬT, PHÂN QUYỀN & TRẠNG THÁI LOCKED
    // =========================================================================
    console.log('\n--- 🔒 SUITE 3: Kiểm thử Phân quyền, Validation & Chặn LOCKED ---');

    // 3.1 Validate giá âm
    try {
      await menuService.createMenuItem(newRestaurant.place_id, { name: 'Món âm giá', price: -10000 }, ownerPartner);
      assert(false, '3.1 Validate giá âm');
    } catch (err: any) {
      assert(err.status === 400, '3.1 Chặn tạo món với giá âm (HTTP 400)', err.message);
    }

    // 3.2 Validate tên trống
    try {
      await menuService.createMenuItem(newRestaurant.place_id, { name: '   ', price: 20000 }, ownerPartner);
      assert(false, '3.2 Validate tên món trống');
    } catch (err: any) {
      assert(err.status === 400, '3.2 Chặn tạo món khi tên rỗng (HTTP 400)', err.message);
    }

    // 3.3 Validate khẩu vị không tồn tại
    try {
      await menuService.createMenuItem(newRestaurant.place_id, { name: 'Món taste lạ', price: 20000, taste_ids: [99999] }, ownerPartner);
      assert(false, '3.3 Validate taste_id không tồn tại');
    } catch (err: any) {
      assert(err.status === 400, '3.3 Chặn khi taste_id không có trong database (HTTP 400)', err.message);
    }

    // 3.4 Phân quyền: Partner A sửa/xóa món quán của Partner B
    try {
      await menuService.createMenuItem(newRestaurant.place_id, { name: 'Món hack', price: 20000 }, otherPartner);
      assert(false, '3.4 Partner khác tạo món quán người khác');
    } catch (err: any) {
      assert(err.status === 403, '3.4 Chặn Partner tạo món vào nhà hàng không thuộc sở hữu (HTTP 403)', err.message);
    }

    try {
      await menuService.updateMenuItem(dish2.menu_item_id, { price: 1000 }, otherPartner);
      assert(false, '3.4 Partner khác sửa món');
    } catch (err: any) {
      assert(err.status === 403, '3.4 Chặn Partner sửa món ăn quán người khác (HTTP 403)', err.message);
    }

    // 3.5 Khóa quán (LOCKED): Partner không được thêm, sửa, ẩn món
    await pool.request().input('id', sql.Int, newRestaurant.place_id).query("UPDATE places SET status = 'LOCKED' WHERE place_id = @id");

    try {
      await menuService.createMenuItem(newRestaurant.place_id, { name: 'Món khi bị khóa', price: 25000 }, ownerPartner);
      assert(false, '3.5 Thêm món khi LOCKED');
    } catch (err: any) {
      assert(err.status === 403, '3.5 Chặn thêm món khi nhà hàng bị LOCKED (HTTP 403)', err.message);
    }

    try {
      await menuService.updateMenuItem(dish2.menu_item_id, { price: 80000 }, ownerPartner);
      assert(false, '3.5 Sửa món khi LOCKED');
    } catch (err: any) {
      assert(err.status === 403, '3.5 Chặn sửa món khi nhà hàng bị LOCKED (HTTP 403)', err.message);
    }

    try {
      await menuService.deleteMenuItem(dish2.menu_item_id, ownerPartner);
      assert(false, '3.5 Ẩn món khi LOCKED');
    } catch (err: any) {
      assert(err.status === 403, '3.5 Chặn ẩn món khi nhà hàng bị LOCKED (HTTP 403)', err.message);
    }

    // Admin có quyền can thiệp ngay cả khi LOCKED
    const adminEdit = await menuService.updateMenuItem(dish2.menu_item_id, { description: 'Admin chỉnh sửa' }, adminUser);
    assert(
      adminEdit.description === 'Admin chỉnh sửa',
      '3.5 Admin vẫn có quyền chỉnh sửa khi nhà hàng ở trạng thái LOCKED'
    );

    // Mở khóa lại nhà hàng
    await pool.request().input('id', sql.Int, newRestaurant.place_id).query("UPDATE places SET status = 'ACTIVE' WHERE place_id = @id");

    // =========================================================================
    // SUITE 4: KIỂM THỬ ROUTE HTTP THẬT (EXPRESS END-TO-END)
    // =========================================================================
    console.log('\n--- 🌐 SUITE 4: Kiểm thử End-to-End qua Express HTTP Routes ---');

    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/restaurants', restaurantRouter);
    app.use('/api/menu-items', menuItemsRouter);

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const testPort = address.port;
    const baseUrl = `http://localhost:${testPort}`;

    try {
      // 4.1 GET /api/restaurants/:id/menu-items (Public)
      const res1 = await fetch(`${baseUrl}/api/restaurants/${newRestaurant.place_id}/menu-items`);
      const data1: any = await res1.json();
      assert(
        res1.status === 200 && Array.isArray(data1.data) && data1.data.every((i: any) => i.is_available === true),
        '4.1 GET /api/restaurants/:id/menu-items (Khách vãng lai chỉ thấy món đang bán is_available=1)',
        `Số món public thấy: ${data1.data.length}`
      );

      // 4.2 GET /api/menu-items/:id (Chi tiết món)
      const res2 = await fetch(`${baseUrl}/api/menu-items/${dish2.menu_item_id}`);
      const data2: any = await res2.json();
      assert(
        res2.status === 200 && data2.data.menu_item_id === dish2.menu_item_id,
        '4.2 GET /api/menu-items/:id (Xem chi tiết 1 món kèm danh sách khẩu vị)',
        `Món: ${data2.data.name}, Khẩu vị count: ${data2.data.tastes.length}`
      );

      // 4.3 GET món không tồn tại -> 404
      const res3 = await fetch(`${baseUrl}/api/menu-items/999999`);
      assert(
        res3.status === 404,
        '4.3 GET /api/menu-items/999999 trả về HTTP 404 Not Found'
      );
    } finally {
      server.close();
    }

    console.log('\n===============================================================');
    console.log(`🎉 TỔNG KẾT: ĐÃ HOÀN THÀNH ${passedTests}/${totalTests} BÀI KIỂM THỬ — TẤT CẢ ĐỀU PASSED!`);
    console.log('===============================================================\n');

  } finally {
    // Dọn dẹp dữ liệu test
    console.log('🧹 Đang dọn dẹp các bản ghi test trong cơ sở dữ liệu...');
    if (createdPlaceIds.length > 0) {
      const idsStr = createdPlaceIds.join(',');
      await pool.request().query(`
        DELETE FROM menu_item_tastes WHERE menu_item_id IN (SELECT menu_item_id FROM menu_items WHERE place_id IN (${idsStr}));
        DELETE FROM menu_items WHERE place_id IN (${idsStr});
        DELETE FROM restaurants WHERE place_id IN (${idsStr});
        DELETE FROM places WHERE place_id IN (${idsStr});
      `);
      console.log(`Đã xóa sạch dữ liệu test cho các place_id: [${idsStr}]`);
    }

    if (createdPartnerIds.length > 0) {
      const pIds = createdPartnerIds.join(',');
      await pool.request().query(`DELETE FROM partner_profiles WHERE partner_id IN (${pIds});`);
      console.log(`Đã xóa partner_profiles: [${pIds}]`);
    }

    if (createdUserIds.length > 0) {
      const uIds = createdUserIds.join(',');
      await pool.request().query(`DELETE FROM users WHERE user_id IN (${uIds});`);
      console.log(`Đã xóa users test: [${uIds}]`);
    }

    await closeDB();
    console.log('🔌 Đã đóng kết nối cơ sở dữ liệu an toàn.');
  }
}

runStep2ComprehensiveVerification().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
