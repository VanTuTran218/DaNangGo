-- ============================================================
-- Migration 019: Tạo bảng quản lý Sự kiện (Events) cho DaNangGo
-- Phục vụ module Sự kiện: hiển thị trang chủ, danh sách, chi tiết và quản trị
-- ============================================================

USE DaNangGo;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'events' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.events (
        event_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        title NVARCHAR(200) NOT NULL,
        slug VARCHAR(230) NOT NULL CONSTRAINT UQ_events_slug UNIQUE,
        cover_image NVARCHAR(500) NULL,
        short_description NVARCHAR(500) NULL,
        description NVARCHAR(MAX) NULL,
        category VARCHAR(50) NULL CONSTRAINT CK_events_category CHECK (
            category IN ('FESTIVAL', 'MUSIC', 'FOOD', 'SPORTS', 'EXHIBITION', 'WORKSHOP', 'FAMILY')
        ),
        start_time DATETIME2(0) NULL,
        end_time DATETIME2(0) NULL,
        is_all_day BIT NOT NULL CONSTRAINT DF_events_is_all_day DEFAULT 0,
        
        -- Liên kết địa điểm có sẵn trong app (tùy chọn)
        place_id INT NULL CONSTRAINT FK_events_places REFERENCES dbo.places(place_id) ON DELETE SET NULL,
        location_name NVARCHAR(200) NULL,
        address NVARCHAR(300) NULL,
        district NVARCHAR(100) NULL,
        latitude DECIMAL(9,6) NULL,
        longitude DECIMAL(9,6) NULL,

        -- Thông tin vé & hình thức tham gia
        ticket_type VARCHAR(30) NULL CONSTRAINT DF_events_ticket_type DEFAULT 'FREE_OPEN' CONSTRAINT CK_events_ticket_type CHECK (
            ticket_type IN ('FREE_OPEN', 'FREE_REGISTRATION', 'PAID', 'UNANNOUNCED')
        ),
        ticket_price_display NVARCHAR(100) NULL,
        ticket_url NVARCHAR(500) NULL,
        registration_deadline DATETIME2(0) NULL,

        -- Ban tổ chức & Nguồn chính thức
        organizer_name NVARCHAR(200) NULL,
        organizer_contact NVARCHAR(255) NULL,
        source_url NVARCHAR(500) NULL,

        -- Trạng thái & Nổi bật
        is_featured BIT NOT NULL CONSTRAINT DF_events_is_featured DEFAULT 0,
        status VARCHAR(30) NOT NULL CONSTRAINT DF_events_status DEFAULT 'DRAFT' CONSTRAINT CK_events_status CHECK (
            status IN ('DRAFT', 'PUBLISHED', 'RESCHEDULED', 'POSTPONED', 'CANCELLED')
        ),
        reschedule_notice NVARCHAR(500) NULL,

        -- Metadata
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_events_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_events_updated_at DEFAULT SYSUTCDATETIME(),

        -- Ràng buộc logic thời gian: end_time >= start_time
        CONSTRAINT CK_events_time CHECK (end_time >= start_time)
    );

    PRINT 'Đã tạo bảng dbo.events thành công.';
END
ELSE
BEGIN
    PRINT 'Bảng dbo.events đã tồn tại.';
END
GO

-- Tạo Index hỗ trợ truy vấn hiệu năng cao
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_events_status_time' AND object_id = OBJECT_ID('dbo.events'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_events_status_time
    ON dbo.events (status, is_featured, start_time)
    INCLUDE (title, slug, cover_image, category, district, location_name, ticket_type, ticket_price_display, end_time);
    PRINT 'Đã tạo index IX_events_status_time.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_events_filters' AND object_id = OBJECT_ID('dbo.events'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_events_filters
    ON dbo.events (category, district, ticket_type)
    INCLUDE (status, start_time, end_time);
    PRINT 'Đã tạo index IX_events_filters.';
END
GO
