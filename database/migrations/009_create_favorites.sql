-- Creates the canonical favorites table. Existing user_favorites data is copied
-- once when upgrading a database that already contains the legacy table.
IF OBJECT_ID(N'dbo.favorites', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.favorites (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        place_id INT NOT NULL,
        created_at DATETIME2(7) NOT NULL
            CONSTRAINT DF_favorites_created_at DEFAULT (GETDATE()),
        CONSTRAINT PK_favorites PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_favorites_user_place UNIQUE (user_id, place_id),
        CONSTRAINT FK_favorites_user FOREIGN KEY (user_id)
            REFERENCES dbo.users(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_favorites_place FOREIGN KEY (place_id)
            REFERENCES dbo.places(place_id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.user_favorites', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.favorites (user_id, place_id, created_at)
    SELECT old_favorite.user_id, old_favorite.place_id, old_favorite.created_at
    FROM dbo.user_favorites AS old_favorite
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.favorites AS current_favorite
        WHERE current_favorite.user_id = old_favorite.user_id
          AND current_favorite.place_id = old_favorite.place_id
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_favorites_user_id'
      AND object_id = OBJECT_ID(N'dbo.favorites')
)
BEGIN
    CREATE INDEX IX_favorites_user_id ON dbo.favorites(user_id);
END;
GO
