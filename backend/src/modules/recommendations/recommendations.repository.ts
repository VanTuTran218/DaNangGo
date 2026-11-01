import { getPool, sql } from '../../config/db';
import type { RecommendationRequest } from './recommendations.validation';

export interface RecommendationItem {
  place_id: number;
  place_type: 'ACCOMMODATION' | 'RESTAURANT' | 'ATTRACTION';
  name: string;
  address: string | null;
  district_name: string | null;
  cover_image: string | null;
  price_min: number | null;
  price_max: number | null;
  ticket_price: number | null;
  avg_rating: number;
  review_count: number;
  cuisine_name: string | null;
  category_name: string | null;
  accommodation_type: string | null;
  star_rating: number | null;
}

function bindIds(request: ReturnType<ReturnType<typeof getPool>['request']>, prefix: string, ids: number[]) {
  ids.forEach((id, index) => request.input(`${prefix}${index}`, sql.Int, id));
  return ids.map((_, index) => `@${prefix}${index}`).join(',');
}

async function allIdsExist(table: 'districts' | 'cuisines' | 'tastes' | 'attraction_categories', column: string, ids: number[]) {
  if (!ids.length) return true;
  const request = getPool().request();
  const parameters = bindIds(request, 'id', ids);
  const result = await request.query<{ id: number }>(`SELECT ${column} AS id FROM dbo.${table} WHERE ${column} IN (${parameters})`);
  return result.recordset.length === new Set(ids).size;
}

export async function validateRecommendationReferences(input: RecommendationRequest) {
  const checks = await Promise.all([
    input.districtId === undefined ? Promise.resolve(true) : allIdsExist('districts', 'district_id', [input.districtId]),
    allIdsExist('cuisines', 'cuisine_id', input.cuisineIds),
    allIdsExist('tastes', 'taste_id', input.tasteIds),
    allIdsExist('attraction_categories', 'category_id', input.attractionCategoryIds),
  ]);
  if (!checks[0]) throw { status: 400, message: 'Quận được chọn không tồn tại.' };
  if (!checks[1]) throw { status: 400, message: 'Cuisine được chọn không tồn tại.' };
  if (!checks[2]) throw { status: 400, message: 'Khẩu vị được chọn không tồn tại.' };
  if (!checks[3]) throw { status: 400, message: 'Loại tham quan được chọn không tồn tại.' };
}

function addSharedFilters(request: ReturnType<ReturnType<typeof getPool>['request']>, input: RecommendationRequest) {
  request.input('budget', sql.Decimal(18, 0), input.budget);
  if (input.districtId !== undefined) request.input('districtId', sql.Int, input.districtId);
  return input.districtId === undefined ? '' : 'AND p.district_id = @districtId';
}

const selectFields = `
  p.place_id, p.place_type, p.name, p.address, d.name AS district_name,
  (SELECT TOP 1 pi.image_url FROM dbo.place_images pi WHERE pi.place_id=p.place_id AND pi.is_cover=1 ORDER BY pi.image_id) AS cover_image,
  CAST(p.avg_rating AS float) AS avg_rating, p.review_count,
`;

export async function findBudgetRecommendations(input: RecommendationRequest) {
  const pool = getPool();
  const groups: { accommodations: RecommendationItem[]; restaurants: RecommendationItem[]; attractions: RecommendationItem[] } = {
    accommodations: [], restaurants: [], attractions: [],
  };
  const queries: Promise<void>[] = [];

  if (input.types.includes('ACCOMMODATION')) {
    queries.push((async () => {
      const request = pool.request();
      const district = addSharedFilters(request, input);
      input.accommodationTypes.forEach((type, index) => request.input(`accommodationValue${index}`, sql.VarChar(20), type));
      const accommodationTypeParams = input.accommodationTypes.map((_, index) => `@accommodationValue${index}`).join(',');
      const starRatings = bindIds(request, 'star', input.starRatings);
      const result = await request.query<RecommendationItem>(`
        SELECT ${selectFields}
          CAST(MIN(rt.price_per_night) AS float) AS price_min,
          CAST(MIN(rt.price_per_night) AS float) AS price_max,
          CAST(NULL AS float) AS ticket_price, CAST(NULL AS nvarchar(100)) AS cuisine_name,
          a.accommodation_type, a.star_rating, CAST(NULL AS nvarchar(100)) AS category_name
        FROM dbo.places p
        JOIN dbo.accommodations a ON a.place_id=p.place_id
        JOIN dbo.room_types rt ON rt.place_id=p.place_id AND rt.status='ACTIVE' AND rt.price_per_night <= @budget
        LEFT JOIN dbo.districts d ON d.district_id=p.district_id
        WHERE p.place_type='ACCOMMODATION' AND p.status='ACTIVE' ${district}
          ${input.accommodationTypes.length ? `AND a.accommodation_type IN (${accommodationTypeParams})` : ''}
          ${input.starRatings.length ? `AND a.star_rating IN (${starRatings})` : ''}
        GROUP BY p.place_id,p.place_type,p.name,p.address,d.name,p.avg_rating,p.review_count,a.accommodation_type,a.star_rating
        ORDER BY p.avg_rating DESC,p.review_count DESC,p.place_id DESC`);
      groups.accommodations = result.recordset.map((r) => ({ ...r, price_min: Number(r.price_min), price_max: Number(r.price_max), avg_rating: Number(r.avg_rating) }));
    })());
  }

  if (input.types.includes('RESTAURANT')) {
    queries.push((async () => {
      const request = pool.request();
      const district = addSharedFilters(request, input);
      const cuisineIds = bindIds(request, 'cuisine', input.cuisineIds);
      const tasteIds = bindIds(request, 'taste', input.tasteIds);
      const result = await request.query<RecommendationItem>(`
        SELECT ${selectFields}
          CAST(r.price_min AS float) AS price_min, CAST(r.price_max AS float) AS price_max,
          CAST(NULL AS float) AS ticket_price, c.name AS cuisine_name,
          CAST(NULL AS varchar(20)) AS accommodation_type, CAST(NULL AS tinyint) AS star_rating,
          CAST(NULL AS nvarchar(100)) AS category_name
        FROM dbo.places p JOIN dbo.restaurants r ON r.place_id=p.place_id
        LEFT JOIN dbo.districts d ON d.district_id=p.district_id
        LEFT JOIN dbo.cuisines c ON c.cuisine_id=r.cuisine_id
        WHERE p.place_type='RESTAURANT' AND p.status='ACTIVE'
          AND r.price_min IS NOT NULL AND r.price_max IS NOT NULL
          AND (r.price_min + r.price_max) / 2.0 <= @budget ${district}
          ${input.cuisineIds.length ? `AND r.cuisine_id IN (${cuisineIds})` : ''}
          ${input.tasteIds.length ? `AND EXISTS (SELECT 1 FROM dbo.menu_items mi JOIN dbo.menu_item_tastes mit ON mit.menu_item_id=mi.menu_item_id WHERE mi.place_id=p.place_id AND mi.is_available=1 AND mit.taste_id IN (${tasteIds}))` : ''}
        ORDER BY p.avg_rating DESC,p.review_count DESC,p.place_id DESC`);
      groups.restaurants = result.recordset.map((r) => ({ ...r, price_min: r.price_min === null ? null : Number(r.price_min), price_max: r.price_max === null ? null : Number(r.price_max), avg_rating: Number(r.avg_rating) }));
    })());
  }

  if (input.types.includes('ATTRACTION')) {
    queries.push((async () => {
      const request = pool.request();
      const district = addSharedFilters(request, input);
      const categoryIds = bindIds(request, 'category', input.attractionCategoryIds);
      const result = await request.query<RecommendationItem>(`
        SELECT ${selectFields}
          CAST(a.ticket_price AS float) AS price_min, CAST(a.ticket_price AS float) AS price_max,
          CAST(a.ticket_price AS float) AS ticket_price, CAST(NULL AS nvarchar(100)) AS cuisine_name,
          CAST(NULL AS varchar(20)) AS accommodation_type, CAST(NULL AS tinyint) AS star_rating,
          ac.name AS category_name
        FROM dbo.places p JOIN dbo.attractions a ON a.place_id=p.place_id
        LEFT JOIN dbo.districts d ON d.district_id=p.district_id
        LEFT JOIN dbo.attraction_categories ac ON ac.category_id=a.category_id
        WHERE p.place_type='ATTRACTION' AND p.status='ACTIVE' AND a.ticket_price <= @budget ${district}
          ${input.attractionCategoryIds.length ? `AND a.category_id IN (${categoryIds})` : ''}
        ORDER BY p.avg_rating DESC,p.review_count DESC,p.place_id DESC`);
      groups.attractions = result.recordset.map((r) => ({ ...r, price_min: Number(r.price_min), price_max: Number(r.price_max), ticket_price: Number(r.ticket_price), avg_rating: Number(r.avg_rating) }));
    })());
  }

  await Promise.all(queries);
  return groups;
}
