USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- Thêm cột updated_at nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reviews') AND name = N'updated_at'
    )
    BEGIN
        ALTER TABLE dbo.reviews ADD updated_at DATETIME2(7) NULL;
        -- Backfill: dùng created_at làm giá trị khởi đầu
        UPDATE dbo.reviews SET updated_at = created_at WHERE updated_at IS NULL;
        PRINT 'Migration 012: Added updated_at column to reviews.';
    END
    ELSE
        PRINT 'Migration 012: updated_at already exists, skipped.';

    -- Thêm cột moderated_at nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reviews') AND name = N'moderated_at'
    )
    BEGIN
        ALTER TABLE dbo.reviews ADD moderated_at DATETIME2(7) NULL;
        PRINT 'Migration 012: Added moderated_at column to reviews.';
    END
    ELSE
        PRINT 'Migration 012: moderated_at already exists, skipped.';

    -- Thêm cột moderated_by nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reviews') AND name = N'moderated_by'
    )
    BEGIN
        ALTER TABLE dbo.reviews ADD moderated_by INT NULL;
        ALTER TABLE dbo.reviews ADD CONSTRAINT fk_reviews_moderated_by
            FOREIGN KEY (moderated_by) REFERENCES dbo.users(user_id);
        PRINT 'Migration 012: Added moderated_by column to reviews.';
    END
    ELSE
        PRINT 'Migration 012: moderated_by already exists, skipped.';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
