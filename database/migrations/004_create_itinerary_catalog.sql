USE DaNangGo;
GO

IF OBJECT_ID('dbo.itinerary_catalog_places', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.itinerary_catalog_places (
        id                  INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        slug                NVARCHAR(100) NOT NULL UNIQUE,
        kind                NVARCHAR(20) NOT NULL,
        name                NVARCHAR(200) NOT NULL,
        description         NVARCHAR(1000) NOT NULL,
        address             NVARCHAR(300) NOT NULL,
        price               DECIMAL(18,2) NOT NULL,
        accommodation_type  NVARCHAR(30) NULL,
        stars               TINYINT NULL,
        meal_period         NVARCHAR(20) NULL,
        image_url           NVARCHAR(1000) NOT NULL,
        is_active           BIT NOT NULL CONSTRAINT DF_itinerary_catalog_active DEFAULT 1,
        created_at          DATETIME2 NOT NULL CONSTRAINT DF_itinerary_catalog_created DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_itinerary_catalog_kind CHECK (kind IN ('STAY', 'FOOD', 'ATTRACTION')),
        CONSTRAINT CK_itinerary_catalog_price CHECK (price >= 0),
        CONSTRAINT CK_itinerary_catalog_meal CHECK (meal_period IS NULL OR meal_period IN ('BREAKFAST', 'LUNCH', 'DINNER')),
        CONSTRAINT CK_itinerary_catalog_stay CHECK (
            (kind = 'STAY' AND accommodation_type IS NOT NULL AND stars BETWEEN 3 AND 5 AND meal_period IS NULL)
            OR (kind = 'FOOD' AND accommodation_type IS NULL AND stars IS NULL AND meal_period IS NOT NULL)
            OR (kind = 'ATTRACTION' AND accommodation_type IS NULL AND stars IS NULL AND meal_period IS NULL)
        )
    );
END;
GO

IF OBJECT_ID('dbo.itinerary_catalog_preferences', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.itinerary_catalog_preferences (
        place_id        INT NOT NULL,
        preference      NVARCHAR(100) NOT NULL,
        CONSTRAINT PK_itinerary_catalog_preferences PRIMARY KEY (place_id, preference),
        CONSTRAINT FK_itinerary_catalog_preferences_place FOREIGN KEY (place_id)
            REFERENCES dbo.itinerary_catalog_places(id) ON DELETE CASCADE,
        CONSTRAINT CK_itinerary_catalog_preference CHECK (
            preference IN (
                N'Ẩm thực địa phương',
                N'Biển & Nghỉ dưỡng',
                N'Di sản & Văn hoá',
                N'Phiêu lưu mạo hiểm',
                N'Check-in sống ảo'
            )
        )
    );
END;
GO

INSERT INTO dbo.itinerary_catalog_places
    (slug, kind, name, description, address, price, accommodation_type, stars, meal_period, image_url)
SELECT source.slug, source.kind, source.name, source.description, source.address, source.price,
       source.accommodation_type, source.stars, source.meal_period, source.image_url
FROM (VALUES
    (N'hotel-thanh-binh-3', N'STAY', N'Khách sạn Thanh Bình', N'Khách sạn phổ thông khu vực trung tâm; giá tham khảo mỗi người/đêm khi ở ghép.', N'Hải Châu, Đà Nẵng', 350000, N'Khách sạn', 3, NULL, N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'),
    (N'hotel-sea-light-3', N'STAY', N'Sea Light Hotel', N'Khách sạn 3 sao khu vực biển; giá tham khảo mỗi người/đêm khi ở ghép.', N'Sơn Trà, Đà Nẵng', 400000, N'Khách sạn', 3, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80'),
    (N'hotel-riverside-3', N'STAY', N'Riverside Boutique Hotel', N'Khách sạn boutique gần sông Hàn; giá tham khảo mỗi người/đêm khi ở ghép.', N'Hải Châu, Đà Nẵng', 450000, N'Khách sạn', 3, NULL, N'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80'),
    (N'hotel-han-river-4', N'STAY', N'Khách sạn Hàn River', N'Khách sạn 4 sao khu vực trung tâm; giá tham khảo mỗi người/đêm khi ở ghép.', N'Hải Châu, Đà Nẵng', 550000, N'Khách sạn', 4, NULL, N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'),
    (N'hotel-my-khe-4', N'STAY', N'Mỹ Khê Beach Hotel', N'Khách sạn gần biển Mỹ Khê; giá tham khảo mỗi người/đêm khi ở ghép.', N'Sơn Trà, Đà Nẵng', 650000, N'Khách sạn', 4, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80'),
    (N'hotel-son-tra-4', N'STAY', N'Sơn Trà Ocean View', N'Khách sạn hướng biển; giá tham khảo mỗi người/đêm khi ở ghép.', N'Sơn Trà, Đà Nẵng', 700000, N'Khách sạn', 4, NULL, N'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80'),
    (N'hotel-grand-5', N'STAY', N'Danang Grand Hotel', N'Khách sạn cao cấp khu vực trung tâm; giá tham khảo mỗi người/đêm khi ở ghép.', N'Hải Châu, Đà Nẵng', 950000, N'Khách sạn', 5, NULL, N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'),
    (N'hotel-beachfront-5', N'STAY', N'Beachfront Luxury Hotel', N'Khách sạn cao cấp gần bãi biển; giá tham khảo mỗi người/đêm khi ở ghép.', N'Ngũ Hành Sơn, Đà Nẵng', 1200000, N'Khách sạn', 5, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80'),
    (N'resort-green-3', N'STAY', N'Green Bay Resort', N'Resort nghỉ dưỡng; giá tham khảo mỗi người/đêm khi ở ghép.', N'Sơn Trà, Đà Nẵng', 650000, N'Resort', 3, NULL, N'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80'),
    (N'resort-ocean-4', N'STAY', N'Ocean Garden Resort', N'Resort gần biển; giá tham khảo mỗi người/đêm khi ở ghép.', N'Ngũ Hành Sơn, Đà Nẵng', 1000000, N'Resort', 4, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80'),
    (N'resort-peninsula-5', N'STAY', N'Son Tra Peninsula Resort', N'Resort cao cấp bán đảo Sơn Trà; giá tham khảo mỗi người/đêm khi ở ghép.', N'Sơn Trà, Đà Nẵng', 1600000, N'Resort', 5, NULL, N'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80'),
    (N'homestay-han-market-3', N'STAY', N'Han Market Homestay', N'Homestay gần chợ Hàn; giá tham khảo mỗi người/đêm.', N'Hải Châu, Đà Nẵng', 250000, N'Homestay', 3, NULL, N'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80'),
    (N'homestay-beach-4', N'STAY', N'An Thuong Beach Homestay', N'Homestay khu An Thượng, thuận tiện ra biển; giá tham khảo mỗi người/đêm.', N'Ngũ Hành Sơn, Đà Nẵng', 350000, N'Homestay', 4, NULL, N'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80'),
    (N'homestay-garden-5', N'STAY', N'Garden House Homestay', N'Homestay sân vườn; giá tham khảo mỗi người/đêm.', N'Sơn Trà, Đà Nẵng', 500000, N'Homestay', 5, NULL, N'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80'),
    (N'camping-son-tra-3', N'STAY', N'Sơn Trà Camping', N'Khu cắm trại cơ bản; phí tham khảo mỗi người/đêm, chưa bao gồm thuê thiết bị.', N'Sơn Trà, Đà Nẵng', 200000, N'Cắm trại', 3, NULL, N'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&q=80'),
    (N'camping-beach-4', N'STAY', N'Coastal Camping Ground', N'Khu cắm trại gần biển; phí tham khảo mỗi người/đêm, chưa bao gồm thuê thiết bị.', N'Ngũ Hành Sơn, Đà Nẵng', 280000, N'Cắm trại', 4, NULL, N'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&q=80'),
    (N'camping-hill-5', N'STAY', N'Hilltop Glamping', N'Glamping tiện nghi; phí tham khảo mỗi người/đêm.', N'Hòa Vang, Đà Nẵng', 450000, N'Cắm trại', 5, NULL, N'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&q=80'),
    (N'banh-mi-ba-lan', N'FOOD', N'Bánh mì Bà Lan', N'Bánh mì địa phương; giá tham khảo mỗi phần.', N'Hải Châu, Đà Nẵng', 30000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'),
    (N'banh-mi-ong-ty', N'FOOD', N'Bánh mì Ông Tý', N'Bánh mì chả bò; giá tham khảo mỗi phần.', N'Hải Châu, Đà Nẵng', 35000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'),
    (N'banh-cuon-nong', N'FOOD', N'Bánh cuốn nóng buổi sáng', N'Bữa sáng địa phương; giá tham khảo mỗi phần.', N'Thanh Khê, Đà Nẵng', 35000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80'),
    (N'pho-bo-hai-chau', N'FOOD', N'Phở bò Hải Châu', N'Phở bò địa phương; giá tham khảo mỗi tô.', N'Hải Châu, Đà Nẵng', 45000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80'),
    (N'banh-beo-ba-be', N'FOOD', N'Bánh bèo Bà Bé', N'Bánh bèo và món ăn sáng miền Trung; giá tham khảo mỗi phần.', N'Thanh Khê, Đà Nẵng', 40000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80'),
    (N'mi-quang-ba-mua', N'FOOD', N'Mì Quảng Bà Mua', N'Mì Quảng đặc sản; giá tham khảo mỗi tô.', N'Hải Châu, Đà Nẵng', 55000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80'),
    (N'bun-cha-ca-ba-phien', N'FOOD', N'Bún chả cá Bà Phiến', N'Bún chả cá địa phương; giá tham khảo mỗi tô.', N'Hải Châu, Đà Nẵng', 45000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80'),
    (N'com-ga-a-hai', N'FOOD', N'Cơm gà A Hải', N'Cơm gà Đà Nẵng; giá tham khảo mỗi phần.', N'Hải Châu, Đà Nẵng', 60000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80'),
    (N'banh-trang-thit-heo', N'FOOD', N'Bánh tráng cuốn thịt heo', N'Đặc sản cuốn; giá tham khảo mỗi phần.', N'Hải Châu, Đà Nẵng', 85000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1561189386-42f49bcc29ef?w=400&q=80'),
    (N'com-nieu-tran', N'FOOD', N'Cơm niêu Trần', N'Cơm niêu và món Việt; giá tham khảo mỗi phần.', N'Sơn Trà, Đà Nẵng', 90000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80'),
    (N'bun-mam-ba-thuyen', N'FOOD', N'Bún mắm Bà Thuyên', N'Bún mắm nêm đặc sản; giá tham khảo mỗi tô.', N'Thanh Khê, Đà Nẵng', 45000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80'),
    (N'banh-xeo-ba-duong', N'FOOD', N'Bánh xèo Bà Dưỡng', N'Bánh xèo và nem lụi; giá tham khảo mỗi phần.', N'Hải Châu, Đà Nẵng', 70000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80'),
    (N'com-ga-roti', N'FOOD', N'Cơm gà roti', N'Cơm gà địa phương; giá tham khảo mỗi phần.', N'Sơn Trà, Đà Nẵng', 65000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80'),
    (N'hai-san-my-khe', N'FOOD', N'Hải sản bình dân Mỹ Khê', N'Hải sản theo mùa; giá tham khảo mỗi suất cá nhân.', N'Khu vực Mỹ Khê, Đà Nẵng', 140000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80'),
    (N'cao-lau-pho-hoi', N'FOOD', N'Cao lầu Phố Hội', N'Cao lầu phong cách miền Trung; giá tham khảo mỗi tô.', N'Hải Châu, Đà Nẵng', 65000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80'),
    (N'my-khe-beach', N'ATTRACTION', N'Bãi biển Mỹ Khê', N'Tắm biển và dạo bộ; không thu vé vào cửa.', N'Võ Nguyên Giáp, Sơn Trà', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80'),
    (N'dragon-bridge', N'ATTRACTION', N'Cầu Rồng và công viên bờ sông', N'Tham quan khu vực trung tâm; trình diễn phun lửa vào tối cuối tuần.', N'Hải Châu, Đà Nẵng', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80'),
    (N'linh-ung-pagoda', N'ATTRACTION', N'Chùa Linh Ứng Sơn Trà', N'Tham quan chùa và ngắm cảnh bán đảo; không thu vé vào cửa.', N'Bán đảo Sơn Trà', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=400&q=80'),
    (N'han-market', N'ATTRACTION', N'Chợ Hàn', N'Khám phá chợ địa phương và đặc sản Đà Nẵng; không thu vé vào cửa.', N'119 Trần Phú, Hải Châu', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80'),
    (N'con-market', N'ATTRACTION', N'Chợ Cồn', N'Khám phá ẩm thực và mua sắm tại chợ địa phương; không thu vé vào cửa.', N'90 Hùng Vương, Hải Châu', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80'),
    (N'cham-museum', N'ATTRACTION', N'Bảo tàng Điêu khắc Chăm', N'Bộ sưu tập điêu khắc Chăm; vé tham khảo khoảng 60.000đ.', N'02 Đường 2 Tháng 9, Hải Châu', 60000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80'),
    (N'marble-mountains', N'ATTRACTION', N'Ngũ Hành Sơn', N'Tham quan danh thắng và hang động; vé tham khảo khoảng 40.000đ.', N'Ngũ Hành Sơn, Đà Nẵng', 40000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80'),
    (N'son-tra-viewpoint', N'ATTRACTION', N'Đỉnh Bàn Cờ Sơn Trà', N'Ngắm cảnh bán đảo và thành phố; chi phí vào cửa tham khảo 0đ.', N'Bán đảo Sơn Trà', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=400&q=80'),
    (N'love-bridge', N'ATTRACTION', N'Cầu Tình Yêu', N'Dạo bộ ven sông Hàn và chụp ảnh; không thu vé vào cửa.', N'Bờ đông sông Hàn, Sơn Trà', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80'),
    (N'asia-park', N'ATTRACTION', N'Asia Park', N'Công viên giải trí; giá vé tham khảo khoảng 200.000đ.', N'01 Phan Đăng Lưu, Hải Châu', 200000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80'),
    (N'ba-na-hills', N'ATTRACTION', N'Bà Nà Hills', N'Khu du lịch trên núi; vé tham khảo từ khoảng 900.000đ, có thể thay đổi theo thời điểm.', N'Hòa Vang, Đà Nẵng', 900000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80'),
    (N'nam-o-reef', N'ATTRACTION', N'Rạn Nam Ô', N'Bãi đá và rạn ven biển; kiểm tra điều kiện thủy triều và an toàn trước khi đi.', N'Liên Chiểu, Đà Nẵng', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80'),
    (N'phap-lam-pagoda', N'ATTRACTION', N'Chùa Pháp Lâm', N'Không gian văn hóa tâm linh trong thành phố; không thu vé vào cửa.', N'574 Ông Ích Khiêm, Hải Châu', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=400&q=80'),
    (N'than-tai-hot-springs', N'ATTRACTION', N'Công viên Suối khoáng nóng Núi Thần Tài', N'Khu nghỉ dưỡng suối khoáng; vé tham khảo khoảng 450.000đ.', N'Hòa Phú, Hòa Vang', 450000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80')
) AS source(slug, kind, name, description, address, price, accommodation_type, stars, meal_period, image_url)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.itinerary_catalog_places AS existing WHERE existing.slug = source.slug
);
GO

INSERT INTO dbo.itinerary_catalog_preferences (place_id, preference)
SELECT place.id, source.preference
FROM (VALUES
    (N'hotel-sea-light-3', N'Biển & Nghỉ dưỡng'),
    (N'hotel-my-khe-4', N'Biển & Nghỉ dưỡng'),
    (N'hotel-beachfront-5', N'Biển & Nghỉ dưỡng'),
    (N'resort-green-3', N'Biển & Nghỉ dưỡng'),
    (N'resort-ocean-4', N'Biển & Nghỉ dưỡng'),
    (N'resort-peninsula-5', N'Biển & Nghỉ dưỡng'),
    (N'homestay-beach-4', N'Biển & Nghỉ dưỡng'),
    (N'camping-beach-4', N'Biển & Nghỉ dưỡng'),
    (N'camping-hill-5', N'Phiêu lưu mạo hiểm'),
    (N'banh-mi-ba-lan', N'Ẩm thực địa phương'),
    (N'banh-mi-ong-ty', N'Ẩm thực địa phương'),
    (N'banh-cuon-nong', N'Ẩm thực địa phương'),
    (N'pho-bo-hai-chau', N'Ẩm thực địa phương'),
    (N'banh-beo-ba-be', N'Ẩm thực địa phương'),
    (N'mi-quang-ba-mua', N'Ẩm thực địa phương'),
    (N'bun-cha-ca-ba-phien', N'Ẩm thực địa phương'),
    (N'com-ga-a-hai', N'Ẩm thực địa phương'),
    (N'banh-trang-thit-heo', N'Ẩm thực địa phương'),
    (N'com-nieu-tran', N'Ẩm thực địa phương'),
    (N'bun-mam-ba-thuyen', N'Ẩm thực địa phương'),
    (N'banh-xeo-ba-duong', N'Ẩm thực địa phương'),
    (N'com-ga-roti', N'Ẩm thực địa phương'),
    (N'hai-san-my-khe', N'Ẩm thực địa phương'),
    (N'cao-lau-pho-hoi', N'Ẩm thực địa phương'),
    (N'my-khe-beach', N'Biển & Nghỉ dưỡng'),
    (N'my-khe-beach', N'Check-in sống ảo'),
    (N'dragon-bridge', N'Check-in sống ảo'),
    (N'dragon-bridge', N'Di sản & Văn hoá'),
    (N'linh-ung-pagoda', N'Di sản & Văn hoá'),
    (N'linh-ung-pagoda', N'Biển & Nghỉ dưỡng'),
    (N'linh-ung-pagoda', N'Check-in sống ảo'),
    (N'han-market', N'Ẩm thực địa phương'),
    (N'han-market', N'Di sản & Văn hoá'),
    (N'con-market', N'Ẩm thực địa phương'),
    (N'con-market', N'Di sản & Văn hoá'),
    (N'cham-museum', N'Di sản & Văn hoá'),
    (N'marble-mountains', N'Phiêu lưu mạo hiểm'),
    (N'marble-mountains', N'Di sản & Văn hoá'),
    (N'marble-mountains', N'Check-in sống ảo'),
    (N'son-tra-viewpoint', N'Phiêu lưu mạo hiểm'),
    (N'son-tra-viewpoint', N'Check-in sống ảo'),
    (N'love-bridge', N'Check-in sống ảo'),
    (N'asia-park', N'Check-in sống ảo'),
    (N'ba-na-hills', N'Phiêu lưu mạo hiểm'),
    (N'ba-na-hills', N'Check-in sống ảo'),
    (N'nam-o-reef', N'Biển & Nghỉ dưỡng'),
    (N'nam-o-reef', N'Phiêu lưu mạo hiểm'),
    (N'phap-lam-pagoda', N'Di sản & Văn hoá'),
    (N'than-tai-hot-springs', N'Biển & Nghỉ dưỡng')
) AS source(slug, preference)
INNER JOIN dbo.itinerary_catalog_places AS place ON place.slug = source.slug
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.itinerary_catalog_preferences AS existing
    WHERE existing.place_id = place.id AND existing.preference = source.preference
);
GO
