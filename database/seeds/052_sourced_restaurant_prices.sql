-- Giá tham khảo tra ngày 2026-10-29; có thể thay đổi, không phải báo giá hiện hành.
-- Chỉ cập nhật bản ghi seed ranking đúng ID/tên và còn thiếu cả hai giá;
-- riêng XÈO thay khoảng giá menu tiệc đã nhập từ lần chạy trước.
-- Chạy bằng sqlcmd -f 65001 để so khớp tên tiếng Việt.
-- 22: https://vn.exp.gg/thong-tin/quan-com-ngon-nhat-tai-da-nang-1638393429/ (50k-110k)
-- 23: https://khamphadanang.vn/dia-diem/madame-lan-da-nang/ (70k-300k)
-- 24: https://pasgo.vn/nha-hang/nha-hang-khong-gian-xua-dien-bien-phu-1824 (200k-400k/người)
-- 25: https://restaurantguru.com/Nha-hang-cafe-Truc-Lam-Vien-Da-Nang (100k-200k/người, 08 Trần Quý Cáp)
-- 26: https://pasgo.vn/nha-hang/nha-hang-pho-bien-nguyen-tat-thanh-2791 (80k-150k/người, số 231; seed ghi 229-231)
-- 27: https://khamphadanang.vn/dia-diem/danh-gia-am-thuc-xeo/ (60k-180k)
-- 28: https://www.taidanang.com/banh-trang-thit-heo-da-nang/ (79k-119k, bài cũ tại 12 Lê Hồng Phong)
-- 29: https://www.foody.vn/da-nang/retro-kitchen-bar/album-thuc-don (30k-100k)
-- 30: https://www.foody.vn/da-nang/namas-seafood-restaurant-bar/gioi-thieu/danh-thuc-ngu-giac-voi-xo-hai-san-vua-boc-vua-xoi-co-1-0-2-o-da-nang-1029 (45k-300k; bài ghi 57 Lý Tự Trọng, hồ sơ hiện ghi 195 Trần Phú)
-- 31: https://www.foody.vn/da-nang/the-lob-seafood-bar (17k-600k, 48 Nguyễn Chí Thanh; Restaurant Guru báo đã đóng cửa)
-- 32: https://salahotelgroup.com/da-nang-recommendation-list/ (150k-440k, lô 17-18 Võ Nguyên Giáp)
-- 33: https://khamphadanang.vn/dia-diem/nha-hang-4u-seafood-da-nang/ (200k-1000k, tên 4U Beach/For You Beach tại lô 9-10)
-- 34: https://pasgo.vn/nha-hang/hoa-lua-chay-kbt-dao-xanh-3708 (100k-150k/người)
-- 35: https://kinhnghiemdulich.vn/top-7-nha-hang-chay-ngon-va-noi-tieng-nhat-hai-chau-da-nang/ (25k-100k/người, 15 Đông Kinh Nghĩa Thục)
-- 36: https://www.foody.vn/da-nang/bep-hen-ve-nha-co-com (25k-85k)
USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

UPDATE r SET price_min = s.price_min, price_max = s.price_max
FROM dbo.restaurants r
JOIN dbo.places p ON p.place_id = r.place_id AND p.place_type = 'RESTAURANT'
JOIN (VALUES
  (22, N'Cơm niêu Trúc Lâm Viên', 50000, 110000),
  (23, N'Nhà hàng Madame Lân', 70000, 300000),
  (24, N'Nhà hàng – Cà phê Không Gian Xưa', 200000, 400000),
  (25, N'Café & Restaurant Trúc Lâm Viên', 100000, 200000),
  (26, N'Nhà hàng Phố Biển', 80000, 150000),
  (27, N'Ẩm Thực XÈO', 60000, 180000),
  (28, N'Đặc sản Hoàng Tín', 79000, 119000),
  (29, N'Retro Kitchen & Bar', 30000, 100000),
  (30, N'Namas Seafood & Restaurant', 45000, 300000),
  (31, N'The Lob Seafood.Bar', 17000, 600000),
  (32, N'Nhà hàng Mỹ Hạnh', 150000, 440000),
  (33, N'Nhà hàng For You Beach', 200000, 1000000),
  (34, N'Hoa Lúa Chay', 100000, 150000),
  (35, N'Nhà hàng chay Tâm Châu', 25000, 100000),
  (36, N'Bếp Hên – Về Nhà Có Cơm', 25000, 85000)
) s(place_id, name, price_min, price_max) ON s.place_id = p.place_id AND s.name = p.name
WHERE (r.price_min IS NULL AND r.price_max IS NULL)
   OR (p.place_id = 27 AND r.price_min = 59000 AND r.price_max = 1499000);

COMMIT TRANSACTION;
GO
