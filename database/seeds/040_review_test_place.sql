-- Idempotent fixture for manually testing place reviews.
-- Safe to run repeatedly: it only inserts this place when it does not exist.
USE DaNangGo;
GO

IF NOT EXISTS (
    SELECT 1
    FROM places
    WHERE name = N'DaNangGo - Địa điểm test đánh giá'
)
BEGIN
    INSERT INTO places
        (place_type, name, description, address, avg_rating, review_count, view_count, status, created_at)
    VALUES
        ('RESTAURANT', N'DaNangGo - Địa điểm test đánh giá',
         N'Địa điểm mẫu để kiểm tra gửi và xem đánh giá.',
         N'Đà Nẵng', 0, 0, 0, 'ACTIVE', SYSDATETIME());
END;
GO

SELECT place_id, name, status
FROM places
WHERE name = N'DaNangGo - Địa điểm test đánh giá';
GO
