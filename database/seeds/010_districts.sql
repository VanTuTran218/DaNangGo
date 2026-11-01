-- ============================================================
-- Seed Data: 010_districts.sql
-- Danh sách các quận/huyện tại Đà Nẵng
-- ============================================================

USE DaNangGo;
GO

-- Xóa dữ liệu cũ (nếu có) để chạy lại không lỗi
DELETE FROM districts;
DBCC CHECKIDENT ('districts', RESEED, 0);
GO

INSERT INTO districts (name) VALUES
(N'Hải Châu'),
(N'Thanh Khê'),
(N'Sơn Trà'),
(N'Ngũ Hành Sơn'),
(N'Liên Chiểu'),
(N'Cẩm Lệ'),
(N'Hòa Vang'),
(N'Hoàng Sa');

PRINT '✅ Đã thêm dữ liệu mẫu cho bảng districts (Quận/Huyện)';
GO
