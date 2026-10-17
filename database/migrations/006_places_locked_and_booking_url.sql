USE DaNangGo;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- 1. Bổ sung trạng thái LOCKED vào ràng buộc chk_places_status
IF EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_places_status' AND parent_object_id = OBJECT_ID('dbo.places')
)
BEGIN
    ALTER TABLE dbo.places DROP CONSTRAINT chk_places_status;
END;
GO

ALTER TABLE dbo.places WITH CHECK ADD CONSTRAINT chk_places_status 
    CHECK (status IN ('PENDING', 'HIDDEN', 'ACTIVE', 'LOCKED'));
GO

-- 2. Thêm cột booking_url nếu chưa tồn tại
IF COL_LENGTH('dbo.places', 'booking_url') IS NULL
BEGIN
    ALTER TABLE dbo.places ADD booking_url NVARCHAR(500) NULL;
END;
GO

-- 3. Ràng buộc kiểm tra booking_url chỉ chấp nhận http:// hoặc https://
IF EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'chk_places_booking_url' AND parent_object_id = OBJECT_ID('dbo.places')
)
BEGIN
    ALTER TABLE dbo.places DROP CONSTRAINT chk_places_booking_url;
END;
GO

ALTER TABLE dbo.places WITH CHECK ADD CONSTRAINT chk_places_booking_url
    CHECK (booking_url IS NULL OR booking_url LIKE 'http://%' OR booking_url LIKE 'https://%');
GO

PRINT 'Migration 006: Added LOCKED status and booking_url column to places successfully.';
GO
