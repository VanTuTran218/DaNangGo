-- ===================================================================================
-- Migration 007: task7_constraints_and_indexes.sql
-- Mục tiêu:
-- 1. Bổ sung & chuẩn hóa các ràng buộc CHECK (giá không âm, trạng thái hợp lệ).
-- 2. Thiết lập hệ thống chỉ mục (INDEX) tối ưu cho các cột thường xuyên lọc:
--    - restaurants: (cuisine_id, price_min, price_max)
--    - attractions: (category_id, ticket_price)
--    - menu_items: (place_id, is_available) INCLUDE (name, price, image_url)
--    - menu_item_tastes: (taste_id, menu_item_id)
--    - places: (place_type, status, avg_rating DESC) INCLUDE (...)
--    - place_images: (place_id, is_cover) INCLUDE (image_url)
--    - opening_hours: (place_id, day_of_week) INCLUDE (open_time, close_time)
-- 3. Đảm bảo tính Idempotent (có thể chạy an toàn nhiều lần).
-- ===================================================================================

USE DaNangGo;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '>>> BẮT ĐẦU MIGRATION 007: CONSTRAINTS & INDEXES CHO DANANGGO...';
GO

-- ===================================================================================
-- PHẦN 1: RÀNG BUỘC KIỂM TRA (CHECK CONSTRAINTS) - CHẶN GIÁ ÂM & TRẠNG THÁI HỢP LỆ
-- ===================================================================================

-- 1.1. Bảng restaurants: Chặn giá âm triệt để (price_min >= 0, price_max >= 0 và price_min <= price_max)
IF EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_rest_price' AND parent_object_id = OBJECT_ID('dbo.restaurants')
)
BEGIN
    ALTER TABLE dbo.restaurants DROP CONSTRAINT chk_rest_price;
END;
GO

ALTER TABLE dbo.restaurants WITH CHECK ADD CONSTRAINT chk_rest_price
    CHECK (
        (price_min IS NULL OR price_min >= 0) AND
        (price_max IS NULL OR price_max >= 0) AND
        (price_min IS NULL OR price_max IS NULL OR price_max >= price_min)
    );
GO
PRINT '  [✓] Đã cập nhật chk_rest_price: Chặn giá âm trên bảng restaurants.';
GO

-- 1.2. Bảng menu_items: Đảm bảo giá món ăn không âm (price >= 0)
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_menu_price' AND parent_object_id = OBJECT_ID('dbo.menu_items')
)
BEGIN
    ALTER TABLE dbo.menu_items WITH CHECK ADD CONSTRAINT chk_menu_price 
        CHECK (price >= 0);
END;
GO
PRINT '  [✓] Đã xác nhận chk_menu_price: Giá món ăn không âm (price >= 0).';
GO

-- 1.3. Bảng attractions: Đảm bảo giá vé điểm du lịch không âm (ticket_price >= 0)
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_attr_price' AND parent_object_id = OBJECT_ID('dbo.attractions')
)
BEGIN
    ALTER TABLE dbo.attractions WITH CHECK ADD CONSTRAINT chk_attr_price 
        CHECK (ticket_price >= 0);
END;
GO
PRINT '  [✓] Đã xác nhận chk_attr_price: Giá vé điểm du lịch không âm (ticket_price >= 0).';
GO

-- 1.4. Bảng places: Đảm bảo ràng buộc trạng thái địa điểm hợp lệ
IF EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_places_status' AND parent_object_id = OBJECT_ID('dbo.places')
)
BEGIN
    ALTER TABLE dbo.places DROP CONSTRAINT chk_places_status;
END;
GO

ALTER TABLE dbo.places WITH CHECK ADD CONSTRAINT chk_places_status 
    CHECK (status IN ('ACTIVE', 'HIDDEN', 'PENDING', 'LOCKED'));
GO
PRINT '  [✓] Đã xác nhận chk_places_status: Cho phép ACTIVE, HIDDEN, PENDING, LOCKED.';
GO

-- 1.5. Bảng places: Đảm bảo điểm đánh giá trung bình từ 0 đến 5
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_places_rating' AND parent_object_id = OBJECT_ID('dbo.places')
)
BEGIN
    ALTER TABLE dbo.places WITH CHECK ADD CONSTRAINT chk_places_rating 
        CHECK (avg_rating >= 0 AND avg_rating <= 5);
END;
GO
PRINT '  [✓] Đã xác nhận chk_places_rating: Điểm đánh giá avg_rating từ 0 đến 5.';
GO


-- ===================================================================================
-- PHẦN 2: HỆ THỐNG CHỈ MỤC (INDEXES) TỐI ƯU HÓA TRUY VẤN LỌC & TÌM KIẾM
-- ===================================================================================

-- 2.1. Bảng restaurants: Chỉ mục lọc theo loại ẩm thực (cuisine_id) và khoảng giá (price_min, price_max)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_restaurants_cuisine_price' AND object_id = OBJECT_ID('dbo.restaurants')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_restaurants_cuisine_price
    ON dbo.restaurants (cuisine_id, price_min, price_max);
    PRINT '  [✓] Đã tạo index IX_restaurants_cuisine_price.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_restaurants_cuisine_price đã tồn tại.';
END;
GO

-- 2.2. Bảng attractions: Chỉ mục lọc theo loại điểm du lịch (category_id) và giá vé (ticket_price)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_attractions_category_price' AND object_id = OBJECT_ID('dbo.attractions')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_attractions_category_price
    ON dbo.attractions (category_id, ticket_price);
    PRINT '  [✓] Đã tạo index IX_attractions_category_price.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_attractions_category_price đã tồn tại.';
END;
GO

-- 2.3. Bảng menu_items: Chỉ mục tối ưu lấy thực đơn còn món kèm tên, giá, ảnh
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_menu_items_place_available' AND object_id = OBJECT_ID('dbo.menu_items')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_menu_items_place_available
    ON dbo.menu_items (place_id, is_available)
    INCLUDE (name, price, image_url);
    PRINT '  [✓] Đã tạo index IX_menu_items_place_available.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_menu_items_place_available đã tồn tại.';
END;
GO

-- 2.4. Bảng menu_item_tastes: Chỉ mục đảo ngược phục vụ lọc món theo khẩu vị
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_menu_item_tastes_taste_item' AND object_id = OBJECT_ID('dbo.menu_item_tastes')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_menu_item_tastes_taste_item
    ON dbo.menu_item_tastes (taste_id, menu_item_id);
    PRINT '  [✓] Đã tạo index IX_menu_item_tastes_taste_item.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_menu_item_tastes_taste_item đã tồn tại.';
END;
GO

-- 2.5. Bảng places: Chỉ mục tối ưu sắp xếp theo điểm đánh giá & phân trang
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_places_type_status_rating' AND object_id = OBJECT_ID('dbo.places')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_places_type_status_rating
    ON dbo.places (place_type, status, avg_rating DESC)
    INCLUDE (name, address, district_id, view_count, promo_label);
    PRINT '  [✓] Đã tạo index IX_places_type_status_rating.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_places_type_status_rating đã tồn tại.';
END;
GO

-- 2.6. Bảng place_images: Chỉ mục lấy ảnh bìa hoặc danh sách ảnh của địa điểm
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_place_images_place_cover' AND object_id = OBJECT_ID('dbo.place_images')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_place_images_place_cover
    ON dbo.place_images (place_id, is_cover)
    INCLUDE (image_url);
    PRINT '  [✓] Đã tạo index IX_place_images_place_cover.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_place_images_place_cover đã tồn tại.';
END;
GO

-- 2.7. Bảng opening_hours: Chỉ mục lấy giờ mở cửa theo ngày trong tuần
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_opening_hours_place_day' AND object_id = OBJECT_ID('dbo.opening_hours')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_opening_hours_place_day
    ON dbo.opening_hours (place_id, day_of_week)
    INCLUDE (open_time, close_time);
    PRINT '  [✓] Đã tạo index IX_opening_hours_place_day.';
END
ELSE
BEGIN
    PRINT '  [-] Index IX_opening_hours_place_day đã tồn tại.';
END;
GO

PRINT '>>> HOÀN TẤT MIGRATION 007 THÀNH CÔNG!';
GO
