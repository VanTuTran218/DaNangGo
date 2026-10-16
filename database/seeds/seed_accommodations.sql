USE [DaNangGo];
GO
/* Quận được tìm theo TÊN (không phụ thuộc id, vì seed 010 của Tú đánh số lại quận).
   Dữ liệu mẫu lưu trú để cả nhóm test. Chạy SAU migration 005. Chạy lại nhiều lần không bị trùng.
   Xóa dữ liệu mẫu:  DELETE FROM dbo.places WHERE name LIKE N'[[]Mẫu]%';  */
SET NOCOUNT ON;

DECLARE @seed TABLE (name NVARCHAR(200), addr NVARCHAR(255), district_name NVARCHAR(50), lat DECIMAL(9,6), lng DECIMAL(9,6),
                     kind VARCHAR(20), star TINYINT NULL, base INT);
INSERT @seed VALUES
 (N'[Mẫu] Khách sạn Biển Xanh',    N'12 Võ Nguyên Giáp',  N'Sơn Trà', 16.054400, 108.247000, 'HOTEL',    4,    900000),
 (N'[Mẫu] Homestay Sông Hàn',      N'5 Bạch Đằng',        N'Hải Châu', 16.067800, 108.220800, 'HOMESTAY', NULL, 350000),
 (N'[Mẫu] Resort Ngũ Hành Sơn',    N'Đường Trường Sa',    N'Ngũ Hành Sơn', 16.001700, 108.263000, 'RESORT',   5,   2500000),
 (N'[Mẫu] Khách sạn Thanh Khê',    N'80 Điện Biên Phủ',   N'Thanh Khê', 16.072000, 108.195000, 'HOTEL',    3,    500000),
 (N'[Mẫu] Homestay Hòa Vang',      N'Thôn Hòa Phú',       N'Hòa Vang', 15.990000, 108.090000, 'HOMESTAY', NULL, 300000);

DECLARE @new TABLE (place_id INT, name NVARCHAR(200));

INSERT dbo.places (place_type, name, description, address, district_id, latitude, longitude, status)
OUTPUT INSERTED.place_id, INSERTED.name INTO @new
SELECT 'ACCOMMODATION', s.name, N'Dữ liệu mẫu để kiểm thử', s.addr,
       (SELECT TOP 1 d.district_id FROM dbo.districts d WHERE d.name = s.district_name), s.lat, s.lng, 'ACTIVE'
FROM @seed s WHERE NOT EXISTS (SELECT 1 FROM dbo.places p WHERE p.name = s.name);

INSERT dbo.accommodations (place_id, place_type, accommodation_type, star_rating, check_in_time, check_out_time)
SELECT n.place_id, 'ACCOMMODATION', s.kind, s.star, '14:00', '12:00'
FROM @new n JOIN @seed s ON s.name = n.name;

DECLARE @room TABLE (rname NVARCHAR(100), cap TINYINT, mult DECIMAL(4,2), cnt INT, promo BIT);
INSERT @room VALUES (N'Phòng đơn', 1, 0.70, 5, 0), (N'Phòng đôi', 2, 1.00, 8, 1), (N'Phòng gia đình', 4, 1.60, 3, 0);

INSERT dbo.room_types (place_id, name, capacity, price_per_night, original_price, room_count)
SELECT n.place_id, r.rname, r.cap,
       CAST(ROUND(s.base * r.mult / 1000, 0) * 1000 AS DECIMAL(18,0)),
       CASE WHEN r.promo = 1 THEN CAST(ROUND(s.base * r.mult * 1.2 / 1000, 0) * 1000 AS DECIMAL(18,0)) END,
       r.cnt
FROM @new n JOIN @seed s ON s.name = n.name CROSS JOIN @room r;

-- Tiện nghi: 1 Wi-Fi, 2 Hồ bơi, 3 Bữa sáng, 4 Điều hòa, 5 Đưa đón sân bay, 6 Đậu xe, 7 Gần biển
INSERT dbo.accommodation_amenities (place_id, amenity_id)
SELECT n.place_id, a.id FROM @new n JOIN @seed s ON s.name = n.name
CROSS APPLY (VALUES (1), (4), (2), (3), (5), (6), (7)) AS a(id)
WHERE a.id IN (1, 4)
   OR (a.id IN (2, 3, 5) AND s.star >= 4)
   OR (a.id = 6 AND s.kind <> 'HOMESTAY')
   OR (a.id = 7 AND s.district_name = N'Sơn Trà');

SELECT p.place_id, p.name, a.accommodation_type,
       (SELECT COUNT(*) FROM dbo.room_types r WHERE r.place_id = p.place_id) AS rooms,
       (SELECT COUNT(*) FROM dbo.accommodation_amenities x WHERE x.place_id = p.place_id) AS amenities
FROM dbo.places p JOIN dbo.accommodations a ON a.place_id = p.place_id
WHERE p.name LIKE N'[[]Mẫu]%';
GO
