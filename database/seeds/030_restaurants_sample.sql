-- ============================================================
-- Seed Data: 030_restaurants_sample.sql
-- Dữ liệu mẫu Nhà hàng bám sát UI Frontend (trang amthuc)
-- ============================================================

USE DaNangGo;
GO

-- 1. Xóa dữ liệu cũ của nhà hàng
DELETE FROM restaurants;
DELETE FROM places WHERE place_type = 'RESTAURANT';
GO

-- 2. Thêm vào bảng places (Bảng cha)
-- Lấy ID của các quận để map
DECLARE @HaiChau INT = (SELECT district_id FROM districts WHERE name = N'Hải Châu');
DECLARE @NguHanhSon INT = (SELECT district_id FROM districts WHERE name = N'Ngũ Hành Sơn');
DECLARE @SonTra INT = (SELECT district_id FROM districts WHERE name = N'Sơn Trà');
DECLARE @ThanhKhe INT = (SELECT district_id FROM districts WHERE name = N'Thanh Khê');

-- Insert 4 nhà hàng mẫu lấy từ UI
INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, avg_rating, review_count, view_count, promo_label, status, created_at)
VALUES 
('RESTAURANT', N'Hải Sản Tươi Sống Mỹ Khê', N'Nhà hàng hải sản uy tín, tôm cua bắt từ thuyền vào buổi sáng.', N'Đường Võ Nguyên Giáp', @NguHanhSon, 16.0594, 108.2443, 4.6, 987, 1500, N'Hải sản tươi sống', 'ACTIVE', GETDATE()),
('RESTAURANT', N'Bánh Xèo Bà Ba', N'Bánh xèo đường kính 45cm, giòn rụm, nhân tôm thịt đầy ắp.', N'Đường Trưng Nữ Vương', @HaiChau, 16.0544, 108.2201, 4.9, 2098, 3000, N'Đặc sản số 1', 'ACTIVE', GETDATE()),
('RESTAURANT', N'Cao Lầu Hội An Giao Lưu', N'Cao lầu chuẩn phong cách Hội An, một bước không cần ra Phố cổ.', N'Đường Phạm Văn Đồng', @SonTra, 16.0711, 108.2381, 4.7, 543, 800, N'Mì Quảng gia truyền', 'ACTIVE', GETDATE()),
('RESTAURANT', N'Mì Hoành Thánh Tàu Bay', N'Mì hoành thánh phong cách người Hoa, tồn tại hơn 50 năm tại Đà Nẵng.', N'Đường Trần Cao Vân', @ThanhKhe, 16.0678, 108.1923, 4.5, 876, 1200, N'Đặc sản số 1', 'ACTIVE', GETDATE());

-- 3. Thêm vào bảng restaurants (Bảng con)
DECLARE @HaiSanId INT = (SELECT cuisine_id FROM cuisines WHERE name = N'Hải sản');
DECLARE @BanhXeoId INT = (SELECT cuisine_id FROM cuisines WHERE name = N'Bánh xèo');
DECLARE @CaoLauId INT = (SELECT cuisine_id FROM cuisines WHERE name = N'Cao lầu');
DECLARE @MiId INT = (SELECT cuisine_id FROM cuisines WHERE name = N'Mì Quảng'); -- Gắn tạm

DECLARE @P1 INT = (SELECT place_id FROM places WHERE name = N'Hải Sản Tươi Sống Mỹ Khê');
DECLARE @P2 INT = (SELECT place_id FROM places WHERE name = N'Bánh Xèo Bà Ba');
DECLARE @P3 INT = (SELECT place_id FROM places WHERE name = N'Cao Lầu Hội An Giao Lưu');
DECLARE @P4 INT = (SELECT place_id FROM places WHERE name = N'Mì Hoành Thánh Tàu Bay');

INSERT INTO restaurants (place_id, place_type, cuisine_id, price_min, price_max)
VALUES 
(@P1, 'RESTAURANT', @HaiSanId, 150000, 500000),
(@P2, 'RESTAURANT', @BanhXeoId, 45000, 80000),
(@P3, 'RESTAURANT', @CaoLauId, 40000, 65000),
(@P4, 'RESTAURANT', @MiId, 35000, 55000);

-- 4. Thêm ảnh (cover)
INSERT INTO place_images (place_id, image_url, is_cover)
VALUES 
(@P1, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', 1),
(@P2, 'https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=600&q=80', 1),
(@P3, 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=600&q=80', 1),
(@P4, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', 1);

PRINT '✅ Đã thêm 4 nhà hàng mẫu (places, restaurants, place_images)';
GO
