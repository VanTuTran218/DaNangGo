import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import express from 'express';
import cookieParser from 'cookie-parser';
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

async function runStep5ComprehensiveVerification() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TASK 5: TÌM KIẾM & LỌC CHUNG (/api/places)');
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

  // Danh sách ID cần dọn dẹp
  const createdPlaceIds: number[] = [];
  const createdUserIds: number[] = [];
  const createdPartnerIds: number[] = [];

  // Dựng Express test server
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
    // ─── Chuẩn bị tài khoản và Partner ───────────────────────────────────────
    // 1. Admin
    const adminRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, 'Admin Step5 Test', 'admin_step5@dananggo.vn', '$2b$12$dummyhash', 'ADM-S5-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = adminRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);

    // 2. Partner User & Profile
    const partnerRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner Step5 Test', 'partner_step5@dananggo.vn', '$2b$12$dummyhash', 'PT-S5-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partnerUserId = partnerRes.recordset[0].user_id;
    createdUserIds.push(partnerUserId);

    const partnerProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, approved_at)
      OUTPUT INSERTED.partner_id
      VALUES (${partnerUserId}, 'Đối Tác Step5 Test', '0905999888', 'APPROVED', GETDATE())
    `);
    const partnerId = partnerProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(partnerId);

    // 3. Partner 2 (để test phân quyền chéo)
    const partner2Res = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, 'Partner 2 Step5 Test', 'partner2_step5@dananggo.vn', '$2b$12$dummyhash', 'PT2-S5-TEST', 1, 'ACTIVE', GETDATE())
    `);
    const partner2UserId = partner2Res.recordset[0].user_id;
    createdUserIds.push(partner2UserId);

    const partner2ProfileRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, contact_phone, approval_status, approved_at)
      OUTPUT INSERTED.partner_id
      VALUES (${partner2UserId}, 'Đối Tác 2 Step5 Test', '0905777666', 'APPROVED', GETDATE())
    `);
    const partner2Id = partner2ProfileRes.recordset[0].partner_id;
    createdPartnerIds.push(partner2Id);

    const adminToken = generateTestToken(adminUserId, 'ADMIN');
    const partnerToken = generateTestToken(partnerUserId, 'PARTNER');
    const partner2Token = generateTestToken(partner2UserId, 'PARTNER');

    // ─── Chuẩn bị Dữ liệu Test Mẫu ───────────────────────────────────────────
    // Địa điểm 1: Nhà hàng Hải Sản Có Dấu
    const p1Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Bánh Canh Cua Đồng Cẩm Lệ', N'Quán bánh canh cua đồng truyền thống', N'Đường Ông Ích Đường, Cẩm Lệ', 2, ${partnerId}, 4.8, 120, 50, 'ACTIVE', GETDATE())
    `);
    const place1Id = p1Res.recordset[0].place_id;
    createdPlaceIds.push(place1Id);

    await pool.request().query(`
      INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
      VALUES (${place1Id}, 'RESTAURANT', 1, 30000, 60000)
    `);

    // Thêm món ăn cho Địa điểm 1 để test tìm kiếm theo tên món
    await pool.request().query(`
      INSERT INTO menu_items (place_id, name, price, is_available)
      VALUES (${place1Id}, N'Bánh Canh Ghẹ Tươi Rút Thịt', 55000, 1)
    `);

    // Thêm giờ mở cửa hôm nay cho place1Id để test open_now
    const curDowRes = await pool.request().query<{ dw: number }>('SELECT DATEPART(dw, GETDATE()) as dw');
    const curDow = curDowRes.recordset[0].dw;
    await pool.request().query(`
      INSERT INTO opening_hours (place_id, day_of_week, open_time, close_time)
      VALUES (${place1Id}, ${curDow}, '00:00:00', '23:59:59')
    `);

    // Thêm ảnh cho place1Id
    await pool.request().query(`
      INSERT INTO place_images (place_id, image_url, is_cover)
      VALUES (${place1Id}, 'https://images.unsplash.com/photo-banh-canh.jpg', 1)
    `);

    // Địa điểm 2: Điểm du lịch
    const p2Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', N'Bảo Tàng Mỹ Thuật Đà Nẵng', N'Bảo tàng nghệ thuật hiện đại', N'78 Lê Duẩn, Hải Châu', 1, NULL, 4.2, 85, 30, 'ACTIVE', GETDATE())
    `);
    const place2Id = p2Res.recordset[0].place_id;
    createdPlaceIds.push(place2Id);

    await pool.request().query(`
      INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
      VALUES (${place2Id}, 'ATTRACTION', 1, 20000, 90)
    `);

    // Địa điểm 3: Bị ẩn (HIDDEN)
    const p3Res = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, description, address, district_id, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Quán Trà Sữa Đang Ẩn Test', N'Quán tạm đóng cửa', N'Ngũ Hành Sơn', 4, ${partnerId}, 3.5, 10, 5, 'HIDDEN', GETDATE())
    `);
    const place3Id = p3Res.recordset[0].place_id;
    createdPlaceIds.push(place3Id);

    await pool.request().query(`
      INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
      VALUES (${place3Id}, 'RESTAURANT', 1, 25000, 45000)
    `);


    // =========================================================================
    // KHỐI 1: VALIDATION SCHEMA & XỬ LÝ LỖI ĐẦU VÀO (HTTP 400 BAD REQUEST)
    // =========================================================================
    console.log('--- KHỐI 1: VALIDATION SCHEMA & BẢO VỆ ĐẦU VÀO (HTTP 400) ---');

    // 1.1 Type không nằm trong whitelist
    const v1 = await fetch(`${baseUrl}?type=HOTEL`);
    const j1 = await v1.json();
    assert(v1.status === 400 && j1.message.includes('Loại địa điểm không hợp lệ'), '1.1 Chặn type không nằm trong whitelist');

    // 1.2 Sort không nằm trong whitelist
    const v2 = await fetch(`${baseUrl}?sort=random_sort`);
    const j2 = await v2.json();
    assert(v2.status === 400 && j2.message.includes('Tiêu chí sắp xếp không hợp lệ'), '1.2 Chặn sort không nằm trong whitelist');

    // 1.3 min_price > max_price
    const v3 = await fetch(`${baseUrl}?min_price=500000&max_price=100000`);
    const j3 = await v3.json();
    assert(v3.status === 400 && j3.message.includes('min_price không được lớn hơn max_price'), '1.3 Chặn min_price lớn hơn max_price');

    // 1.4 min_price âm
    const v4 = await fetch(`${baseUrl}?min_price=-5000`);
    const j4 = await v4.json();
    assert(v4.status === 400 && j4.message.includes('min_price phải là số không âm'), '1.4 Chặn min_price là số âm');

    // 1.5 min_rating vượt ngoài [0, 5]
    const v5 = await fetch(`${baseUrl}?min_rating=5.5`);
    const j5 = await v5.json();
    assert(v5.status === 400 && j5.message.includes('min_rating phải là số từ 0.0 đến 5.0'), '1.5 Chặn min_rating vượt quá 5.0');

    // 1.6 limit vượt quá 50
    const v6 = await fetch(`${baseUrl}?limit=100`);
    const j6 = await v6.json();
    assert(v6.status === 400 && j6.message.includes('limit phải là số nguyên từ 1 đến 50'), '1.6 Chặn limit vượt quá 50');

    // 1.7 page <= 0
    const v7 = await fetch(`${baseUrl}?page=0`);
    const j7 = await v7.json();
    assert(v7.status === 400 && j7.message.includes('page phải là số nguyên dương'), '1.7 Chặn page <= 0');

    // 1.8 open_now không hợp lệ
    const v8 = await fetch(`${baseUrl}?open_now=maybe`);
    const j8 = await v8.json();
    assert(v8.status === 400 && j8.message.includes('open_now phải là giá trị boolean'), '1.8 Chặn open_now không phải boolean');

    // 1.9 district_id <= 0
    const v9 = await fetch(`${baseUrl}?district_id=-1`);
    const j9 = await v9.json();
    assert(v9.status === 400 && j9.message.includes('district_id phải là số nguyên dương'), '1.9 Chặn district_id <= 0');

    // 1.10 Keyword q dài quá 200 ký tự
    const longQ = 'a'.repeat(201);
    const v10 = await fetch(`${baseUrl}?q=${longQ}`);
    const j10 = await v10.json();
    assert(v10.status === 400 && j10.message.includes('không được vượt quá 200 ký tự'), '1.10 Chặn từ khóa q dài hơn 200 ký tự');


    // =========================================================================
    // KHỐI 2: TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU (COLLATE Latin1_General_CI_AI)
    // =========================================================================
    console.log('\n--- KHỐI 2: TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU ---');

    // 2.1 Tìm kiếm không dấu: "banh canh cua" -> "Bánh Canh Cua Đồng Cẩm Lệ"
    const s1 = await fetch(`${baseUrl}?q=banh%20canh%20cua`);
    const sj1 = await s1.json();
    assert(s1.status === 200, '2.1 Tìm kiếm không dấu trả về 200 OK');
    const foundP1NoAccent = sj1.data?.items?.some((i: any) => i.place_id === place1Id);
    assert(foundP1NoAccent, '2.1 Tìm không dấu "banh canh cua" khớp chính xác "Bánh Canh Cua Đồng Cẩm Lệ"');

    // 2.2 Tìm kiếm có dấu: "Bánh Canh Cua" -> "Bánh Canh Cua Đồng Cẩm Lệ"
    const s2 = await fetch(`${baseUrl}?q=${encodeURIComponent('Bánh Canh Cua')}`);
    const sj2 = await s2.json();
    const foundP1WithAccent = sj2.data?.items?.some((i: any) => i.place_id === place1Id);
    assert(foundP1WithAccent, '2.2 Tìm có dấu "Bánh Canh Cua" khớp chính xác địa điểm');

    // 2.3 Tìm theo địa chỉ không dấu: "cam le" -> "Cẩm Lệ"
    const s3 = await fetch(`${baseUrl}?q=cam%20le`);
    const sj3 = await s3.json();
    const foundAddress = sj3.data?.items?.some((i: any) => i.place_id === place1Id);
    assert(foundAddress, '2.3 Tìm theo địa chỉ không dấu "cam le" thành công');

    // 2.4 Tìm theo tên món ăn: "ghe tuoi" -> Ra quán bánh canh phục vụ món "Bánh Canh Ghẹ Tươi Rút Thịt"
    const s4 = await fetch(`${baseUrl}?q=ghe%20tuoi`);
    const sj4 = await s4.json();
    const foundByMenuItem = sj4.data?.items?.some((i: any) => i.place_id === place1Id);
    assert(foundByMenuItem, '2.4 Tìm theo tên món ăn đang bán "ghe tuoi" tìm ra đúng quán');


    // =========================================================================
    // KHỐI 3: BỘ LỌC ĐA TIÊU CHÍ (MULTI-CRITERIA FILTERS)
    // =========================================================================
    console.log('\n--- KHỐI 3: BỘ LỌC ĐA TIÊU CHÍ ---');

    // 3.1 Lọc type=RESTAURANT
    const f1 = await fetch(`${baseUrl}?type=RESTAURANT`);
    const fj1 = await f1.json();
    assert(f1.status === 200, '3.1 Lọc type=RESTAURANT trả về 200 OK');
    const allRestaurants = fj1.data?.items?.every((i: any) => i.place_type === 'RESTAURANT');
    assert(allRestaurants && fj1.data?.items?.length > 0, '3.1 Tất cả kết quả trả về đúng loại RESTAURANT');

    // 3.2 Lọc type=ATTRACTION
    const f2 = await fetch(`${baseUrl}?type=ATTRACTION`);
    const fj2 = await f2.json();
    assert(f2.status === 200, '3.2 Lọc type=ATTRACTION trả về 200 OK');
    const allAttractions = fj2.data?.items?.every((i: any) => i.place_type === 'ATTRACTION');
    assert(allAttractions && fj2.data?.items?.length > 0, '3.2 Tất cả kết quả trả về đúng loại ATTRACTION');

    // 3.3 Lọc theo district_id = 2 (Cẩm Lệ)
    const f3 = await fetch(`${baseUrl}?district_id=2`);
    const fj3 = await f3.json();
    const allDistrict2 = fj3.data?.items?.every((i: any) => i.district_id === 2);
    assert(allDistrict2, '3.3 Lọc theo quận/huyện (district_id = 2) chính xác');

    // 3.4 Lọc theo min_rating = 4.5
    const f4 = await fetch(`${baseUrl}?min_rating=4.5`);
    const fj4 = await f4.json();
    const allHighRating = fj4.data?.items?.every((i: any) => i.avg_rating >= 4.5);
    assert(allHighRating && fj4.data?.items?.length > 0, '3.4 Lọc theo đánh giá tối thiểu min_rating >= 4.5 chính xác');

    // 3.5 Lọc theo khoảng giá: min_price = 20000, max_price = 50000
    const f5 = await fetch(`${baseUrl}?min_price=20000&max_price=50000`);
    const fj5 = await f5.json();
    assert(f5.status === 200 && fj5.data?.items?.length > 0, '3.5 Lọc theo khoảng giá min_price/max_price thành công');

    // 3.6 Lọc mở cửa (open_now = true)
    const f6 = await fetch(`${baseUrl}?open_now=true`);
    const fj6 = await f6.json();
    assert(f6.status === 200, '3.6 Lọc open_now=true trả về 200 OK');
    const place1Open = fj6.data?.items?.some((i: any) => i.place_id === place1Id && i.is_open === true);
    assert(place1Open, '3.6 Quán có giờ mở cửa hôm nay hiển thị đúng is_open=true khi lọc open_now=true');


    // =========================================================================
    // KHỐI 4: SẮP XẾP (SORTING) & PHÂN TRANG (PAGINATION)
    // =========================================================================
    console.log('\n--- KHỐI 4: SẮP XẾP & PHÂN TRANG ---');

    // 4.1 Sắp xếp theo giá tăng dần (price_asc)
    const o1 = await fetch(`${baseUrl}?sort=price_asc`);
    const oj1 = await o1.json();
    const pricesAsc = oj1.data?.items?.map((i: any) => i.price_min ?? 0);
    let isPriceAsc = true;
    for (let idx = 0; idx < pricesAsc.length - 1; idx++) {
      if (pricesAsc[idx] > pricesAsc[idx + 1]) {
        isPriceAsc = false;
        break;
      }
    }
    assert(isPriceAsc, '4.1 Sắp xếp price_asc đảm bảo giá tăng dần chuẩn xác');

    // 4.2 Sắp xếp theo đánh giá giảm dần (rating_desc)
    const o2 = await fetch(`${baseUrl}?sort=rating_desc`);
    const oj2 = await o2.json();
    const ratings = oj2.data?.items?.map((i: any) => i.avg_rating);
    let isRatingDesc = true;
    for (let idx = 0; idx < ratings.length - 1; idx++) {
      if (ratings[idx] < ratings[idx + 1]) {
        isRatingDesc = false;
        break;
      }
    }
    assert(isRatingDesc, '4.2 Sắp xếp rating_desc đảm bảo rating giảm dần chuẩn xác');

    // 4.3 Phân trang: page=1, limit=2
    const pPage1 = await fetch(`${baseUrl}?page=1&limit=2`);
    const pjPage1 = await pPage1.json();
    assert(pjPage1.data?.items?.length <= 2, '4.3 Số phần tử trả về tuân thủ đúng limit=2');
    assert(pjPage1.data?.page === 1, '4.3 Trang hiện tại là 1');
    assert(pjPage1.data?.total >= 2, '4.3 Tổng số bản ghi total tính toán đúng');
    assert(pjPage1.data?.total_pages >= 1, '4.3 total_pages tính toán chính xác');

    // 4.4 Phân trang: page=2, limit=2
    const pPage2 = await fetch(`${baseUrl}?page=2&limit=2`);
    const pjPage2 = await pPage2.json();
    assert(pPage2.status === 200 && pjPage2.data?.page === 2, '4.4 Chuyển sang trang page=2 thành công');
    // Đảm bảo không trùng lặp id giữa trang 1 và trang 2
    const p1Ids = pjPage1.data?.items?.map((i: any) => i.place_id);
    const p2Ids = pjPage2.data?.items?.map((i: any) => i.place_id);
    const hasOverlap = p1Ids.some((id: number) => p2Ids.includes(id));
    assert(!hasOverlap, '4.4 Không bị trùng lặp dữ liệu giữa trang 1 và trang 2');


    // =========================================================================
    // KHỐI 5: LẤY CHI TIẾT ĐỊA ĐIỂM & TĂNG VIEW COUNT
    // =========================================================================
    console.log('\n--- KHỐI 5: LẤY CHI TIẾT ĐỊA ĐIỂM & LƯỢT XEM ---');

    // 5.1 GET /api/places/:id trả về 200 OK với đầy đủ ảnh và giờ mở cửa
    const d1 = await fetch(`${baseUrl}/${place1Id}`);
    const dj1 = await d1.json();
    assert(d1.status === 200 && dj1.success === true, '5.1 Lấy chi tiết địa điểm trả về 200 OK');
    assert(dj1.data?.name === 'Bánh Canh Cua Đồng Cẩm Lệ', '5.1 Tên địa điểm trùng khớp');
    assert(Array.isArray(dj1.data?.images) && dj1.data?.images.length > 0, '5.1 Trả về danh sách ảnh (images)');
    assert(Array.isArray(dj1.data?.opening_hours) && dj1.data?.opening_hours.length > 0, '5.1 Trả về lịch mở cửa (opening_hours)');
    assert(dj1.data?.is_open === true, '5.1 Trạng thái is_open được tính toán chính xác');

    // 5.2 Lượt xem view_count tự động tăng sau khi xem chi tiết
    const initialView = dj1.data?.view_count;
    // Chờ 1 chút để fire-and-forget query hoàn tất
    await new Promise((r) => setTimeout(r, 200));
    const d1Again = await fetch(`${baseUrl}/${place1Id}`);
    const dj1Again = await d1Again.json();
    assert(dj1Again.data?.view_count >= initialView + 1, '5.2 Lượt xem (view_count) tự động tăng khi xem chi tiết');

    // 5.3 ID không tồn tại -> 404
    const dNotFound = await fetch(`${baseUrl}/999999`);
    const djNotFound = await dNotFound.json();
    assert(dNotFound.status === 404 && djNotFound.message.includes('Không tìm thấy'), '5.3 ID không tồn tại trả về 404 Not Found');

    // 5.4 ID không hợp lệ -> 400
    const dInvalid = await fetch(`${baseUrl}/invalid_id`);
    const djInvalid = await dInvalid.json();
    assert(dInvalid.status === 400 && djInvalid.message.includes('ID địa điểm không hợp lệ'), '5.4 ID chữ cái trả về 400 Bad Request');


    // =========================================================================
    // KHỐI 6: PHÂN QUYỀN TRẠNG THÁI (ACTIVE, HIDDEN, LOCKED)
    // =========================================================================
    console.log('\n--- KHỐI 6: PHÂN QUYỀN TRẠNG THÁI (ACTIVE, HIDDEN, LOCKED) ---');

    // 6.1 Khách vãng lai xem địa điểm HIDDEN -> Nhận 404 Not Found
    const hGuest = await fetch(`${baseUrl}/${place3Id}`);
    assert(hGuest.status === 404, '6.1 Khách vãng lai xem địa điểm HIDDEN nhận 404 Not Found');

    // 6.2 Admin có cookie xem địa điểm HIDDEN -> Nhận 200 OK
    const hAdmin = await fetch(`${baseUrl}/${place3Id}`, {
      headers: {
        Cookie: `admin_access=${adminToken}`,
      },
    });
    const hjAdmin = await hAdmin.json();
    assert(hAdmin.status === 200 && hjAdmin.data?.status === 'HIDDEN', '6.2 ADMIN có token xem địa điểm HIDDEN nhận 200 OK');

    // 6.3 Khách vãng lai không thấy địa điểm HIDDEN trong danh sách search
    const sHidden = await fetch(`${baseUrl}?q=Tr%C3%A0%20S%E1%BB%AFa%20%C4%90ang%20%E1%BA%A8n`);
    const sjHidden = await sHidden.json();
    const guestFoundHidden = sjHidden.data?.items?.some((i: any) => i.place_id === place3Id);
    assert(!guestFoundHidden, '6.3 Địa điểm HIDDEN bị ẩn hoàn toàn khỏi kết quả tìm kiếm của khách');

    // 6.4 Partner cập nhật trạng thái cơ sở của mình -> Thành công
    const patchPartner = await fetch(`${baseUrl}/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${partnerToken}`,
      },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    const patchJson = await patchPartner.json();
    assert(patchPartner.status === 200 && patchJson.success === true, '6.4 Partner cập nhật trạng thái cơ sở của mình thành HIDDEN thành công');

    // 6.5 Partner 2 cố ý sửa trạng thái cơ sở của Partner 1 -> Bị chặn 403
    const patchOther = await fetch(`${baseUrl}/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${partner2Token}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const patchOtherJson = await patchOther.json();
    assert(patchOther.status === 403, '6.5 Partner không thể sửa trạng thái cơ sở của đối tác khác (HTTP 403)');

    // 6.6 Partner cố ý đổi trạng thái sang LOCKED -> Bị chặn 403 (Chỉ Admin)
    const patchLockedPartner = await fetch(`${baseUrl}/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${partnerToken}`,
      },
      body: JSON.stringify({ status: 'LOCKED' }),
    });
    assert(patchLockedPartner.status === 403, '6.6 Partner không được phép tự ý khóa LOCKED cơ sở (HTTP 403)');

    // 6.7 Admin khóa LOCKED cơ sở -> Thành công
    const patchAdminLock = await fetch(`${baseUrl}/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_access=${adminToken}`,
      },
      body: JSON.stringify({ status: 'LOCKED' }),
    });
    assert(patchAdminLock.status === 200, '6.7 ADMIN khóa cơ sở sang LOCKED thành công');

    // 6.8 Khi cơ sở bị LOCKED, Partner không thể tự mở khóa -> Bị chặn 403
    const patchPartnerUnlock = await fetch(`${baseUrl}/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${partnerToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(patchPartnerUnlock.status === 403, '6.8 Cơ sở đang bị LOCKED, Partner không thể tự mở khóa (HTTP 403)');

    // 6.9 Admin mở khóa cơ sở LOCKED sang ACTIVE -> Thành công
    const patchAdminUnlock = await fetch(`${baseUrl}/${place1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_access=${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(patchAdminUnlock.status === 200, '6.9 ADMIN mở khóa cơ sở LOCKED sang ACTIVE thành công');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH KIỂM THỬ TASK 5: ${passedTests}/${totalTests} ca kiểm thử PASSED (100%)`);
    console.log('========================================================================\n');
  } finally {
    server.close();

    // Dọn dẹp dữ liệu kiểm thử
    console.log('🧹 Đang dọn dẹp dữ liệu kiểm thử trong Database...');
    if (createdPlaceIds.length > 0) {
      const idsStr = createdPlaceIds.join(',');
      await pool.request().query(`DELETE FROM menu_items WHERE place_id IN (${idsStr})`);
      await pool.request().query(`DELETE FROM opening_hours WHERE place_id IN (${idsStr})`);
      await pool.request().query(`DELETE FROM place_images WHERE place_id IN (${idsStr})`);
      await pool.request().query(`DELETE FROM restaurants WHERE place_id IN (${idsStr})`);
      await pool.request().query(`DELETE FROM attractions WHERE place_id IN (${idsStr})`);
      await pool.request().query(`DELETE FROM places WHERE place_id IN (${idsStr})`);
    }
    if (createdPartnerIds.length > 0) {
      await pool.request().query(`DELETE FROM partner_profiles WHERE partner_id IN (${createdPartnerIds.join(',')})`);
    }
    if (createdUserIds.length > 0) {
      await pool.request().query(`DELETE FROM users WHERE user_id IN (${createdUserIds.join(',')})`);
    }

    console.log('✅ Đã dọn dẹp toàn bộ dữ liệu test an toàn!');
    await closeDB();
  }
}

runStep5ComprehensiveVerification().catch((err) => {
  console.error('Lỗi kiểm thử Step 5:', err);
  process.exit(1);
});
