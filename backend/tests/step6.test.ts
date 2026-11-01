import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
import placesRouter from '../src/modules/places/places.routes';
import { errorHandler } from '../src/middleware/error-handler';
import http from 'http';
import jwt from 'jsonwebtoken';
import { getVietnamTime, calculateIsOpenNow } from '../src/modules/places/places.repository';

function generateTestToken(userId: number, role: string) {
  const secret = process.env.JWT_ACCESS_SECRET || 'testsecret12345678901234567890123456789012';
  return jwt.sign(
    { role, publicId: `TEST-${userId}`, sessionType: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    secret,
    { subject: String(userId), expiresIn: '1h' }
  );
}

async function runStep6ComprehensiveVerification() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TASK 6: XEM CHI TIẾT ĐỊA ĐIỂM (/api/places/:id)');
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

  // Dựng Express server kiểm thử
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/places', placesRouter);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api/places`;

  try {
    // ─── Chuẩn bị Tài khoản Test ──────────────────────────────────────────────
    // 1. Admin
    const adminRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, 'Admin Step6 Test', 'admin_step6@dananggo.vn', '$2b$12$dummyhash', 'ADM-S6-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);

    // 2. Partner 1 (Chủ nhà hàng & Điểm du lịch test)
    const partner1Res = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner 1 Step6 Test', 'partner1_step6@dananggo.vn', '$2b$12$dummyhash', 'PT1-S6-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partner1UserId = partner1Res.recordset[0].user_id;
    createdUserIds.push(partner1UserId);

    const p1ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, approved_at)
      OUTPUT INSERTED.partner_id
      VALUES (${partner1UserId}, 'Đối Tác 1 Step6 Test', '0905111222', 'APPROVED', GETDATE())
    `);
    const partner1Id = p1ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(partner1Id);

    // 3. Partner 2 (Chủ cơ sở khác)
    const partner2Res = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner 2 Step6 Test', 'partner2_step6@dananggo.vn', '$2b$12$dummyhash', 'PT2-S6-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partner2UserId = partner2Res.recordset[0].user_id;
    createdUserIds.push(partner2UserId);

    const p2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, approved_at)
      OUTPUT INSERTED.partner_id
      VALUES (${partner2UserId}, 'Đối Tác 2 Step6 Test', '0905333444', 'APPROVED', GETDATE())
    `);
    const partner2Id = p2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(partner2Id);

    // 4. User thường
    const userRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, 'User Regular Step6', 'user_step6@dananggo.vn', '$2b$12$dummyhash', 'USR-S6-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const regularUserId = userRes.recordset[0].user_id;
    createdUserIds.push(regularUserId);

    // Tạo JWT tokens
    const adminToken = generateTestToken(adminUserId, 'ADMIN');
    const partner1Token = generateTestToken(partner1UserId, 'PARTNER');
    const partner2Token = generateTestToken(partner2UserId, 'PARTNER');
    const userToken = generateTestToken(regularUserId, 'USER');

    // ─── Chuẩn bị Dữ liệu Địa điểm Test ──────────────────────────────────────
    const vnTime = getVietnamTime();

    // Địa điểm A: Nhà hàng ACTIVE với Menu Items & Tastes
    const pARes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, booking_url, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Nhà Hàng Biển Mỹ Khê Step6', N'Hải sản tươi sống cao cấp tại Đà Nẵng', N'120 Võ Nguyên Giáp', 1, 16.0601, 108.2435, '02363999888', 'https://mykheseafood.vn', 'https://dananggo.vn/book/mykhe', ${partner1Id}, 4.8, 150, 20, 'ACTIVE', GETDATE())
    `);
    const placeAId = pARes.recordset[0].place_id;
    createdPlaceIds.push(placeAId);

    await pool.request().query(`
      INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
      VALUES (${placeAId}, 'RESTAURANT', 1, 50000, 250000)
    `);

    // Ảnh cho Nhà hàng A (1 cover, 2 ảnh phụ)
    await pool.request().query(`
      INSERT INTO place_images (place_id, image_url, is_cover)
      VALUES 
        (${placeAId}, 'https://images.unsplash.com/photo-cover.jpg', 1),
        (${placeAId}, 'https://images.unsplash.com/photo-sub1.jpg', 0),
        (${placeAId}, 'https://images.unsplash.com/photo-sub2.jpg', 0)
    `);

    // Giờ mở cửa cho Nhà hàng A (Hôm nay mở cả ngày: 00:00 - 23:59)
    await pool.request().query(`
      INSERT INTO opening_hours (place_id, day_of_week, open_time, close_time)
      VALUES 
        (${placeAId}, ${vnTime.dayOfWeek}, '00:00:00', '23:59:59')
    `);

    // Menu items cho Nhà hàng A:
    // Món 1: Đang bán (is_available = 1) kèm 2 khẩu vị
    const m1Res = await pool.request().query<{ menu_item_id: number }>(`
      INSERT INTO menu_items (place_id, name, description, price, image_url, is_available)
      OUTPUT INSERTED.menu_item_id
      VALUES (${placeAId}, N'Cua Huỳnh Đế Hấp Sả', N'Cua tươi sống chắc thịt', 250000, 'https://images.unsplash.com/photo-crab.jpg', 1)
    `);
    const menuItem1Id = m1Res.recordset[0].menu_item_id;

    // Gán 2 khẩu vị: taste_id = 1 (Cay), taste_id = 2 (Ngọt/Béo)
    await pool.request().query(`
      INSERT INTO menu_item_tastes (menu_item_id, taste_id)
      VALUES (${menuItem1Id}, 1), (${menuItem1Id}, 2)
    `);

    // Món 2: Đang bán (is_available = 1) không có taste
    await pool.request().query(`
      INSERT INTO menu_items (place_id, name, description, price, image_url, is_available)
      VALUES (${placeAId}, N'Mực Cơm Hấp Gừng', N'Mực cơm tươi giòn ngọt', 150000, NULL, 1)
    `);

    // Món 3: ĐÃ BỊ ẨN (is_available = 0) -> API chi tiết KHÔNG được trả ra cho khách
    await pool.request().query(`
      INSERT INTO menu_items (place_id, name, description, price, image_url, is_available)
      VALUES (${placeAId}, N'Món Đã Ngừng Phục Vụ', N'Tạm hết hàng', 80000, NULL, 0)
    `);

    // Địa điểm B: Điểm tham quan du lịch (ATTRACTION) ACTIVE
    const pBRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', N'Bảo Tàng Điêu Khắc Chăm Step6', N'Bảo tàng nghệ thuật Chăm Pa lớn nhất thế giới', N'Số 02 đường 2 Tháng 9, Hải Châu', 1, 16.0605, 108.2230, '02363574765', 'https://chammuseum.vn', NULL, 4.7, 320, 100, 'ACTIVE', GETDATE())
    `);
    const placeBId = pBRes.recordset[0].place_id;
    createdPlaceIds.push(placeBId);

    await pool.request().query(`
      INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
      VALUES (${placeBId}, 'ATTRACTION', 1, 60000, 90)
    `);

    // Địa điểm C: Cơ sở lưu trú (ACCOMMODATION) ACTIVE
    const pCRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ACCOMMODATION', N'Khách Sạn Biển Vàng Step6', N'Khách sạn 4 sao view biển', N'15 Võ Văn Kiệt', 2, ${partner1Id}, 4.6, 95, 45, 'ACTIVE', GETDATE())
    `);
    const placeCId = pCRes.recordset[0].place_id;
    createdPlaceIds.push(placeCId);

    await pool.request().query(`
      INSERT INTO accommodations (place_id, place_type, accommodation_type, star_rating, check_in_time, check_out_time, accepts_cash, accepts_bank_transfer)
      VALUES (${placeCId}, 'ACCOMMODATION', 'HOTEL', 4, '14:00:00', '12:00:00', 1, 1)
    `);

    // Thêm room_types cho Cơ sở C
    await pool.request().query(`
      INSERT INTO room_types (place_id, name, capacity, price_per_night, original_price, status)
      VALUES 
        (${placeCId}, N'Phòng Deluxe Hướng Biển', 2, 850000, 1200000, 'ACTIVE'),
        (${placeCId}, N'Phòng Suite Gia Đình', 4, 1600000, 2000000, 'ACTIVE'),
        (${placeCId}, N'Phòng Tạm Ẩn', 2, 500000, 600000, 'HIDDEN')
    `);


    // Địa điểm D: Nhà hàng ở trạng thái HIDDEN (Của Partner 1)
    const pDRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Trà Ẩn Step6', N'Quán đang tạm ẩn', N'Hải Châu', 1, ${partner1Id}, 'HIDDEN', GETDATE())
    `);
    const placeDId = pDRes.recordset[0].place_id;
    createdPlaceIds.push(placeDId);

    // Địa điểm E: Cơ sở trạng thái LOCKED (Bị khóa bởi Admin)
    const pERes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Vi Phạm Bị Khóa Step6', N'Quán đang bị admin khóa', N'Sơn Trà', 2, ${partner1Id}, 'LOCKED', GETDATE())
    `);
    const placeEId = pERes.recordset[0].place_id;
    createdPlaceIds.push(placeEId);

    // Địa điểm F: Cơ sở trạng thái PENDING (Chờ duyệt)
    const pFRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Mới Đăng Ký Chờ Duyệt Step6', N'Quán chờ duyệt', N'Cẩm Lệ', 3, ${partner1Id}, 'PENDING', GETDATE())
    `);
    const placeFId = pFRes.recordset[0].place_id;
    createdPlaceIds.push(placeFId);


    // =========================================================================
    // 📦 SUITE 1: VALIDATION ĐẦU VÀO & HTTP ERROR CODES (YÊU CẦU 1, 2)
    // =========================================================================
    console.log('--- 📦 SUITE 1: VALIDATION ĐẦU VÀO (HTTP 400 & 404) ---');

    // 1.1 ID dạng chữ cái -> 400 Bad Request
    const rAlpha = await fetch(`${baseUrl}/abc_invalid`);
    const jAlpha = await rAlpha.json();
    assert(rAlpha.status === 400, '1.1 ID dạng chữ cái trả về HTTP 400 Bad Request');
    assert(jAlpha.message.includes('ID địa điểm không hợp lệ'), '1.1 Thông điệp báo lỗi ID chữ cái chính xác');

    // 1.2 ID <= 0 -> 400 Bad Request
    const rZero = await fetch(`${baseUrl}/0`);
    assert(rZero.status === 400, '1.2 ID = 0 trả về HTTP 400 Bad Request');
    const rNeg = await fetch(`${baseUrl}/-10`);
    assert(rNeg.status === 400, '1.2 ID số âm trả về HTTP 400 Bad Request');

    // 1.3 ID không tồn tại trong database -> 404 Not Found
    const rNotFound = await fetch(`${baseUrl}/9999999`);
    const jNotFound = await rNotFound.json();
    assert(rNotFound.status === 404, '1.3 ID không tồn tại trả về HTTP 404 Not Found');
    assert(jNotFound.message.includes('Không tìm thấy địa điểm'), '1.3 Thông điệp báo lỗi 404 chuẩn xác');


    // =========================================================================
    // 🔒 SUITE 2: PHÂN QUYỀN TRẠNG THÁI (YÊU CẦU 2: HIDDEN, LOCKED, PENDING)
    // =========================================================================
    console.log('\n--- 🔒 SUITE 2: BẢO MẬT & PHÂN QUYỀN TRẠNG THÁI (HIDDEN, LOCKED, PENDING) ---');

    // 2.1 Địa điểm HIDDEN
    // a. Khách vãng lai xem -> 404
    const rGuestHidden = await fetch(`${baseUrl}/${placeDId}`);
    assert(rGuestHidden.status === 404, '2.1a Khách vãng lai xem quán HIDDEN nhận HTTP 404 Not Found');

    // b. User thường xem -> 404
    const rUserHidden = await fetch(`${baseUrl}/${placeDId}`, {
      headers: { Cookie: `access_token=${userToken}` },
    });
    assert(rUserHidden.status === 404, '2.1b User thường xem quán HIDDEN nhận HTTP 404 Not Found');

    // c. Partner khác (Partner 2) xem quán HIDDEN của Partner 1 -> 404
    const rPartner2Hidden = await fetch(`${baseUrl}/${placeDId}`, {
      headers: { Cookie: `access_token=${partner2Token}` },
    });
    assert(rPartner2Hidden.status === 404, '2.1c Partner khác xem quán HIDDEN nhận HTTP 404 Not Found');

    // d. Partner chủ quán (Partner 1) xem quán HIDDEN của mình -> 200 OK
    const rPartner1Hidden = await fetch(`${baseUrl}/${placeDId}`, {
      headers: { Cookie: `access_token=${partner1Token}` },
    });
    const jPartner1Hidden = await rPartner1Hidden.json();
    assert(rPartner1Hidden.status === 200 && jPartner1Hidden.data?.status === 'HIDDEN', '2.1d Partner chủ sở hữu xem quán HIDDEN của mình nhận HTTP 200 OK');

    // e. Admin xem quán HIDDEN -> 200 OK
    const rAdminHidden = await fetch(`${baseUrl}/${placeDId}`, {
      headers: { Cookie: `admin_access=${adminToken}` },
    });
    assert(rAdminHidden.status === 200, '2.1e Admin xem quán HIDDEN nhận HTTP 200 OK');

    // 2.2 Địa điểm LOCKED
    // a. Khách vãng lai xem quán LOCKED -> 404
    const rGuestLocked = await fetch(`${baseUrl}/${placeEId}`);
    assert(rGuestLocked.status === 404, '2.2a Khách vãng lai xem quán LOCKED nhận HTTP 404 Not Found');

    // b. Partner chủ xem quán LOCKED của mình -> 200 OK
    const rOwnerLocked = await fetch(`${baseUrl}/${placeEId}`, {
      headers: { Cookie: `access_token=${partner1Token}` },
    });
    assert(rOwnerLocked.status === 200, '2.2b Partner chủ xem quán LOCKED của mình nhận HTTP 200 OK');

    // c. Admin xem quán LOCKED -> 200 OK
    const rAdminLocked = await fetch(`${baseUrl}/${placeEId}`, {
      headers: { Cookie: `admin_access=${adminToken}` },
    });
    assert(rAdminLocked.status === 200, '2.2c Admin xem quán LOCKED nhận HTTP 200 OK');

    // 2.3 Địa điểm PENDING (Chờ duyệt)
    // a. Khách vãng lai xem quán PENDING -> 404
    const rGuestPending = await fetch(`${baseUrl}/${placeFId}`);
    assert(rGuestPending.status === 404, '2.3a Khách vãng lai xem quán PENDING nhận HTTP 404 Not Found');

    // b. Partner chủ xem quán PENDING -> 200 OK
    const rOwnerPending = await fetch(`${baseUrl}/${placeFId}`, {
      headers: { Cookie: `access_token=${partner1Token}` },
    });
    assert(rOwnerPending.status === 200, '2.3b Partner chủ xem quán PENDING nhận HTTP 200 OK');

    // c. Admin xem quán PENDING -> 200 OK
    const rAdminPending = await fetch(`${baseUrl}/${placeFId}`, {
      headers: { Cookie: `admin_access=${adminToken}` },
    });
    assert(rAdminPending.status === 200, '2.3c Admin xem quán PENDING nhận HTTP 200 OK');


    // =========================================================================
    // 🏛️ SUITE 3: THÔNG TIN CHUNG ĐẦY ĐỦ (YÊU CẦU 3)
    // =========================================================================
    console.log('\n--- 🏛️ SUITE 3: THÔNG TIN CHUNG (ẢNH, TỌA ĐỘ, MÔ TẢ, ĐỊA CHỈ, RATING) ---');

    const rPlaceA = await fetch(`${baseUrl}/${placeAId}`);
    const jPlaceA = await rPlaceA.json();
    assert(rPlaceA.status === 200, '3.1 GET /api/places/:id trả về HTTP 200 OK');

    const dataA = jPlaceA.data;
    assert(dataA.name === 'Nhà Hàng Biển Mỹ Khê Step6', '3.1 Tên địa điểm chính xác');
    assert(dataA.address === '120 Võ Nguyên Giáp', '3.1 Địa chỉ chính xác');
    assert(dataA.district_name !== null, '3.1 Trả về tên quận/huyện');
    assert(dataA.latitude === 16.0601 && dataA.longitude === 108.2435, '3.1 Tọa độ GPS (latitude, longitude) chính xác');
    assert(dataA.phone === '02363999888', '3.1 Số điện thoại chính xác');
    assert(dataA.website === 'https://mykheseafood.vn', '3.1 Website chính xác');
    assert(dataA.booking_url === 'https://dananggo.vn/book/mykhe', '3.1 URL đặt bàn chính xác');
    assert(dataA.avg_rating === 4.8, '3.1 Điểm đánh giá avg_rating chính xác');
    assert(dataA.review_count === 150, '3.1 Số lượt đánh giá review_count chính xác');

    // Danh sách ảnh (images)
    assert(Array.isArray(dataA.images) && dataA.images.length === 3, '3.2 Trả về danh sách ảnh images (3 ảnh)');
    assert(dataA.images[0].is_cover === true, '3.2 Ảnh cover được ưu tiên đứng đầu');
    assert(dataA.cover_image === 'https://images.unsplash.com/photo-cover.jpg', '3.2 cover_image chuẩn xác');

    // Lịch mở cửa (opening_hours)
    assert(Array.isArray(dataA.opening_hours) && dataA.opening_hours.length > 0, '3.3 Trả về danh sách lịch mở cửa opening_hours');


    // =========================================================================
    // 🍜 SUITE 4: DỮ LIỆU NHÀ HÀNG - MENU ITEMS KÈM TASTES (YÊU CẦU 4A)
    // =========================================================================
    console.log('\n--- 🍜 SUITE 4: DỮ LIỆU NHÀ HÀNG - THỰC ĐƠN & KHẨU VỊ (YÊU CẦU 4A) ---');

    assert(dataA.place_type === 'RESTAURANT', '4.1 place_type là RESTAURANT');
    assert(dataA.price_min === 50000 && dataA.price_max === 250000, '4.1 Khoảng giá price_min/price_max chính xác');
    assert(Array.isArray(dataA.menu_items), '4.2 Trả về mảng menu_items');

    // Chỉ lấy món đang bán (is_available = 1) -> 2 món, món thứ 3 bị ẩn
    assert(dataA.menu_items.length === 2, '4.2 Chỉ trả về món đang bán (2/3 món, loại trừ món bị ẩn is_available=0)');

    const crabItem = dataA.menu_items.find((m: any) => m.name === 'Cua Huỳnh Đế Hấp Sả');
    assert(Boolean(crabItem), '4.3 Món Cua Huỳnh Đế Hấp Sả có mặt trong thực đơn');
    assert(crabItem.price === 250000, '4.3 Giá món ăn chính xác (250,000đ)');
    assert(crabItem.is_available === true, '4.3 is_available là true');
    assert(Array.isArray(crabItem.tastes) && crabItem.tastes.length === 2, '4.4 Món ăn kèm danh sách 2 khẩu vị tastes');
    assert(crabItem.tastes.some((t: any) => t.taste_id === 1), '4.4 Có khẩu vị taste_id = 1');
    assert(crabItem.tastes.some((t: any) => t.taste_id === 2), '4.4 Có khẩu vị taste_id = 2');

    const hiddenItem = dataA.menu_items.find((m: any) => m.name === 'Món Đã Ngừng Phục Vụ');
    assert(!hiddenItem, '4.5 Món bị ẩn (is_available=0) tuyệt đối không xuất hiện');


    // =========================================================================
    // 🏖️ SUITE 5: DỮ LIỆU ĐIỂM DU LỊCH (ATTRACTION - YÊU CẦU 4B)
    // =========================================================================
    console.log('\n--- 🏖️ SUITE 5: DỮ LIỆU ĐIỂM DU LỊCH - GIÁ VÉ & THỜI LƯỢNG (YÊU CẦU 4B) ---');

    const rPlaceB = await fetch(`${baseUrl}/${placeBId}`);
    const jPlaceB = await rPlaceB.json();
    assert(rPlaceB.status === 200, '5.1 Lấy chi tiết điểm du lịch thành công (200 OK)');

    const dataB = jPlaceB.data;
    assert(dataB.place_type === 'ATTRACTION', '5.1 place_type là ATTRACTION');
    assert(dataB.ticket_price === 60000, '5.2 Giá vé tham quan ticket_price chính xác (60,000đ)');
    assert(dataB.visit_duration_minutes === 90, '5.3 Thời lượng tham quan visit_duration_minutes chính xác (90 phút)');
    assert(dataB.category_name !== null, '5.4 Danh mục điểm du lịch category_name được trả về đầy đủ');


    // =========================================================================
    // 🏨 SUITE 6: DỮ LIỆU LƯU TRÚ (ACCOMMODATION - YÊU CẦU 4C)
    // =========================================================================
    console.log('\n--- 🏨 SUITE 6: DỮ LIỆU LƯU TRÚ - PHÒNG & TIỆN NGHI (YÊU CẦU 4C) ---');

    const rPlaceC = await fetch(`${baseUrl}/${placeCId}`);
    const jPlaceC = await rPlaceC.json();
    assert(rPlaceC.status === 200, '6.1 Lấy chi tiết cơ sở lưu trú thành công (200 OK)');

    const dataC = jPlaceC.data;
    assert(dataC.place_type === 'ACCOMMODATION', '6.1 place_type là ACCOMMODATION');
    assert(dataC.accommodation_type === 'HOTEL', '6.2 Loại hình lưu trú là HOTEL');
    assert(dataC.star_rating === 4, '6.2 Xếp hạng 4 sao chính xác');
    assert(dataC.check_in_time === '14:00', '6.2 Giờ nhận phòng check_in_time chính xác');
    assert(dataC.check_out_time === '12:00', '6.2 Giờ trả phòng check_out_time chính xác');
    assert(dataC.accepts_cash === true && dataC.accepts_bank_transfer === true, '6.2 Phương thức thanh toán chuẩn xác');

    // Danh sách loại phòng
    assert(Array.isArray(dataC.room_types), '6.3 Trả về mảng room_types');
    assert(dataC.room_types.length === 2, '6.3 Chỉ trả về 2 phòng ACTIVE (loại trừ phòng HIDDEN)');
    assert(dataC.room_types[0].price_per_night === 850000, '6.3 Giá phòng/đêm chính xác');



    // =========================================================================
    // ⏰ SUITE 7: TÍNH isOpenNow THEO GIỜ VIỆT NAM (UTC+7 - YÊU CẦU 5)
    // =========================================================================
    console.log('\n--- ⏰ SUITE 7: TÍNH TRẠNG THÁI MỞ CỬA THEO GIỜ VIỆT NAM (YÊU CẦU 5) ---');

    // 7.1 Kiểm tra hàm getVietnamTime
    const currentVn = getVietnamTime();
    assert(currentVn.dayOfWeek >= 1 && currentVn.dayOfWeek <= 7, '7.1 getVietnamTime trả về thứ hợp lệ (1..7)');
    assert(/^\d{2}:\d{2}:\d{2}$/.test(currentVn.currentTimeString), '7.1 getVietnamTime trả về chuỗi giờ HH:mm:ss chuẩn xác');

    // 7.2 Quán A mở 00:00 - 23:59 hôm nay -> isOpenNow phải là true
    assert(dataA.isOpenNow === true, '7.2 Quán mở 00:00 - 23:59 hôm nay trả về isOpenNow === true');
    assert(dataA.today_hours !== null && dataA.today_hours.includes('00:00'), '7.3 today_hours phản ánh khung giờ hôm nay');

    // 7.4 Kiểm tra ca mở xuyên đêm (ví dụ 20:00 đến 04:00 sáng)
    const nightShiftHours = [
      { opening_id: 1, place_id: 999, day_of_week: 3, open_time: '20:00', close_time: '04:00' },
    ];
    // Lúc 23:30 tối
    const isNightOpen = calculateIsOpenNow(nightShiftHours as any, { dayOfWeek: 3, currentTimeString: '23:30:00' });
    assert(isNightOpen === true, '7.4 Ca mở xuyên đêm: lúc 23:30 tối nhận diện isOpenNow === true');
    // Lúc 02:00 sáng hôm sau (thứ 4)
    const isLateOpen = calculateIsOpenNow(nightShiftHours as any, { dayOfWeek: 4, currentTimeString: '02:00:00' });
    assert(isLateOpen === true, '7.4 Ca mở xuyên đêm: lúc 02:00 sáng hôm sau nhận diện isOpenNow === true');
    // Lúc 10:00 sáng (ngoài ca)
    const isClosed = calculateIsOpenNow(nightShiftHours as any, { dayOfWeek: 3, currentTimeString: '10:00:00' });
    assert(isClosed === false, '7.4 Ngoài ca mở cửa nhận diện isOpenNow === false');


    // =========================================================================
    // 👁️ SUITE 8: TĂNG VIEW COUNT TỰ ĐỘNG (FIRE-AND-FORGET - YÊU CẦU 6)
    // =========================================================================
    console.log('\n--- 👁️ SUITE 8: TĂNG VIEW COUNT TỰ ĐỘNG (FIRE-AND-FORGET - YÊU CẦU 6) ---');

    const initialViewCount = dataA.view_count;
    // Chờ 150ms để fire-and-forget update chạy xong
    await new Promise((r) => setTimeout(r, 200));

    // Gọi lần 2
    const rPlaceA2 = await fetch(`${baseUrl}/${placeAId}`);
    const jPlaceA2 = await rPlaceA2.json();
    assert(rPlaceA2.status === 200, '8.1 Gọi lại API xem chi tiết thành công');
    assert(jPlaceA2.data?.view_count >= initialViewCount + 1, '8.2 view_count tự động tăng sau mỗi lần xem chi tiết');

    // Gọi lần 3
    await new Promise((r) => setTimeout(r, 200));
    const rPlaceA3 = await fetch(`${baseUrl}/${placeAId}`);
    const jPlaceA3 = await rPlaceA3.json();
    assert(jPlaceA3.data?.view_count >= initialViewCount + 2, '8.3 view_count tiếp tục tăng đều đặn');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH KIỂM THỬ TASK 6: ${passedTests}/${totalTests} ca kiểm thử PASSED (100%)`);
    console.log('========================================================================\n');
  } finally {
    // ─── Dọn dẹp sạch dữ liệu test trong database ─────────────────────────────
    console.log('🧹 Đang dọn dẹp dữ liệu kiểm thử Task 6 trong Database...');
    for (const pid of createdPlaceIds) {
      await pool.request().query(`
        DELETE FROM menu_item_tastes WHERE menu_item_id IN (SELECT menu_item_id FROM menu_items WHERE place_id = ${pid});
        DELETE FROM menu_items WHERE place_id = ${pid};
        DELETE FROM place_images WHERE place_id = ${pid};
        DELETE FROM opening_hours WHERE place_id = ${pid};
        DELETE FROM restaurants WHERE place_id = ${pid};
        DELETE FROM attractions WHERE place_id = ${pid};
        DELETE FROM room_types WHERE place_id = ${pid};
        DELETE FROM accommodation_amenities WHERE place_id = ${pid};
        DELETE FROM accommodations WHERE place_id = ${pid};
        DELETE FROM places WHERE place_id = ${pid};
      `).catch(() => {});
    }

    for (const partnerId of createdPartnerIds) {
      await pool.request().query(`DELETE FROM partner_profiles WHERE partner_id = ${partnerId}`).catch(() => {});
    }

    for (const uid of createdUserIds) {
      await pool.request().query(`DELETE FROM users WHERE user_id = ${uid}`).catch(() => {});
    }

    server.close();
    await closeDB();
    console.log('✅ Đã dọn dẹp toàn bộ dữ liệu test Task 6 an toàn!');
  }
}

runStep6ComprehensiveVerification().catch((err) => {
  console.error('❌ Lỗi kiểm thử Step 6:', err);
  process.exit(1);
});
