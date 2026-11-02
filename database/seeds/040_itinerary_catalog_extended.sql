USE DaNangGo;
GO

-- ============================================================
-- 040_itinerary_catalog_extended.sql
-- Mở rộng danh mục địa điểm cho chức năng "Tạo lịch trình"
-- Thêm: nhiều ẩm thực, khách sạn, nhà hàng, giải trí
-- ============================================================

-- ─── 1. Cập nhật constraint kind để cho phép ENTERTAINMENT ───────────────────
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_itinerary_catalog_kind'
      AND parent_object_id = OBJECT_ID('dbo.itinerary_catalog_places')
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places
    DROP CONSTRAINT CK_itinerary_catalog_kind;
END;
GO

ALTER TABLE dbo.itinerary_catalog_places
ADD CONSTRAINT CK_itinerary_catalog_kind
    CHECK (kind IN ('STAY', 'FOOD', 'ATTRACTION', 'ENTERTAINMENT'));
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_itinerary_catalog_meal'
      AND parent_object_id = OBJECT_ID('dbo.itinerary_catalog_places')
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places
    DROP CONSTRAINT CK_itinerary_catalog_meal;
END;
GO

ALTER TABLE dbo.itinerary_catalog_places
ADD CONSTRAINT CK_itinerary_catalog_meal
    CHECK (meal_period IS NULL OR meal_period IN ('BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'));
GO

-- Cập nhật constraint stay để cho phép ENTERTAINMENT không cần meal_period
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_itinerary_catalog_stay'
      AND parent_object_id = OBJECT_ID('dbo.itinerary_catalog_places')
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places
    DROP CONSTRAINT CK_itinerary_catalog_stay;
END;
GO

ALTER TABLE dbo.itinerary_catalog_places
ADD CONSTRAINT CK_itinerary_catalog_stay CHECK (
    (kind = 'STAY'          AND accommodation_type IS NOT NULL AND stars BETWEEN 3 AND 5 AND meal_period IS NULL)
    OR (kind = 'FOOD'       AND accommodation_type IS NULL AND stars IS NULL AND meal_period IS NOT NULL)
    OR (kind = 'ATTRACTION' AND accommodation_type IS NULL AND stars IS NULL AND meal_period IS NULL)
    OR (kind = 'ENTERTAINMENT' AND accommodation_type IS NULL AND stars IS NULL AND meal_period IS NULL)
);
GO

-- ─── 2. Thêm cột opening_time / closing_time / visit_duration_minutes nếu chưa có ─
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.itinerary_catalog_places') AND name = 'opening_time'
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places ADD opening_time TIME NULL;
END;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.itinerary_catalog_places') AND name = 'closing_time'
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places ADD closing_time TIME NULL;
END;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.itinerary_catalog_places') AND name = 'visit_duration_minutes'
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places ADD visit_duration_minutes SMALLINT NULL;
END;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.itinerary_catalog_places') AND name = 'room_type'
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places ADD room_type NVARCHAR(50) NULL;
END;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.itinerary_catalog_places') AND name = 'room_capacity'
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places ADD room_capacity TINYINT NULL;
END;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.itinerary_catalog_places') AND name = 'price_basis'
)
BEGIN
    ALTER TABLE dbo.itinerary_catalog_places
        ADD price_basis NVARCHAR(20) NOT NULL CONSTRAINT DF_itinerary_catalog_price_basis DEFAULT 'PER_PERSON';
END;
GO

-- ─── 3. Thêm địa điểm mới ────────────────────────────────────────────────────
-- Cấu trúc:
--   slug | kind | name | description | address | price
--   | accommodation_type | stars | meal_period | image_url

INSERT INTO dbo.itinerary_catalog_places
    (slug, kind, name, description, address, price,
     accommodation_type, stars, meal_period, image_url,
     opening_time, closing_time, visit_duration_minutes, price_basis)
SELECT
    source.slug, source.kind, source.name, source.description, source.address, source.price,
    source.accommodation_type, source.stars, source.meal_period, source.image_url,
    source.opening_time, source.closing_time, source.visit_duration_minutes, source.price_basis
FROM (VALUES

    -- ── KHÁCH SẠN 3 SAO bổ sung ──────────────────────────────────────────────
    (N'hotel-phu-my-3',       N'STAY', N'Khách sạn Phú Mỹ',        N'Khách sạn trung tâm Hải Châu, gần chợ Hàn, giá bình dân.', N'Hải Châu, Đà Nẵng', 380000, N'Khách sạn', 3, NULL, N'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),
    (N'hotel-bamboo-3',       N'STAY', N'Bamboo Hotel',             N'Khách sạn thiết kế hiện đại, cách biển 5 phút.', N'Sơn Trà, Đà Nẵng', 420000, N'Khách sạn', 3, NULL, N'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),
    (N'hotel-green-city-3',   N'STAY', N'Green City Hotel',         N'Khách sạn xanh khu Thanh Khê, thuận tiện di chuyển.', N'Thanh Khê, Đà Nẵng', 360000, N'Khách sạn', 3, NULL, N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),

    -- ── KHÁCH SẠN 4 SAO bổ sung ──────────────────────────────────────────────
    (N'hotel-sunrise-4',      N'STAY', N'Sunrise Premium Hotel',    N'Khách sạn 4 sao view biển, có bể bơi vô cực.', N'Ngũ Hành Sơn, Đà Nẵng', 750000, N'Khách sạn', 4, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),
    (N'hotel-golden-bay-4',   N'STAY', N'Golden Bay Hotel',         N'Khách sạn sang trọng gần bãi biển Non Nước.', N'Ngũ Hành Sơn, Đà Nẵng', 720000, N'Khách sạn', 4, NULL, N'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),
    (N'hotel-center-plaza-4', N'STAY', N'Center Plaza Hotel',       N'Vị trí đắc địa trung tâm, gần cầu Sông Hàn.', N'Hải Châu, Đà Nẵng', 680000, N'Khách sạn', 4, NULL, N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),

    -- ── KHÁCH SẠN 5 SAO bổ sung ──────────────────────────────────────────────
    (N'hotel-hyatt-5',        N'STAY', N'Hyatt Regency Đà Nẵng',   N'Khách sạn 5 sao quốc tế, bãi biển riêng tư, spa cao cấp.', N'Ngũ Hành Sơn, Đà Nẵng', 2500000, N'Khách sạn', 5, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', NULL, NULL, NULL, N'PER_ROOM'),
    (N'hotel-sheraton-5',     N'STAY', N'Sheraton Grand Đà Nẵng',  N'Khách sạn 5 sao bờ sông Hàn, nhà hàng Sky36 nổi tiếng.', N'Hải Châu, Đà Nẵng', 2200000, N'Khách sạn', 5, NULL, N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80', NULL, NULL, NULL, N'PER_ROOM'),

    -- ── RESORT 4 & 5 SAO bổ sung ─────────────────────────────────────────────
    (N'resort-fusion-4',      N'STAY', N'Fusion Suites Đà Nẵng',   N'Resort boutique có bữa sáng và spa miễn phí.', N'Sơn Trà, Đà Nẵng', 1400000, N'Resort', 4, NULL, N'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80', NULL, NULL, NULL, N'PER_ROOM'),
    (N'resort-premier-5',     N'STAY', N'Premier Village Resort',   N'Resort 5 sao cao cấp bán đảo Sơn Trà, biệt thự riêng.', N'Sơn Trà, Đà Nẵng', 4500000, N'Resort', 5, NULL, N'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80', NULL, NULL, NULL, N'PER_ROOM'),
    (N'resort-intercontinental-5', N'STAY', N'InterContinental Đà Nẵng', N'Resort 5 sao trên đỉnh đồi, view toàn cảnh biển tuyệt đẹp.', N'Sơn Trà, Đà Nẵng', 5000000, N'Resort', 5, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', NULL, NULL, NULL, N'PER_ROOM'),

    -- ── HOMESTAY bổ sung ─────────────────────────────────────────────────────
    (N'homestay-my-an-3',     N'STAY', N'My An Beach Homestay',     N'Homestay thoáng mát khu Mỹ An, đi bộ ra biển 3 phút.', N'Ngũ Hành Sơn, Đà Nẵng', 280000, N'Homestay', 3, NULL, N'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),
    (N'homestay-old-town-3',  N'STAY', N'Old Town Homestay',        N'Homestay phong cách cổ điển, gần khu phố cổ.', N'Hải Châu, Đà Nẵng', 260000, N'Homestay', 3, NULL, N'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),
    (N'homestay-han-river-4', N'STAY', N'Han River View Homestay',  N'Homestay có ban công nhìn sông Hàn, yên tĩnh.', N'Hải Châu, Đà Nẵng', 380000, N'Homestay', 4, NULL, N'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80', NULL, NULL, NULL, N'PER_PERSON'),

    -- ── ẨM THỰC – BỮA SÁNG bổ sung ──────────────────────────────────────────
    (N'xoi-man-ba-hong',      N'FOOD', N'Xôi mặn Bà Hồng',         N'Xôi mặn truyền thống, ăn kèm ruốc và chả lụa.', N'Hải Châu, Đà Nẵng', 30000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', N'06:00', N'10:00', 20, N'PER_PERSON'),
    (N'bun-bo-hue-sang',      N'FOOD', N'Bún bò Huế buổi sáng',    N'Bún bò Huế cay đặc trưng, nước dùng đậm vị.', N'Thanh Khê, Đà Nẵng', 45000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80', N'06:00', N'10:30', 25, N'PER_PERSON'),
    (N'cafe-trung-sang',      N'FOOD', N'Cà phê trứng Đà Thành',   N'Cà phê trứng nổi tiếng, kết hợp đặc sản miền Trung.', N'Hải Châu, Đà Nẵng', 35000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', N'07:00', N'11:00', 30, N'PER_PERSON'),
    (N'banh-uot-long-troi',   N'FOOD', N'Bánh ướt lòng trời',      N'Bánh ướt mềm, ăn kèm tôm thịt và mỡ hành.', N'Liên Chiểu, Đà Nẵng', 30000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', N'06:00', N'10:00', 20, N'PER_PERSON'),
    (N'chao-long-sang',       N'FOOD', N'Cháo lòng buổi sáng',     N'Cháo trắng nấu từ gạo tẻ, ăn kèm lòng heo, dồi.', N'Hải Châu, Đà Nẵng', 40000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', N'06:00', N'10:00', 20, N'PER_PERSON'),
    (N'my-quang-sang',        N'FOOD', N'Mì Quảng bữa sáng Quỳnh', N'Mì Quảng phục vụ từ sáng sớm, nguyên liệu tươi.', N'Cẩm Lệ, Đà Nẵng', 40000, NULL, NULL, N'BREAKFAST', N'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80', N'06:00', N'10:30', 25, N'PER_PERSON'),

    -- ── ẨM THỰC – BỮA TRƯA bổ sung ──────────────────────────────────────────
    (N'bun-bo-nam-bo-trua',   N'FOOD', N'Bún bò Nam Bộ trưa',      N'Bún bò kiểu Nam ăn kèm rau sống và đậu phộng rang.', N'Hải Châu, Đà Nẵng', 55000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80', N'10:30', N'14:00', 30, N'PER_PERSON'),
    (N'com-tam-ba-ghien',     N'FOOD', N'Cơm tấm Bà Ghiền',        N'Cơm tấm sườn bì chả, phong cách Nam Bộ ngay Đà Nẵng.', N'Sơn Trà, Đà Nẵng', 60000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', N'10:00', N'14:30', 30, N'PER_PERSON'),
    (N'banh-trang-nuong-trua', N'FOOD', N'Bánh tráng nướng phố ẩm thực', N'Bánh tráng nướng truyền thống Đà Nẵng, phong phú nhân.', N'Hải Châu, Đà Nẵng', 40000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', N'10:00', N'22:00', 20, N'PER_PERSON'),
    (N'lau-ca-da-nang',       N'FOOD', N'Lẩu cá đặc sản',          N'Lẩu cá tươi, nước dùng chua cay đặc trưng miền Trung.', N'Ngũ Hành Sơn, Đà Nẵng', 120000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'10:00', N'14:30', 60, N'PER_PERSON'),
    (N'com-hen-truong-dinh',  N'FOOD', N'Cơm hến Trường Định',     N'Cơm hến đặc sản Huế – Đà Nẵng, nước hến đậm đà.', N'Hải Châu, Đà Nẵng', 35000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', N'10:00', N'14:00', 25, N'PER_PERSON'),
    (N'nha-hang-thu-gom',     N'FOOD', N'Nhà hàng Thu Gom Sơn Trà', N'Nhà hàng hải sản bình dân, nguyên liệu tươi mỗi ngày.', N'Sơn Trà, Đà Nẵng', 130000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'10:00', N'15:00', 60, N'PER_PERSON'),
    (N'quan-com-binh-dan-2',  N'FOOD', N'Quán cơm bình dân Thanh',  N'Cơm bình dân thập cẩm, nhiều lựa chọn, giá rẻ.', N'Thanh Khê, Đà Nẵng', 40000, NULL, NULL, N'LUNCH', N'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', N'10:30', N'14:00', 25, N'PER_PERSON'),

    -- ── ẨM THỰC – ĂN NHẸ BUỔI CHIỀU ──────────────────────────────────────────
    (N'che-lien-buoi-chieu', N'FOOD', N'Chè Liên buổi chiều', N'Chè sầu và chè thập cẩm, phù hợp ăn nhẹ buổi chiều.', N'Hải Châu, Đà Nẵng', 30000, NULL, NULL, N'SNACK', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80', N'10:00', N'22:00', 30, N'PER_PERSON'),
    (N'banh-trang-kep-cho-con', N'FOOD', N'Bánh tráng kẹp chợ Cồn', N'Bánh tráng kẹp nóng và đồ ăn vặt địa phương.', N'Thanh Khê, Đà Nẵng', 25000, NULL, NULL, N'SNACK', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', N'14:00', N'21:00', 25, N'PER_PERSON'),
    (N'sua-chua-muoi-chanh', N'FOOD', N'Sữa chua muối và mít trộn', N'Món ăn vặt mát nhẹ đặc trưng Đà Nẵng.', N'Sơn Trà, Đà Nẵng', 35000, NULL, NULL, N'SNACK', N'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', N'14:00', N'21:00', 30, N'PER_PERSON'),

    -- ── ẨM THỰC – BỮA TỐI bổ sung ───────────────────────────────────────────
    (N'nha-hang-be-man',      N'FOOD', N'Nhà hàng Bé Mặn',         N'Nhà hàng hải sản nổi tiếng, không gian rộng thoáng.', N'Mỹ Khê, Đà Nẵng', 180000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'16:00', N'22:00', 90, N'PER_PERSON'),
    (N'nha-hang-pho-bien',    N'FOOD', N'Nhà hàng Phố Biển',       N'Seafood tươi sống, view biển buổi tối lãng mạn.', N'Ngũ Hành Sơn, Đà Nẵng', 200000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'16:00', N'22:30', 90, N'PER_PERSON'),
    (N'quan-nhau-lang-chai',  N'FOOD', N'Quán nhậu Làng Chài',     N'Ăn tối kiểu nhậu nhẹ, hải sản nướng đặc sản.', N'Liên Chiểu, Đà Nẵng', 120000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'17:00', N'23:00', 90, N'PER_PERSON'),
    (N'nuong-tu-chon-dem',    N'FOOD', N'Nướng tự chọn đêm Đà Nẵng', N'Lẩu nướng tự chọn, phong phú thực đơn, giá cố định.', N'Sơn Trà, Đà Nẵng', 150000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'16:30', N'23:00', 90, N'PER_PERSON'),
    (N'banh-trang-dem',       N'FOOD', N'Bánh tráng cuốn đêm',     N'Phố bánh tráng cuốn tối, sôi động, nhiều gánh hàng rong.', N'Hải Châu, Đà Nẵng', 60000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80', N'17:00', N'23:00', 45, N'PER_PERSON'),
    (N'che-da-nang-dem',      N'FOOD', N'Chè Đà Nẵng buổi tối',   N'Chè thập cẩm và đặc sản Đà Nẵng, tráng miệng sau bữa tối.', N'Hải Châu, Đà Nẵng', 25000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80', N'15:00', N'23:00', 30, N'PER_PERSON'),
    (N'lau-riêu-cua-dem',     N'FOOD', N'Lẩu riêu cua đêm',       N'Lẩu riêu cua cà chua đậm đà, ăn buổi tối mát trời.', N'Thanh Khê, Đà Nẵng', 100000, NULL, NULL, N'DINNER', N'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', N'17:00', N'23:30', 75, N'PER_PERSON'),

    -- ── GIẢI TRÍ (ENTERTAINMENT) ─────────────────────────────────────────────
    (N'ent-sun-world-bana',   N'ENTERTAINMENT', N'Sun World Bà Nà Hills', N'Khu vui chơi giải trí trên đỉnh núi Bà Nà, có cáp treo dài nhất thế giới và Golden Bridge nổi tiếng.', N'Hòa Vang, Đà Nẵng', 850000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80', N'08:00', N'17:00', 360, N'PER_PERSON'),
    (N'ent-helio-center',     N'ENTERTAINMENT', N'Helio Entertainment Center', N'Trung tâm giải trí tổng hợp với nhiều trò chơi, phòng chiếu phim, khu ăn uống sầm uất.', N'Hải Châu, Đà Nẵng', 150000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80', N'09:00', N'22:00', 180, N'PER_PERSON'),
    (N'ent-asia-park-night',  N'ENTERTAINMENT', N'Asia Park – Công viên Châu Á', N'Công viên giải trí và Sun Wheel – vòng quay khổng lồ, đẹp nhất về đêm.', N'Hải Châu, Đà Nẵng', 200000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80', N'15:00', N'22:00', 120, N'PER_PERSON'),
    (N'ent-kayak-son-tra',    N'ENTERTAINMENT', N'Chèo kayak bán đảo Sơn Trà', N'Trải nghiệm chèo kayak quanh bán đảo Sơn Trà, ngắm rạn san hô và rừng nguyên sinh.', N'Sơn Trà, Đà Nẵng', 200000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80', N'06:00', N'11:00', 120, N'PER_PERSON'),
    (N'ent-diving-my-khe',    N'ENTERTAINMENT', N'Lặn biển Mỹ Khê',          N'Lặn với bình khí, khám phá san hô và sinh vật biển tại vùng biển Mỹ Khê.', N'Sơn Trà, Đà Nẵng', 350000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80', N'07:00', N'11:30', 150, N'PER_PERSON'),
    (N'ent-hot-spring-than-tai', N'ENTERTAINMENT', N'Tắm khoáng Núi Thần Tài', N'Khu suối khoáng nóng thiên nhiên, tắm bùn và thư giãn giữa thiên nhiên.', N'Hòa Vang, Đà Nẵng', 350000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80', N'08:00', N'17:00', 180, N'PER_PERSON'),
    (N'ent-surf-my-khe',      N'ENTERTAINMENT', N'Lướt sóng biển Mỹ Khê',    N'Học và trải nghiệm lướt sóng cùng huấn luyện viên, phù hợp mọi trình độ.', N'Mỹ Khê, Đà Nẵng', 250000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80', N'07:00', N'11:00', 120, N'PER_PERSON'),
    (N'ent-cycling-son-tra',  N'ENTERTAINMENT', N'Đạp xe khám phá Sơn Trà',  N'Thuê xe đạp và khám phá bán đảo Sơn Trà, ngắm cảnh hoang sơ, gặp khỉ đuôi đỏ.', N'Sơn Trà, Đà Nẵng', 100000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1546587348-d12660c30c50?w=400&q=80', N'06:00', N'11:00', 150, N'PER_PERSON'),
    (N'ent-night-market',     N'ENTERTAINMENT', N'Chợ đêm Đà Nẵng',          N'Chợ đêm sôi động, mua sắm đồ lưu niệm, thưởng thức ẩm thực đường phố.', N'Hải Châu, Đà Nẵng', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80', N'17:00', N'23:00', 90, N'PER_PERSON'),
    (N'ent-da-nang-fireworks', N'ENTERTAINMENT', N'Xem trình diễn pháo hoa',  N'Đêm trình diễn pháo hoa quốc tế tại cầu Sông Hàn, đặc sắc nhất vào mùa hè.', N'Hải Châu, Đà Nẵng', 0, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80', N'20:00', N'22:00', 90, N'PER_PERSON'),
    (N'ent-vinpearl-land',    N'ENTERTAINMENT', N'Vinpearl Land Đà Nẵng',    N'Công viên nước và trò chơi sôi động, thích hợp gia đình và nhóm bạn.', N'Ngũ Hành Sơn, Đà Nẵng', 600000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80', N'08:30', N'17:30', 300, N'PER_PERSON'),
    (N'ent-golf-ba-na',       N'ENTERTAINMENT', N'Sân golf Ba Na Hills',      N'Sân golf trên cao nguyên mây, view núi rừng hùng vĩ, trải nghiệm độc đáo.', N'Hòa Vang, Đà Nẵng', 1200000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=80', N'07:00', N'16:00', 240, N'PER_PERSON'),
    (N'ent-escape-game',      N'ENTERTAINMENT', N'Escape Game Đà Nẵng',      N'Trò chơi thoát hiểm trong phòng, thử thách trí tuệ và tinh thần đồng đội.', N'Hải Châu, Đà Nẵng', 150000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80', N'09:00', N'22:00', 90, N'PER_PERSON'),
    (N'ent-bowling',          N'ENTERTAINMENT', N'Bowling Đà Nẵng',           N'Trung tâm bowling hiện đại, phù hợp gia đình và nhóm bạn.', N'Hải Châu, Đà Nẵng', 80000, NULL, NULL, NULL, N'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80', N'09:00', N'23:00', 90, N'PER_PERSON')

) AS source(slug, kind, name, description, address, price,
            accommodation_type, stars, meal_period, image_url,
            opening_time, closing_time, visit_duration_minutes, price_basis)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.itinerary_catalog_places AS existing WHERE existing.slug = source.slug
);
GO

-- ─── 4. Thêm preferences cho các địa điểm mới ────────────────────────────────
INSERT INTO dbo.itinerary_catalog_preferences (place_id, preference)
SELECT place.id, source.preference
FROM (VALUES
    -- Khách sạn / lưu trú mới
    (N'hotel-phu-my-3',              N'Ẩm thực địa phương'),
    (N'hotel-bamboo-3',              N'Biển & Nghỉ dưỡng'),
    (N'hotel-bamboo-3',              N'Check-in sống ảo'),
    (N'hotel-sunrise-4',             N'Biển & Nghỉ dưỡng'),
    (N'hotel-sunrise-4',             N'Check-in sống ảo'),
    (N'hotel-golden-bay-4',          N'Biển & Nghỉ dưỡng'),
    (N'hotel-hyatt-5',               N'Biển & Nghỉ dưỡng'),
    (N'hotel-sheraton-5',            N'Check-in sống ảo'),
    (N'resort-fusion-4',             N'Biển & Nghỉ dưỡng'),
    (N'resort-fusion-4',             N'Check-in sống ảo'),
    (N'resort-premier-5',            N'Biển & Nghỉ dưỡng'),
    (N'resort-intercontinental-5',   N'Biển & Nghỉ dưỡng'),
    (N'resort-intercontinental-5',   N'Check-in sống ảo'),
    (N'homestay-my-an-3',            N'Biển & Nghỉ dưỡng'),
    (N'homestay-han-river-4',        N'Check-in sống ảo'),

    -- Bữa sáng mới
    (N'xoi-man-ba-hong',             N'Ẩm thực địa phương'),
    (N'bun-bo-hue-sang',             N'Ẩm thực địa phương'),
    (N'cafe-trung-sang',             N'Ẩm thực địa phương'),
    (N'cafe-trung-sang',             N'Check-in sống ảo'),
    (N'banh-uot-long-troi',          N'Ẩm thực địa phương'),
    (N'chao-long-sang',              N'Ẩm thực địa phương'),
    (N'my-quang-sang',               N'Ẩm thực địa phương'),

    -- Bữa trưa mới
    (N'bun-bo-nam-bo-trua',          N'Ẩm thực địa phương'),
    (N'com-tam-ba-ghien',            N'Ẩm thực địa phương'),
    (N'banh-trang-nuong-trua',       N'Ẩm thực địa phương'),
    (N'banh-trang-nuong-trua',       N'Check-in sống ảo'),
    (N'lau-ca-da-nang',              N'Ẩm thực địa phương'),
    (N'com-hen-truong-dinh',         N'Ẩm thực địa phương'),
    (N'nha-hang-thu-gom',            N'Ẩm thực địa phương'),
    (N'nha-hang-thu-gom',            N'Biển & Nghỉ dưỡng'),
    (N'quan-com-binh-dan-2',         N'Ẩm thực địa phương'),

    -- Ăn nhẹ buổi chiều
    (N'che-lien-buoi-chieu',         N'Ẩm thực địa phương'),
    (N'banh-trang-kep-cho-con',      N'Ẩm thực địa phương'),
    (N'sua-chua-muoi-chanh',         N'Ẩm thực địa phương'),

    -- Bữa tối mới
    (N'nha-hang-be-man',             N'Ẩm thực địa phương'),
    (N'nha-hang-be-man',             N'Biển & Nghỉ dưỡng'),
    (N'nha-hang-pho-bien',           N'Ẩm thực địa phương'),
    (N'nha-hang-pho-bien',           N'Biển & Nghỉ dưỡng'),
    (N'nha-hang-pho-bien',           N'Check-in sống ảo'),
    (N'quan-nhau-lang-chai',         N'Ẩm thực địa phương'),
    (N'nuong-tu-chon-dem',           N'Ẩm thực địa phương'),
    (N'banh-trang-dem',              N'Ẩm thực địa phương'),
    (N'che-da-nang-dem',             N'Ẩm thực địa phương'),
    (N'lau-riêu-cua-dem',            N'Ẩm thực địa phương'),

    -- Giải trí mới
    (N'ent-sun-world-bana',          N'Phiêu lưu mạo hiểm'),
    (N'ent-sun-world-bana',          N'Check-in sống ảo'),
    (N'ent-helio-center',            N'Check-in sống ảo'),
    (N'ent-asia-park-night',         N'Check-in sống ảo'),
    (N'ent-kayak-son-tra',           N'Phiêu lưu mạo hiểm'),
    (N'ent-kayak-son-tra',           N'Biển & Nghỉ dưỡng'),
    (N'ent-diving-my-khe',           N'Phiêu lưu mạo hiểm'),
    (N'ent-diving-my-khe',           N'Biển & Nghỉ dưỡng'),
    (N'ent-hot-spring-than-tai',     N'Biển & Nghỉ dưỡng'),
    (N'ent-hot-spring-than-tai',     N'Phiêu lưu mạo hiểm'),
    (N'ent-surf-my-khe',             N'Phiêu lưu mạo hiểm'),
    (N'ent-surf-my-khe',             N'Biển & Nghỉ dưỡng'),
    (N'ent-surf-my-khe',             N'Check-in sống ảo'),
    (N'ent-cycling-son-tra',         N'Phiêu lưu mạo hiểm'),
    (N'ent-cycling-son-tra',         N'Check-in sống ảo'),
    (N'ent-night-market',            N'Ẩm thực địa phương'),
    (N'ent-night-market',            N'Check-in sống ảo'),
    (N'ent-da-nang-fireworks',       N'Check-in sống ảo'),
    (N'ent-vinpearl-land',           N'Phiêu lưu mạo hiểm'),
    (N'ent-golf-ba-na',              N'Check-in sống ảo'),
    (N'ent-escape-game',             N'Phiêu lưu mạo hiểm'),
    (N'ent-bowling',                 N'Phiêu lưu mạo hiểm')

) AS source(slug, preference)
INNER JOIN dbo.itinerary_catalog_places AS place ON place.slug = source.slug
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.itinerary_catalog_preferences AS existing
    WHERE existing.place_id = place.id AND existing.preference = source.preference
);
GO
