USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.partner_profiles', N'U') IS NULL
        THROW 51000, 'dbo.partner_profiles does not exist. Apply the existing partner schema first.', 1;

    IF OBJECT_ID(N'dbo.users', N'U') IS NULL
        THROW 51001, 'dbo.users does not exist. Apply the existing auth schema first.', 1;

    -- Keep Admin locks separate from temporary lockouts caused by failed logins.
    IF COL_LENGTH(N'dbo.users', N'admin_locked') IS NULL
        ALTER TABLE dbo.users ADD admin_locked BIT NOT NULL
            CONSTRAINT DF_users_admin_locked DEFAULT (0) WITH VALUES;

    -- Rejection explanations are optional for existing/approved profiles.
    IF COL_LENGTH(N'dbo.partner_profiles', N'rejection_reason') IS NULL
        ALTER TABLE dbo.partner_profiles ADD rejection_reason NVARCHAR(500) NULL;

    COMMIT TRANSACTION;
    PRINT 'Partner account controls schema is ready.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
