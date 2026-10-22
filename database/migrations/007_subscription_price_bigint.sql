-- Align existing DaNangGo databases with migration 005.
-- Widen subscription/package prices to BIGINT so revenue SUM() cannot overflow INT.
USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- The revenue index includes partner_subscriptions.price, so drop it before ALTER COLUMN.
    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.partner_subscriptions')
          AND name = N'price' AND TYPE_NAME(user_type_id) = N'int'
    )
    BEGIN
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.partner_subscriptions')
              AND name = N'IX_partner_subscriptions_revenue'
        )
            DROP INDEX IX_partner_subscriptions_revenue ON dbo.partner_subscriptions;

        DECLARE @dropSubscriptionChecks NVARCHAR(MAX) = N'';
        SELECT @dropSubscriptionChecks +=
            N'ALTER TABLE dbo.partner_subscriptions DROP CONSTRAINT ' + QUOTENAME(name) + N';'
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.partner_subscriptions')
          AND parent_column_id = COLUMNPROPERTY(parent_object_id, N'price', 'ColumnId');
        IF LEN(@dropSubscriptionChecks) > 0 EXEC sys.sp_executesql @dropSubscriptionChecks;

        ALTER TABLE dbo.partner_subscriptions ALTER COLUMN price BIGINT NOT NULL;
        ALTER TABLE dbo.partner_subscriptions
            ADD CONSTRAINT CK_partner_subscriptions_price CHECK (price >= 0);
    END;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.subscription_packages')
          AND name = N'price' AND TYPE_NAME(user_type_id) = N'int'
    )
    BEGIN
        DECLARE @dropPackageChecks NVARCHAR(MAX) = N'';
        SELECT @dropPackageChecks +=
            N'ALTER TABLE dbo.subscription_packages DROP CONSTRAINT ' + QUOTENAME(name) + N';'
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.subscription_packages')
          AND parent_column_id = COLUMNPROPERTY(parent_object_id, N'price', 'ColumnId');
        IF LEN(@dropPackageChecks) > 0 EXEC sys.sp_executesql @dropPackageChecks;

        ALTER TABLE dbo.subscription_packages ALTER COLUMN price BIGINT NOT NULL;
        ALTER TABLE dbo.subscription_packages
            ADD CONSTRAINT CK_subscription_packages_price CHECK (price >= 0);
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.partner_subscriptions')
          AND name = N'IX_partner_subscriptions_revenue'
    )
        CREATE INDEX IX_partner_subscriptions_revenue
            ON dbo.partner_subscriptions (payment_status, confirmed_at)
            INCLUDE (price, package_id);

    COMMIT TRANSACTION;
    PRINT 'Subscription price columns are BIGINT; revenue index is available.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
