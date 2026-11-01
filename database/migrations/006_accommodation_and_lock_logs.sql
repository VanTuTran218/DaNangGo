USE [DaNangGo];
GO
/* Migration bổ sung nghiệp vụ Lưu trú và Khóa địa điểm */

IF COL_LENGTH('dbo.places', 'booking_url') IS NULL
    ALTER TABLE dbo.places ADD booking_url VARCHAR(255) NULL;
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_places_status')
    ALTER TABLE dbo.places DROP CONSTRAINT chk_places_status;
GO
ALTER TABLE dbo.places ADD CONSTRAINT chk_places_status
    CHECK (status IN ('PENDING', 'ACTIVE', 'HIDDEN', 'LOCKED'));
GO

IF COL_LENGTH('dbo.room_types', 'room_count') IS NULL
    ALTER TABLE dbo.room_types ADD room_count INT NOT NULL CONSTRAINT df_room_count DEFAULT (1);
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_room_count')
    ALTER TABLE dbo.room_types ADD CONSTRAINT chk_room_count CHECK (room_count > 0);
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_acc_kind')
    ALTER TABLE dbo.accommodations DROP CONSTRAINT chk_acc_kind;
GO
ALTER TABLE dbo.accommodations ADD CONSTRAINT chk_acc_kind
    CHECK (accommodation_type IN ('HOTEL', 'HOMESTAY', 'RESORT'));
GO
IF OBJECT_ID('dbo.place_lock_logs', 'U') IS NULL
CREATE TABLE dbo.place_lock_logs (
    log_id          INT IDENTITY(1,1) PRIMARY KEY,
    place_id        INT           NOT NULL,
    reason          NVARCHAR(255) NOT NULL,
    previous_status VARCHAR(20)   NOT NULL,
    locked_by       INT           NOT NULL,
    locked_at       DATETIME2(7)  NOT NULL CONSTRAINT df_pll_locked_at DEFAULT (SYSDATETIME()),
    unlocked_by     INT           NULL,
    unlocked_at     DATETIME2(7)  NULL,
    CONSTRAINT fk_pll_place    FOREIGN KEY (place_id)    REFERENCES dbo.places(place_id) ON DELETE CASCADE,
    CONSTRAINT fk_pll_locker   FOREIGN KEY (locked_by)   REFERENCES dbo.users(user_id),
    CONSTRAINT fk_pll_unlocker FOREIGN KEY (unlocked_by) REFERENCES dbo.users(user_id)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_pll_place_open')
    CREATE INDEX idx_pll_place_open ON dbo.place_lock_logs (place_id, unlocked_at);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_room_place_status_price')
    CREATE INDEX idx_room_place_status_price ON dbo.room_types (place_id, status) INCLUDE (price_per_night, capacity);
GO
