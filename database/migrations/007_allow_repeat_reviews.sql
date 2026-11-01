USE DaNangGo;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = 'uq_review_user_place'
          AND parent_object_id = OBJECT_ID('dbo.reviews')
    )
    BEGIN
        ALTER TABLE dbo.reviews DROP CONSTRAINT uq_review_user_place;
    END;

    COMMIT TRANSACTION;
    PRINT 'Migration 007: Users may create multiple reviews for the same place.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
