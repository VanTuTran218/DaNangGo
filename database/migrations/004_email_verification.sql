USE DaNangGo;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- =========================================================
    -- 1. Đảm bảo cột email_verified đã có (migration 003 đã thêm)
    --    Tài khoản cũ đang có email_verified = 0 → set = 1 để không bị khóa
    -- =========================================================
    IF COL_LENGTH('dbo.users', 'email_verified') IS NOT NULL
    BEGIN
        UPDATE dbo.users SET email_verified = 1 WHERE email_verified = 0;
    END;

    -- =========================================================
    -- 2. Tạo bảng email_verifications nếu chưa có
    --    - code_hash: bcrypt hash của mã OTP 6 số
    --    - expires_at: hết hạn sau 10 phút kể từ lần tạo/gửi lại
    --    - attempts: số lần nhập sai (giới hạn 5 lần)
    --    - last_sent_at: để rate-limit gửi lại (tối thiểu 60 giây)
    --    - sent_count: đếm tổng số lần gửi trong 1 giờ (giới hạn 5 lần)
    --    - window_start: thời điểm bắt đầu cửa sổ 1 giờ
    -- =========================================================
    IF OBJECT_ID(N'dbo.email_verifications', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.email_verifications (
            id           BIGINT IDENTITY(1,1) NOT NULL
                             CONSTRAINT PK_email_verifications PRIMARY KEY,
            user_id      INT NOT NULL
                             CONSTRAINT FK_email_verifications_users
                             FOREIGN KEY REFERENCES dbo.users(user_id)
                             ON DELETE CASCADE,
            code_hash    VARCHAR(255) NOT NULL,
            expires_at   DATETIME2 NOT NULL,
            attempts     INT NOT NULL CONSTRAINT DF_ev_attempts DEFAULT (0),
            created_at   DATETIME2 NOT NULL CONSTRAINT DF_ev_created_at DEFAULT (SYSUTCDATETIME()),
            last_sent_at DATETIME2 NOT NULL CONSTRAINT DF_ev_last_sent_at DEFAULT (SYSUTCDATETIME()),
            sent_count   INT NOT NULL CONSTRAINT DF_ev_sent_count DEFAULT (1),
            window_start DATETIME2 NOT NULL CONSTRAINT DF_ev_window_start DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_email_verifications_user_id UNIQUE (user_id)
        );

        CREATE INDEX IX_email_verifications_user_id
            ON dbo.email_verifications(user_id)
            INCLUDE (expires_at, attempts);
    END;

    COMMIT TRANSACTION;
    PRINT 'Migration 004: email_verifications created, existing accounts marked as verified.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
