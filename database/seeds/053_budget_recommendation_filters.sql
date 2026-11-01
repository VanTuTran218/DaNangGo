-- Bổ sung dữ liệu công khai cho catalog kiểm thử gợi ý theo ngân sách.
-- Chạy SAU 050, 051, 052. Chạy lại không tạo trùng; không ghi đè chỉnh sửa của partner.
-- Lookup IDs 1-5 cuisine, 1-7 district, 1-6 taste, 1-5 attraction category:
-- đối chiếu database/schema/DaNangGo_SqlServer.sql và DB local. Tên trong DB local bị mojibake.
-- Loại món: https://danangfantasticity.com/en/tin-tuc/co-so-an-uong-dat-chuan-phuc-vuc-khach-du-lich-tai-dia-ban-thanh-pho-da-nang
-- Hạng 5 sao: https://danangfantasticity.com/cn/5-sao-vi/kham-pha-he-thong-khach-san-5-sao-tai-da-nang
-- Hạng 4 sao: https://danangfantasticity.com/cn/kham-pha-he-thong-khach-san-4-sao-tai-da-nang
-- Monarque: https://www.agoda.com/monarque-hotel-danang/hotel/da-nang-vn.html
-- Quận tham quan: https://danangfantasticity.com/en/discovery/my-khe-beach-one-of-the-ten-most-beautiful-beaches-in-asia
-- https://danangfantasticity.com/en/culture/linh-ung-pagoda
-- https://danangfantasticity.com/en/natural/marble-mountains
-- https://sunworld.vn/vi/banahills/tin-tuc-du-lich/dinh-ba-na-hills-cao-bao-nhieu-1943
-- Thực đơn/giá món: https://www.amthucxeo.com/thuc-don.html
-- https://khamphadanang.vn/dia-diem/bep-hen-vietnamese-restaurant/
-- Khẩu vị là phân loại suy ra từ tên/thành phần món, không phải đánh giá do nhà hàng cung cấp.
-- Giá menu là giá tham khảo tại nguồn; cần xác nhận lại trước khi dùng để bán/đặt món.
USE DaNangGo;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT dbo.cuisines (name)
SELECT s.name FROM (VALUES (N'Món chay'), (N'Món Á - Âu')) s(name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.cuisines c WHERE c.name = s.name);

UPDATE r SET cuisine_id = COALESCE(s.cuisine_id, c.cuisine_id)
FROM dbo.restaurants r
JOIN dbo.places p ON p.place_id = r.place_id AND p.place_type = 'RESTAURANT'
JOIN (VALUES
 (22, N'Cơm niêu Trúc Lâm Viên', 1, NULL),
 (23, N'Nhà hàng Madame Lân', 1, NULL),
 (24, N'Nhà hàng – Cà phê Không Gian Xưa', 4, NULL),
 (25, N'Café & Restaurant Trúc Lâm Viên', 4, NULL),
 (26, N'Nhà hàng Phố Biển', 2, NULL),
 (27, N'Ẩm Thực XÈO', 3, NULL),
 (28, N'Đặc sản Hoàng Tín', 3, NULL),
 (29, N'Retro Kitchen & Bar', NULL, N'Món Á - Âu'),
 (30, N'Namas Seafood & Restaurant', 2, NULL),
 (31, N'The Lob Seafood.Bar', 2, NULL),
 (32, N'Nhà hàng Mỹ Hạnh', 2, NULL),
 (33, N'Nhà hàng For You Beach', 2, NULL),
 (34, N'Hoa Lúa Chay', NULL, N'Món chay'),
 (35, N'Nhà hàng chay Tâm Châu', NULL, N'Món chay'),
 (36, N'Bếp Hên – Về Nhà Có Cơm', 1, NULL)
) s(place_id, place_name, cuisine_id, cuisine_name) ON s.place_id=p.place_id AND s.place_name=p.name
LEFT JOIN dbo.cuisines c ON c.name=s.cuisine_name
WHERE r.cuisine_id IS NULL;

UPDATE a SET star_rating=s.star_rating
FROM dbo.accommodations a
JOIN dbo.places p ON p.place_id=a.place_id AND p.place_type='ACCOMMODATION'
JOIN (VALUES
 (7, N'Furama Resort Danang', 5), (8, N'Naman Retreat', 5),
 (9, N'TIA Wellness Resort', 5), (19, N'Sala Danang Beach Hotel', 4),
 (20, N'HAIAN Beach Hotel & Spa', 4), (21, N'Monarque Hotel Danang', 4)
) s(place_id, place_name, star_rating) ON s.place_id=p.place_id AND s.place_name=p.name
WHERE a.star_rating IS NULL;

UPDATE p SET district_id=s.district_id
FROM dbo.places p
JOIN (VALUES
 (2, N'Biển Mỹ Khê', 2),
 (4, N'Chùa Linh Ứng Sơn Trà', 2),
 (5, N'Danh thắng Ngũ Hành Sơn', 3),
 (6, N'Cầu Vàng - Bà Nà Hills', 7)
) s(place_id, place_name, district_id) ON s.place_id=p.place_id AND s.place_name=p.name
WHERE p.place_type='ATTRACTION' AND p.district_id IS NULL;

-- Ngũ Hành Sơn có cả giá trị lịch sử/văn hóa, nhưng danh mục tự nhiên phù hợp hơn
-- với mô tả núi và hang động trong cổng thông tin du lịch thành phố.
UPDATE a SET category_id=2
FROM dbo.attractions a JOIN dbo.places p ON p.place_id=a.place_id
WHERE p.place_id=5 AND p.name=N'Danh thắng Ngũ Hành Sơn' AND a.category_id=3;

-- Chỉ thêm món có tên và giá riêng được nguồn công khai nêu rõ.
INSERT dbo.menu_items (place_id, name, description, price, is_available)
SELECT p.place_id, s.item_name, N'Giá tham khảo từ ' + s.source_url + N'; vui lòng xác nhận menu hiện hành.', s.price, 1
FROM (VALUES
 (27, N'Ẩm Thực XÈO', N'Chả Giò Phô Mai', 89000, N'https://www.amthucxeo.com/thuc-don.html'),
 (27, N'Ẩm Thực XÈO', N'Cánh Gà Chiên Mắm', 159000, N'https://www.amthucxeo.com/thuc-don.html'),
 (27, N'Ẩm Thực XÈO', N'Bò Xào Tiêu Đen', 159000, N'https://www.amthucxeo.com/thuc-don.html'),
 (27, N'Ẩm Thực XÈO', N'Tôm Sốt Bơ Tỏi Lý Sơn', 299000, N'https://www.amthucxeo.com/thuc-don.html'),
 (27, N'Ẩm Thực XÈO', N'Bánh Xèo Tôm Nhảy', 69000, N'https://www.amthucxeo.com/thuc-don.html'),
 (36, N'Bếp Hên – Về Nhà Có Cơm', N'Canh chua cá lóc', 80000, N'https://khamphadanang.vn/dia-diem/bep-hen-vietnamese-restaurant/'),
 (36, N'Bếp Hên – Về Nhà Có Cơm', N'Salad rong biển', 89000, N'https://khamphadanang.vn/dia-diem/bep-hen-vietnamese-restaurant/')
) s(place_id, place_name, item_name, price, source_url)
JOIN dbo.places p ON p.place_id=s.place_id AND p.name=s.place_name AND p.place_type='RESTAURANT'
WHERE NOT EXISTS (SELECT 1 FROM dbo.menu_items mi WHERE mi.place_id=p.place_id AND mi.name=s.item_name);

INSERT dbo.menu_item_tastes (menu_item_id, taste_id)
SELECT mi.menu_item_id, s.taste_id
FROM (VALUES
 (27, N'Chả Giò Phô Mai', 6),
 (27, N'Cánh Gà Chiên Mắm', 4),
 (27, N'Bò Xào Tiêu Đen', 1),
 (27, N'Tôm Sốt Bơ Tỏi Lý Sơn', 6),
 (36, N'Canh chua cá lóc', 3),
 (36, N'Salad rong biển', 5)
) s(place_id, item_name, taste_id)
JOIN dbo.menu_items mi ON mi.place_id=s.place_id AND mi.name=s.item_name AND mi.description LIKE N'Giá tham khảo từ %'
WHERE NOT EXISTS (SELECT 1 FROM dbo.menu_item_tastes mit WHERE mit.menu_item_id=mi.menu_item_id AND mit.taste_id=s.taste_id);

COMMIT TRANSACTION;
GO
