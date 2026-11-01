USE DaNangGo;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- =========================================================
    -- 1. Thêm cột purpose vào email_verifications
    --    Phân biệt: 'verify_email' vs 'reset_password'
    --    Bản ghi cũ (verify_email) mặc định là 'verify_email'
    -- =========================================================
    IF COL_LENGTH('dbo.email_verifications', 'purpose') IS NULL
    BEGIN
        ALTER TABLE dbo.email_verifications
            ADD purpose VARCHAR(20) NOT NULL
                CONSTRAINT DF_ev_purpose DEFAULT ('verify_email');
    END;

    -- =========================================================
    -- 2. Xóa bảng password_reset_tokens cũ nếu còn tồn tại
    --    (chuyển sang dùng email_verifications + purpose)
    --    KHÔNG xóa vì có thể gây mất data — chỉ ghi chú để admin xử lý thủ công
    -- =========================================================
    -- (Giữ nguyên bảng password_reset_tokens để không phá vỡ backward compat)

    COMMIT TRANSACTION;
    PRINT 'Migration 005: Added purpose column to email_verifications.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
