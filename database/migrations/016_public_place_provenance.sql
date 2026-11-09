-- Public reference facts are independent of partner verification and booking inventory.
-- NULL means unverified, not that the business refuses a payment method.
ALTER TABLE dbo.accommodations ALTER COLUMN accepts_cash BIT NULL;
ALTER TABLE dbo.accommodations ALTER COLUMN accepts_bank_transfer BIT NULL;
IF COL_LENGTH('dbo.places','reference_key') IS NULL ALTER TABLE dbo.places ADD reference_key VARCHAR(100) NULL;
IF COL_LENGTH('dbo.places','reference_source_url') IS NULL ALTER TABLE dbo.places ADD reference_source_url NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.places','reference_checked_at') IS NULL ALTER TABLE dbo.places ADD reference_checked_at DATE NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.places') AND name='UQ_public_reference_key') CREATE UNIQUE INDEX UQ_public_reference_key ON dbo.places(reference_key) WHERE reference_key IS NOT NULL;
IF OBJECT_ID('dbo.public_place_provenance','U') IS NULL CREATE TABLE dbo.public_place_provenance(place_id INT PRIMARY KEY REFERENCES dbo.places(place_id),facts_json NVARCHAR(MAX) NOT NULL,updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),CHECK(ISJSON(facts_json)=1));
IF OBJECT_ID('dbo.public_catalog_change_log','U') IS NULL CREATE TABLE dbo.public_catalog_change_log(batch_id UNIQUEIDENTIFIER NOT NULL,place_id INT NOT NULL REFERENCES dbo.places(place_id),previous_status VARCHAR(20) NOT NULL,new_status VARCHAR(20) NOT NULL,reason NVARCHAR(300) NOT NULL,changed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),PRIMARY KEY(batch_id,place_id));
GO
