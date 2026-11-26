-- Migration 017: Events & Event Submissions management for DaNangGo.
-- Supports Public Discovery (/api/events), Admin Events CRUD (/api/admin/events),
-- and Admin Event Submissions Review (/api/admin/event-submissions).
-- All statements are idempotent.

IF OBJECT_ID('dbo.events', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.events (
    event_id INT IDENTITY(1,1) PRIMARY KEY,
    slug VARCHAR(180) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    cover_image NVARCHAR(500) NULL,
    short_description NVARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL,
    category VARCHAR(40) NULL,
    start_time DATETIME2 NULL,
    end_time DATETIME2 NULL,
    is_all_day BIT NOT NULL DEFAULT 0,
    place_id INT NULL REFERENCES dbo.places(place_id),
    location_name NVARCHAR(200) NULL,
    address NVARCHAR(300) NULL,
    district NVARCHAR(100) NULL,
    latitude DECIMAL(9,6) NULL,
    longitude DECIMAL(9,6) NULL,
    ticket_type VARCHAR(30) NOT NULL DEFAULT 'FREE_OPEN',
    ticket_price_display NVARCHAR(100) NULL,
    ticket_url NVARCHAR(500) NULL,
    registration_deadline DATETIME2 NULL,
    organizer_name NVARCHAR(200) NULL,
    organizer_contact NVARCHAR(255) NULL,
    source_url NVARCHAR(500) NULL,
    is_featured BIT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    reschedule_notice NVARCHAR(500) NULL,
    created_by INT NULL REFERENCES dbo.users(user_id),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_events_slug UNIQUE (slug),
    CONSTRAINT CK_events_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'RESCHEDULED', 'POSTPONED', 'CANCELLED')),
    CONSTRAINT CK_events_ticket_type CHECK (ticket_type IN ('FREE_OPEN', 'FREE_REGISTRATION', 'PAID', 'UNANNOUNCED'))
  );
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.events')
    AND name = 'IX_events_status_start_time'
)
  CREATE INDEX IX_events_status_start_time
    ON dbo.events(status, is_featured DESC, start_time ASC);
GO

IF OBJECT_ID('dbo.event_submissions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.event_submissions (
    submission_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    organizer_name NVARCHAR(200) NOT NULL,
    organizer_contact NVARCHAR(255) NULL,
    category VARCHAR(40) NULL DEFAULT 'FESTIVAL',
    short_description NVARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL,
    location_name NVARCHAR(200) NULL,
    address NVARCHAR(300) NULL,
    district NVARCHAR(100) NULL,
    start_time DATETIME2 NULL,
    end_time DATETIME2 NULL,
    ticket_type VARCHAR(30) NOT NULL DEFAULT 'FREE_OPEN',
    ticket_price_display NVARCHAR(100) NULL,
    ticket_url NVARCHAR(500) NULL,
    source_url NVARCHAR(500) NULL,
    cover_image NVARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason NVARCHAR(500) NULL,
    approved_event_id INT NULL REFERENCES dbo.events(event_id),
    submitted_by INT NULL REFERENCES dbo.users(user_id),
    reviewed_by INT NULL REFERENCES dbo.users(user_id),
    submitted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    reviewed_at DATETIME2 NULL,
    CONSTRAINT CK_event_submissions_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
  );
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.event_submissions')
    AND name = 'IX_event_submissions_status_submitted_at'
)
  CREATE INDEX IX_event_submissions_status_submitted_at
    ON dbo.event_submissions(status, submitted_at DESC);
GO

IF OBJECT_ID('dbo.event_reminders', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.event_reminders (
    reminder_id INT IDENTITY(1,1) PRIMARY KEY,
    event_id INT NOT NULL REFERENCES dbo.events(event_id) ON DELETE CASCADE,
    user_id INT NULL REFERENCES dbo.users(user_id),
    recipient_email NVARCHAR(160) NOT NULL,
    email_hash VARCHAR(64) NOT NULL,
    recipient_name NVARCHAR(120) NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    notified_at DATETIME2 NULL,
    CONSTRAINT UQ_event_reminders_event_email UNIQUE (event_id, email_hash),
    CONSTRAINT CK_event_reminders_status CHECK (delivery_status IN ('PENDING', 'SENT', 'DEV_LOGGED', 'FAILED'))
  );
END;
GO

