
USE DaNangGo;
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'itinerary_training_data'
)
BEGIN
    CREATE TABLE itinerary_training_data (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        input_json          NVARCHAR(MAX) NOT NULL,
        output_json         NVARCHAR(MAX) NOT NULL,
        algorithm_version   NVARCHAR(50) NOT NULL,
        created_at          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_itinerary_training_input_json CHECK (ISJSON(input_json) = 1),
        CONSTRAINT CK_itinerary_training_output_json CHECK (ISJSON(output_json) = 1)
    );
END;
GO
