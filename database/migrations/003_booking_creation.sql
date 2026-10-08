USE DaNangGo;
GO

-- Requires the booking tables from 002 (or the equivalent database.sql snapshot).
IF OBJECT_ID('dbo.bookings', 'U') IS NULL OR OBJECT_ID('dbo.booking_items', 'U') IS NULL
    THROW 50001, 'Apply booking tables before migration 003.', 1;
GO

IF COL_LENGTH('dbo.room_types', 'total_rooms') IS NULL
    ALTER TABLE dbo.room_types ADD total_rooms INT NULL
        CONSTRAINT ck_room_total_rooms CHECK (total_rooms > 0);
GO

IF COL_LENGTH('dbo.restaurants', 'seating_capacity') IS NULL
    ALTER TABLE dbo.restaurants ADD seating_capacity INT NULL
        CONSTRAINT ck_rest_seating_capacity CHECK (seating_capacity > 0);
GO

IF OBJECT_ID('dbo.ticket_types', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ticket_types (
        ticket_type_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        place_id INT NOT NULL REFERENCES dbo.attractions(place_id),
        name NVARCHAR(100) NOT NULL,
        price DECIMAL(18,2) NOT NULL CONSTRAINT ck_ticket_price CHECK (price >= 0),
        daily_capacity INT NULL CONSTRAINT ck_ticket_capacity CHECK (daily_capacity > 0),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
            CONSTRAINT ck_ticket_status CHECK (status IN ('ACTIVE', 'HIDDEN'))
    );
END;
GO

IF COL_LENGTH('dbo.booking_items', 'ticket_type_id') IS NULL
    ALTER TABLE dbo.booking_items ADD ticket_type_id INT NULL
        CONSTRAINT fk_booking_item_ticket_type REFERENCES dbo.ticket_types(ticket_type_id);
GO

IF COL_LENGTH('dbo.booking_items', 'arrival_time') IS NULL
    ALTER TABLE dbo.booking_items ADD arrival_time TIME(0) NULL;
GO

IF OBJECT_ID('dbo.idempotency_requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.idempotency_requests (
        user_id INT NOT NULL REFERENCES dbo.users(user_id),
        idempotency_key NVARCHAR(128) NOT NULL,
        request_hash CHAR(64) NOT NULL,
        response_status INT NOT NULL,
        response_body NVARCHAR(MAX) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT uq_idempotency_user_key UNIQUE (user_id, idempotency_key)
    );
END;
GO
