-- =====================================================================================
-- HỆ THỐNG DU LỊCH THÔNG MINH ĐÀ NẴNG (DANANGGO SMART TOURISM)
-- MIGRATION 008: INDEX OPTIMIZATION & EXECUTION PLAN PERFORMANCE TUNING
-- Task: 10.3 - Bổ sung Non-Clustered Indexes tối ưu hóa tìm kiếm, phân trang và đồng bộ
-- Author: Tú (Testing & Optimization Lead)
-- Database: DaNangGo (SQL Server 2019/2022)
-- =====================================================================================

USE DaNangGo;
GO

PRINT '=====================================================================================';
PRINT 'DANANGGO - THỰC THI MIGRATION 008: TỐI ƯU HÓA INDEXES & HIỆU NĂNG TRUY VẤN';
PRINT '=====================================================================================';
GO

-- =====================================================================================
-- 1. TỐI ƯU HÓA TÌM KIẾM CÔNG KHAI, LỌC QUẬN VÀ PHÂN TRANG THEO ĐÁNH GIÁ (PLACES)
-- Query tối ưu:
--   SELECT ... FROM places 
--   WHERE status IN ('APPROVED', 'ACTIVE') AND district_id = @district_id 
--   ORDER BY avg_rating DESC, place_id
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_places_filter_covering' AND object_id = OBJECT_ID('dbo.places'))
BEGIN
    DROP INDEX IX_places_filter_covering ON dbo.places;
END
GO

CREATE NONCLUSTERED INDEX IX_places_filter_covering
ON dbo.places (status, district_id, avg_rating DESC)
INCLUDE (
    place_id, 
    place_type, 
    name, 
    address, 
    latitude, 
    longitude, 
    phone, 
    website, 
    booking_url, 
    review_count, 
    view_count, 
    promo_label, 
    partner_id, 
    created_at, 
    updated_at
);
PRINT '✅ Đã tạo Index bao phủ: IX_places_filter_covering';
GO

-- =====================================================================================
-- 2. TỐI ƯU HÓA TRUY VẤN QUẢN LÝ CƠ SỞ ĐỐI TÁC (PARTNER DASHBOARD)
-- Query tối ưu:
--   SELECT ... FROM places 
--   WHERE partner_id = @partner_id AND status = @status 
--   ORDER BY created_at DESC
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_places_partner_dashboard' AND object_id = OBJECT_ID('dbo.places'))
BEGIN
    DROP INDEX IX_places_partner_dashboard ON dbo.places;
END
GO

CREATE NONCLUSTERED INDEX IX_places_partner_dashboard
ON dbo.places (partner_id, status, created_at DESC)
INCLUDE (
    place_id, 
    place_type, 
    name, 
    address, 
    district_id, 
    avg_rating, 
    review_count, 
    view_count, 
    promo_label, 
    updated_at
);
PRINT '✅ Đã tạo Index bao phủ: IX_places_partner_dashboard';
GO

-- =====================================================================================
-- 3. TỐI ƯU HÓA TRUY VẤN BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN (ADMIN PLACES PORTAL)
-- Query tối ưu:
--   SELECT p.*, pp.business_name FROM places p 
--   WHERE p.status = @status 
--   ORDER BY p.created_at DESC
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_places_admin_status_created' AND object_id = OBJECT_ID('dbo.places'))
BEGIN
    DROP INDEX IX_places_admin_status_created ON dbo.places;
END
GO

CREATE NONCLUSTERED INDEX IX_places_admin_status_created
ON dbo.places (status, created_at DESC)
INCLUDE (
    place_id, 
    place_type, 
    name, 
    address, 
    district_id, 
    partner_id, 
    avg_rating, 
    review_count, 
    view_count, 
    updated_at
);
PRINT '✅ Đã tạo Index bao phủ: IX_places_admin_status_created';
GO

-- =====================================================================================
-- 4. TỐI ƯU HÓA LỌC KHOẢNG GIÁ NHÀ HÀNG (RESTAURANTS PRICE RANGE)
-- Query tối ưu:
--   SELECT ... FROM restaurants 
--   WHERE price_min <= @max_price AND price_max >= @min_price
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_restaurants_price_range' AND object_id = OBJECT_ID('dbo.restaurants'))
BEGIN
    DROP INDEX IX_restaurants_price_range ON dbo.restaurants;
END
GO

CREATE NONCLUSTERED INDEX IX_restaurants_price_range
ON dbo.restaurants (price_min, price_max)
INCLUDE (
    place_id, 
    cuisine_id, 
    place_type
);
PRINT '✅ Đã tạo Index khoảng giá: IX_restaurants_price_range';
GO

-- =====================================================================================
-- 5. TỐI ƯU HÓA TRUY VẤN THỰC ĐƠN VÀ ĐỒNG BỘ GIÁ MÓN ĂN (MENU ITEMS COVERING)
-- Query tối ưu:
--   SELECT * FROM menu_items 
--   WHERE place_id = @place_id AND is_available = 1
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_menu_items_place_available' AND object_id = OBJECT_ID('dbo.menu_items'))
BEGIN
    DROP INDEX IX_menu_items_place_available ON dbo.menu_items;
END
GO

CREATE NONCLUSTERED INDEX IX_menu_items_place_available
ON dbo.menu_items (place_id, is_available)
INCLUDE (
    menu_item_id, 
    name, 
    price, 
    description, 
    image_url, 
    updated_at
);
PRINT '✅ Đã tạo Index bao phủ thực đơn: IX_menu_items_place_available';
GO

-- =====================================================================================
-- 6. TỐI ƯU HÓA TRUY VẤN XÁC THỰC VÀ HỒ SƠ ĐỐI TÁC (PARTNER PROFILES)
-- Query tối ưu:
--   SELECT ... FROM partner_profiles 
--   WHERE user_id = @user_id
-- =====================================================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_partner_profiles_user_status' AND object_id = OBJECT_ID('dbo.partner_profiles'))
BEGIN
    DROP INDEX IX_partner_profiles_user_status ON dbo.partner_profiles;
END
GO

CREATE NONCLUSTERED INDEX IX_partner_profiles_user_status
ON dbo.partner_profiles (user_id, approval_status)
INCLUDE (
    partner_id, 
    business_name, 
    service_type, 
    tax_code, 
    contact_phone, 
    address, 
    approved_by, 
    approved_at, 
    created_at
);
PRINT '✅ Đã tạo Index hồ sơ đối tác: IX_partner_profiles_user_status';
GO

-- =====================================================================================
-- 7. CẬP NHẬT THỐNG KÊ TOÀN DIỆN CHO CÁC BẢNG (UPDATE STATISTICS WITH FULLSCAN)
-- Giúp Query Optimizer phân phối chi phí chính xác tuyệt đối
-- =====================================================================================
UPDATE STATISTICS dbo.places WITH FULLSCAN;
UPDATE STATISTICS dbo.restaurants WITH FULLSCAN;
UPDATE STATISTICS dbo.menu_items WITH FULLSCAN;
UPDATE STATISTICS dbo.partner_profiles WITH FULLSCAN;
PRINT '✅ Đã cập nhật thống kê phân phối (Fullscan Statistics Updated)';
GO

PRINT '=====================================================================================';
PRINT 'HOÀN THÀNH MIGRATION 008: 100% CÁC TRUY VẤN CHÍNH ĐÃ ĐƯỢC PHỦ INDEX TỐI ƯU!';
PRINT '=====================================================================================';
GO
