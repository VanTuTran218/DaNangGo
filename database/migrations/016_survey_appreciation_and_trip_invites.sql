-- Migration 016: Survey appreciation emails, digital certificates, and post-trip email invitations.
-- Keeps dbo.survey_responses 100% anonymous (no raw email or user_id stored in survey_responses).
-- All statements are idempotent.

IF OBJECT_ID('dbo.survey_appreciation_deliveries', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.survey_appreciation_deliveries (
    delivery_id INT IDENTITY(1,1) PRIMARY KEY,
    response_id INT NOT NULL REFERENCES dbo.survey_responses(response_id),
    certificate_code VARCHAR(32) NOT NULL,
    email_hash VARCHAR(64) NOT NULL,
    masked_email NVARCHAR(160) NOT NULL,
    recipient_name NVARCHAR(120) NOT NULL,
    origin_label NVARCHAR(120) NULL,
    stay_duration_label NVARCHAR(80) NULL,
    satisfaction_score TINYINT NULL,
    nps_score TINYINT NULL,
    reward_code VARCHAR(32) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    sent_at DATETIME2 NULL,
    CONSTRAINT UQ_survey_appreciation_response UNIQUE (response_id),
    CONSTRAINT UQ_survey_appreciation_cert UNIQUE (certificate_code),
    CONSTRAINT CK_survey_appreciation_status CHECK (delivery_status IN ('SENT', 'SKIPPED_COOLDOWN', 'FAILED', 'DEV_LOGGED'))
  );
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.survey_appreciation_deliveries')
    AND name = 'IX_survey_appreciation_email_hash'
)
  CREATE INDEX IX_survey_appreciation_email_hash
    ON dbo.survey_appreciation_deliveries(email_hash, created_at DESC);
GO

IF OBJECT_ID('dbo.survey_trip_invitations', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.survey_trip_invitations (
    invitation_id INT IDENTITY(1,1) PRIMARY KEY,
    itinerary_id BIGINT NOT NULL,
    user_id INT NOT NULL REFERENCES dbo.users(user_id),
    email_hash VARCHAR(64) NOT NULL,
    masked_email NVARCHAR(160) NOT NULL,
    itinerary_title NVARCHAR(200) NOT NULL,
    trip_end_date DATE NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_survey_trip_invitation_itinerary UNIQUE (itinerary_id),
    CONSTRAINT CK_survey_trip_invitation_status CHECK (delivery_status IN ('SENT', 'FAILED', 'DEV_LOGGED'))
  );
END;
GO
