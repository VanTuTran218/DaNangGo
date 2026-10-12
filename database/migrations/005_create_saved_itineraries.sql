USE DaNangGo;
GO

IF OBJECT_ID('dbo.itineraries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.itineraries (
        id                      BIGINT IDENTITY(1,1) NOT NULL,
        title                   NVARCHAR(200) NOT NULL,
        status                  NVARCHAR(20) NOT NULL
                                    CONSTRAINT DF_itineraries_status DEFAULT N'SAVED',
        generation_input_json   NVARCHAR(MAX) NOT NULL,
        notices_json            NVARCHAR(MAX) NOT NULL
                                    CONSTRAINT DF_itineraries_notices DEFAULT N'[]',
        recommendations_json    NVARCHAR(MAX) NOT NULL
                                    CONSTRAINT DF_itineraries_recommendations DEFAULT N'[]',
        algorithm_version       NVARCHAR(50) NOT NULL,
        generated_at            DATETIME2(0) NOT NULL,
        created_at              DATETIME2(0) NOT NULL
                                    CONSTRAINT DF_itineraries_created DEFAULT SYSUTCDATETIME(),
        updated_at              DATETIME2(0) NULL,
        CONSTRAINT PK_itineraries PRIMARY KEY (id),
        CONSTRAINT CK_itineraries_status CHECK (status IN (N'DRAFT', N'SAVED', N'ARCHIVED')),
        CONSTRAINT CK_itineraries_input_json CHECK (ISJSON(generation_input_json) = 1),
        CONSTRAINT CK_itineraries_notices_json CHECK (ISJSON(notices_json) = 1),
        CONSTRAINT CK_itineraries_recommendations_json CHECK (ISJSON(recommendations_json) = 1)
    );

    CREATE INDEX IX_itineraries_created_at
        ON dbo.itineraries (created_at DESC);
END;
GO

IF OBJECT_ID('dbo.itinerary_items', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.itinerary_items (
        id                  BIGINT IDENTITY(1,1) NOT NULL,
        itinerary_id        BIGINT NOT NULL,
        day_number          TINYINT NOT NULL,
        sequence_number     SMALLINT NOT NULL,
        item_key            NVARCHAR(100) NOT NULL,
        scheduled_time      TIME(0) NOT NULL,
        item_type           NVARCHAR(20) NOT NULL,
        title               NVARCHAR(300) NOT NULL,
        description         NVARCHAR(2000) NOT NULL,
        location            NVARCHAR(500) NULL,
        image_url           NVARCHAR(1000) NULL,
        estimated_cost      DECIMAL(18,2) NOT NULL,
        CONSTRAINT PK_itinerary_items PRIMARY KEY (id),
        CONSTRAINT FK_itinerary_items_itinerary FOREIGN KEY (itinerary_id)
            REFERENCES dbo.itineraries(id) ON DELETE CASCADE,
        CONSTRAINT UQ_itinerary_items_order UNIQUE (itinerary_id, day_number, sequence_number),
        CONSTRAINT UQ_itinerary_items_key UNIQUE (itinerary_id, item_key),
        CONSTRAINT CK_itinerary_items_day CHECK (day_number BETWEEN 1 AND 7),
        CONSTRAINT CK_itinerary_items_sequence CHECK (sequence_number >= 1),
        CONSTRAINT CK_itinerary_items_type CHECK (item_type IN (N'attraction', N'food', N'hotel', N'transport')),
        CONSTRAINT CK_itinerary_items_cost CHECK (estimated_cost >= 0)
    );

    CREATE INDEX IX_itinerary_items_itinerary_day
        ON dbo.itinerary_items (itinerary_id, day_number, sequence_number);
END;
GO

IF OBJECT_ID('dbo.itinerary_budgets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.itinerary_budgets (
        itinerary_id            BIGINT NOT NULL,
        currency                CHAR(3) NOT NULL
                                    CONSTRAINT DF_itinerary_budgets_currency DEFAULT 'VND',
        budget_amount           DECIMAL(18,2) NOT NULL,
        estimated_total         DECIMAL(18,2) NOT NULL,
        remaining_budget        DECIMAL(18,2) NOT NULL,
        over_budget_amount      DECIMAL(18,2) NOT NULL,
        budget_status           NVARCHAR(20) NOT NULL,
        accommodation_cost      DECIMAL(18,2) NOT NULL,
        food_cost               DECIMAL(18,2) NOT NULL,
        transport_cost          DECIMAL(18,2) NOT NULL,
        attractions_cost        DECIMAL(18,2) NOT NULL,
        contingency_cost        DECIMAL(18,2) NOT NULL,
        CONSTRAINT PK_itinerary_budgets PRIMARY KEY (itinerary_id),
        CONSTRAINT FK_itinerary_budgets_itinerary FOREIGN KEY (itinerary_id)
            REFERENCES dbo.itineraries(id) ON DELETE CASCADE,
        CONSTRAINT CK_itinerary_budgets_status CHECK (budget_status IN (N'within-budget', N'over-budget')),
        CONSTRAINT CK_itinerary_budgets_amounts CHECK (
            budget_amount >= 0
            AND estimated_total >= 0
            AND over_budget_amount >= 0
            AND accommodation_cost >= 0
            AND food_cost >= 0
            AND transport_cost >= 0
            AND attractions_cost >= 0
            AND contingency_cost >= 0
        ),
        CONSTRAINT CK_itinerary_budgets_balance CHECK (
            remaining_budget = budget_amount - estimated_total
            AND over_budget_amount = CASE
                WHEN estimated_total > budget_amount THEN estimated_total - budget_amount
                ELSE 0
            END
            AND budget_status = CASE
                WHEN estimated_total > budget_amount THEN N'over-budget'
                ELSE N'within-budget'
            END
        ),
        CONSTRAINT CK_itinerary_budgets_cost_breakdown CHECK (
            estimated_total = accommodation_cost + food_cost + transport_cost
                + attractions_cost + contingency_cost
        )
    );
END;
GO
