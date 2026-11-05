-- Verified reference facts, deliberately separate from room_types / bookable inventory.
IF OBJECT_ID('dbo.public_stay_details','U') IS NULL
CREATE TABLE dbo.public_stay_details (
  place_id INT NOT NULL PRIMARY KEY REFERENCES dbo.places(place_id),
  facts_json NVARCHAR(MAX) NOT NULL CHECK (ISJSON(facts_json)=1),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
