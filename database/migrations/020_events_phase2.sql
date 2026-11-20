-- ============================================================
-- Migration 020: Các bảng bổ trợ cho Module Sự kiện - Đợt 2
-- 1. dbo.event_favorites: Lưu sự kiện yêu thích (Bookmark)
-- 2. dbo.event_user_calendar: Thêm sự kiện vào lịch cá nhân
-- 3. dbo.event_notifications: Thông báo khi sự kiện đã lưu đổi lịch / hoãn / hủy
-- ============================================================

USE DaNangGo;
GO

-- 1. Bảng dbo.event_favorites (Lưu sự kiện yêu thích)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'event_favorites' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.event_favorites (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_event_favorites_created_at DEFAULT SYSUTCDATETIME(),
        
        CONSTRAINT FK_event_favorites_user FOREIGN KEY (user_id) 
            REFERENCES dbo.users(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_event_favorites_event FOREIGN KEY (event_id) 
            REFERENCES dbo.events(event_id) ON DELETE CASCADE,
        CONSTRAINT UQ_event_favorites UNIQUE (user_id, event_id)
    );

    CREATE NONCLUSTERED INDEX IX_event_favorites_user_id ON dbo.event_favorites(user_id);
    CREATE NONCLUSTERED INDEX IX_event_favorites_event_id ON dbo.event_favorites(event_id);
    PRINT 'Đã tạo bảng dbo.event_favorites thành công.';
END
ELSE
BEGIN
    PRINT 'Bảng dbo.event_favorites đã tồn tại.';
END
GO

-- 2. Bảng dbo.event_user_calendar (Theo dõi sự kiện đã thêm vào lịch cá nhân)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'event_user_calendar' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.event_user_calendar (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        added_at DATETIME2(0) NOT NULL CONSTRAINT DF_event_user_calendar_added_at DEFAULT SYSUTCDATETIME(),
        
        CONSTRAINT FK_event_calendar_user FOREIGN KEY (user_id) 
            REFERENCES dbo.users(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_event_calendar_event FOREIGN KEY (event_id) 
            REFERENCES dbo.events(event_id) ON DELETE CASCADE,
        CONSTRAINT UQ_event_user_calendar UNIQUE (user_id, event_id)
    );

    CREATE NONCLUSTERED INDEX IX_event_user_calendar_user_id ON dbo.event_user_calendar(user_id);
    PRINT 'Đã tạo bảng dbo.event_user_calendar thành công.';
END
ELSE
BEGIN
    PRINT 'Bảng dbo.event_user_calendar đã tồn tại.';
END
GO

-- 3. Bảng dbo.event_notifications (Thông báo biến động sự kiện đã lưu cho người dùng)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'event_notifications' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.event_notifications (
        notification_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        type VARCHAR(30) NOT NULL CONSTRAINT CK_event_notifications_type CHECK (
            type IN ('RESCHEDULED', 'POSTPONED', 'CANCELLED', 'TIME_CHANGE', 'GENERAL')
        ),
        notice NVARCHAR(500) NULL,
        is_read BIT NOT NULL CONSTRAINT DF_event_notifications_is_read DEFAULT 0,
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_event_notifications_created_at DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_event_notifications_user FOREIGN KEY (user_id) 
            REFERENCES dbo.users(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_event_notifications_event FOREIGN KEY (event_id) 
            REFERENCES dbo.events(event_id) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_event_notifications_user_read 
    ON dbo.event_notifications(user_id, is_read, created_at DESC);
    PRINT 'Đã tạo bảng dbo.event_notifications thành công.';
END
ELSE
BEGIN
    PRINT 'Bảng dbo.event_notifications đã tồn tại.';
END
GO
