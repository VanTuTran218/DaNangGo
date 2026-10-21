import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import partnerRouter from '../src/modules/partner/partner.routes';
import placesRouter from '../src/modules/places/places.routes';
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

async function runStep92Tests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TASK 9.2: DANH SÁCH QUÁN CỦA TÔI & ĐỔI TRẠNG THÁI');
  console.log('   (GET /api/partner/places, view_count, filter status, PATCH status, LOCKED)');
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
  const createdPlaceIds: number[] = [];

  // Setup Express App
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/partner', partnerRouter);
  app.use('/api/places', placesRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // TẠO DỮ LIỆU TEST
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Partner 1
    const p1UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Một 9.2', 'p1_step92@dananggo.vn', 'hash', 'P1-92', 1, 'ACTIVE', GETDATE())
    `);
    const p1UserId = p1UserRes.recordset[0].user_id;
    createdUserIds.push(p1UserId);
    const p1Token = generateTestToken(p1UserId, 'PARTNER');

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p1UserId}, N'Nhà Hàng Partner 1', '0905111111', 'APPROVED', N'120 Nguyễn Văn Linh', 'TABLE', GETDATE(), GETDATE())
    `);
    const p1PartnerId = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p1PartnerId);

    // 2. Partner 2
    const p2UserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Partner Hai 9.2', 'p2_step92@dananggo.vn', 'hash', 'P2-92', 1, 'ACTIVE', GETDATE())
    `);
    const p2UserId = p2UserRes.recordset[0].user_id;
    createdUserIds.push(p2UserId);
    const p2Token = generateTestToken(p2UserId, 'PARTNER');

    const p2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, address, service_type, approved_at, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${p2UserId}, N'Nhà Hàng Partner 2', '0905222222', 'APPROVED', N'45 Lê Duẩn', 'TABLE', GETDATE(), GETDATE())
    `);
    const p2PartnerId = p2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(p2PartnerId);

    // 3. User thường
    const normalUserRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, N'User Thường 9.2', 'user_step92@dananggo.vn', 'hash', 'USR-92', 1, 'ACTIVE', GETDATE())
    `);
    const normalUserId = normalUserRes.recordset[0].user_id;
    createdUserIds.push(normalUserId);
    const normalToken = generateTestToken(normalUserId, 'USER');

    // 4. Tạo các quán mẫu cho Partner 1:
    // Quán 1: ACTIVE, view_count = 1520
    const place1Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Hải Sản Mỹ Khê P1', N'Hải sản tươi sống bên biển', N'12 Võ Nguyên Giáp', 3, ${p1PartnerId}, 1520, 'ACTIVE', GETDATE())
    `);
    const place1Id = place1Res.recordset[0].place_id;
    createdPlaceIds.push(place1Id);
    await pool.request().query(`
      INSERT INTO restaurants (place_id, cuisine_id, price_min, price_max)
      VALUES (${place1Id}, 1, 50000, 350000)
    `);
    await pool.request().query(`
      INSERT INTO place_images (place_id, image_url, is_cover)
      VALUES (${place1Id}, 'https://images.unsplash.com/photo-1.jpg', 1)
    `);

    // Quán 2: HIDDEN, view_count = 430
    const place2Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Bún Chả Cá P1 (Đã Ẩn)', N'Đặc sản chả cá Đà Nẵng', N'88 Lê Hồng Phong', 1, ${p1PartnerId}, 430, 'HIDDEN', GETDATE())
    `);
    const place2Id = place2Res.recordset[0].place_id;
    createdPlaceIds.push(place2Id);
    await pool.request().query(`
      INSERT INTO restaurants (place_id, cuisine_id, price_min, price_max)
      VALUES (${place2Id}, 2, 30000, 60000)
    `);

    // Quán 3: LOCKED, view_count = 980
    const place3Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Nướng Phố P1 (Bị Khóa)', N'Quán nướng vi phạm bị khóa', N'15 Quang Trung', 1, ${p1PartnerId}, 980, 'LOCKED', GETDATE())
    `);
    const place3Id = place3Res.recordset[0].place_id;
    createdPlaceIds.push(place3Id);
    await pool.request().query(`
      INSERT INTO restaurants (place_id, cuisine_id, price_min, price_max)
      VALUES (${place3Id}, 3, 40000, 120000)
    `);

    // Quán 4: Thuộc Partner 2 (để kiểm tra cách ly dữ liệu)
    const place4Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Cơm Gà Partner 2', N'Cơm gà gia truyền', N'90 Hải Phòng', 1, ${p2PartnerId}, 310, 'ACTIVE', GETDATE())
    `);
    const place4Id = place4Res.recordset[0].place_id;
    createdPlaceIds.push(place4Id);
    await pool.request().query(`
      INSERT INTO restaurants (place_id, cuisine_id, price_min, price_max)
      VALUES (${place4Id}, 4, 35000, 70000)
    `);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 1: BẢO MẬT & PHÂN QUYỀN TRUY CẬP ROUTE /api/partner/places
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 1: BẢO MẬT ROUTE GET /api/partner/places ---');

    const resNoAuth = await fetch(`${baseUrl}/api/partner/places`);
    assert(resNoAuth.status === 401, '1.1 Không có token nhận HTTP 401 Unauthorized');

    const resNormalUser = await fetch(`${baseUrl}/api/partner/places`, {
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    assert(resNormalUser.status === 403, '1.2 User thường nhận HTTP 403 Forbidden');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 2: DANH SÁCH QUÁN CỦA TÔI & DỮ LIỆU ĐẶC TẢ
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 2: DANH SÁCH QUÁN CỦA TÔI (PARTNER 1) ---');

    const resP1 = await fetch(`${baseUrl}/api/partner/places`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    const jsonP1 = await resP1.json();
    assert(resP1.status === 200 && jsonP1.success === true, '2.1 Partner 1 lấy danh sách quán thành công');
    assert(jsonP1.data.length === 3, '2.2 Partner 1 nhận chính xác 3 quán của mình (không có quán của Partner 2)');

    // Kiểm tra chi tiết các trường của Quán 1
    const p1Item = jsonP1.data.find((p: any) => p.placeId === place1Id);
    assert(!!p1Item, '2.3 Tìm thấy Quán 1 trong danh sách');
    assert(p1Item.name === 'Quán Hải Sản Mỹ Khê P1', '2.4 Tên quán chính xác');
    assert(p1Item.status === 'ACTIVE', '2.5 Trạng thái quán 1 là ACTIVE');
    assert(p1Item.viewCount === 1520, '2.6 Số lượt xem view_count khớp chính xác với CSDL (1520)');
    assert(p1Item.priceMin === 50000 && p1Item.priceMax === 350000, '2.7 Khoảng giá price_min, price_max chính xác');
    assert(p1Item.images && p1Item.images.length > 0, '2.8 Danh sách hình ảnh được nạp đầy đủ');

    // Kiểm tra Quán 3 (LOCKED) vẫn xuất hiện trong danh sách của chủ sở hữu
    const p3Item = jsonP1.data.find((p: any) => p.placeId === place3Id);
    assert(!!p3Item && p3Item.status === 'LOCKED', '2.9 Quán bị LOCKED vẫn hiển thị trong Dashboard của chính Partner');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 3: LỌC THEO TRẠNG THÁI (status filter)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 3: BỘ LỌC TRẠNG THÁI (status filter) ---');

    // Lọc ACTIVE
    const resFilterActive = await fetch(`${baseUrl}/api/partner/places?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    const jsonActive = await resFilterActive.json();
    assert(jsonActive.data.length === 1 && jsonActive.data[0].placeId === place1Id, '3.1 Lọc status=ACTIVE trả về đúng 1 quán');

    // Lọc HIDDEN
    const resFilterHidden = await fetch(`${baseUrl}/api/partner/places?status=HIDDEN`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    const jsonHidden = await resFilterHidden.json();
    assert(jsonHidden.data.length === 1 && jsonHidden.data[0].placeId === place2Id, '3.2 Lọc status=HIDDEN trả về đúng 1 quán');

    // Lọc LOCKED
    const resFilterLocked = await fetch(`${baseUrl}/api/partner/places?status=LOCKED`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    const jsonLocked = await resFilterLocked.json();
    assert(jsonLocked.data.length === 1 && jsonLocked.data[0].placeId === place3Id, '3.3 Lọc status=LOCKED trả về đúng 1 quán');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST CASE 4: THAO TÁC ẨN / HIỆN (TOGGLE STATUS) VÀ XỬ LÝ LOCKED
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- NHÓM 4: THAO TÁC ẨN / HIỆN (PATCH /api/places/:id/status) ---');

    // 4.1 Partner 1 ẩn Quán 1 (ACTIVE -> HIDDEN)
    const resHide = await fetch(`${baseUrl}/api/places/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    const hideJson = await resHide.json();
    assert(resHide.status === 200 && hideJson.data.status === 'HIDDEN', '4.1 Partner 1 ẩn quán thành công (status -> HIDDEN)');

    // 4.2 Partner 1 mở lại Quán 1 (HIDDEN -> ACTIVE)
    const resShow = await fetch(`${baseUrl}/api/places/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const showJson = await resShow.json();
    assert(resShow.status === 200 && showJson.data.status === 'ACTIVE', '4.2 Partner 1 mở hiển thị lại quán thành công (status -> ACTIVE)');

    // 4.3 Partner 1 cố mở khóa hoặc đổi trạng thái Quán 3 đang bị LOCKED -> BỊ CHẶN 403
    const resToggleLocked = await fetch(`${baseUrl}/api/places/${place3Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(resToggleLocked.status === 403, '4.3 Quán đang LOCKED: Partner không thể tự ý mở khóa (trả về 403 Forbidden)');

    // 4.4 Partner 1 cố sửa trạng thái quán của Partner 2 -> BỊ CHẶN 403
    const resHackP2 = await fetch(`${baseUrl}/api/places/${place4Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p1Token}`,
      },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    assert(resHackP2.status === 403, '4.4 Partner không thể thay đổi trạng thái quán của đối tác khác (403 Forbidden)');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH TOÀN BỘ KIỂM THỬ TASK 9.2: ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log('========================================================================\n');
  } finally {
    server.close();
    // Dọn dẹp an toàn các bản ghi test
    for (const pid of createdPlaceIds) {
      await pool.request().query(`DELETE FROM place_images WHERE place_id = ${pid}`);
      await pool.request().query(`DELETE FROM restaurants WHERE place_id = ${pid}`);
      await pool.request().query(`DELETE FROM places WHERE place_id = ${pid}`);
    }
    for (const ptId of createdPartnerIds) {
      await pool.request().query(`DELETE FROM partner_profiles WHERE partner_id = ${ptId}`);
    }
    for (const uid of createdUserIds) {
      await pool.request().query(`DELETE FROM users WHERE user_id = ${uid}`);
    }
    await closeDB();
  }
}

runStep92Tests().catch((err) => {
  console.error('Lỗi khi chạy test 9.2:', err);
  process.exit(1);
});
