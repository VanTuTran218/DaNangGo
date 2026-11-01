USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID('dbo.review_images', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.review_images (
            image_id INT IDENTITY(1,1) NOT NULL CONSTRAINT pk_review_images PRIMARY KEY,
            review_id INT NOT NULL,
            image_order TINYINT NOT NULL,
            mime_type VARCHAR(20) NOT NULL,
            image_data VARBINARY(MAX) NOT NULL,
            CONSTRAINT uq_review_images_order UNIQUE (review_id, image_order),
            CONSTRAINT ck_review_images_order CHECK (image_order BETWEEN 0 AND 4),
            CONSTRAINT ck_review_images_mime CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
            CONSTRAINT fk_review_images_review FOREIGN KEY (review_id)
                REFERENCES dbo.reviews(review_id) ON DELETE CASCADE
        );
    END;

    COMMIT TRANSACTION;
    PRINT 'Migration 008: Add ordered image data to reviews.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
