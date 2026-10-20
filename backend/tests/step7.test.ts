import { connectDB, getPool, closeDB, sql } from '../src/config/db';
import { createPlaceCommon, CreatePlaceCommonDto } from '../src/modules/places';

async function runStep7ComprehensiveVerification() {
  await connectDB();
  const pool = getPool();

  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN TASK 7: DATABASE CONSTRAINTS, INDEXES,');
  console.log('   SEED DATA & SHARED HELPER FUNCTION (createPlaceCommon)');
  console.log('========================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

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

  // Khai báo mảng để dọn dẹp các ID test
  const cleanupPlaceIds: number[] = [];

  try {
    // =========================================================================
    // SUITE 1: KIỂM THỬ CÁC RÀNG BUỘC CHECK (CHECK CONSTRAINTS)
    // =========================================================================
    console.log('--- 🔒 SUITE 1: KIỂM THỬ RÀNG BUỘC CHECK (CHẶN GIÁ ÂM & TRẠNG THÁI) ---');

    // 1.1 Tạo địa điểm cha test để thử các ràng buộc bảng con
    const testPlaceRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('RESTAURANT', 'Nhà Hàng Test Constraint Step 7', 'ACTIVE', GETDATE())
    `);
    const testPlaceId = testPlaceRes.recordset[0].place_id;
    cleanupPlaceIds.push(testPlaceId);

    // 1.2 Kiểm tra chk_rest_price: Chặn price_min < 0
    let blockedRestMinPrice = false;
    try {
      await pool.request().query(`
        INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
        VALUES (${testPlaceId}, 'RESTAURANT', 1, -50000, 100000)
      `);
    } catch (err: any) {
      if (err.message.includes('chk_rest_price')) {
        blockedRestMinPrice = true;
      }
    }
    assert(blockedRestMinPrice, '1.1 SQL Server chặn chèn price_min âm (< 0) trên restaurants', 'Ràng buộc chk_rest_price kích hoạt chính xác');

    // 1.3 Kiểm tra chk_rest_price: Chặn price_max < 0
    let blockedRestMaxPrice = false;
    try {
      await pool.request().query(`
        INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
        VALUES (${testPlaceId}, 'RESTAURANT', 1, 0, -10000)
      `);
    } catch (err: any) {
      if (err.message.includes('chk_rest_price')) {
        blockedRestMaxPrice = true;
      }
    }
    assert(blockedRestMaxPrice, '1.2 SQL Server chặn chèn price_max âm (< 0) trên restaurants', 'Ràng buộc chk_rest_price kích hoạt chính xác');

    // 1.4 Kiểm tra chk_rest_price: Chặn price_min > price_max
    let blockedRestMinGreaterThanMax = false;
    try {
      await pool.request().query(`
        INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
        VALUES (${testPlaceId}, 'RESTAURANT', 1, 200000, 50000)
      `);
    } catch (err: any) {
      if (err.message.includes('chk_rest_price')) {
        blockedRestMinGreaterThanMax = true;
      }
    }
    assert(blockedRestMinGreaterThanMax, '1.3 SQL Server chặn price_min > price_max trên restaurants', 'Ràng buộc chk_rest_price kiểm soát logic khoảng giá');

    // Thêm restaurant hợp lệ để test menu_items
    await pool.request().query(`
      INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
      VALUES (${testPlaceId}, 'RESTAURANT', 1, 50000, 200000)
    `);

    // 1.5 Kiểm tra chk_menu_price: Chặn giá món ăn âm trên menu_items
    let blockedMenuNegativePrice = false;
    try {
      await pool.request().query(`
        INSERT INTO menu_items (place_id, name, price, is_available)
        VALUES (${testPlaceId}, 'Món ăn giá âm test', -25000, 1)
      `);
    } catch (err: any) {
      if (err.message.includes('chk_menu_price')) {
        blockedMenuNegativePrice = true;
      }
    }
    assert(blockedMenuNegativePrice, '1.4 SQL Server chặn giá món ăn âm (price < 0) trên menu_items', 'Ràng buộc chk_menu_price kích hoạt chính xác');

    // 1.6 Kiểm tra chk_attr_price: Chặn giá vé âm trên attractions
    const testAttrPlaceRes = await pool.request().query<{ place_id: number }>(`
      INSERT INTO places (place_type, name, status, created_at)
      OUTPUT INSERTED.place_id
      VALUES ('ATTRACTION', 'Điểm Du Lịch Test Constraint Step 7', 'ACTIVE', GETDATE())
    `);
    const testAttrPlaceId = testAttrPlaceRes.recordset[0].place_id;
    cleanupPlaceIds.push(testAttrPlaceId);

    let blockedAttrNegativePrice = false;
    try {
      await pool.request().query(`
        INSERT INTO attractions (place_id, place_type, category_id, ticket_price)
        VALUES (${testAttrPlaceId}, 'ATTRACTION', 1, -10000)
      `);
    } catch (err: any) {
      if (err.message.includes('chk_attr_price')) {
        blockedAttrNegativePrice = true;
      }
    }
    assert(blockedAttrNegativePrice, '1.5 SQL Server chặn giá vé âm (ticket_price < 0) trên attractions', 'Ràng buộc chk_attr_price kích hoạt chính xác');

    // 1.7 Kiểm tra chk_places_status: Chặn trạng thái không hợp lệ trên places
    let blockedInvalidPlaceStatus = false;
    try {
      await pool.request().query(`
        INSERT INTO places (place_type, name, status)
        VALUES ('RESTAURANT', 'Quán trạng thái bậy', 'INVALID_STATUS')
      `);
    } catch (err: any) {
      if (err.message.includes('chk_places_status')) {
        blockedInvalidPlaceStatus = true;
      }
    }
    assert(blockedInvalidPlaceStatus, '1.6 SQL Server chặn status không hợp lệ trên places', 'Chỉ chấp nhận ACTIVE, HIDDEN, PENDING, LOCKED');

    // 1.8 Kiểm tra chk_places_rating: Chặn avg_rating > 5
    let blockedInvalidRating = false;
    try {
      await pool.request().query(`
        INSERT INTO places (place_type, name, avg_rating, status)
        VALUES ('RESTAURANT', 'Quán rating 6 sao', 6.0, 'ACTIVE')
      `);
    } catch (err: any) {
      if (err.message.includes('chk_places_rating')) {
        blockedInvalidRating = true;
      }
    }
    assert(blockedInvalidRating, '1.7 SQL Server chặn avg_rating > 5.0 trên places', 'Ràng buộc chk_places_rating kích hoạt chính xác');

    // =========================================================================
    // SUITE 2: KIỂM THỬ HỆ THỐNG CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
    // =========================================================================
    console.log('\n--- ⚡ SUITE 2: KIỂM THỬ HỆ THỐNG CHỈ MỤC (INDEXES) TRONG SYS.INDEXES ---');

    const expectedIndexes = [
      { table: 'restaurants', index: 'IX_restaurants_cuisine_price', desc: 'Chỉ mục lọc ẩm thực theo loại món và khoảng giá' },
      { table: 'attractions', index: 'IX_attractions_category_price', desc: 'Chỉ mục lọc điểm du lịch theo danh mục và giá vé' },
      { table: 'menu_items', index: 'IX_menu_items_place_available', desc: 'Chỉ mục lấy thực đơn còn món mở bán' },
      { table: 'menu_item_tastes', index: 'IX_menu_item_tastes_taste_item', desc: 'Chỉ mục đảo ngược lọc món theo khẩu vị' },
      { table: 'places', index: 'IX_places_type_status_rating', desc: 'Chỉ mục sắp xếp theo điểm đánh giá & phân trang' },
      { table: 'place_images', index: 'IX_place_images_place_cover', desc: 'Chỉ mục lấy ảnh đại diện của địa điểm' },
      { table: 'opening_hours', index: 'IX_opening_hours_place_day', desc: 'Chỉ mục kiểm tra giờ mở cửa theo ngày trong tuần' }
    ];

    const sysIndexRes = await pool.request().query<{ table_name: string; index_name: string }>(`
      SELECT t.name AS table_name, i.name AS index_name
      FROM sys.indexes i
      JOIN sys.tables t ON t.object_id = i.object_id
      WHERE i.name IN (${expectedIndexes.map((x) => `'${x.index}'`).join(',')})
    `);

    const existingIndexNames = new Set(sysIndexRes.recordset.map((r) => r.index_name));

    for (let i = 0; i < expectedIndexes.length; i++) {
      const exp = expectedIndexes[i];
      assert(
        existingIndexNames.has(exp.index),
        `2.${i + 1} Index ${exp.index} tồn tại trên bảng ${exp.table}`,
        `${exp.desc}`
      );
    }

    // =========================================================================
    // SUITE 3: KIỂM THỬ HÀM DÙNG CHUNG createPlaceCommon
    // =========================================================================
    console.log('\n--- 🛠️ SUITE 3: KIỂM THỬ HÀM DÙNG CHUNG createPlaceCommon (TÚ & TÍN) ---');

    // 3.1 Tạo độc lập địa điểm loại ACCOMMODATION (Tín)
    const accPlaceId = await createPlaceCommon({
      place_type: 'ACCOMMODATION',
      name: 'Khách sạn DaNang Seaside Luxury Step 7',
      description: 'Khách sạn ven biển 4 sao view trọn vịnh Đà Nẵng',
      address: '250 Võ Nguyên Giáp, Phước Mỹ',
      district_id: 3,
      latitude: 16.0655,
      longitude: 108.2455,
      phone: '02363999777',
      website: 'https://danangseaside.com',
      booking_url: 'https://dananggo.vn/dat-phong/danang-seaside',
      promo_label: 'Khách sạn ven biển',
      status: 'ACTIVE'
    });
    cleanupPlaceIds.push(accPlaceId);

    assert(accPlaceId > 0, '3.1 createPlaceCommon tạo địa điểm ACCOMMODATION độc lập thành công', `Tạo place_id = ${accPlaceId}`);

    const accPlaceDb = await pool.request().input('id', sql.Int, accPlaceId).query('SELECT * FROM places WHERE place_id = @id');
    assert(accPlaceDb.recordset.length === 1, '3.1 Bản ghi được lưu chính xác trong database');
    assert(accPlaceDb.recordset[0].place_type === 'ACCOMMODATION', '3.1 place_type đúng là ACCOMMODATION');
    assert(accPlaceDb.recordset[0].name === 'Khách sạn DaNang Seaside Luxury Step 7', '3.1 Tên khách sạn khớp chính xác');
    assert(accPlaceDb.recordset[0].booking_url === 'https://dananggo.vn/dat-phong/danang-seaside', '3.1 booking_url được lưu đúng');

    // 3.2 Kiểm tra Transaction Commit thành công
    const txCommit = new sql.Transaction(pool);
    await txCommit.begin();
    let txCommitPlaceId = 0;
    try {
      txCommitPlaceId = await createPlaceCommon({
        place_type: 'ACCOMMODATION',
        name: 'Khách Sạn Mường Thanh Grand Step 7',
        district_id: 1,
        status: 'ACTIVE'
      }, txCommit);

      // Ghi tiếp bảng accommodations
      await txCommit.request()
        .input('place_id', sql.Int, txCommitPlaceId)
        .input('place_type', sql.VarChar(20), 'ACCOMMODATION')
        .input('accommodation_type', sql.VarChar(20), 'HOTEL')
        .input('star_rating', sql.TinyInt, 4)
        .query(`
          INSERT INTO accommodations (place_id, place_type, accommodation_type, star_rating, accepts_cash, accepts_bank_transfer)
          VALUES (@place_id, @place_type, @accommodation_type, @star_rating, 1, 1)
        `);

      await txCommit.commit();
      cleanupPlaceIds.push(txCommitPlaceId);
    } catch (err) {
      await txCommit.rollback();
      throw err;
    }

    assert(txCommitPlaceId > 0, '3.2 createPlaceCommon chạy trong sql.Transaction Commit thành công liên 2 bảng', `Commit place_id = ${txCommitPlaceId}`);

    // 3.3 Kiểm tra Transaction Rollback hoàn toàn khi bảng con bị lỗi
    const txRollback = new sql.Transaction(pool);
    await txRollback.begin();
    let txRollbackPlaceId = 0;
    try {
      txRollbackPlaceId = await createPlaceCommon({
        place_type: 'ACCOMMODATION',
        name: 'Khách Sạn Sẽ Bị Rollback',
        district_id: 1
      }, txRollback);

      // Giả lập lỗi ở bảng con (insert place_type sai để trigger FK/check constraint)
      await txRollback.request()
        .input('place_id', sql.Int, txRollbackPlaceId)
        .query(`INSERT INTO accommodations (place_id, place_type, accommodation_type) VALUES (@place_id, 'WRONG_TYPE', 'HOTEL')`);

      await txRollback.commit();
    } catch (err: any) {
      await txRollback.rollback();
    }

    // Kiểm tra xem place_id đó có bị rollback khỏi DB chưa
    const checkRollback = await pool.request().input('id', sql.Int, txRollbackPlaceId).query('SELECT place_id FROM places WHERE place_id = @id');
    assert(
      checkRollback.recordset.length === 0,
      '3.3 createPlaceCommon hỗ trợ Transaction Rollback hoàn toàn sạch sẽ',
      `Place ID ${txRollbackPlaceId} đã được rollback khỏi places, không để lại dữ liệu rác`
    );

    // 3.4 Kiểm tra Validation phòng thủ của createPlaceCommon
    let catchMissingName = false;
    try {
      await createPlaceCommon({ place_type: 'RESTAURANT', name: '   ' });
    } catch (err: any) {
      if (err.message.includes('Tên địa điểm')) catchMissingName = true;
    }
    assert(catchMissingName, '3.4 Chặn tạo địa điểm khi tên rỗng hoặc toàn khoảng trắng', 'Validation phòng thủ hoạt động đúng');

    let catchInvalidType = false;
    try {
      await createPlaceCommon({ place_type: 'INVALID_TYPE' as any, name: 'Quán ăn' });
    } catch (err: any) {
      if (err.message.includes('Loại địa điểm')) catchInvalidType = true;
    }
    assert(catchInvalidType, '3.4 Chặn tạo địa điểm khi place_type không nằm trong whitelist');

    let catchInvalidBookingUrl = false;
    try {
      await createPlaceCommon({
        place_type: 'RESTAURANT',
        name: 'Quán ăn link sai',
        booking_url: 'ftp://wrong-protocol.com'
      });
    } catch (err: any) {
      if (err.message.includes('booking_url')) catchInvalidBookingUrl = true;
    }
    assert(catchInvalidBookingUrl, '3.4 Chặn booking_url không bắt đầu bằng http:// hoặc https://');

    // =========================================================================
    // SUITE 4: KIỂM THỬ TOÀN VẸN KHÓA NGOẠI (FOREIGN KEYS) & DỮ LIỆU SEED
    // =========================================================================
    console.log('\n--- 🌐 SUITE 4: KIỂM THỬ TOÀN VẸN KHÓA NGOẠI & DỮ LIỆU SEED TASK 7 ---');

    // 4.1 Kiểm tra số lượng dữ liệu seed tối thiểu đã có trong hệ thống
    const placesCount = await pool.request().query<{ c: number }>('SELECT COUNT(*) as c FROM places WHERE status = \'ACTIVE\'');
    assert(placesCount.recordset[0].c >= 10, `4.1 Hệ thống có ít nhất 10 địa điểm ACTIVE (Thực tế: ${placesCount.recordset[0].c})`);

    const restCount = await pool.request().query<{ c: number }>('SELECT COUNT(*) as c FROM restaurants');
    assert(restCount.recordset[0].c >= 6, `4.1 Hệ thống có ít nhất 6 nhà hàng mẫu (Thực tế: ${restCount.recordset[0].c})`);

    const attrCount = await pool.request().query<{ c: number }>('SELECT COUNT(*) as c FROM attractions');
    assert(attrCount.recordset[0].c >= 6, `4.1 Hệ thống có ít nhất 6 điểm du lịch mẫu (Thực tế: ${attrCount.recordset[0].c})`);

    const menuCount = await pool.request().query<{ c: number }>('SELECT COUNT(*) as c FROM menu_items');
    assert(menuCount.recordset[0].c >= 20, `4.1 Hệ thống có ít nhất 20 món ăn mẫu (Thực tế: ${menuCount.recordset[0].c})`);

    const hoursCount = await pool.request().query<{ c: number }>('SELECT COUNT(*) as c FROM opening_hours');
    assert(hoursCount.recordset[0].c >= 50, `4.1 Hệ thống có lịch mở cửa đầy đủ (Thực tế: ${hoursCount.recordset[0].c})`);

    const imagesCount = await pool.request().query<{ c: number }>('SELECT COUNT(*) as c FROM place_images');
    assert(imagesCount.recordset[0].c >= 25, `4.1 Hệ thống có thư viện ảnh mẫu phong phú (Thực tế: ${imagesCount.recordset[0].c})`);

    // 4.2 Kiểm tra tính toàn vẹn khóa ngoại (Không có orphan records)
    // - Orphan restaurants
    const orphanRest = await pool.request().query(`
      SELECT r.place_id FROM restaurants r
      LEFT JOIN places p ON p.place_id = r.place_id AND p.place_type = 'RESTAURANT'
      WHERE p.place_id IS NULL
    `);
    assert(orphanRest.recordset.length === 0, '4.2 100% restaurants liên kết hợp lệ với places (Không có orphan)');

    // - Orphan attractions
    const orphanAttr = await pool.request().query(`
      SELECT a.place_id FROM attractions a
      LEFT JOIN places p ON p.place_id = a.place_id AND p.place_type = 'ATTRACTION'
      WHERE p.place_id IS NULL
    `);
    assert(orphanAttr.recordset.length === 0, '4.2 100% attractions liên kết hợp lệ với places (Không có orphan)');

    // - Orphan menu_items
    const orphanMenu = await pool.request().query(`
      SELECT m.menu_item_id FROM menu_items m
      LEFT JOIN restaurants r ON r.place_id = m.place_id
      WHERE r.place_id IS NULL
    `);
    assert(orphanMenu.recordset.length === 0, '4.2 100% menu_items liên kết hợp lệ với restaurants (Không có orphan)');

    // - Orphan menu_item_tastes
    const orphanTastes = await pool.request().query(`
      SELECT mt.menu_item_id, mt.taste_id FROM menu_item_tastes mt
      LEFT JOIN menu_items m ON m.menu_item_id = mt.menu_item_id
      LEFT JOIN tastes t ON t.taste_id = mt.taste_id
      WHERE m.menu_item_id IS NULL OR t.taste_id IS NULL
    `);
    assert(orphanTastes.recordset.length === 0, '4.2 100% menu_item_tastes liên kết hợp lệ với menu_items và tastes');

    // - Orphan opening_hours
    const orphanHours = await pool.request().query(`
      SELECT o.opening_id FROM opening_hours o
      LEFT JOIN places p ON p.place_id = o.place_id
      WHERE p.place_id IS NULL
    `);
    assert(orphanHours.recordset.length === 0, '4.2 100% opening_hours liên kết hợp lệ với places');

    // - Orphan place_images
    const orphanImages = await pool.request().query(`
      SELECT img.image_id FROM place_images img
      LEFT JOIN places p ON p.place_id = img.place_id
      WHERE p.place_id IS NULL
    `);
    assert(orphanImages.recordset.length === 0, '4.2 100% place_images liên kết hợp lệ với places');

    // 4.3 Kiểm tra tính hợp lý của khoảng giá price_min / price_max trên các nhà hàng
    const priceRangeCheck = await pool.request().query<{ place_id: number; price_min: number; price_max: number }>(`
      SELECT place_id, price_min, price_max FROM restaurants
      WHERE price_min IS NOT NULL AND price_max IS NOT NULL
    `);
    let allPricesValid = true;
    for (const row of priceRangeCheck.recordset) {
      if (row.price_min < 0 || row.price_max < 0 || row.price_min > row.price_max) {
        allPricesValid = false;
        break;
      }
    }
    assert(allPricesValid, '4.3 Tất cả nhà hàng có khoảng giá hợp lệ (0 <= price_min <= price_max)');

    console.log('\n========================================================================');
    console.log(`🎉 HOÀN THÀNH KIỂM THỬ TASK 7: ${passedTests}/${totalTests} ca kiểm thử PASSED (100%)`);
    console.log('========================================================================\n');

  } finally {
    // Dọn dẹp dữ liệu kiểm thử
    if (cleanupPlaceIds.length > 0) {
      console.log('🧹 Đang dọn dẹp các bản ghi test trong cơ sở dữ liệu...');
      const idList = cleanupPlaceIds.join(',');
      await pool.request().query(`
        DELETE FROM accommodations WHERE place_id IN (${idList});
        DELETE FROM menu_item_tastes WHERE menu_item_id IN (SELECT menu_item_id FROM menu_items WHERE place_id IN (${idList}));
        DELETE FROM menu_items WHERE place_id IN (${idList});
        DELETE FROM restaurants WHERE place_id IN (${idList});
        DELETE FROM attractions WHERE place_id IN (${idList});
        DELETE FROM opening_hours WHERE place_id IN (${idList});
        DELETE FROM place_images WHERE place_id IN (${idList});
        DELETE FROM places WHERE place_id IN (${idList});
      `);
      console.log(`✅ Đã dọn dẹp an toàn các place_id test: [${idList}]`);
    }

    await closeDB();
  }
}

if (require.main === module) {
  runStep7ComprehensiveVerification().catch((err) => {
    console.error('Lỗi khi chạy kiểm thử Step 7:', err);
    process.exit(1);
  });
}
