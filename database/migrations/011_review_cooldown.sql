USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.review_cooldowns', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.review_cooldowns (
            user_id INT NOT NULL,
            place_id INT NOT NULL,
            last_reviewed_at DATETIME2(7) NOT NULL,
            CONSTRAINT pk_review_cooldowns PRIMARY KEY (user_id, place_id),
            CONSTRAINT fk_review_cooldowns_user FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE CASCADE,
            CONSTRAINT fk_review_cooldowns_place FOREIGN KEY (place_id) REFERENCES dbo.places(place_id) ON DELETE CASCADE
        );
    END;

    MERGE dbo.review_cooldowns AS target
    USING (
        SELECT user_id, place_id, MAX(created_at) AS last_reviewed_at
        FROM dbo.reviews GROUP BY user_id, place_id
    ) AS source
    ON target.user_id = source.user_id AND target.place_id = source.place_id
    WHEN MATCHED AND target.last_reviewed_at < source.last_reviewed_at
        THEN UPDATE SET last_reviewed_at = source.last_reviewed_at
    WHEN NOT MATCHED THEN
        INSERT (user_id, place_id, last_reviewed_at)
        VALUES (source.user_id, source.place_id, source.last_reviewed_at);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
