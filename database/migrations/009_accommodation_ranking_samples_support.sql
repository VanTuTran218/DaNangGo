-- SQL Server: support the accommodation kinds used by the development seed.
-- Also supplies room_count on databases that have not applied migration 006.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.room_types', 'room_count') IS NULL
    ALTER TABLE dbo.room_types ADD room_count INT NOT NULL
        CONSTRAINT df_room_count DEFAULT (1);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE parent_object_id = OBJECT_ID('dbo.room_types') AND name = 'chk_room_count')
    EXEC('ALTER TABLE dbo.room_types ADD CONSTRAINT chk_room_count CHECK (room_count > 0)');

IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE parent_object_id = OBJECT_ID('dbo.accommodations') AND name = 'chk_acc_kind')
    ALTER TABLE dbo.accommodations DROP CONSTRAINT chk_acc_kind;

ALTER TABLE dbo.accommodations WITH CHECK ADD CONSTRAINT chk_acc_kind
    CHECK (accommodation_type IN ('HOTEL', 'HOMESTAY', 'RESORT', 'HOSTEL', 'APARTMENT'));

COMMIT;
