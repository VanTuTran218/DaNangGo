import { getPool, sql } from '../../config/db';

export type FavoritePlaceType = 'RESTAURANT' | 'ACCOMMODATION' | 'ATTRACTION';

export interface FavoritePlaceRecord {
  place_id: number;
  place_type: FavoritePlaceType;
  name: string;
  address: string | null;
  avg_rating: number;
  review_count: number;
  cover_image: string | null;
  favorited_at: Date;
}

export async function listFavoriteIds(userId: number): Promise<number[]> {
  const result = await getPool().request()
    .input('userId', sql.Int, userId)
    .query<{ place_id: number }>(`
      SELECT place_id
      FROM dbo.favorites
      WHERE user_id = @userId
    `);
  return result.recordset.map((row) => row.place_id);
}

export async function isActivePlace(placeId: number): Promise<boolean> {
  const result = await getPool().request()
    .input('placeId', sql.Int, placeId)
    .query<{ found: number }>(`
      SELECT TOP (1) 1 AS found
      FROM dbo.places
      WHERE place_id = @placeId AND status = 'ACTIVE'
    `);
  return result.recordset.length > 0;
}

export async function insertFavorite(userId: number, placeId: number): Promise<void> {
  try {
    await getPool().request()
      .input('userId', sql.Int, userId)
      .input('placeId', sql.Int, placeId)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM dbo.favorites WITH (UPDLOCK, HOLDLOCK)
          WHERE user_id = @userId AND place_id = @placeId
        )
        BEGIN
          INSERT INTO dbo.favorites (user_id, place_id)
          VALUES (@userId, @placeId)
        END
      `);
  } catch (error) {
    const dbError = error as { number?: number };
    if (dbError.number !== 2601 && dbError.number !== 2627) throw error;
  }
}

export async function deleteFavorite(userId: number, placeId: number): Promise<void> {
  await getPool().request()
    .input('userId', sql.Int, userId)
    .input('placeId', sql.Int, placeId)
    .query(`
      DELETE FROM dbo.favorites
      WHERE user_id = @userId AND place_id = @placeId
    `);
}

export async function listFavorites(input: {
  userId: number;
  type?: FavoritePlaceType;
  page: number;
  limit: number;
}): Promise<{ data: FavoritePlaceRecord[]; total: number }> {
  const pool = getPool();
  const bind = (request: ReturnType<typeof pool.request>) => request
    .input('userId', sql.Int, input.userId)
    .input('type', sql.VarChar(20), input.type ?? null);
  const where = `f.user_id = @userId AND p.status = 'ACTIVE'
    AND (@type IS NULL OR p.place_type = @type)`;

  const count = await bind(pool.request()).query<{ total: number }>(`
    SELECT COUNT(*) AS total
    FROM dbo.favorites AS f
    INNER JOIN dbo.places AS p ON p.place_id = f.place_id
    WHERE ${where}
  `);

  const result = await bind(pool.request())
    .input('offset', sql.Int, (input.page - 1) * input.limit)
    .input('limit', sql.Int, input.limit)
    .query<FavoritePlaceRecord>(`
      SELECT p.place_id, p.place_type, p.name, p.address,
        p.avg_rating, p.review_count,
        cover.image_url AS cover_image,
        f.created_at AS favorited_at
      FROM dbo.favorites AS f
      INNER JOIN dbo.places AS p ON p.place_id = f.place_id
      OUTER APPLY (
        SELECT TOP (1) pi.image_url
        FROM dbo.place_images AS pi
        WHERE pi.place_id = p.place_id
        ORDER BY pi.is_cover DESC, pi.image_id ASC
      ) AS cover
      WHERE ${where}
      ORDER BY f.created_at DESC, f.id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  return { data: result.recordset, total: count.recordset[0]?.total ?? 0 };
}
