import { getPool, sql } from '../../config/db';

export interface ReviewRow {
  review_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface PlaceReviewSummary {
  place_id: number;
  avg_rating: number;
  review_count: number;
}

export interface AdminReviewRow {
  review_id: number;
  place_id: number;
  place_name: string;
  user_name: string;
  rating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  created_at: Date;
}

export async function findPlaceSummary(placeId: number): Promise<PlaceReviewSummary | null> {
  const result = await getPool().request()
    .input('place_id', sql.Int, placeId)
    .query(`
      SELECT place_id, avg_rating, review_count
      FROM places
      WHERE place_id = @place_id
    `);
  return (result.recordset[0] as PlaceReviewSummary | undefined) ?? null;
}

export async function findApprovedReviews(
  placeId: number,
  offset: number,
  limit: number,
): Promise<{ rows: ReviewRow[]; total: number }> {
  const pool = getPool();
  const countResult = await pool.request()
    .input('place_id', sql.Int, placeId)
    .query(`SELECT COUNT(*) AS total FROM reviews WHERE place_id = @place_id AND status = 'APPROVED'`);
  const dataResult = await pool.request()
    .input('place_id', sql.Int, placeId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT r.review_id, u.full_name AS reviewer_name, r.rating, r.comment, r.created_at
      FROM reviews r
      INNER JOIN users u ON u.user_id = r.user_id
      WHERE r.place_id = @place_id AND r.status = 'APPROVED'
      ORDER BY r.created_at DESC, r.review_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return { rows: dataResult.recordset as ReviewRow[], total: (countResult.recordset[0] as { total: number }).total };
}

export async function insertPendingReview(
  placeId: number,
  userId: number,
  rating: number,
  comment: string,
  cooldownMinutes: number,
): Promise<{ reviewId: number } | { retryAfterSeconds: number }> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    await transaction.request().input('user_id', sql.Int, userId)
      .query('SELECT user_id FROM users WITH (UPDLOCK, HOLDLOCK) WHERE user_id = @user_id');
    const recentReview = await transaction.request()
      .input('user_id', sql.Int, userId)
      .input('cooldown_minutes', sql.Int, cooldownMinutes)
      .query(`
        SELECT TOP 1 DATEDIFF(SECOND, GETDATE(), DATEADD(MINUTE, @cooldown_minutes, created_at)) AS retry_after_seconds
        FROM reviews
        WHERE user_id = @user_id AND created_at > DATEADD(MINUTE, -@cooldown_minutes, GETDATE())
        ORDER BY created_at DESC, review_id DESC
      `);
    const retryAfterSeconds = (recentReview.recordset[0] as { retry_after_seconds: number } | undefined)?.retry_after_seconds;
    if (retryAfterSeconds !== undefined) {
      await transaction.rollback();
      return { retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }

    const result = await transaction.request()
      .input('place_id', sql.Int, placeId)
      .input('user_id', sql.Int, userId)
      .input('rating', sql.TinyInt, rating)
      .input('comment', sql.NVarChar(1000), comment)
      .query(`
        INSERT INTO reviews (user_id, place_id, rating, comment, status)
        OUTPUT INSERTED.review_id
        VALUES (@user_id, @place_id, @rating, @comment, 'PENDING')
      `);
    await transaction.commit();
    return { reviewId: (result.recordset[0] as { review_id: number }).review_id };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function findUserReviews(userId: number): Promise<AdminReviewRow[]> {
  const result = await getPool().request()
    .input('user_id', sql.Int, userId)
    .query(`
      SELECT r.review_id, r.place_id, p.name AS place_name,
        u.full_name AS user_name, r.rating, r.comment, r.status, r.created_at
      FROM reviews r
      INNER JOIN places p ON p.place_id = r.place_id
      INNER JOIN users u ON u.user_id = r.user_id
      WHERE r.user_id = @user_id
      ORDER BY r.created_at DESC, r.review_id DESC
    `);
  return result.recordset as AdminReviewRow[];
}

export async function findReviewOwner(reviewId: number): Promise<{ user_id: number; status: 'PENDING' | 'APPROVED' | 'HIDDEN' } | null> {
  const result = await getPool().request()
    .input('review_id', sql.Int, reviewId)
    .query('SELECT user_id, status FROM reviews WHERE review_id = @review_id');
  return (result.recordset[0] as { user_id: number; status: 'PENDING' | 'APPROVED' | 'HIDDEN' } | undefined) ?? null;
}

export async function updateOwnReviewTx(reviewId: number, userId: number, rating: number, comment: string): Promise<'updated' | 'missing' | 'forbidden'> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const review = await transaction.request().input('review_id', sql.Int, reviewId)
      .query('SELECT user_id, place_id, status FROM reviews WITH (UPDLOCK, HOLDLOCK) WHERE review_id = @review_id');
    const row = review.recordset[0] as { user_id: number; place_id: number; status: 'PENDING' | 'APPROVED' | 'HIDDEN' } | undefined;
    if (!row) { await transaction.rollback(); return 'missing'; }
    if (row.user_id !== userId) { await transaction.rollback(); return 'forbidden'; }
    await transaction.request().input('place_id', sql.Int, row.place_id)
      .query('SELECT place_id FROM places WITH (UPDLOCK, HOLDLOCK) WHERE place_id = @place_id');
    await transaction.request().input('review_id', sql.Int, reviewId).input('rating', sql.TinyInt, rating)
      .input('comment', sql.NVarChar(1000), comment).query(`
        UPDATE reviews SET rating = @rating, comment = @comment, status = 'PENDING',
          moderated_by = NULL, moderated_at = NULL, updated_at = GETDATE()
        WHERE review_id = @review_id
      `);
    if (row.status === 'APPROVED') await refreshPlaceReviewSummary(transaction, row.place_id);
    await transaction.commit();
    return 'updated';
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function deleteOwnReviewTx(reviewId: number, userId: number): Promise<'deleted' | 'missing' | 'forbidden'> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const review = await transaction.request().input('review_id', sql.Int, reviewId)
      .query('SELECT user_id, place_id, status FROM reviews WITH (UPDLOCK, HOLDLOCK) WHERE review_id = @review_id');
    const row = review.recordset[0] as { user_id: number; place_id: number; status: 'PENDING' | 'APPROVED' | 'HIDDEN' } | undefined;
    if (!row) { await transaction.rollback(); return 'missing'; }
    if (row.user_id !== userId) { await transaction.rollback(); return 'forbidden'; }
    await transaction.request().input('place_id', sql.Int, row.place_id)
      .query('SELECT place_id FROM places WITH (UPDLOCK, HOLDLOCK) WHERE place_id = @place_id');
    await transaction.request().input('review_id', sql.Int, reviewId).query('DELETE FROM reviews WHERE review_id = @review_id');
    if (row.status === 'APPROVED') await refreshPlaceReviewSummary(transaction, row.place_id);
    await transaction.commit();
    return 'deleted';
  } catch (error) { await transaction.rollback(); throw error; }
}

export async function isActivePlace(placeId: number): Promise<boolean> {
  const result = await getPool().request()
    .input('place_id', sql.Int, placeId)
    .query("SELECT 1 AS found FROM places WHERE place_id = @place_id AND status = 'ACTIVE'");
  return result.recordset.length > 0;
}

export async function findAdminReviews(rating?: number, status?: string): Promise<AdminReviewRow[]> {
  const request = getPool().request();
  const filters: string[] = [];
  if (rating !== undefined) {
    request.input('rating', sql.TinyInt, rating);
    filters.push('r.rating = @rating');
  }
  if (status) {
    request.input('status', sql.VarChar(20), status);
    filters.push('r.status = @status');
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const result = await request.query(`
    SELECT r.review_id, r.place_id, p.name AS place_name,
      u.full_name AS user_name, r.rating, r.comment, r.status, r.created_at
    FROM reviews r
    INNER JOIN places p ON p.place_id = r.place_id
    INNER JOIN users u ON u.user_id = r.user_id
    ${where}
    ORDER BY CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END,
      r.created_at DESC, r.review_id DESC
  `);
  return result.recordset as AdminReviewRow[];
}

export async function updateReviewStatusTx(
  reviewId: number,
  status: 'APPROVED' | 'HIDDEN',
  moderatorId: number,
): Promise<boolean> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const placeId = await lockReviewPlace(transaction, reviewId);
    if (!placeId) {
      await transaction.rollback();
      return false;
    }
    const result = await transaction.request()
      .input('review_id', sql.Int, reviewId)
      .input('status', sql.VarChar(20), status)
      .input('moderator_id', sql.Int, moderatorId)
      .query(`
        UPDATE reviews
        SET status = @status, moderated_by = @moderator_id,
            moderated_at = GETDATE(), updated_at = GETDATE()
        WHERE review_id = @review_id
      `);
    if (!result.rowsAffected[0]) {
      await transaction.rollback();
      return false;
    }
    await refreshPlaceReviewSummary(transaction, placeId);
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteReviewTx(reviewId: number): Promise<boolean> {
  const transaction = getPool().transaction();
  await transaction.begin();
  try {
    const placeId = await lockReviewPlace(transaction, reviewId);
    if (!placeId) {
      await transaction.rollback();
      return false;
    }
    const result = await transaction.request()
      .input('review_id', sql.Int, reviewId)
      .query(`
        DELETE FROM reviews
        WHERE review_id = @review_id
      `);
    if (!result.rowsAffected[0]) {
      await transaction.rollback();
      return false;
    }
    await refreshPlaceReviewSummary(transaction, placeId);
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function lockReviewPlace(transaction: sql.Transaction, reviewId: number): Promise<number | null> {
  const review = await transaction.request()
    .input('review_id', sql.Int, reviewId)
    .query('SELECT place_id FROM reviews WHERE review_id = @review_id');
  const placeId = (review.recordset[0] as { place_id: number } | undefined)?.place_id;
  if (!placeId) return null;

  await transaction.request()
    .input('place_id', sql.Int, placeId)
    .query('SELECT place_id FROM places WITH (UPDLOCK, HOLDLOCK) WHERE place_id = @place_id');
  return placeId;
}

async function refreshPlaceReviewSummary(transaction: sql.Transaction, placeId: number): Promise<void> {
  await transaction.request()
    .input('place_id', sql.Int, placeId)
    .query(`
      UPDATE places
      SET avg_rating = COALESCE((
            SELECT CAST(AVG(CAST(rating AS decimal(4, 2))) AS decimal(2, 1))
            FROM reviews WHERE place_id = @place_id AND status = 'APPROVED'
          ), 0),
          review_count = (
            SELECT COUNT(*) FROM reviews WHERE place_id = @place_id AND status = 'APPROVED'
          ),
          updated_at = GETDATE()
      WHERE place_id = @place_id
    `);
}
