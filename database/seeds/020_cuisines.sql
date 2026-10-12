-- ============================================================
-- Seed Data: 020_cuisines.sql
-- Danh sách các danh mục ẩm thực dựa theo UI Frontend
-- ============================================================

USE DaNangGo;
GO

DELETE FROM cuisines;
DBCC CHECKIDENT ('cuisines', RESEED, 0);
GO

INSERT INTO cuisines (name) VALUES
(N'Hải sản'),
(N'Bánh xèo'),
(N'Lẩu cá'),
(N'Cao lầu'),
(N'Mì Quảng'),
(N'Bún chả cá'),
(N'Bánh canh'),
(N'Cơm nhà'),
(N'Ăn vặt & Chè'),
(N'Cà phê');

PRINT '✅ Đã thêm dữ liệu mẫu cho bảng cuisines (Danh mục ẩm thực)';
GO
