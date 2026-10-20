-- ===================================================================================
-- Seed Data: 040_task7_comprehensive_seed.sql
-- Dữ liệu mẫu chuẩn toàn diện cho Task 7 (Điểm du lịch, Nhà hàng, Thực đơn, Giờ mở cửa, Ảnh)
-- Idempotent: Sử dụng IF NOT EXISTS theo tên địa điểm
-- ===================================================================================

USE DaNangGo;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

PRINT '>>> BẮT ĐẦU NẠP DỮ LIỆU SEED TASK 7 QUA SQL SCRIPT...';
GO

-- 1. NẠP ĐIỂM DU LỊCH MẪU NỔI TIẾNG ĐÀ NẴNG (ATTRACTIONS)
DECLARE @HoaVang INT = (SELECT district_id FROM districts WHERE name = N'Hòa Vang');
DECLARE @SonTra INT = (SELECT district_id FROM districts WHERE name = N'Sơn Trà');
DECLARE @NguHanhSon INT = (SELECT district_id FROM districts WHERE name = N'Ngũ Hành Sơn');
DECLARE @HaiChau INT = (SELECT district_id FROM districts WHERE name = N'Hải Châu');

DECLARE @GiaiTri INT = (SELECT category_id FROM attraction_categories WHERE name = N'Giải trí');
DECLARE @TamLinh INT = (SELECT category_id FROM attraction_categories WHERE name = N'Chùa / Tâm linh');
DECLARE @VanHoa INT = (SELECT category_id FROM attraction_categories WHERE name = N'Văn hóa / Lịch sử');
DECLARE @BaiBien INT = (SELECT category_id FROM attraction_categories WHERE name = N'Bãi biển');

-- 1.1 Sun World Bà Nà Hills
IF NOT EXISTS (SELECT 1 FROM places WHERE name = N'Sun World Bà Nà Hills' AND place_type = 'ATTRACTION')
BEGIN
    INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, booking_url, promo_label, avg_rating, review_count, view_count, status, created_at)
    VALUES ('ATTRACTION', N'Sun World Bà Nà Hills', N'Thiên đường nghỉ dưỡng và vui chơi giải trí trên đỉnh núi Chúa ở độ cao 1.487m. Nổi tiếng với Cầu Vàng bàn tay khổng lồ, Làng Pháp cổ kính.', N'Tuyến cáp treo Bà Nà - Suối Mơ, An Sơn, Hòa Ninh', @HoaVang, 15.9988, 107.9881, '02363791999', 'https://banahills.sunworld.vn', 'https://dananggo.vn/ve/ba-na-hills', N'Biểu tượng du lịch', 4.8, 3450, 8900, 'ACTIVE', GETDATE());

    DECLARE @P_BaNa INT = SCOPE_IDENTITY();
    INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
    VALUES (@P_BaNa, 'ATTRACTION', @GiaiTri, 900000, 360);
END;

-- 1.2 Bán Đảo Sơn Trà & Chùa Linh Ứng
IF NOT EXISTS (SELECT 1 FROM places WHERE name = N'Bán Đảo Sơn Trà & Chùa Linh Ứng' AND place_type = 'ATTRACTION')
BEGIN
    INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, booking_url, promo_label, avg_rating, review_count, view_count, status, created_at)
    VALUES ('ATTRACTION', N'Bán Đảo Sơn Trà & Chùa Linh Ứng', N'Khu bảo tồn thiên nhiên đa dạng với tượng Phật Bà Quan Âm cao 67m hướng nhìn ra biển Đông, đỉnh Bàn Cờ huyền thoại.', N'Bán đảo Sơn Trà, Thọ Quang', @SonTra, 16.1008, 108.2774, '02363935567', 'https://sontra.danang.gov.vn', 'https://dananggo.vn/tour/ban-dao-son-tra', N'Lá phổi xanh Đà Nẵng', 4.9, 2980, 7600, 'ACTIVE', GETDATE());

    DECLARE @P_SonTra INT = SCOPE_IDENTITY();
    INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
    VALUES (@P_SonTra, 'ATTRACTION', @TamLinh, 0, 180);
END;

-- 1.3 Danh Thắng Ngũ Hành Sơn
IF NOT EXISTS (SELECT 1 FROM places WHERE name = N'Danh Thắng Ngũ Hành Sơn' AND place_type = 'ATTRACTION')
BEGIN
    INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, booking_url, promo_label, avg_rating, review_count, view_count, status, created_at)
    VALUES ('ATTRACTION', N'Danh Thắng Ngũ Hành Sơn', N'Quần thể 5 ngọn núi đá vôi kỳ vĩ gắn liền với truyền thuyết ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ), lưu giữ hệ thống hang động huyền ảo.', N'81 Huyền Trân Công Chúa, Hòa Hải', @NguHanhSon, 16.0044, 108.2635, '02363961114', 'https://nguhanhson.danang.gov.vn', 'https://dananggo.vn/ve/ngu-hanh-son', N'Di tích quốc gia đặc biệt', 4.6, 1890, 5100, 'ACTIVE', GETDATE());

    DECLARE @P_NguHanhSon INT = SCOPE_IDENTITY();
    INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
    VALUES (@P_NguHanhSon, 'ATTRACTION', @VanHoa, 40000, 120);
END;

-- 1.4 Cầu Rồng & Cầu Tình Yêu
IF NOT EXISTS (SELECT 1 FROM places WHERE name = N'Cầu Rồng & Cầu Tình Yêu Đà Nẵng' AND place_type = 'ATTRACTION')
BEGIN
    INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, booking_url, promo_label, avg_rating, review_count, view_count, status, created_at)
    VALUES ('ATTRACTION', N'Cầu Rồng & Cầu Tình Yêu Đà Nẵng', N'Cây cầu bắc qua sông Hàn có kiến trúc độc đáo mô phỏng con rồng thời Lý vươn mình ra biển lớn. Trở thành tâm điểm lễ hội với màn phun lửa và phun nước rực rỡ.', N'Đường Nguyễn Văn Linh nối dài Trần Hưng Đạo', @HaiChau, 16.0611, 108.2272, '02363822288', 'https://danangfantasticity.com/cau-rong', 'https://dananggo.vn/diem-den/cau-rong', N'Biểu tượng thành phố', 4.8, 4200, 9800, 'ACTIVE', GETDATE());

    DECLARE @P_CauRong INT = SCOPE_IDENTITY();
    INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
    VALUES (@P_CauRong, 'ATTRACTION', @VanHoa, 0, 60);
END;

-- 1.5 Bãi Biển Mỹ Khê
IF NOT EXISTS (SELECT 1 FROM places WHERE name = N'Bãi Biển Mỹ Khê' AND place_type = 'ATTRACTION')
BEGIN
    INSERT INTO places (place_type, name, description, address, district_id, latitude, longitude, phone, website, booking_url, promo_label, avg_rating, review_count, view_count, status, created_at)
    VALUES ('ATTRACTION', N'Bãi Biển Mỹ Khê', N'Bãi biển từng được tạp chí Forbes bình chọn là một trong những bãi biển quyến rũ nhất hành tinh với bờ cát trắng mịn thoai thoải, làn nước trong xanh ấm áp quanh năm.', N'Đường Võ Nguyên Giáp, Phước Mỹ', @SonTra, 16.0683, 108.2468, '02363999111', 'https://danangfantasticity.com/bien-my-khe', 'https://dananggo.vn/diem-den/bien-my-khe', N'Top bãi biển thế giới', 4.9, 5120, 12500, 'ACTIVE', GETDATE());

    DECLARE @P_MyKhe INT = SCOPE_IDENTITY();
    INSERT INTO attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
    VALUES (@P_MyKhe, 'ATTRACTION', @BaiBien, 0, 120);
END;

PRINT '>>> HOÀN THÀNH SEED DỮ LIỆU ĐIỂM DU LỊCH!';
GO
