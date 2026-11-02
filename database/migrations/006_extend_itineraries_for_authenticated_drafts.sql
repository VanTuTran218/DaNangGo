USE DaNangGo;
GO

IF OBJECT_ID('dbo.itineraries', 'U') IS NULL
BEGIN
    ;THROW 50001, 'Run migration 005_create_saved_itineraries.sql before migration 006.', 1;
END;

IF OBJECT_ID('dbo.itinerary_items', 'U') IS NULL
BEGIN
    ;THROW 50002, 'Run migration 005_create_saved_itineraries.sql before migration 006.', 1;
END;

IF OBJECT_ID('dbo.itinerary_budgets', 'U') IS NULL
BEGIN
    ;THROW 50003, 'Run migration 005_create_saved_itineraries.sql before migration 006.', 1;
END;

IF OBJECT_ID('dbo.itinerary_catalog_places', 'U') IS NULL
BEGIN
    ;THROW 50004, 'Run migration 004_create_itinerary_catalog.sql before migration 006.', 1;
END;

IF COL_LENGTH('dbo.itineraries', 'user_id') IS NULL
    ALTER TABLE dbo.itineraries ADD user_id INT NULL;
IF COL_LENGTH('dbo.itineraries', 'start_date') IS NULL
    ALTER TABLE dbo.itineraries ADD start_date DATE NULL;
IF COL_LENGTH('dbo.itineraries', 'day_count') IS NULL
    ALTER TABLE dbo.itineraries ADD day_count TINYINT NULL;
IF COL_LENGTH('dbo.itineraries', 'guest_count') IS NULL
    ALTER TABLE dbo.itineraries ADD guest_count INT NULL;
IF COL_LENGTH('dbo.itineraries', 'needs_json') IS NULL
    ALTER TABLE dbo.itineraries ADD needs_json NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.itineraries')
      AND name = 'IX_itineraries_user_created'
)
    CREATE INDEX IX_itineraries_user_created
        ON dbo.itineraries (user_id, created_at DESC);
GO

IF OBJECT_ID('dbo.CK_itineraries_needs_json', 'C') IS NULL
    ALTER TABLE dbo.itineraries ADD CONSTRAINT CK_itineraries_needs_json
        CHECK (needs_json IS NULL OR ISJSON(needs_json) = 1);
IF OBJECT_ID('dbo.CK_itineraries_day_count', 'C') IS NULL
    ALTER TABLE dbo.itineraries ADD CONSTRAINT CK_itineraries_day_count
        CHECK (day_count IS NULL OR day_count BETWEEN 1 AND 3);
IF OBJECT_ID('dbo.CK_itineraries_guest_count', 'C') IS NULL
    ALTER TABLE dbo.itineraries ADD CONSTRAINT CK_itineraries_guest_count
        CHECK (guest_count IS NULL OR guest_count > 0);
GO

IF COL_LENGTH('dbo.itinerary_items', 'catalog_place_id') IS NULL
    ALTER TABLE dbo.itinerary_items ADD catalog_place_id INT NULL;
IF COL_LENGTH('dbo.itinerary_items', 'unit_price') IS NULL
    ALTER TABLE dbo.itinerary_items ADD unit_price DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_itinerary_items_unit_price DEFAULT 0;
IF COL_LENGTH('dbo.itinerary_items', 'quantity') IS NULL
    ALTER TABLE dbo.itinerary_items ADD quantity INT NOT NULL
        CONSTRAINT DF_itinerary_items_quantity DEFAULT 1;
IF COL_LENGTH('dbo.itinerary_items', 'duration_minutes') IS NULL
    ALTER TABLE dbo.itinerary_items ADD duration_minutes SMALLINT NULL;
IF COL_LENGTH('dbo.itinerary_items', 'travel_minutes') IS NULL
    ALTER TABLE dbo.itinerary_items ADD travel_minutes SMALLINT NULL;
GO

IF COL_LENGTH('dbo.itinerary_catalog_places', 'opening_time') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD opening_time TIME(0) NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'closing_time') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD closing_time TIME(0) NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'visit_duration_minutes') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD visit_duration_minutes SMALLINT NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'latitude') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD latitude DECIMAL(9,6) NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'longitude') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD longitude DECIMAL(9,6) NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'room_type') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD room_type NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'room_capacity') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD room_capacity SMALLINT NULL;
IF COL_LENGTH('dbo.itinerary_catalog_places', 'price_basis') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD price_basis NVARCHAR(20) NOT NULL
        CONSTRAINT DF_itinerary_catalog_price_basis DEFAULT N'PER_PERSON';
GO

IF OBJECT_ID('dbo.CK_itinerary_catalog_price_basis', 'C') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD CONSTRAINT CK_itinerary_catalog_price_basis
        CHECK (price_basis IN (N'PER_PERSON', N'PER_ROOM'));
IF OBJECT_ID('dbo.CK_itinerary_catalog_room_capacity', 'C') IS NULL
    ALTER TABLE dbo.itinerary_catalog_places ADD CONSTRAINT CK_itinerary_catalog_room_capacity
        CHECK (room_capacity IS NULL OR room_capacity > 0);
GO

IF OBJECT_ID('dbo.CK_itinerary_items_unit_price', 'C') IS NULL
    ALTER TABLE dbo.itinerary_items ADD CONSTRAINT CK_itinerary_items_unit_price CHECK (unit_price >= 0);
IF OBJECT_ID('dbo.CK_itinerary_items_quantity', 'C') IS NULL
    ALTER TABLE dbo.itinerary_items ADD CONSTRAINT CK_itinerary_items_quantity CHECK (quantity > 0);
IF OBJECT_ID('dbo.CK_itinerary_items_duration', 'C') IS NULL
    ALTER TABLE dbo.itinerary_items ADD CONSTRAINT CK_itinerary_items_duration
        CHECK (duration_minutes IS NULL OR duration_minutes > 0);
GO

IF OBJECT_ID('dbo.user_itinerary_preferences', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_itinerary_preferences (
        user_id             INT NOT NULL,
        preferences_json    NVARCHAR(MAX) NOT NULL,
        updated_at          DATETIME2(0) NOT NULL
                                CONSTRAINT DF_user_itinerary_preferences_updated DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_user_itinerary_preferences PRIMARY KEY (user_id),
        CONSTRAINT CK_user_itinerary_preferences_json CHECK (ISJSON(preferences_json) = 1)
    );
END;
GO

IF OBJECT_ID('dbo.itinerary_catalog_places', 'U') IS NOT NULL
    AND OBJECT_ID('dbo.FK_itinerary_items_catalog_place', 'F') IS NULL
BEGIN
    ALTER TABLE dbo.itinerary_items ADD CONSTRAINT FK_itinerary_items_catalog_place
        FOREIGN KEY (catalog_place_id) REFERENCES dbo.itinerary_catalog_places(id);
END;
GO
