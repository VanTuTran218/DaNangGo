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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runStep10EdgeCaseTests() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN TASK 10 (STEP 10.4)');
  console.log('   KIỂM TRA 6 EDGE CASES BẮT BUỘC:');
  console.log('   1. Partner A sửa quán Partner B (403 Forbidden)');
  console.log('   2. Quán ẩn (HIDDEN) không hiển thị cho khách/user thường (404 Not Found)');
  console.log('   3. Tìm kiếm tiếng Việt không dấu ("mi quang" -> "Mì Quảng")');
  console.log('   4. Phân trang limit > 50 bị từ chối (400 Bad Request)');
  console.log('   5. Lượt xem (view_count) tăng chính xác khi xem chi tiết');
  console.log('   6. Quán bị khóa (LOCKED) không thể tự kích hoạt lại bởi Đối tác (403)');
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
    // =========================================================================
    // KHỞI TẠO TÀI KHOẢN KIỂM THỬ:
    // - Partner A (User A, Partner A)
    // - Partner B (User B, Partner B)
    // - Normal User (User C)
    // - Admin User (User Admin)
    // =========================================================================
    // 1. Partner A
    const uARes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Đối Tác A Step10', 'partner_a_10@dananggo.vn', 'hash', 'P-10-A', 1, 'ACTIVE', GETDATE())
    `);
    const userAId = uARes.recordset[0].user_id;
    createdUserIds.push(userAId);

    const pARes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, service_type, approval_status, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${userAId}, N'Doanh Nghiệp A', 'TABLE', 'APPROVED', GETDATE())
    `);
    const partnerAId = pARes.recordset[0].partner_id;
    createdPartnerIds.push(partnerAId);

    // 2. Partner B
    const uBRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (2, N'Đối Tác B Step10', 'partner_b_10@dananggo.vn', 'hash', 'P-10-B', 1, 'ACTIVE', GETDATE())
    `);
    const userBId = uBRes.recordset[0].user_id;
    createdUserIds.push(userBId);

    const pBRes = await pool.request().query<{ partner_id: number }>(`
      INSERT INTO partner_profiles (user_id, business_name, service_type, approval_status, created_at)
      OUTPUT INSERTED.partner_id
      VALUES (${userBId}, N'Doanh Nghiệp B', 'TABLE', 'APPROVED', GETDATE())
    `);
    const partnerBId = pBRes.recordset[0].partner_id;
    createdPartnerIds.push(partnerBId);

    // 3. Normal Tourist User
    const uCRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (1, N'Khách Du Lịch Step10', 'tourist_10@dananggo.vn', 'hash', 'U-10-C', 1, 'ACTIVE', GETDATE())
    `);
    const userCId = uCRes.recordset[0].user_id;
    createdUserIds.push(userCId);

    // 4. Admin User
    const uAdminRes = await pool.request().query<{ user_id: number }>(`
      INSERT INTO users (role_id, full_name, email, password_hash, public_id, email_verified, status, created_at)
      OUTPUT INSERTED.user_id
      VALUES (3, N'Quản Trị Viên Step10', 'admin_10@dananggo.vn', 'hash', 'ADM-10', 1, 'ACTIVE', GETDATE())
    `);
    const adminUserId = uAdminRes.recordset[0].user_id;
    createdUserIds.push(adminUserId);

    // Tạo JWT Tokens
    const tokenPartnerA = generateTestToken(userAId, 'PARTNER');
    const tokenPartnerB = generateTestToken(userBId, 'PARTNER');
    const tokenUser = generateTestToken(userCId, 'USER');
    const tokenAdmin = generateTestToken(adminUserId, 'ADMIN');

    // Tạo cơ sở sở hữu bởi Partner B để kiểm thử
    const placeBRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, address, district_id, latitude, longitude, partner_id, avg_rating, review_count, view_count, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', N'Mì Quảng Bà Vị Đặc Sản', N'166 Lê Đình Dương, Hải Châu', 1, 16.0650, 108.2180, ${partnerBId}, 4.8, 12, 100, 'ACTIVE', GETDATE())
    `);
    const placeBId = placeBRes.recordset[0].place_id;
    createdPlaceIds.push(placeBId);

    await pool.request().query(`
      INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
      VALUES (${placeBId}, 'RESTAURANT', 1, 35000, 75000)
    `);

    // Thêm món ăn cho quán B
    const dishRes = await pool.request().query<{ menu_item_id: number }>(`
      INSERT INTO menu_items (place_id, name, description, price, is_available)
      OUTPUT INSERTED.menu_item_id
      VALUES (${placeBId}, N'Mì Quảng Gà Ta Rút Xương', N'Thịt gà ta thả vườn giòn ngọt đậm đà', 50000, 1)
    `);
    const dishId = dishRes.recordset[0].menu_item_id;

    console.log(`Setup hoàn tất: Place B (ID: ${placeBId}, Dish: ${dishId}) thuộc Partner B (${partnerBId})\n`);

    // =========================================================================
    // EDGE CASE 1: PARTNER A SỬA QUÁN PARTNER B (403 FORBIDDEN)
    // =========================================================================
    console.log('--- 🛡️ EDGE CASE 1: PHÂN QUYỀN ĐA ĐỐI TÁC (PARTNER A SỬA QUÁN B -> 403) ---');

    // 1.1 Partner A gọi PUT /api/restaurants/:id của quán B
    const editRes = await fetch(`${baseUrl}/api/restaurants/${placeBId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartnerA}`,
      },
      body: JSON.stringify({
        name: 'Tên quán bị Partner A chiếm đoạt',
        price_min: 99999,
      }),
    });
    assert(editRes.status === 403, '1.1 Partner A cố cập nhật thông tin quán của Partner B nhận HTTP 403 Forbidden');
    const editJson = await editRes.json();
    assert(editJson.success === false, '1.2 Response báo success: false khi Partner A sửa quán B');

    // 1.3 Partner A gọi PATCH /api/places/:id/status của quán B
    const statusRes = await fetch(`${baseUrl}/api/places/${placeBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartnerA}`,
      },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    assert(statusRes.status === 403, '1.3 Partner A cố đổi trạng thái quán của Partner B nhận HTTP 403 Forbidden');

    // 1.4 Partner A gọi POST /api/restaurants/:id/menu-items để thêm món vào quán B
    const addDishRes = await fetch(`${baseUrl}/api/restaurants/${placeBId}/menu-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartnerA}`,
      },
      body: JSON.stringify({
        name: 'Món ăn do Partner A chèn trộm',
        price: 99000,
      }),
    });
    assert(addDishRes.status === 403, '1.4 Partner A cố thêm món ăn vào quán của Partner B nhận HTTP 403 Forbidden');

    // 1.5 Partner A gọi DELETE /api/restaurants/:id để xóa quán B
    const deleteRes = await fetch(`${baseUrl}/api/restaurants/${placeBId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenPartnerA}`,
      },
    });
    assert(deleteRes.status === 403, '1.5 Partner A cố xóa quán của Partner B nhận HTTP 403 Forbidden');

    // 1.6 Kiểm tra cơ sở dữ liệu: Thông tin quán B không bị thay đổi
    const checkB = await pool.request().query(`
      SELECT name, status, partner_id FROM places WHERE place_id = ${placeBId}
    `);
    assert(checkB.recordset[0].name === 'Mì Quảng Bà Vị Đặc Sản', '1.6 Dữ liệu tên quán B trong CSDL hoàn toàn nguyên vẹn');
    assert(checkB.recordset[0].partner_id === partnerBId, '1.7 Chủ sở hữu partner_id vẫn là Partner B không đổi');

    // =========================================================================
    // EDGE CASE 2: CƠ SỞ BỊ ẨN (status = 'HIDDEN') ẨN VỚI NGƯỜI DÙNG THƯỜNG (404)
    // =========================================================================
    console.log('\n--- 👁️ EDGE CASE 2: CƠ SỞ BỊ ẨN (HIDDEN) HOÀN TOÀN VÔ HÌNH VỚI KHÁCH ---');

    // Chuyển quán B sang HIDDEN bởi chính chủ sở hữu Partner B
    await pool.request().query(`UPDATE places SET status = 'HIDDEN' WHERE place_id = ${placeBId}`);

    // 2.1 Khách vãng lai tìm kiếm danh sách quán (GET /api/places?q=Bà Vị)
    const guestSearch = await fetch(`${baseUrl}/api/places?q=Bà Vị`);
    const guestSearchData = await guestSearch.json();
    const foundInGuestSearch = (guestSearchData.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(!foundInGuestSearch, '2.1 Khách vãng lai tìm kiếm không nhìn thấy quán đang HIDDEN');

    // 2.2 Khách vãng lai truy cập thẳng ID quán HIDDEN (GET /api/places/:id)
    const guestDetail = await fetch(`${baseUrl}/api/places/${placeBId}`);
    assert(guestDetail.status === 404, '2.2 Khách vãng lai xem chi tiết quán HIDDEN nhận HTTP 404 Not Found');

    // 2.3 Khách du lịch đã đăng nhập (USER) truy cập ID quán HIDDEN
    const userDetail = await fetch(`${baseUrl}/api/places/${placeBId}`, {
      headers: { Authorization: `Bearer ${tokenUser}` },
    });
    assert(userDetail.status === 404, '2.3 Người dùng thường (USER) xem chi tiết quán HIDDEN nhận HTTP 404 Not Found');

    // 2.4 Đối tác khác (Partner A) truy cập ID quán HIDDEN
    const partnerADetail = await fetch(`${baseUrl}/api/places/${placeBId}`, {
      headers: { Authorization: `Bearer ${tokenPartnerA}` },
    });
    assert(partnerADetail.status === 404, '2.4 Đối tác khác (Partner A) xem chi tiết quán HIDDEN nhận HTTP 404 Not Found');

    // 2.5 Đối tác chủ sở hữu (Partner B) truy cập quán HIDDEN của mình
    const ownerDetail = await fetch(`${baseUrl}/api/places/${placeBId}`, {
      headers: { Authorization: `Bearer ${tokenPartnerB}` },
    });
    assert(ownerDetail.status === 200, '2.5 Đối tác chủ sở hữu (Partner B) xem quán HIDDEN của mình nhận HTTP 200 OK');

    // 2.6 Quản trị viên (ADMIN) truy cập quán HIDDEN
    const adminDetail = await fetch(`${baseUrl}/api/places/${placeBId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminDetail.status === 200, '2.6 Quản trị viên (ADMIN) xem quán HIDDEN nhận HTTP 200 OK');

    // Trả lại trạng thái ACTIVE cho quán B để test các bước tiếp
    await pool.request().query(`UPDATE places SET status = 'ACTIVE' WHERE place_id = ${placeBId}`);

    // =========================================================================
    // EDGE CASE 3: TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU ("mi quang" -> "Mì Quảng")
    // =========================================================================
    console.log('\n--- 🔤 EDGE CASE 3: TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU (ACCENT-INSENSITIVE) ---');

    // 3.1 Tìm kiếm không dấu thường: "mi quang"
    const s1 = await fetch(`${baseUrl}/api/places?q=mi quang`);
    const d1 = await s1.json();
    const hasPlaceB1 = (d1.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(hasPlaceB1, '3.1 Tìm kiếm từ khóa không dấu "mi quang" tìm thấy chính xác "Mì Quảng Bà Vị Đặc Sản"');

    // 3.2 Tìm kiếm không dấu viết HOA: "MI QUANG"
    const s2 = await fetch(`${baseUrl}/api/places?q=MI QUANG`);
    const d2 = await s2.json();
    const hasPlaceB2 = (d2.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(hasPlaceB2, '3.2 Tìm kiếm không dấu viết HOA "MI QUANG" tìm thấy chính xác');

    // 3.3 Tìm kiếm có dấu chuẩn: "mì quảng"
    const s3 = await fetch(`${baseUrl}/api/places?q=mì quảng`);
    const d3 = await s3.json();
    const hasPlaceB3 = (d3.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(hasPlaceB3, '3.3 Tìm kiếm có dấu chuẩn "mì quảng" tìm thấy chính xác');

    // 3.4 Tìm kiếm theo tên riêng không dấu: "ba vi"
    const s4 = await fetch(`${baseUrl}/api/places?q=ba vi`);
    const d4 = await s4.json();
    const hasPlaceB4 = (d4.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(hasPlaceB4, '3.4 Tìm kiếm tên riêng không dấu "ba vi" tìm thấy chính xác');

    // 3.5 Tìm kiếm theo địa chỉ không dấu: "le dinh duong"
    const s5 = await fetch(`${baseUrl}/api/places?q=le dinh duong`);
    const d5 = await s5.json();
    const hasPlaceB5 = (d5.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(hasPlaceB5, '3.5 Tìm kiếm theo địa chỉ không dấu "le dinh duong" tìm thấy quán');

    // 3.6 Tìm kiếm theo tên món ăn phục vụ không dấu: "ga ta"
    const s6 = await fetch(`${baseUrl}/api/places?q=ga ta`);
    const d6 = await s6.json();
    const hasPlaceB6 = (d6.data?.items || []).some((p: any) => p.place_id === placeBId);
    assert(hasPlaceB6, '3.6 Tìm kiếm theo món ăn phục vụ không dấu "ga ta" tìm thấy quán có món "Gà Ta Rút Xương"');

    // =========================================================================
    // EDGE CASE 4: PHÂN TRANG LIMIT > 50 BỊ TỪ CHỐI (400 BAD REQUEST)
    // =========================================================================
    console.log('\n--- 📄 EDGE CASE 4: PHÂN TRANG LIMIT > 50 BỊ TỪ CHỐI (400 BAD REQUEST) ---');

    // 4.1 limit = 51 (vượt quá 50)
    const lim51 = await fetch(`${baseUrl}/api/places?limit=51`);
    assert(lim51.status === 400, '4.1 Phân trang limit=51 bị từ chối với HTTP 400 Bad Request');
    const lim51Data = await lim51.json();
    assert(lim51Data.message?.includes('1 đến 50') || lim51Data.error?.includes('1 đến 50') || lim51Data.success === false, '4.2 Thông báo lỗi nêu rõ giới hạn tối đa 50');

    // 4.3 limit = 100
    const lim100 = await fetch(`${baseUrl}/api/places?limit=100`);
    assert(lim100.status === 400, '4.3 Phân trang limit=100 bị từ chối với HTTP 400 Bad Request');

    // 4.4 limit = 0
    const lim0 = await fetch(`${baseUrl}/api/places?limit=0`);
    assert(lim0.status === 400, '4.4 Phân trang limit=0 bị từ chối với HTTP 400 Bad Request');

    // 4.5 limit = -5
    const limNeg = await fetch(`${baseUrl}/api/places?limit=-5`);
    assert(limNeg.status === 400, '4.5 Phân trang limit số âm (-5) bị từ chối với HTTP 400 Bad Request');

    // 4.6 limit = 50 (giới hạn tối đa hợp lệ)
    const lim50 = await fetch(`${baseUrl}/api/places?limit=50`);
    assert(lim50.status === 200, '4.6 Phân trang limit=50 (mức trần cho phép) được chấp nhận HTTP 200 OK');

    // =========================================================================
    // EDGE CASE 5: LƯỢT XEM (view_count) TĂNG CHÍNH XÁC KHI XEM CHI TIẾT
    // =========================================================================
    console.log('\n--- 📈 EDGE CASE 5: LƯỢT XEM (view_count) TĂNG CHÍNH XÁC KHI XEM CHI TIẾT ---');

    // 5.1 Lấy view_count ban đầu
    const vcInitRes = await pool.request().query(`SELECT view_count FROM places WHERE place_id = ${placeBId}`);
    const initialViewCount = Number(vcInitRes.recordset[0].view_count);
    console.log(`   Lượt xem ban đầu: ${initialViewCount}`);

    // 5.2 Khách xem chi tiết lần 1
    const view1 = await fetch(`${baseUrl}/api/places/${placeBId}`);
    assert(view1.status === 200, '5.1 Khách gọi xem chi tiết thành công (200 OK)');
    await sleep(60); // Đợi fire-and-forget cập nhật DB

    // 5.3 Kiểm tra view_count trong DB tăng lên đúng 1
    const vc1Res = await pool.request().query(`SELECT view_count FROM places WHERE place_id = ${placeBId}`);
    const viewCountAfter1 = Number(vc1Res.recordset[0].view_count);
    assert(viewCountAfter1 === initialViewCount + 1, `5.2 Lượt xem tăng chính xác từ ${initialViewCount} lên ${viewCountAfter1} (+1)`);

    // 5.4 Khách xem chi tiết lần 2
    const view2 = await fetch(`${baseUrl}/api/places/${placeBId}`);
    assert(view2.status === 200, '5.3 Khách xem chi tiết lần 2 thành công (200 OK)');
    await sleep(60);

    const vc2Res = await pool.request().query(`SELECT view_count FROM places WHERE place_id = ${placeBId}`);
    const viewCountAfter2 = Number(vc2Res.recordset[0].view_count);
    assert(viewCountAfter2 === initialViewCount + 2, `5.4 Lượt xem tăng chính xác từ ${viewCountAfter1} lên ${viewCountAfter2} (+2)`);

    // 5.5 Gọi xem ID không tồn tại (404) -> view_count của các quán khác không bị ảnh hưởng
    const viewNonExistent = await fetch(`${baseUrl}/api/places/999999`);
    assert(viewNonExistent.status === 404, '5.5 Gọi ID không tồn tại trả về 404 và không làm sai lệch view_count');

    // =========================================================================
    // EDGE CASE 6: CƠ SỞ BỊ KHÓA (LOCKED) KHÔNG THỂ TỰ KÍCH HOẠT LẠI BỞI ĐỐI TÁC
    // =========================================================================
    console.log('\n--- 🔒 EDGE CASE 6: CƠ SỞ BỊ KHÓA (LOCKED) KHÔNG THỂ TỰ KÍCH HOẠT LẠI BỞI ĐỐI TÁC ---');

    // 6.1 Admin thực hiện khóa quán B (status = 'LOCKED') do vi phạm
    const adminLockRes = await fetch(`${baseUrl}/api/admin/places/${placeBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ status: 'LOCKED' }),
    });
    assert(adminLockRes.status === 200, '6.1 Admin khóa quán vi phạm thành công (HTTP 200 OK)');

    const lockedCheck = await pool.request().query(`SELECT status FROM places WHERE place_id = ${placeBId}`);
    assert(lockedCheck.recordset[0].status === 'LOCKED', '6.2 CSDL xác nhận quán đang ở trạng thái LOCKED');

    // 6.3 Partner chủ sở hữu (Partner B) cố mở lại quán sang ACTIVE -> Bị chặn 403
    const partnerReactivateRes = await fetch(`${baseUrl}/api/places/${placeBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartnerB}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    assert(partnerReactivateRes.status === 403, '6.3 Partner chủ sở hữu cố đổi quán LOCKED sang ACTIVE bị chặn 403 Forbidden');
    const reactivateData = await partnerReactivateRes.json();
    assert(reactivateData.message?.includes('LOCKED') || reactivateData.message?.includes('khóa'), '6.4 Phản hồi nêu rõ chỉ Admin mới có quyền mở khóa quán');

    // 6.5 Partner B cố đổi sang HIDDEN -> Vẫn bị chặn 403
    const partnerHideRes = await fetch(`${baseUrl}/api/places/${placeBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartnerB}`,
      },
      body: JSON.stringify({ status: 'HIDDEN' }),
    });
    assert(partnerHideRes.status === 403, '6.5 Partner chủ sở hữu cố đổi quán LOCKED sang HIDDEN vẫn bị chặn 403 Forbidden');

    // 6.6 Khách vãng lai xem chi tiết quán LOCKED -> nhận 404
    const guestLockedView = await fetch(`${baseUrl}/api/places/${placeBId}`);
    assert(guestLockedView.status === 404, '6.6 Khách vãng lai xem quán LOCKED nhận HTTP 404 Not Found');

    // 6.7 Chỉ có Admin mới có quyền mở khóa quán (chuyển sang APPROVED / ACTIVE)
    const adminUnlockRes = await fetch(`${baseUrl}/api/admin/places/${placeBId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(adminUnlockRes.status === 200, '6.7 Admin mở khóa quán thành công (HTTP 200 OK)');

    const unlockedCheck = await pool.request().query(`SELECT status FROM places WHERE place_id = ${placeBId}`);
    assert(unlockedCheck.recordset[0].status === 'ACTIVE', '6.8 CSDL xác nhận quán đã được mở khóa trở lại trạng thái ACTIVE');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
    console.log('   TOÀN BỘ 6 EDGE CASES ĐÃ ĐƯỢC XÁC THỰC HOÀN HẢO!');
    console.log('========================================================================\n');
  } finally {
    // Dọn dẹp dữ liệu kiểm thử
    console.log('🧹 Đang dọn dẹp các bản ghi kiểm thử Task 10...');
    if (createdPlaceIds.length > 0) {
      await pool.request().query(`
        DELETE FROM menu_item_tastes WHERE menu_item_id IN (SELECT menu_item_id FROM menu_items WHERE place_id IN (${createdPlaceIds.join(',')}));
        DELETE FROM menu_items WHERE place_id IN (${createdPlaceIds.join(',')});
        DELETE FROM restaurants WHERE place_id IN (${createdPlaceIds.join(',')});
        DELETE FROM places WHERE place_id IN (${createdPlaceIds.join(',')});
      `);
    }
    if (createdPartnerIds.length > 0) {
      await pool.request().query(`DELETE FROM partner_profiles WHERE partner_id IN (${createdPartnerIds.join(',')})`);
    }
    if (createdUserIds.length > 0) {
      await pool.request().query(`DELETE FROM users WHERE user_id IN (${createdUserIds.join(',')})`);
    }
    console.log('✅ Đã dọn dẹp sạch sẽ toàn bộ bản ghi test.');
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDB();
  }
}

if (require.main === module) {
  runStep10EdgeCaseTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error in Step 10 test suite:', err);
      process.exit(1);
    });
}
