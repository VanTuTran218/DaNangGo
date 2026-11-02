USE DaNangGo;
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

INSERT INTO dbo.itinerary_catalog_places
    (slug, kind, name, description, address, price, accommodation_type, stars, meal_period, image_url)
SELECT
    source.slug, source.kind, source.name, source.description, source.address, source.price,
    source.accommodation_type, source.stars, source.meal_period, source.image_url
FROM (VALUES
    (N'che-lien-buoi-chieu', N'FOOD', N'Chè Liên buổi chiều', N'Chè sầu và chè thập cẩm, phù hợp ăn nhẹ buổi chiều.', N'Hải Châu, Đà Nẵng', 30000, NULL, NULL, N'SNACK', N'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80'),
    (N'banh-trang-kep-cho-con', N'FOOD', N'Bánh tráng kẹp chợ Cồn', N'Bánh tráng kẹp nóng và đồ ăn vặt địa phương.', N'Thanh Khê, Đà Nẵng', 25000, NULL, NULL, N'SNACK', N'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80'),
    (N'sua-chua-muoi-chanh', N'FOOD', N'Sữa chua muối và mít trộn', N'Món ăn vặt mát nhẹ đặc trưng Đà Nẵng.', N'Sơn Trà, Đà Nẵng', 35000, NULL, NULL, N'SNACK', N'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80')
) AS source(slug, kind, name, description, address, price, accommodation_type, stars, meal_period, image_url)
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.itinerary_catalog_places AS existing
    WHERE existing.slug = source.slug
);
GO

INSERT INTO dbo.itinerary_catalog_preferences (place_id, preference)
SELECT place.id, source.preference
FROM (VALUES
    (N'che-lien-buoi-chieu', N'Ẩm thực địa phương'),
    (N'banh-trang-kep-cho-con', N'Ẩm thực địa phương'),
    (N'sua-chua-muoi-chanh', N'Ẩm thực địa phương')
) AS source(slug, preference)
INNER JOIN dbo.itinerary_catalog_places AS place ON place.slug = source.slug
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.itinerary_catalog_preferences AS existing
    WHERE existing.place_id = place.id AND existing.preference = source.preference
);
GO
