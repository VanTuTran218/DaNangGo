-- ============================================================
-- Migration: 005_partner_subscriptions.sql
-- Mô tả: Tạo các bảng quản lý gói đăng ký đối tác (PARTNER),
--        lịch sử đăng ký, giao dịch thanh toán và lịch sử thay đổi.
-- Database: DaNangGo (Microsoft SQL Server)
-- ============================================================

USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Kiểm tra các bảng phụ thuộc bắt buộc
    IF OBJECT_ID(N'dbo.partner_profiles', N'U') IS NULL
        THROW 52001, 'Bảng dbo.partner_profiles chưa tồn tại. Vui lòng chạy các migration trước đó.', 1;

    IF OBJECT_ID(N'dbo.users', N'U') IS NULL
        THROW 52002, 'Bảng dbo.users chưa tồn tại. Vui lòng chạy các migration trước đó.', 1;

    -- 2. Bảng danh mục gói đăng ký dịch vụ DaNangGo
    IF OBJECT_ID(N'dbo.subscription_packages', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.subscription_packages (
            package_id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_subscription_packages PRIMARY KEY,
            package_code        VARCHAR(50) NOT NULL CONSTRAINT UQ_subscription_packages_code UNIQUE,
            name                NVARCHAR(100) NOT NULL,
            duration_months     INT NOT NULL CONSTRAINT CK_subscription_packages_duration CHECK (duration_months > 0),
            price               BIGINT NOT NULL CONSTRAINT CK_subscription_packages_price CHECK (price >= 0),
            description         NVARCHAR(500) NULL,
            is_active           BIT NOT NULL CONSTRAINT DF_subscription_packages_is_active DEFAULT (1),
            sort_order          INT NOT NULL CONSTRAINT DF_subscription_packages_sort_order DEFAULT (0),
            created_at          DATETIME2 NOT NULL CONSTRAINT DF_subscription_packages_created_at DEFAULT (SYSUTCDATETIME()),
            updated_at          DATETIME2 NULL
        );
        PRINT 'Đã tạo bảng dbo.subscription_packages';
    END;

    -- 3. Khởi tạo 3 gói giá mặc định (chống trùng lặp khi chạy lại)
    IF NOT EXISTS (SELECT 1 FROM dbo.subscription_packages WHERE package_code = '1_MONTH')
    BEGIN
        INSERT INTO dbo.subscription_packages (package_code, name, duration_months, price, description, is_active, sort_order)
        VALUES ('1_MONTH', N'Gói 1 tháng', 1, 500000, N'Dành cho đối tác trải nghiệm dịch vụ nền tảng DaNangGo trong 1 tháng.', 1, 1);
        PRINT 'Đã thêm gói 1 tháng (500.000 VNĐ)';
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.subscription_packages WHERE package_code = '6_MONTHS')
    BEGIN
        INSERT INTO dbo.subscription_packages (package_code, name, duration_months, price, description, is_active, sort_order)
        VALUES ('6_MONTHS', N'Gói 6 tháng', 6, 2500000, N'Gói nửa năm tiết kiệm chi phí, tối ưu tiếp cận du khách tại Đà Nẵng.', 1, 2);
        PRINT 'Đã thêm gói 6 tháng (2.500.000 VNĐ)';
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.subscription_packages WHERE package_code = '1_YEAR')
    BEGIN
        INSERT INTO dbo.subscription_packages (package_code, name, duration_months, price, description, is_active, sort_order)
        VALUES ('1_YEAR', N'Gói 1 năm', 12, 4500000, N'Gói cả năm ưu đãi cao nhất, duy trì dịch vụ liên tục và ổn định.', 1, 3);
        PRINT 'Đã thêm gói 1 năm (4.500.000 VNĐ)';
    END;

    -- 4. Bảng đăng ký gói và thanh toán phí sử dụng của đối tác
    IF OBJECT_ID(N'dbo.partner_subscriptions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.partner_subscriptions (
            subscription_id         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_partner_subscriptions PRIMARY KEY,
            transaction_code        NVARCHAR(50) NOT NULL CONSTRAINT UQ_partner_subscriptions_txcode UNIQUE,
            partner_id              INT NOT NULL CONSTRAINT FK_partner_subscriptions_partner FOREIGN KEY REFERENCES dbo.partner_profiles(partner_id),
            package_id              INT NOT NULL CONSTRAINT FK_partner_subscriptions_package FOREIGN KEY REFERENCES dbo.subscription_packages(package_id),
            
            -- Snapshot giá trị tại thời điểm đăng ký (bảo toàn lịch sử khi giá gói thay đổi)
            package_name            NVARCHAR(100) NOT NULL,
            duration_months         INT NOT NULL,
            price                   BIGINT NOT NULL CONSTRAINT CK_partner_subscriptions_price CHECK (price >= 0),
            
            -- Trạng thái đăng ký và trạng thái thanh toán
            subscription_status     NVARCHAR(20) NOT NULL CONSTRAINT DF_partner_subscriptions_sub_status DEFAULT ('PENDING')
                                    CONSTRAINT CK_partner_subscriptions_sub_status CHECK (subscription_status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'CANCELLED')),
            payment_status          NVARCHAR(20) NOT NULL CONSTRAINT DF_partner_subscriptions_pay_status DEFAULT ('PENDING')
                                    CONSTRAINT CK_partner_subscriptions_pay_status CHECK (payment_status IN ('PENDING', 'PAID', 'REJECTED')),
            
            -- Thông tin thanh toán (chuyển khoản thủ công)
            payment_method          NVARCHAR(50) NOT NULL CONSTRAINT DF_partner_subscriptions_pay_method DEFAULT ('BANK_TRANSFER'),
            payment_reference       NVARCHAR(100) NULL,
            payment_proof_note      NVARCHAR(500) NULL,
            payment_submitted_at    DATETIME2 NULL,
            
            -- Thời hạn sử dụng theo lịch
            start_date              DATETIME2 NULL,
            end_date                DATETIME2 NULL,
            created_at              DATETIME2 NOT NULL CONSTRAINT DF_partner_subscriptions_created_at DEFAULT (SYSUTCDATETIME()),
            
            -- Thông tin kiểm duyệt thanh toán của Admin
            confirmed_by            INT NULL CONSTRAINT FK_partner_subscriptions_confirmed_by FOREIGN KEY REFERENCES dbo.users(user_id),
            confirmed_at            DATETIME2 NULL,
            rejection_reason        NVARCHAR(500) NULL,
            
            -- Metadata gia hạn
            is_renewal              BIT NOT NULL CONSTRAINT DF_partner_subscriptions_is_renewal DEFAULT (0),
            renewed_from_id         INT NULL CONSTRAINT FK_partner_subscriptions_renewed_from FOREIGN KEY REFERENCES dbo.partner_subscriptions(subscription_id)
        );
        PRINT 'Đã tạo bảng dbo.partner_subscriptions';
    END;

    -- 5. Bảng ghi log lịch sử thay đổi trạng thái đăng ký/thanh toán
    IF OBJECT_ID(N'dbo.subscription_status_logs', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.subscription_status_logs (
            log_id              INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_subscription_status_logs PRIMARY KEY,
            subscription_id     INT NOT NULL CONSTRAINT FK_sub_logs_subscription FOREIGN KEY REFERENCES dbo.partner_subscriptions(subscription_id) ON DELETE CASCADE,
            previous_status     NVARCHAR(50) NULL,
            new_status          NVARCHAR(50) NOT NULL,
            action_by_user_id   INT NULL CONSTRAINT FK_sub_logs_user FOREIGN KEY REFERENCES dbo.users(user_id),
            created_at          DATETIME2 NOT NULL CONSTRAINT DF_sub_logs_created_at DEFAULT (SYSUTCDATETIME()),
            note                NVARCHAR(500) NULL
        );
        PRINT 'Đã tạo bảng dbo.subscription_status_logs';
    END;

    -- 6. Chỉ mục tăng tốc truy vấn đối tác, báo cáo doanh thu và thời hạn
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_partner_subscriptions_partner' AND object_id = OBJECT_ID(N'dbo.partner_subscriptions'))
    BEGIN
        CREATE INDEX IX_partner_subscriptions_partner ON dbo.partner_subscriptions (partner_id, subscription_status, end_date);
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_partner_subscriptions_revenue' AND object_id = OBJECT_ID(N'dbo.partner_subscriptions'))
    BEGIN
        CREATE INDEX IX_partner_subscriptions_revenue ON dbo.partner_subscriptions (payment_status, confirmed_at) INCLUDE (price, package_id);
    END;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_partner_subscriptions_created' AND object_id = OBJECT_ID(N'dbo.partner_subscriptions'))
    BEGIN
        CREATE INDEX IX_partner_subscriptions_created ON dbo.partner_subscriptions (created_at DESC);
    END;

    COMMIT TRANSACTION;
    PRINT '✅ Migration 005_partner_subscriptions hoàn tất thành công!';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    PRINT '❌ Lỗi thực thi migration 005_partner_subscriptions: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
GO
