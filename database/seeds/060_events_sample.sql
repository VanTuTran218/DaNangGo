-- ============================================================
-- Seed 060: Dữ liệu mẫu Sự kiện (Events) cho DaNangGo
-- Bao gồm các trường hợp: Miễn phí, Có phí, Kéo dài nhiều ngày, Đổi lịch, Đã hủy và Bản nháp
-- Thiết kế ngày động theo ngày chạy thực tế (GETDATE()) để luôn có dữ liệu cho "Hôm nay", "Cuối tuần này"
-- ============================================================

USE DaNangGo;
GO

-- Xóa dữ liệu mẫu cũ nếu có
DELETE FROM dbo.events WHERE slug IN (
    'workshop-lam-den-long-truyen-thong',
    'le-hoi-am-thuc-duong-pho-da-nang',
    'dem-nhac-acoustic-ben-song-han',
    'trien-lam-anh-da-nang-xua-va-nay',
    'giai-chay-marathon-cau-rong',
    'le-hoi-dieu-bien-my-khe',
    'dai-nhac-hoi-edm-chao-he'
);
GO

-- Lấy mốc thời gian hiện tại theo giờ Việt Nam
DECLARE @Now DATETIME2(0) = DATEADD(HOUR, 7, SYSUTCDATETIME());
DECLARE @TodayStart DATETIME2(0) = CAST(CAST(@Now AS DATE) AS DATETIME2(0));

-- Tính mốc Thứ Bảy và Chủ Nhật tuần này
DECLARE @DayOfWeek INT = DATEPART(WEEKDAY, @TodayStart); -- 1: CN, 2: T2, ..., 7: T7 (tùy setting @@DATEFIRST)
-- Đảm bảo tính toán chuẩn độc lập với @@DATEFIRST
DECLARE @DaysUntilSaturday INT = (7 - ((DATEPART(dw, @TodayStart) + @@DATEFIRST - 2) % 7 + 1));
IF @DaysUntilSaturday < 0 SET @DaysUntilSaturday = @DaysUntilSaturday + 7;

DECLARE @ThisSaturday DATETIME2(0) = DATEADD(DAY, @DaysUntilSaturday, @TodayStart);
DECLARE @ThisSunday DATETIME2(0) = DATEADD(DAY, 1, @ThisSaturday);

-- 1. Workshop làm đèn lồng truyền thống (Miễn phí · Cần đăng ký, Diễn ra Thứ Bảy tuần này, Nổi bật)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Workshop làm đèn lồng truyền thống',
    'workshop-lam-den-long-truyen-thong',
    N'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    N'Trải nghiệm tự tay làm chiếc đèn lồng Hội An truyền thống dưới sự hướng dẫn của nghệ nhân làng nghề.',
    N'Đến với workshop, bạn sẽ được hướng dẫn tỉ mỉ từng bước từ uốn khung tre, bọc lụa gấm tơ tằm đến vẽ họa tiết trang trí. Toàn bộ vật liệu được ban tổ chức chuẩn bị sẵn. Mỗi người tham gia sẽ được mang tác phẩm của mình về làm quà lưu niệm.' + CHAR(13) + CHAR(10) +
    N'Lịch trình:' + CHAR(13) + CHAR(10) +
    N'- 14:00: Đón khách và giới thiệu lịch sử nghề đèn lồng' + CHAR(13) + CHAR(10) +
    N'- 14:30: Thực hành bọc lụa và trang trí' + CHAR(13) + CHAR(10) +
    N'- 15:45: Hoàn thiện sản phẩm và chụp ảnh lưu niệm.',
    'WORKSHOP',
    DATEADD(HOUR, 14, @ThisSaturday),
    DATEADD(HOUR, 16, @ThisSaturday),
    0,
    N'Bảo tàng Điêu khắc Chăm & Không gian Văn hóa',
    N'Số 02 đường 2 Tháng 9, Bình Hiên',
    N'Hải Châu',
    16.060123, 108.223456,
    'FREE_REGISTRATION',
    N'Miễn phí · Cần đăng ký trước',
    N'https://dananggo.vn/dang-ky/workshop-den-long',
    DATEADD(HOUR, 23, DATEADD(DAY, -1, @ThisSaturday)),
    N'CLB Nghệ Thuật Dân Gian Đà Nẵng',
    N'contact@danangfolkart.vn · 0905123456',
    N'https://danangtourism.gov.vn/events/workshop-den-long',
    1,
    'PUBLISHED',
    NULL
);

-- 2. Lễ hội Ẩm thực Đường phố Đà Nẵng (Miễn phí · Vào cửa tự do, Kéo dài 3 ngày từ Thứ Sáu đến Chủ Nhật)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Lễ hội Ẩm thực Đường phố Đà Nẵng 2026',
    'le-hoi-am-thuc-duong-pho-da-nang',
    N'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    N'Quy tụ hơn 50 gian hàng ẩm thực đặc sản miền Trung cùng các màn trình diễn nấu ăn đỉnh cao ven sông Hàn.',
    N'Không gian lễ hội mở cửa miễn phí cho tất cả người dân và du khách. Bạn có thể thưởng thức bánh xèo, nem lụi, mì Quảng, hải sản tươi nướng cùng các loại chè Đà Thành thơm ngon. Buổi tối có sân khấu acoustic và các trò chơi dân gian có thưởng.',
    'FOOD',
    DATEADD(HOUR, 16, DATEADD(DAY, -1, @ThisSaturday)), -- Chiều Thứ 6
    DATEADD(HOUR, 22, @ThisSunday),                      -- Tối Chủ Nhật
    0,
    N'Công viên Bờ Đông Cầu Rồng',
    N'Đường Trần Hưng Đạo, An Hải Tây',
    N'Sơn Trà',
    16.061234, 108.229876,
    'FREE_OPEN',
    N'Miễn phí · Vào cửa tự do',
    NULL,
    NULL,
    N'Sở Du lịch Thành phố Đà Nẵng',
    N'dulich@danang.gov.vn',
    N'https://danangtourism.gov.vn/am-thuc-duong-pho-2026',
    1,
    'PUBLISHED',
    NULL
);

-- 3. Đêm nhạc Acoustic Bên Bờ Sông Hàn (Có phí · Xem vé, Diễn ra Tối Hôm Nay / Ngày mai)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Đêm nhạc Acoustic Bên Bờ Sông Hàn',
    'dem-nhac-acoustic-ben-song-han',
    N'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    N'Thả hồn vào những giai điệu tình ca nhẹ nhàng trong không gian lộng gió nhìn ra cầu quay Sông Hàn.',
    N'Đêm nhạc với sự góp mặt của ban nhạc Acoustic Đà Nẵng và các ca sĩ trẻ được yêu thích. Giá vé đã bao gồm 01 phần nước uống tự chọn (mocktail hoặc trà trái cây cao cấp).',
    'MUSIC',
    DATEADD(HOUR, 19, @TodayStart),
    DATEADD(HOUR, 22, @TodayStart),
    0,
    N'Sky36 Rooftop Lounge Bar',
    N'36 Bạch Đằng, Thạch Thang',
    N'Hải Châu',
    16.075432, 108.224321,
    'PAID',
    N'150.000đ - 250.000đ',
    N'https://ticketbox.vn/danang-acoustic-night',
    DATEADD(HOUR, 18, @TodayStart),
    N'Han River Live Club',
    N'0905987654 · fanpage.com/hanriverlive',
    N'https://ticketbox.vn/danang-acoustic-night',
    0,
    'PUBLISHED',
    NULL
);

-- 4. Triển lãm Ảnh Nghệ thuật Đà Nẵng - Xưa và Nay (Cả ngày, Kéo dài 10 ngày)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Triển lãm Ảnh Nghệ thuật Đà Nẵng - Xưa và Nay',
    'trien-lam-anh-da-nang-xua-va-nay',
    N'https://images.unsplash.com/photo-1531247484795-1a1a5b6c22cb?auto=format&fit=crop&w=1200&q=80',
    N'Hơn 120 tác phẩm nhiếp ảnh quý hiếm ghi lại những khoảnh khắc chuyển mình rực rỡ của thành phố đầu biển cuối sông.',
    N'Triển lãm mở cửa tự do hàng ngày cho công chúng và du khách. Triển lãm được chia làm 3 không gian: Ký ức Ngũ Hành Sơn, Dòng sông của những cây cầu và Đô thị đáng sống thế kỷ 21.',
    'EXHIBITION',
    DATEADD(DAY, -2, @TodayStart),
    DATEADD(DAY, 8, @TodayStart),
    1,
    N'Bảo tàng Mỹ thuật Đà Nẵng',
    N'78 Lê Duẩn, Thạch Thang',
    N'Hải Châu',
    16.071234, 108.219876,
    'FREE_OPEN',
    N'Miễn phí · Vào cửa tự do',
    NULL,
    NULL,
    N'Hội Nhiếp ảnh Nghệ thuật TP Đà Nẵng',
    N'mythuatdanang@danang.gov.vn',
    N'https://dnfam.vn/trien-lam-anh-xua-nay',
    0,
    'PUBLISHED',
    NULL
);

-- 5. Giải chạy Marathon Cầu Rồng (Đổi lịch / Dời ngày - RESCHEDULED)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Giải chạy Marathon Cầu Rồng Khám Phá Biển Sáng',
    'giai-chay-marathon-cau-rong',
    N'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80',
    N'Cung đường chạy ven bờ biển Sơn Trà và vượt Cầu Rồng ngắm trọn bình minh rạng rỡ của thành phố.',
    N'Giải chạy cự ly 5km, 10km và 21km dành cho vận động viên phong trào và chuyên nghiệp. Toàn bộ tiền bán vé được gây quỹ bảo tồn thiên nhiên bán đảo Sơn Trà.',
    'SPORTS',
    DATEADD(HOUR, 5, DATEADD(DAY, 7, @ThisSunday)), -- Dời sang Chủ nhật tuần sau
    DATEADD(HOUR, 10, DATEADD(DAY, 7, @ThisSunday)),
    0,
    N'Quảng trường Cầu Rồng & Đường Bạch Đằng',
    N'Đường Võ Văn Kiệt nối Trần Hưng Đạo',
    N'Sơn Trà',
    16.061890, 108.228910,
    'PAID',
    N'300.000đ - 650.000đ',
    N'https://marathon.dananggo.vn/register',
    DATEADD(DAY, 5, @ThisSunday),
    N'Liên đoàn Điền kinh Đà Nẵng & DanangGo Club',
    N'support@danangmarathon.vn · 0935123789',
    N'https://marathon.dananggo.vn',
    1,
    'RESCHEDULED',
    N'THÔNG BÁO DỜI LỊCH: Ban tổ chức đã dời ngày thi đấu sang Chủ nhật tuần sau để phối hợp cùng lực lượng CSGT phân luồng mặt cầu tốt nhất. Giờ xuất phát và cự ly giữ nguyên.'
);

-- 6. Lễ hội Diều Biển Mỹ Khê (Đã hủy - CANCELLED, vẫn mở link chi tiết để đọc thông báo)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Lễ hội Diều Khổng Lồ Biển Mỹ Khê',
    'le-hoi-dieu-bien-my-khe',
    N'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80',
    N'Trình diễn hàng trăm cánh diều khí động học khổng lồ rực rỡ sắc màu trên bầu trời bãi biển Mỹ Khê.',
    N'Sự kiện quy tụ các nghệ nhân diều quốc tế đến từ Nhật Bản, Thái Lan và Việt Nam. Dự kiến có khu vực riêng hướng dẫn trẻ em tự làm và thả diều truyền thống.',
    'FESTIVAL',
    DATEADD(HOUR, 14, @ThisSunday),
    DATEADD(HOUR, 18, @ThisSunday),
    0,
    N'Công viên Biển Đông & Bãi tắm Phạm Văn Đồng',
    N'Đường Võ Nguyên Giáp, Phước Mỹ',
    N'Sơn Trà',
    16.069876, 108.245678,
    'FREE_OPEN',
    N'Miễn phí · Vào cửa tự do',
    NULL,
    NULL,
    N'Ban Quản lý Bán đảo Sơn Trà và các bãi biển du lịch Đà Nẵng',
    N'bqlbiendanang@danang.gov.vn',
    N'https://danangtourism.gov.vn/dieu-bien-my-khe',
    0,
    'CANCELLED',
    N'THÔNG BÁO TẠM HỦY: Do điều kiện thời tiết ngoài khơi có gió chướng mạnh không đảm bảo an toàn bay cho các cánh diều kích thước lớn, sự kiện cuối tuần này xin phép tạm hủy. Xin chân thành cáo lỗi cùng quý khách.'
);

-- 7. Đại nhạc hội EDM Chào Hè (Bản nháp - DRAFT, chỉ Admin thấy trên CMS)
INSERT INTO dbo.events (
    title, slug, cover_image, short_description, description,
    category, start_time, end_time, is_all_day,
    location_name, address, district, latitude, longitude,
    ticket_type, ticket_price_display, ticket_url, registration_deadline,
    organizer_name, organizer_contact, source_url,
    is_featured, status, reschedule_notice
) VALUES (
    N'Đại nhạc hội EDM Sóng Nước Chào Hè 2026',
    'dai-nhac-hoi-edm-chao-he',
    N'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    N'Bản nháp sự kiện âm nhạc quy mô 10.000 khán giả đang chờ chốt giấy phép biểu diễn.',
    N'Nội dung đang được ban tổ chức biên tập và chờ phê duyệt danh sách nghệ sĩ biểu diễn.',
    'MUSIC',
    DATEADD(DAY, 30, @TodayStart),
    DATEADD(DAY, 30, DATEADD(HOUR, 23, @TodayStart)),
    0,
    N'Cung Thể thao Tiên Sơn',
    N'03 Phan Đăng Lưu, Hòa Cường Bắc',
    N'Hải Châu',
    16.035678, 108.223456,
    'PAID',
    N'Chưa công bố',
    NULL,
    NULL,
    N'Danang Events Media',
    N'media@dananggo.vn',
    NULL,
    0,
    'DRAFT',
    NULL
);
GO

PRINT '✅ Đã nạp dữ liệu mẫu Sự kiện (Events) thành công!';
