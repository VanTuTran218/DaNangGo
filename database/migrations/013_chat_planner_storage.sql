-- Keep the original relational itinerary schema intact. The web planner uses
-- a separate namespace when dbo.itineraries is the older itinerary_id schema.
-- Deploy with the AI migration runner; all statements are idempotent.
IF SCHEMA_ID('planner') IS NULL EXEC('CREATE SCHEMA planner AUTHORIZATION dbo');
GO
IF OBJECT_ID('planner.itineraries') IS NULL
BEGIN
 IF COL_LENGTH('dbo.itineraries','generation_input_json') IS NOT NULL
   AND COL_LENGTH('dbo.itineraries','id') IS NOT NULL
  EXEC('CREATE VIEW planner.itineraries AS SELECT * FROM dbo.itineraries');
 ELSE
  CREATE TABLE planner.itineraries (
   id BIGINT IDENTITY PRIMARY KEY,user_id INT NOT NULL REFERENCES dbo.users(user_id),
   title NVARCHAR(200) NOT NULL,status NVARCHAR(20) NOT NULL DEFAULT N'DRAFT',
   generation_input_json NVARCHAR(MAX) NOT NULL,notices_json NVARCHAR(MAX) NOT NULL DEFAULT N'[]',
   recommendations_json NVARCHAR(MAX) NOT NULL DEFAULT N'[]',algorithm_version NVARCHAR(50) NOT NULL,
   generated_at DATETIME2 NOT NULL,start_date DATE NOT NULL,day_count TINYINT NOT NULL,
   guest_count INT NOT NULL,needs_json NVARCHAR(MAX) NOT NULL,
   created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),updated_at DATETIME2 NULL,
   CHECK(status IN(N'DRAFT',N'SAVED',N'ARCHIVED')),CHECK(day_count BETWEEN 1 AND 3),CHECK(guest_count>0),
   CHECK(ISJSON(generation_input_json)=1 AND ISJSON(notices_json)=1 AND ISJSON(recommendations_json)=1 AND ISJSON(needs_json)=1));
END;
GO
IF OBJECT_ID('planner.itinerary_items') IS NULL
BEGIN
 IF COL_LENGTH('dbo.itineraries','generation_input_json') IS NOT NULL
  EXEC('CREATE VIEW planner.itinerary_items AS SELECT * FROM dbo.itinerary_items');
 ELSE
  CREATE TABLE planner.itinerary_items(
   id BIGINT IDENTITY PRIMARY KEY,itinerary_id BIGINT NOT NULL REFERENCES planner.itineraries(id) ON DELETE CASCADE,
   day_number TINYINT NOT NULL,sequence_number SMALLINT NOT NULL,item_key NVARCHAR(100) NOT NULL,
   scheduled_time TIME(0) NOT NULL,item_type NVARCHAR(20) NOT NULL,title NVARCHAR(300) NOT NULL,
   description NVARCHAR(2000) NOT NULL,location NVARCHAR(500) NULL,image_url NVARCHAR(1000) NULL,
   estimated_cost DECIMAL(18,2) NOT NULL,catalog_place_id INT NULL,unit_price DECIMAL(18,2) NOT NULL,
   quantity INT NOT NULL,duration_minutes SMALLINT NULL,travel_minutes SMALLINT NULL,
   UNIQUE(itinerary_id,day_number,sequence_number),UNIQUE(itinerary_id,item_key),
   CHECK(day_number BETWEEN 1 AND 3),CHECK(estimated_cost>=0 AND unit_price>=0 AND quantity>0),
   CHECK(item_type IN(N'attraction',N'food',N'hotel',N'transport',N'entertainment')));
END;
GO
IF OBJECT_ID('planner.itinerary_budgets') IS NULL
BEGIN
 IF COL_LENGTH('dbo.itineraries','generation_input_json') IS NOT NULL
  EXEC('CREATE VIEW planner.itinerary_budgets AS SELECT * FROM dbo.itinerary_budgets');
 ELSE
  CREATE TABLE planner.itinerary_budgets(
   itinerary_id BIGINT PRIMARY KEY REFERENCES planner.itineraries(id) ON DELETE CASCADE,
   currency CHAR(3) NOT NULL DEFAULT 'VND',budget_amount DECIMAL(18,2) NOT NULL,
   estimated_total DECIMAL(18,2) NOT NULL,remaining_budget DECIMAL(18,2) NOT NULL,
   over_budget_amount DECIMAL(18,2) NOT NULL,budget_status NVARCHAR(20) NOT NULL,
   accommodation_cost DECIMAL(18,2) NOT NULL,food_cost DECIMAL(18,2) NOT NULL,
   transport_cost DECIMAL(18,2) NOT NULL,attractions_cost DECIMAL(18,2) NOT NULL,
   entertainment_cost DECIMAL(18,2) NOT NULL DEFAULT 0,contingency_cost DECIMAL(18,2) NOT NULL,
   CHECK(budget_amount>=0 AND estimated_total>=0 AND accommodation_cost>=0 AND food_cost>=0 AND transport_cost>=0 AND attractions_cost>=0 AND entertainment_cost>=0 AND contingency_cost>=0),
   CHECK(estimated_total=accommodation_cost+food_cost+transport_cost+attractions_cost+entertainment_cost+contingency_cost),
   CHECK(remaining_budget=budget_amount-estimated_total),CHECK(budget_status IN(N'within-budget',N'over-budget')));
END;
GO
IF OBJECT_ID('planner.itinerary_training_data') IS NULL
BEGIN
 IF OBJECT_ID('dbo.itinerary_training_data') IS NOT NULL
  EXEC('CREATE VIEW planner.itinerary_training_data AS SELECT * FROM dbo.itinerary_training_data');
 ELSE
  CREATE TABLE planner.itinerary_training_data(id BIGINT IDENTITY PRIMARY KEY,input_json NVARCHAR(MAX) NOT NULL,
    output_json NVARCHAR(MAX) NOT NULL,algorithm_version NVARCHAR(50) NOT NULL,created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CHECK(ISJSON(input_json)=1 AND ISJSON(output_json)=1));
END;
GO
-- No sample places or prices are seeded. Missing catalog data stays empty.
IF OBJECT_ID('dbo.itinerary_catalog_places','U') IS NULL
 CREATE TABLE dbo.itinerary_catalog_places(
  id INT IDENTITY PRIMARY KEY,slug NVARCHAR(100) NOT NULL UNIQUE,kind NVARCHAR(20) NOT NULL,
  name NVARCHAR(200) NOT NULL,description NVARCHAR(1000) NOT NULL,address NVARCHAR(300) NOT NULL,
  price DECIMAL(18,2) NOT NULL,accommodation_type NVARCHAR(30) NULL,stars TINYINT NULL,
  meal_period NVARCHAR(20) NULL,image_url NVARCHAR(1000) NOT NULL,is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),opening_time TIME NULL,closing_time TIME NULL,
  visit_duration_minutes SMALLINT NULL,latitude DECIMAL(9,6) NULL,longitude DECIMAL(9,6) NULL,
  room_type NVARCHAR(100) NULL,room_capacity SMALLINT NULL,price_basis NVARCHAR(20) NOT NULL DEFAULT N'PER_PERSON',
  CHECK(price>=0),CHECK(kind IN(N'STAY',N'FOOD',N'ATTRACTION',N'ENTERTAINMENT')));
IF OBJECT_ID('dbo.user_itinerary_preferences','U') IS NULL
 CREATE TABLE dbo.user_itinerary_preferences(user_id INT PRIMARY KEY REFERENCES dbo.users(user_id),
 preferences_json NVARCHAR(MAX) NOT NULL,updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),CHECK(ISJSON(preferences_json)=1));
GO
