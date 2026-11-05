-- Complete the empty catalog structure without inserting sample businesses.
IF OBJECT_ID('dbo.itinerary_catalog_preferences','U') IS NULL
 CREATE TABLE dbo.itinerary_catalog_preferences(
  place_id INT NOT NULL REFERENCES dbo.itinerary_catalog_places(id) ON DELETE CASCADE,
  preference NVARCHAR(100) NOT NULL,PRIMARY KEY(place_id,preference),
  CHECK(preference IN(N'Ẩm thực địa phương',N'Biển & Nghỉ dưỡng',N'Di sản & Văn hoá',N'Phiêu lưu mạo hiểm',N'Check-in sống ảo')));
GO
IF OBJECT_ID('planner.itineraries','U') IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('planner.itineraries') AND name='IX_planner_owner_created')
 CREATE INDEX IX_planner_owner_created ON planner.itineraries(user_id,created_at DESC,id DESC);
GO
