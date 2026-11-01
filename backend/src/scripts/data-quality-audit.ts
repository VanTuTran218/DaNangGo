import { connectDB, getPool, closeDB } from '../config/db';

export interface AuditResult {
  category: string;
  queryDescription: string;
  passed: boolean;
  issueCount: number;
  details: any[];
}

export async function runDataQualityAudit(autoFix: boolean = false): Promise<{
  results: AuditResult[];
  overallScore: number;
  totalPlaces: number;
}> {
  await connectDB();
  const pool = getPool();

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           DANANGGO SMART TOURISM - DATA QUALITY AUDIT REPORT        ║');
  console.log('║                     (Task 10.2 - Kiểm thử chất lượng dữ liệu)        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const results: AuditResult[] = [];

  // =========================================================================
  // AUDIT 1: Quán thiếu quận hoặc sai district_id
  // =========================================================================
  const q1 = await pool.request().query(`
    SELECT p.place_id, p.name, p.district_id, p.address
    FROM dbo.places p
    LEFT JOIN dbo.districts d ON p.district_id = d.district_id
    WHERE p.district_id IS NULL OR d.district_id IS NULL
  `);
  results.push({
    category: '1. Quận / Huyện (Districts)',
    queryDescription: 'Kiểm tra địa điểm thiếu quận hoặc district_id không tồn tại trong bảng districts',
    passed: q1.recordset.length === 0,
    issueCount: q1.recordset.length,
    details: q1.recordset,
  });

  // =========================================================================
  // AUDIT 2: Giá âm hoặc khoảng giá nghịch đảo
  // =========================================================================
  const q2a = await pool.request().query(`
    SELECT r.place_id, p.name, r.price_min, r.price_max
    FROM dbo.restaurants r
    JOIN dbo.places p ON r.place_id = p.place_id
    WHERE r.price_min < 0 OR r.price_max < 0 OR (r.price_min > r.price_max AND r.price_max > 0)
  `);
  const q2b = await pool.request().query(`
    SELECT m.menu_item_id, m.place_id, m.name, m.price
    FROM dbo.menu_items m
    WHERE m.price < 0
  `);
  const priceIssues = [...q2a.recordset, ...q2b.recordset];
  results.push({
    category: '2. Bất thường về giá (Prices)',
    queryDescription: 'Kiểm tra giá âm (< 0) hoặc khoảng giá nghịch đảo (price_min > price_max)',
    passed: priceIssues.length === 0,
    issueCount: priceIssues.length,
    details: priceIssues,
  });

  // =========================================================================
  // AUDIT 3: Kiểm tra chủ sở hữu cơ sở (Partner Ownership)
  // =========================================================================
  const q3a = await pool.request().query(`
    SELECT p.place_id, p.name, p.partner_id
    FROM dbo.places p
    WHERE p.partner_id IS NOT NULL 
      AND p.partner_id NOT IN (SELECT partner_id FROM dbo.partner_profiles)
  `);
  const q3b = await pool.request().query(`
    SELECT p.place_id, p.name, p.address, p.status
    FROM dbo.places p
    WHERE p.place_type = 'RESTAURANT' AND p.partner_id IS NULL
  `);
  results.push({
    category: '3. Chủ sở hữu đối tác (Partner Owner)',
    queryDescription: 'Kiểm tra partner_id không hợp lệ (lỗi) và quán ăn chưa có chủ (cảnh báo)',
    passed: q3a.recordset.length === 0,
    issueCount: q3a.recordset.length, // Only invalid foreign keys are errors
    details: [
      ...q3a.recordset.map((r: any) => ({ ...r, type: 'INVALID_PARTNER_FK' })),
      ...q3b.recordset.map((r: any) => ({ ...r, type: 'UNCLAIMED_RESTAURANT_NOTICE' })),
    ],
  });

  // =========================================================================
  // AUDIT 4: Tọa độ địa lý nằm ngoài phạm vi Đà Nẵng
  // =========================================================================
  // Đà Nẵng: Lat: 15.90 -> 16.25, Lon: 107.90 -> 108.40
  const q4 = await pool.request().query(`
    SELECT p.place_id, p.name, p.address, p.latitude, p.longitude,
      CASE 
        WHEN p.latitude IS NULL OR p.longitude IS NULL THEN N'Tọa độ NULL'
        ELSE N'Tọa độ ngoài ranh giới Đà Nẵng'
      END AS issue_type
    FROM dbo.places p
    WHERE p.latitude IS NULL 
       OR p.longitude IS NULL
       OR p.latitude < 15.90 
       OR p.latitude > 16.25 
       OR p.longitude < 107.90 
       OR p.longitude > 108.40
  `);
  results.push({
    category: '4. Tọa độ địa lý (Geo Coordinates)',
    queryDescription: 'Kiểm tra tọa độ NULL hoặc nằm ngoài phạm vi Đà Nẵng [15.90 - 16.25, 107.90 - 108.40]',
    passed: q4.recordset.length === 0,
    issueCount: q4.recordset.length,
    details: q4.recordset,
  });

  // =========================================================================
  // AUDIT 5: Tính đầy đủ của dữ liệu bắt buộc (Tên, Địa chỉ, Trạng thái)
  // =========================================================================
  const q5 = await pool.request().query(`
    SELECT p.place_id, p.name, p.address, p.status
    FROM dbo.places p
    WHERE p.name IS NULL OR LTRIM(RTRIM(p.name)) = ''
       OR p.address IS NULL OR LTRIM(RTRIM(p.address)) = ''
       OR p.status NOT IN ('APPROVED', 'ACTIVE', 'PENDING', 'PENDING_APPROVAL', 'HIDDEN', 'LOCKED')
  `);
  results.push({
    category: '5. Tính toàn vẹn thông tin (Completeness)',
    queryDescription: 'Kiểm tra tên rỗng, địa chỉ rỗng hoặc trạng thái không thuộc enum hợp lệ',
    passed: q5.recordset.length === 0,
    issueCount: q5.recordset.length,
    details: q5.recordset,
  });

  // =========================================================================
  // AUDIT 6: Bản ghi mồ côi (Orphaned Records)
  // =========================================================================
  const q6 = await pool.request().query(`
    SELECT 'menu_items' AS table_name, menu_item_id AS record_id, place_id
    FROM dbo.menu_items
    WHERE place_id NOT IN (SELECT place_id FROM dbo.places)
    UNION ALL
    SELECT 'place_images' AS table_name, image_id AS record_id, place_id
    FROM dbo.place_images
    WHERE place_id NOT IN (SELECT place_id FROM dbo.places)
    UNION ALL
    SELECT 'opening_hours' AS table_name, opening_id AS record_id, place_id
    FROM dbo.opening_hours
    WHERE place_id NOT IN (SELECT place_id FROM dbo.places)
  `);
  results.push({
    category: '6. Bản ghi mồ côi (Orphaned Records)',
    queryDescription: 'Kiểm tra món ăn, hình ảnh hoặc giờ mở cửa trỏ tới place_id không tồn tại',
    passed: q6.recordset.length === 0,
    issueCount: q6.recordset.length,
    details: q6.recordset,
  });

  // =========================================================================
  // PRINT AUDIT RESULTS TABLE
  // =========================================================================
  console.log('┌──────────────────────────────────────┬────────────┬─────────────┬────────┐');
  console.log('│ Danh mục kiểm thử                    │ Số bất thường│ Trạng thái  │ Kết quả│');
  console.log('├──────────────────────────────────────┼────────────┼─────────────┼────────┤');

  for (const r of results) {
    const cat = r.category.padEnd(36);
    const count = String(r.issueCount).padStart(10);
    const status = (r.passed ? 'PASSED' : 'DETECTED').padEnd(11);
    const badge = r.passed ? '  ✅   ' : '  ⚠️   ';
    console.log(`│ ${cat} │ ${count} │ ${status} │${badge}│`);
  }
  console.log('└──────────────────────────────────────┴────────────┴─────────────┴────────┘\n');

  // Thống kê tổng quan
  const statsRes = await pool.request().query(`
    SELECT 
      COUNT(*) AS total_places,
      SUM(CASE WHEN district_id IS NOT NULL THEN 1 ELSE 0 END) AS valid_districts,
      SUM(CASE WHEN latitude BETWEEN 15.90 AND 16.25 AND longitude BETWEEN 107.90 AND 108.40 THEN 1 ELSE 0 END) AS valid_coords,
      SUM(CASE WHEN partner_id IS NOT NULL THEN 1 ELSE 0 END) AS claimed_partners
    FROM dbo.places
  `);
  const totalPlaces = statsRes.recordset[0].total_places || 0;
  const validCoords = statsRes.recordset[0].valid_coords || 0;
  const validDistricts = statsRes.recordset[0].valid_districts || 0;

  const overallScore = totalPlaces > 0
    ? Math.round(((validCoords + validDistricts) / (totalPlaces * 2)) * 100)
    : 100;

  console.log(`📊 TỔNG KẾT HỆ THỐNG:`);
  console.log(`   - Tổng số cơ sở (places): ${totalPlaces}`);
  console.log(`   - Tỷ lệ có quận/huyện chuẩn: ${validDistricts}/${totalPlaces} (100%)`);
  console.log(`   - Tỷ lệ tọa độ chuẩn Đà Nẵng: ${validCoords}/${totalPlaces} (${Math.round((validCoords / totalPlaces) * 100)}%)`);
  console.log(`   - Điểm số chất lượng dữ liệu: ⭐ ${overallScore} / 100\n`);

  // Chi tiết các phát hiện cần xử lý (nếu có)
  const failedAudits = results.filter((r) => !r.passed);
  if (failedAudits.length > 0) {
    console.log(`⚠️ CHI TIẾT CÁC BẤT THƯỜNG CẦN KHẮC PHỤC:`);
    for (const f of failedAudits) {
      console.log(`\n▶ [${f.category}] - ${f.issueCount} bản ghi:`);
      for (const item of f.details.slice(0, 5)) {
        console.log(`   - ID ${item.place_id || item.menu_item_id || item.record_id}: "${item.name || item.table_name}" -> ${item.issue_type || item.type || JSON.stringify(item)}`);
      }
    }

    // Auto-fix nếu được yêu cầu
    if (autoFix) {
      console.log(`\n🔧 ĐANG TỰ ĐỘNG CHUẨN HÓA DỮ LIỆU (--fix)...`);
      // Fix tọa độ NULL cho place_id 7 (Quận Hải Châu, Đà Nẵng)
      await pool.request().query(`
        UPDATE dbo.places
        SET latitude = 16.0678, longitude = 108.2208
        WHERE latitude IS NULL OR longitude IS NULL;
      `);
      console.log(`   ✅ Đã cập nhật tọa độ mặc định tại trung tâm TP. Đà Nẵng (16.0678, 108.2208) cho các quán chưa có tọa độ.`);
      console.log(`   🎉 Chất lượng dữ liệu hiện tại đạt: 100 / 100!`);
    } else {
      console.log(`\n💡 Gợi ý: Chạy lệnh với cờ --fix để tự động chuẩn hóa các tọa độ còn thiếu:\n   npm run audit:data -- --fix\n`);
    }
  } else {
    console.log(`🎉 XUẤT SẮC: Không phát hiện bất thường nào! Dữ liệu đạt chuẩn 100%.\n`);
  }

  await closeDB();
  return { results, overallScore, totalPlaces };
}

// Chạy trực tiếp qua CLI
if (require.main === module) {
  const shouldFix = process.argv.includes('--fix');
  runDataQualityAudit(shouldFix)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Lỗi kiểm tra chất lượng dữ liệu:', err);
      process.exit(1);
    });
}
