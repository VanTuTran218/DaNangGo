-- Bổ sung subtype cho 5 điểm tham quan từ seed 050.
-- Giá vé là dữ liệu mẫu của project (đối chiếu seed 040), không phải giá hiện hành.
-- Chạy qua sqlcmd với -f 65001 để tên tiếng Việt khớp dữ liệu trong DB.
USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT dbo.attractions (place_id, place_type, category_id, ticket_price, visit_duration_minutes)
SELECT p.place_id, 'ATTRACTION', s.category_id, s.ticket_price, NULL
FROM (VALUES
    (N'Biển Mỹ Khê', 1, 0),
    (N'Cầu Rồng', 3, 0),
    (N'Chùa Linh Ứng Sơn Trà', 5, 0),
    (N'Danh thắng Ngũ Hành Sơn', 3, 40000),
    (N'Cầu Vàng - Bà Nà Hills', 4, 900000)
) AS s(name, category_id, ticket_price)
JOIN dbo.places p ON p.name = s.name AND p.place_type = 'ATTRACTION'
WHERE NOT EXISTS (SELECT 1 FROM dbo.attractions a WHERE a.place_id = p.place_id);

COMMIT TRANSACTION;
GO
