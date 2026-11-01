USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- Existing users and their dependent foreign keys are preserved.
    IF COL_LENGTH('dbo.users', 'public_id') IS NULL
        ALTER TABLE dbo.users ADD public_id NVARCHAR(20) NULL;

    IF COL_LENGTH('dbo.users', 'email_verified') IS NULL
        ALTER TABLE dbo.users ADD email_verified BIT NOT NULL
            CONSTRAINT DF_users_email_verified DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('dbo.users', 'failed_login_count') IS NULL
        ALTER TABLE dbo.users ADD failed_login_count INT NOT NULL
            CONSTRAINT DF_users_failed_login_count DEFAULT (0) WITH VALUES;

    IF COL_LENGTH('dbo.users', 'locked_until') IS NULL
        ALTER TABLE dbo.users ADD locked_until DATETIME2 NULL;

    IF COL_LENGTH('dbo.users', 'last_login_at') IS NULL
        ALTER TABLE dbo.users ADD last_login_at DATETIME2 NULL;

    -- Stable IDs for any legacy users; this update does not alter user IDs or references.
    -- Compile the statement after the column has been added. SQL Server binds
    -- column names before executing the full batch, even when ALTER is guarded.
    EXEC sys.sp_executesql N'
        UPDATE dbo.users
           SET public_id = N''LG-'' + RIGHT(REPLICATE(''0'', 10) + CONVERT(VARCHAR(10), user_id), 10)
         WHERE public_id IS NULL;';

    DECLARE @has_null_public_id BIT;
    EXEC sys.sp_executesql
        N'SELECT @has_nulls = CASE WHEN EXISTS (SELECT 1 FROM dbo.users WHERE public_id IS NULL) THEN 1 ELSE 0 END;',
        N'@has_nulls BIT OUTPUT',
        @has_nulls = @has_null_public_id OUTPUT;

    IF @has_null_public_id = 1
        THROW 51000, 'Cannot make dbo.users.public_id required while NULL values remain.', 1;

    IF EXISTS (
        SELECT 1 FROM sys.columns
         WHERE object_id = OBJECT_ID(N'dbo.users')
           AND name = N'public_id'
           AND is_nullable = 1
    )
        EXEC sys.sp_executesql N'ALTER TABLE dbo.users ALTER COLUMN public_id NVARCHAR(20) NOT NULL;';

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.users') AND name = N'UX_users_public_id')
        EXEC sys.sp_executesql N'CREATE UNIQUE INDEX UX_users_public_id ON dbo.users(public_id);';

    -- Keep the existing required, unique email column and index intact.
    -- Email is mandatory at registration; phone remains optional.
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.users') AND name = N'UX_users_phone')
        CREATE UNIQUE INDEX UX_users_phone ON dbo.users(phone) WHERE phone IS NOT NULL;

    IF OBJECT_ID(N'dbo.partner_profiles', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH('dbo.partner_profiles', 'service_type') IS NULL
            ALTER TABLE dbo.partner_profiles ADD service_type NVARCHAR(10) NULL;

        IF COL_LENGTH('dbo.partner_profiles', 'tax_code') IS NULL
            ALTER TABLE dbo.partner_profiles ADD tax_code NVARCHAR(20) NULL;

        IF COL_LENGTH('dbo.partner_profiles', 'created_at') IS NULL
            ALTER TABLE dbo.partner_profiles ADD created_at DATETIME2 NOT NULL
                CONSTRAINT DF_partner_profiles_created_at DEFAULT (SYSUTCDATETIME()) WITH VALUES;

        IF NOT EXISTS (
            SELECT 1 FROM sys.check_constraints
             WHERE parent_object_id = OBJECT_ID(N'dbo.partner_profiles')
               AND name = N'CK_partner_profiles_service_type'
        )
            EXEC sys.sp_executesql N'
                ALTER TABLE dbo.partner_profiles ADD CONSTRAINT CK_partner_profiles_service_type
                    CHECK (service_type IS NULL OR service_type IN (N''STAY'', N''TABLE'', N''TICKET''));';
    END;

    IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.refresh_tokens (
            token_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_refresh_tokens PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME2 NOT NULL,
            revoked_at DATETIME2 NULL,
            user_agent NVARCHAR(255) NULL,
            ip NVARCHAR(45) NULL,
            created_at DATETIME2 NOT NULL CONSTRAINT DF_refresh_tokens_created_at DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_refresh_tokens_token_hash UNIQUE (token_hash),
            CONSTRAINT FK_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
        );
        CREATE INDEX IX_refresh_tokens_user_active ON dbo.refresh_tokens(user_id, expires_at) INCLUDE (revoked_at);
    END;

    IF OBJECT_ID(N'dbo.password_reset_tokens', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.password_reset_tokens (
            id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_password_reset_tokens PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME2 NOT NULL,
            used_at DATETIME2 NULL,
            created_at DATETIME2 NOT NULL CONSTRAINT DF_password_reset_tokens_created_at DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT UQ_password_reset_tokens_token_hash UNIQUE (token_hash),
            CONSTRAINT FK_password_reset_tokens_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
        );
        CREATE INDEX IX_password_reset_tokens_user_active ON dbo.password_reset_tokens(user_id, expires_at) INCLUDE (used_at);
    END;

    -- Roles already reference users through role_id. Add only missing labels.
    IF OBJECT_ID(N'dbo.roles', N'U') IS NOT NULL AND COL_LENGTH('dbo.roles', 'role_name') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE UPPER(role_name) = 'USER')
            INSERT INTO dbo.roles(role_name) VALUES ('User');
        IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE UPPER(role_name) = 'PARTNER')
            INSERT INTO dbo.roles(role_name) VALUES ('Partner');
        IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE UPPER(role_name) = 'ADMIN')
            INSERT INTO dbo.roles(role_name) VALUES ('Admin');
    END;

    COMMIT TRANSACTION;
    PRINT 'Auth schema upgrade completed. Existing users, roles, and foreign keys were retained.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
