-- =====================================================================================
-- HỆ THỐNG DU LỊCH THÔNG MINH ĐÀ NẴNG (DANANGGO SMART TOURISM)
-- DATA QUALITY AUDIT & ANOMALY DETECTION SCRIPT
-- Task: 10.2 - Kiểm tra toàn diện chất lượng dữ liệu và phát hiện bất thường
-- Author: Tú (Testing & Optimization Lead)
-- Database: DaNangGo (SQL Server 2019/2022)
-- =====================================================================================

USE DaNangGo;
GO

PRINT '=====================================================================================';
PRINT 'DANANGGO - BÁO CÁO KIỂM THỬ CHẤT LƯỢNG DỮ LIỆU TOÀN HỆ THỐNG (DATA QUALITY AUDIT)';
PRINT 'Thời gian thực thi: ' + CONVERT(VARCHAR(30), GETDATE(), 120);
PRINT '=====================================================================================';
PRINT '';

-- =====================================================================================
-- 1. KIỂM TRA ĐỊA ĐIỂM THIẾU HOẶC SAI QUẬN/HUYỆN (DISTRICT INTEGRITY)
-- Tiêu chuẩn: Mỗi địa điểm phải có district_id hợp lệ tồn tại trong bảng districts
-- =====================================================================================
PRINT '>>> 1. KIỂM TRA ĐỊA ĐIỂM THIẾU HOẶC SAI QUẬN/HUYỆN:';
SELECT 
    p.place_id,
    p.name AS place_name,
    p.place_type,
    p.address,
    p.district_id,
    CASE 
        WHEN p.district_id IS NULL THEN N'Lỗi: district_id bị NULL'
        ELSE N'Lỗi: district_id không tồn tại trong bảng districts'
    END AS error_description
FROM dbo.places p
LEFT JOIN dbo.districts d ON p.district_id = d.district_id
WHERE p.district_id IS NULL OR d.district_id IS NULL;

IF @@ROWCOUNT = 0
    PRINT N'==> ĐẠT: Không có địa điểm nào bị thiếu hoặc sai quận/huyện.';
PRINT '';

-- =====================================================================================
-- 2. KIỂM TRA GIÁ TIÊU CỰC VÀ KHOẢNG GIÁ BẤT HỢP LÝ (PRICE ANOMALIES)
-- Tiêu chuẩn: 
-- - price_min >= 0, price_max >= 0
-- - Nếu có cả 2 giá thì price_min <= price_max
-- - menu_items.price >= 0
-- =====================================================================================
PRINT '>>> 2. KIỂM TRA BẤT THƯỜNG VỀ GIÁ (KHOẢNG GIÁ VÀ MÓN ĂN):';

-- 2.1 Khoảng giá nhà hàng
SELECT 
    p.place_id,
    p.name AS restaurant_name,
    r.price_min,
    r.price_max,
    CASE 
        WHEN r.price_min < 0 THEN N'Lỗi: price_min là số âm'
        WHEN r.price_max < 0 THEN N'Lỗi: price_max là số âm'
        WHEN r.price_min > r.price_max AND r.price_max > 0 THEN N'Lỗi: price_min lớn hơn price_max'
        ELSE N'Lỗi giá không xác định'
    END AS price_error
FROM dbo.restaurants r
JOIN dbo.places p ON r.place_id = p.place_id
WHERE r.price_min < 0 
   OR r.price_max < 0 
   OR (r.price_min > r.price_max AND r.price_max > 0);

-- 2.2 Giá món ăn trong thực đơn
SELECT 
    m.menu_item_id,
    m.place_id,
    p.name AS restaurant_name,
    m.name AS dish_name,
    m.price,
    N'Lỗi: Giá món ăn bị âm (< 0)' AS error_description
FROM dbo.menu_items m
JOIN dbo.places p ON m.place_id = p.place_id
WHERE m.price < 0;

IF @@ROWCOUNT = 0
    PRINT N'==> ĐẠT: Toàn bộ khoảng giá và giá món ăn đều hợp lệ (không có giá âm hoặc đảo ngược).';
PRINT '';

-- =====================================================================================
-- 3. KIỂM TRA CHỦ SỞ HỮU CƠ SỞ (PARTNER OWNERSHIP INTEGRITY)
-- Tiêu chuẩn: 
-- - partner_id nếu có phải tồn tại trong bảng partner_profiles
-- - Thống kê các cơ sở ẩm thực thương mại chưa được gán đối tác quản lý (Ownerless)
-- =====================================================================================
PRINT '>>> 3. KIỂM TRA CHỦ SỞ HỮU CƠ SỞ DỊCH VỤ (PARTNERS):';

-- 3.1 Địa điểm có partner_id sai (không tồn tại trong partner_profiles)
SELECT 
    p.place_id,
    p.name AS place_name,
    p.partner_id,
    N'Lỗi: partner_id không tồn tại trong partner_profiles' AS error_description
FROM dbo.places p
WHERE p.partner_id IS NOT NULL 
  AND p.partner_id NOT IN (SELECT partner_id FROM dbo.partner_profiles);

-- 3.2 Cơ sở ẩm thực thương mại chưa gán đối tác (Dữ liệu ban đầu cần bàn giao/claim)
SELECT 
    p.place_id,
    p.name AS place_name,
    p.address,
    p.status,
    N'Cảnh báo: Quán ăn chưa có đối tác quản lý (partner_id IS NULL)' AS warning_description
FROM dbo.places p
WHERE p.place_type = 'RESTAURANT' AND p.partner_id IS NULL;
PRINT '';

-- =====================================================================================
-- 4. KIỂM TRA TỌA ĐỘ ĐỊA LÝ NGOÀI PHẠM VI TP. ĐÀ NẴNG (GEO-COORDINATES AUDIT)
-- Giới hạn địa lý TP. Đà Nẵng:
-- - Vĩ độ (Latitude): 15.900000 đến 16.250000 N
-- - Kinh độ (Longitude): 107.900000 đến 108.400000 E
-- =====================================================================================
PRINT '>>> 4. KIỂM TRA TỌA ĐỘ ĐỊA LÝ TP. ĐÀ NẴNG:';

SELECT 
    p.place_id,
    p.name AS place_name,
    p.address,
    p.latitude,
    p.longitude,
    CASE 
        WHEN p.latitude IS NULL OR p.longitude IS NULL THEN N'Cảnh báo: Tọa độ bị NULL (chưa được định vị)'
        WHEN p.latitude < 15.90 OR p.latitude > 16.25 THEN N'Lỗi: Vĩ độ nằm ngoài phạm vi Đà Nẵng [15.90 - 16.25]'
        WHEN p.longitude < 107.90 OR p.longitude > 108.40 THEN N'Lỗi: Kinh độ nằm ngoài phạm vi Đà Nẵng [107.90 - 108.40]'
        ELSE N'Bất thường khác'
    END AS geo_error
FROM dbo.places p
WHERE p.latitude IS NULL 
   OR p.longitude IS NULL
   OR p.latitude < 15.90 
   OR p.latitude > 16.25 
   OR p.longitude < 107.90 
   OR p.longitude > 108.40;

IF @@ROWCOUNT = 0
    PRINT N'==> ĐẠT: 100% địa điểm có tọa độ nằm chuẩn xác trong ranh giới Đà Nẵng.';
PRINT '';

-- =====================================================================================
-- 5. KIỂM TRA TÍNH ĐẦY ĐỦ CỦA THÔNG TIN CƠ BẢN (DATA COMPLETENESS)
-- Tiêu chuẩn: Tên, địa chỉ không được để trống; Trạng thái phải thuộc enum hợp lệ
-- =====================================================================================
PRINT '>>> 5. KIỂM TRA THÔNG TIN BẮT BUỘC (TÊN, ĐỊA CHỈ, TRẠNG THÁI):';

SELECT 
    p.place_id,
    p.name,
    p.address,
    p.status,
    CASE 
        WHEN p.name IS NULL OR LTRIM(RTRIM(p.name)) = '' THEN N'Lỗi nghiêm trọng: Tên địa điểm bị rỗng'
        WHEN p.address IS NULL OR LTRIM(RTRIM(p.address)) = '' THEN N'Lỗi: Địa chỉ bị rỗng'
        WHEN p.status NOT IN ('APPROVED', 'ACTIVE', 'PENDING', 'PENDING_APPROVAL', 'HIDDEN', 'LOCKED') THEN N'Lỗi: Trạng thái không hợp lệ (' + ISNULL(p.status, 'NULL') + ')'
        ELSE N'Lỗi khác'
    END AS completeness_error
FROM dbo.places p
WHERE p.name IS NULL OR LTRIM(RTRIM(p.name)) = ''
   OR p.address IS NULL OR LTRIM(RTRIM(p.address)) = ''
   OR p.status NOT IN ('APPROVED', 'ACTIVE', 'PENDING', 'PENDING_APPROVAL', 'HIDDEN', 'LOCKED');

IF @@ROWCOUNT = 0
    PRINT N'==> ĐẠT: Không có địa điểm nào bị rỗng tên, rỗng địa chỉ hoặc sai trạng thái.';
PRINT '';

-- =====================================================================================
-- 6. KIỂM TRA BẢN GHI MỒ CÔI (ORPHANED RECORDS AUDIT)
-- Tiêu chuẩn: Mọi món ăn, ảnh, giờ mở cửa phải liên kết tới place_id hợp lệ
-- =====================================================================================
PRINT '>>> 6. KIỂM TRA CÁC BẢN GHI MỒ CÔI:';

-- 6.1 Món ăn mồ côi
SELECT m.menu_item_id, m.place_id, m.name, N'Món ăn mồ côi (place_id không tồn tại)' AS issue
FROM dbo.menu_items m
WHERE m.place_id NOT IN (SELECT place_id FROM dbo.places);

-- 6.2 Ảnh địa điểm mồ côi
SELECT pi.image_id, pi.place_id, pi.image_url, N'Ảnh mồ côi (place_id không tồn tại)' AS issue
FROM dbo.place_images pi
WHERE pi.place_id NOT IN (SELECT place_id FROM dbo.places);

-- 6.3 Giờ mở cửa mồ côi
SELECT oh.opening_id, oh.place_id, N'Giờ mở cửa mồ côi (place_id không tồn tại)' AS issue
FROM dbo.opening_hours oh
WHERE oh.place_id NOT IN (SELECT place_id FROM dbo.places);

IF @@ROWCOUNT = 0
    PRINT N'==> ĐẠT: Không có bản ghi mồ côi nào trong hệ thống.';
PRINT '';

-- =====================================================================================
-- 7. TỔNG HỢP CHỈ SỐ CHẤT LƯỢNG DỮ LIỆU TOÀN HỆ THỐNG (DATA QUALITY KPI SUMMARY)
-- =====================================================================================
PRINT '=====================================================================================';
PRINT 'DANANGGO - BẢNG TỔNG KẾT CHỈ SỐ CHẤT LƯỢNG DỮ LIỆU (KPI SUMMARY)';
PRINT '=====================================================================================';

SELECT 
    COUNT(*) AS total_places,
    SUM(CASE WHEN district_id IS NOT NULL AND district_id IN (SELECT district_id FROM dbo.districts) THEN 1 ELSE 0 END) AS valid_district_count,
    SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN 15.90 AND 16.25 AND longitude BETWEEN 107.90 AND 108.40 THEN 1 ELSE 0 END) AS valid_geo_count,
    SUM(CASE WHEN partner_id IS NOT NULL THEN 1 ELSE 0 END) AS claimed_partner_count,
    SUM(CASE WHEN status IN ('APPROVED', 'ACTIVE') THEN 1 ELSE 0 END) AS public_active_count,
    CAST(ROUND(
        SUM(CASE 
            WHEN district_id IS NOT NULL 
             AND name IS NOT NULL AND LTRIM(RTRIM(name)) <> '' 
             AND address IS NOT NULL AND LTRIM(RTRIM(address)) <> '' 
             AND latitude BETWEEN 15.90 AND 16.25 
             AND longitude BETWEEN 107.90 AND 108.40 
            THEN 1 ELSE 0 
        END) * 100.0 / COUNT(*), 2
    ) AS DECIMAL(5,2)) AS overall_data_quality_score_percent
FROM dbo.places;
GO
