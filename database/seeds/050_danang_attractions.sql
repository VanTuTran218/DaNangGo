-- Idempotent starter catalog of Da Nang attractions for the /places and review pages.
-- Fact sources: danangfantasticity.com/en/discovery/my-khe-beach-one-of-the-ten-most-beautiful-beaches-in-asia,
-- danangfantasticity.com/en/dragon-bridge, danangfantasticity.com/en/linh-ung-pagoda,
-- danangfantasticity.com/en/travel-directory/the-marble-mountains,
-- danangfantasticity.com/en/golden-bridge-a-new-brand-of-tourism-in-danang.
-- Photo sources: Unsplash pages qvAyg0KW8DI, BXErCS6Yam8, yeJEkbeqmNc, 8F4og3n9np8;
-- Marble Mountains photo: vinwonders.com/en/wonderpedia/news/da-nang-weather-in-april/.
-- Safe to rerun: this script only inserts missing places/images and never deletes data.
USE DaNangGo;
GO

DECLARE @seed TABLE (
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL
);

INSERT INTO @seed (name, description, address, image_url)
VALUES
    (N'Biển Mỹ Khê',
     N'Một bãi biển nổi tiếng của Đà Nẵng với bãi cát dài, không gian ven biển thoáng đãng và các hoạt động tắm biển, đi bộ, thể thao biển. Địa điểm nằm trên tuyến du lịch ven biển Võ Nguyên Giáp.',
     N'Đường Võ Nguyên Giáp, Đà Nẵng',
     'https://images.unsplash.com/photo-1723142282970-1fd415eec1ad?auto=format&fit=crop&w=1200&q=80'),
    (N'Cầu Rồng',
     N'Cây cầu bắc qua sông Hàn với thiết kế hình rồng, là một trong những công trình biểu tượng của Đà Nẵng. Cầu được đưa vào sử dụng năm 2013.',
     N'Đường Nguyễn Văn Linh, Đà Nẵng',
     'https://images.unsplash.com/photo-1603054561323-09f79d5df183?auto=format&fit=crop&w=1200&q=80'),
    (N'Chùa Linh Ứng Sơn Trà',
     N'Quần thể chùa trên bán đảo Sơn Trà, nổi bật với tượng Quan Thế Âm hướng ra biển và tầm nhìn rộng ra vịnh Đà Nẵng.',
     N'Bán đảo Sơn Trà, Đà Nẵng',
     'https://images.unsplash.com/photo-1560964645-f9c3a3857831?auto=format&fit=crop&w=1200&q=80'),
    (N'Danh thắng Ngũ Hành Sơn',
     N'Quần thể gồm sáu ngọn núi đá vôi, có hang động, chùa và các điểm ngắm cảnh. Thủy Sơn là ngọn núi được nhiều du khách ghé thăm.',
     N'81 Huyền Trân Công Chúa, phường Ngũ Hành Sơn, Đà Nẵng',
     'https://static.vinwonders.com/production/da-nang-weather-in-april-7.jpg'),
    (N'Cầu Vàng - Bà Nà Hills',
     N'Cây cầu đi bộ trên khu du lịch Bà Nà Hills, nổi bật với lối đi màu vàng được nâng đỡ bởi đôi bàn tay đá khổng lồ. Cầu dài khoảng 150 mét và mở cửa đón khách năm 2018.',
     N'Khu du lịch Sun World Bà Nà Hills, Đà Nẵng',
     'https://images.unsplash.com/photo-1677125058484-86b1e964eb31?auto=format&fit=crop&w=1200&q=80');

INSERT INTO places
    (place_type, name, description, address, avg_rating, review_count, view_count, status, created_at)
SELECT 'ATTRACTION', s.name, s.description, s.address, 0, 0, 0, 'ACTIVE', SYSDATETIME()
FROM @seed s
WHERE NOT EXISTS (SELECT 1 FROM places p WHERE p.name = s.name);

INSERT INTO place_images (place_id, image_url, is_cover)
SELECT p.place_id, s.image_url, 1
FROM @seed s
JOIN places p ON p.name = s.name
WHERE NOT EXISTS (
    SELECT 1 FROM place_images pi
    WHERE pi.place_id = p.place_id AND pi.is_cover = 1
)
AND NOT EXISTS (
    SELECT 1 FROM place_images pi
    WHERE pi.place_id = p.place_id AND pi.image_url = s.image_url
);
GO

SELECT p.place_id, p.name, p.status, pi.image_url
FROM places p
LEFT JOIN place_images pi ON pi.place_id = p.place_id AND pi.is_cover = 1
WHERE p.name IN (N'Biển Mỹ Khê', N'Cầu Rồng', N'Chùa Linh Ứng Sơn Trà', N'Danh thắng Ngũ Hành Sơn', N'Cầu Vàng - Bà Nà Hills')
ORDER BY p.name;
GO
