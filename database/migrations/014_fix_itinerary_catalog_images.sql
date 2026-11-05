USE DaNangGo;
GO

UPDATE dbo.itinerary_catalog_places
SET image_url = CASE slug
    WHEN N'hotel-thanh-binh-3' THEN N'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'
    WHEN N'banh-mi-ba-lan' THEN N'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80'
    WHEN N'banh-mi-ong-ty' THEN N'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80'
END
WHERE slug IN (N'hotel-thanh-binh-3', N'banh-mi-ba-lan', N'banh-mi-ong-ty');
GO
