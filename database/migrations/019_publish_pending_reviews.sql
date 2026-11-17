USE DaNangGo;
GO

SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @affected_places TABLE (place_id INT NOT NULL);

    UPDATE dbo.reviews
    SET status = 'APPROVED'
    OUTPUT INSERTED.place_id INTO @affected_places (place_id)
    WHERE status = 'PENDING';

    UPDATE p
    SET avg_rating = COALESCE(s.avg_rating, 0),
        review_count = COALESCE(s.review_count, 0),
        updated_at = SYSDATETIME()
    FROM dbo.places p
    INNER JOIN (SELECT DISTINCT place_id FROM @affected_places) a ON a.place_id = p.place_id
    OUTER APPLY (
        SELECT CAST(AVG(CAST(r.rating AS decimal(4, 2))) AS decimal(2, 1)) AS avg_rating,
               COUNT(*) AS review_count
        FROM dbo.reviews r
        WHERE r.place_id = p.place_id AND r.status = 'APPROVED'
    ) s;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
