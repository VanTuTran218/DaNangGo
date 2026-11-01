USE DaNangGo;
GO

IF OBJECT_ID('dbo.itinerary_items', 'U') IS NULL
    THROW 50001, 'Run migration 005_create_saved_itineraries.sql before migration 008.', 1;
IF OBJECT_ID('dbo.itinerary_budgets', 'U') IS NULL
    THROW 50002, 'Run migration 005_create_saved_itineraries.sql before migration 008.', 1;
GO

IF COL_LENGTH('dbo.itinerary_budgets', 'entertainment_cost') IS NULL
BEGIN
    ALTER TABLE dbo.itinerary_budgets
    ADD entertainment_cost DECIMAL(18,2) NOT NULL
        CONSTRAINT DF_itinerary_budgets_entertainment_cost DEFAULT 0;
END;
GO

IF OBJECT_ID('dbo.CK_itinerary_items_type', 'C') IS NOT NULL
    ALTER TABLE dbo.itinerary_items DROP CONSTRAINT CK_itinerary_items_type;
ALTER TABLE dbo.itinerary_items
ADD CONSTRAINT CK_itinerary_items_type
    CHECK (item_type IN (N'attraction', N'food', N'hotel', N'transport', N'entertainment'));
GO

IF OBJECT_ID('dbo.CK_itinerary_budgets_cost_breakdown', 'C') IS NOT NULL
    ALTER TABLE dbo.itinerary_budgets DROP CONSTRAINT CK_itinerary_budgets_cost_breakdown;
ALTER TABLE dbo.itinerary_budgets
ADD CONSTRAINT CK_itinerary_budgets_cost_breakdown
    CHECK (estimated_total = accommodation_cost + food_cost + transport_cost
        + attractions_cost + entertainment_cost + contingency_cost);
GO
