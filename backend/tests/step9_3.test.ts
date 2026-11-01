import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import jwt from 'jsonwebtoken';
import categoriesRouter from '../src/modules/categories/categories.routes';
import restaurantRouter from '../src/modules/restaurants/restaurants.routes';
import partnerRouter from '../src/modules/partner/partner.routes';
import { errorHandler } from '../src/middleware/error-handler';

function generateTestToken(userId: number, role: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runStep93Tests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TASK 9.3: TẠO VÀ SỬA NHÀ HÀNG (PLACEFORM & API)');
  console.log('   (GET /api/districts, /api/cuisines, POST & PUT /api/restaurants)');
  console.log('========================================================================\n');

  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api', categoriesRouter);
  app.use('/api/restaurants', restaurantRouter);
  app.use('/api/partner', partnerRouter);
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
    // TẠO DỮ LIỆU ĐỐI TÁC TEST
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Partner 1
    const p1UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Một 9.3', 'p1_step93@dananggo.vn', 'hash', 'P1-93', 1, 'ACTIVE', GETDATE())
    `);
    const p1UserId = p1UserRes.recordset[0].user_id;
    createdUserIds.push(p1UserId);
    const p1Token = generateTestToken(p1UserId, 'PARTNER');

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p1UserId}, N'Nhà Hàng Partner 93', '0905111193', 'APPROVED', N'120 Nguyễn Văn Linh', 'TABLE', GETDATE(), GETDATE())
    `);
    const p1PartnerId = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p1PartnerId);

    // 2. Partner 2 (để test chặn quyền sửa chéo)
    const p2UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Hai 9.3', 'p2_step93@dananggo.vn', 'hash', 'P2-93', 1, 'ACTIVE', GETDATE())
    `);
    const p2UserId = p2UserRes.recordset[0].user_id;
    createdUserIds.push(p2UserId);
    const p2Token = generateTestToken(p2UserId, 'PARTNER');

    // 3. Admin user
    const adminUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Admin 9.3', 'admin_step93@dananggo.vn', 'hash', 'ADM-93', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminUserRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);
    const adminToken = generateTestToken(adminUserId, 'ADMIN');

    // ==================== NHÓM 1: DANH MỤC MASTER DATA ====================
    console.log('\n--- NHÓM 1: DANH MỤC DÙNG CHUNG (GET /api/districts, /api/cuisines) ---');

    const distRes = await fetch(`${baseUrl}/api/districts`);
    const distData = await distRes.json();
    assert(distRes.status === 200, '1.1 Lấy danh sách quận/huyện thành công (status 200)');
    assert(Array.isArray(distData.data) && distData.data.length >= 7, '1.2 Danh sách quận/huyện có dữ liệu chuẩn');

    const cuisRes = await fetch(`${baseUrl}/api/cuisines`);
    const cuisData = await cuisRes.json();
    assert(cuisRes.status === 200, '1.3 Lấy danh mục ẩm thực thành công (status 200)');
    assert(Array.isArray(cuisData.data) && cuisData.data.length > 0, '1.4 Danh mục ẩm thực có dữ liệu');

    const districtId = distData.data[0].id;
    const cuisineId = cuisData.data[0].id;

    // ==================== NHÓM 2: VALIDATION TRƯỚC KHI TẠO ====================
    console.log('\n--- NHÓM 2: VALIDATION FORM TẠO NHÀ HÀNG ---');

    // 2.1 Thiếu tên nhà hàng
    const noNameRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({
        address: '123 Võ Nguyên Giáp',
        district_id: districtId,
      }),
    });
    assert(noNameRes.status === 400, '2.1 Thiếu tên nhà hàng trả về 400 Bad Request');

    // 2.2 booking_url không có http/https
    const invalidBookingRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({
        name: 'Quán Test URL Lỗi',
        address: '123 Võ Nguyên Giáp',
        district_id: districtId,
        booking_url: 'pasgo.vn/dat-cho/123',
      }),
    });
    const invalidBookingJson = await invalidBookingRes.json();
    assert(invalidBookingRes.status === 400, '2.2 booking_url thiếu http/https trả về 400 Bad Request');
    assert(
      invalidBookingJson.message.includes('http:// hoặc https://'),
      '2.3 Thông báo lỗi booking_url hiển thị chính xác'
    );

    // 2.3 price_max < price_min
    const invalidPriceRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({
        name: 'Quán Test Giá Lỗi',
        address: '123 Võ Nguyên Giáp',
        district_id: districtId,
        price_min: 500000,
        price_max: 100000,
      }),
    });
    assert(invalidPriceRes.status === 400, '2.4 price_max < price_min trả về 400 Bad Request');

    // ==================== NHÓM 3: TẠO NHÀ HÀNG & LƯU HÌNH ẢNH ====================
    console.log('\n--- NHÓM 3: TẠO NHÀ HÀNG THÀNH CÔNG (POST /api/restaurants) ---');

    const newPlacePayload = {
      name: `Quán Hải Sản Task 9.3 Test - ${Date.now()}`,
      description: 'Không gian mở thoáng đãng, hải sản tươi sống bắt tại hồ.',
      address: '254 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
      district_id: districtId,
      cuisine_id: cuisineId,
      price_min: 80000,
      price_max: 450000,
      latitude: 16.0612,
      longitude: 108.2435,
      phone: '0905123456',
      website: 'https://bemanseafood.vn',
      booking_url: 'https://pasgo.vn/dat-cho/haisan-beman-danang',
      images: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      ],
    };

    const createRes = await fetch(`${baseUrl}/api/restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify(newPlacePayload),
    });
    const createJson = await createRes.json();

    assert(createRes.status === 201, '3.1 Tạo nhà hàng thành công nhận status 201 Created');
    assert(
      typeof createJson.data?.place_id === 'number' && createJson.data.place_id > 0,
      '3.2 Trả về place_id số nguyên dương'
    );
    const createdPlaceId = createJson.data.place_id;
    createdPlaceIds.push(createdPlaceId);

    assert(createJson.data.name === newPlacePayload.name, '3.3 Tên nhà hàng đúng như yêu cầu');
    assert(createJson.data.booking_url === newPlacePayload.booking_url, '3.4 booking_url được lưu chính xác');
    assert(Boolean(createJson.data.cover_image), '3.5 Ảnh bìa cover_image được lưu chính xác');

    // Kiểm tra DB: bảng place_images phải có 2 ảnh
    const imgCheck = await pool
      .request()
      .input('place_id', createdPlaceId)
      .query('SELECT COUNT(*) AS count FROM place_images WHERE place_id = @place_id');
    assert(imgCheck.recordset[0].count === 2, '3.6 CSDL đã lưu chính xác 2 ảnh vào place_images');

    // ==================== NHÓM 4: CẬP NHẬT NHÀ HÀNG & SỬA ẢNH ====================
    console.log('\n--- NHÓM 4: CẬP NHẬT NHÀ HÀNG & THAY ĐỔI ẢNH (PUT /api/restaurants/:id) ---');

    const updatePayload = {
      name: `${newPlacePayload.name} (Đã Sửa)`,
      price_min: 90000,
      price_max: 550000,
      booking_url: 'https://booking.dananggo.vn/nhahang/1',
      images: ['https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800'],
    };

    const updateRes = await fetch(`${baseUrl}/api/restaurants/${createdPlaceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const updateJson = await updateRes.json();

    assert(updateRes.status === 200, '4.1 Cập nhật nhà hàng thành công nhận status 200 OK');
    assert(updateJson.data.name === updatePayload.name, '4.2 Tên mới đã được cập nhật');
    assert(
      updateJson.data.price_min === 90000 && updateJson.data.price_max === 550000,
      '4.3 Khoảng giá mới đã được cập nhật'
    );

    const imgCheck2 = await pool
      .request()
      .input('place_id', createdPlaceId)
      .query('SELECT COUNT(*) AS count FROM place_images WHERE place_id = @place_id');
    assert(imgCheck2.recordset[0].count === 1, '4.4 Danh sách ảnh được cập nhật lại chính xác 1 ảnh mới');

    // ==================== NHÓM 5: PHÂN QUYỀN & CHẶN SỬA KHI LOCKED ====================
    console.log('\n--- NHÓM 5: BẢO MẬT QUYỀN SỞ HỮU & CHẶN SỬA KHI LOCKED ---');

    // 5.1 Partner 2 sửa quán của Partner 1 bị chặn
    const crossRes = await fetch(`${baseUrl}/api/restaurants/${createdPlaceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p2Token}`,
      },
      body: JSON.stringify({ name: 'Hack Tên Quán' }),
    });
    assert(crossRes.status === 403, '5.1 Partner khác sửa quán bị chặn 403 Forbidden');

    // 5.2 Khóa quán (LOCKED) và thử sửa
    await pool
      .request()
      .input('place_id', createdPlaceId)
      .query("UPDATE places SET status = 'LOCKED' WHERE place_id = @place_id");

    const lockedUpdateRes = await fetch(`${baseUrl}/api/restaurants/${createdPlaceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({ name: 'Cố tình sửa quán LOCKED' }),
    });
    const lockedUpdateJson = await lockedUpdateRes.json();

    assert(lockedUpdateRes.status === 403, '5.2 Quán LOCKED bị chặn sửa trả về 403 Forbidden');
    assert(
      lockedUpdateJson.message.includes('LOCKED') || lockedUpdateJson.message.includes('khóa'),
      '5.3 Thông báo lỗi nêu rõ quán đang bị khóa LOCKED'
    );

    // 5.3 Admin có quyền cập nhật quán kể cả khi LOCKED (isAdminMode)
    const adminUpdateRes = await fetch(`${baseUrl}/api/restaurants/${createdPlaceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `${updatePayload.name} - Mở bởi Admin`,
        status: 'ACTIVE',
      }),
    });
    assert(adminUpdateRes.status === 200, '5.4 Admin có quyền sửa quán LOCKED thành ACTIVE (isAdminMode)');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TOÀN BỘ KIỂM THỬ TASK 9.3: ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log('========================================================================\n');
  } finally {
    server.close();
    // Dọn dẹp dữ liệu test
    if (createdPlaceIds.length > 0) {
      const ids = createdPlaceIds.join(',');
      await pool.request().query(`
        DELETE FROM place_images WHERE place_id IN (${ids});
        DELETE FROM restaurants WHERE place_id IN (${ids});
        DELETE FROM places WHERE place_id IN (${ids});
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
    await closeDB();
  }
}

runStep93Tests().catch((err) => {
  console.error('Lỗi khi chạy test 9.3:', err);
  process.exit(1);
});
