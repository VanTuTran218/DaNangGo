-- Complete the missing parts of 006_accommodation_and_lock_logs without
-- replacing the newer accommodation type constraint from migration 009.
USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.place_lock_logs', N'U') IS NULL
    BEGIN
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
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_pll_place_open' AND object_id = OBJECT_ID(N'dbo.place_lock_logs'))
        CREATE INDEX idx_pll_place_open ON dbo.place_lock_logs (place_id, unlocked_at);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_room_place_status_price' AND object_id = OBJECT_ID(N'dbo.room_types'))
        CREATE INDEX idx_room_place_status_price ON dbo.room_types (place_id, status) INCLUDE (price_per_night, capacity);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
