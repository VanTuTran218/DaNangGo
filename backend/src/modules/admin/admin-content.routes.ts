import { Router } from 'express';
import { z } from 'zod';
import { getPool, sql } from '../../config/db';
import { AuthError } from '../auth/auth.errors';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();
router.use(['/places', '/reviews'], requireAuth('ADMIN'), requireRole('ADMIN'));

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const id = (raw: unknown) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new AuthError(400, 'ID không hợp lệ.');
  return n;
};

// ================= ĐỊA ĐIỂM =================
const placeListSchema = pageSchema.extend({
  status: z.enum(['ACTIVE', 'HIDDEN', 'PENDING', 'LOCKED']).optional(),
  type: z.enum(['ACCOMMODATION', 'RESTAURANT', 'ATTRACTION']).optional(),
  districtId: z.coerce.number().int().min(1).optional(),
  q: z.string().trim().max(100).optional(),
});

// GET /api/admin/places
router.get('/places', async (req, res) => {
  const f = placeListSchema.parse(req.query);
  const r = await getPool().request()
    .input('status', sql.VarChar(20), f.status ?? null)
    .input('type', sql.VarChar(20), f.type ?? null)
    .input('district', sql.Int, f.districtId ?? null)
    .input('q', sql.NVarChar(100), f.q ? `%${f.q}%` : null)
    .input('offset', sql.Int, (f.page - 1) * f.limit).input('limit', sql.Int, f.limit)
    .query(`
      SELECT p.place_id, p.place_type, p.name, p.address, p.status, p.district_id, d.name AS district_name,
             p.partner_id, pp.business_name AS partner_name, p.avg_rating, p.review_count, p.view_count, p.created_at,
             (SELECT TOP 1 i.image_url FROM dbo.place_images i
               WHERE i.place_id = p.place_id ORDER BY i.is_cover DESC, i.image_id) AS cover_image,
             CASE p.place_type
               WHEN 'ACCOMMODATION' THEN (SELECT MIN(rt.price_per_night) FROM dbo.room_types rt
                                          WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')
               WHEN 'RESTAURANT' THEN r.price_min
               ELSE a.ticket_price END AS price_min,
             CASE p.place_type
               WHEN 'ACCOMMODATION' THEN (SELECT MAX(rt.price_per_night) FROM dbo.room_types rt
                                          WHERE rt.place_id = p.place_id AND rt.status = 'ACTIVE')
               WHEN 'RESTAURANT' THEN r.price_max
               ELSE a.ticket_price END AS price_max,
             COUNT(*) OVER() AS total
      FROM dbo.places p
      LEFT JOIN dbo.districts d ON d.district_id = p.district_id
      LEFT JOIN dbo.partner_profiles pp ON pp.partner_id = p.partner_id
      LEFT JOIN dbo.restaurants r ON r.place_id = p.place_id
      LEFT JOIN dbo.attractions a ON a.place_id = p.place_id
      WHERE (@status IS NULL OR p.status = @status) AND (@type IS NULL OR p.place_type = @type)
        AND (@district IS NULL OR p.district_id = @district) AND (@q IS NULL OR p.name LIKE @q)
      ORDER BY p.place_id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  const items = r.recordset;
  res.json({ success: true, data: { items, total: items[0]?.total ?? 0, page: f.page, limit: f.limit } });
});

// PATCH /api/admin/places/:id/lock   (cần migration 004: trạng thái LOCKED, và 005: place_lock_logs)
router.patch('/places/:id/lock', async (req, res) => {
  const placeId = id(req.params.id);
  const { reason } = z.object({ reason: z.string().trim().min(1, 'Vui lòng nhập lý do khóa.').max(255) }).parse(req.body);
  const adminId = res.locals.authUserId as number;

  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    const cur = await new sql.Request(tx).input('id', sql.Int, placeId)
      .query<{ status: string }>('SELECT status FROM dbo.places WITH (UPDLOCK) WHERE place_id = @id');
    if (!cur.recordset[0]) throw new AuthError(404, 'Không tìm thấy địa điểm.');
    if (cur.recordset[0].status === 'LOCKED') throw new AuthError(409, 'Địa điểm đã bị khóa.');

    await new sql.Request(tx).input('id', sql.Int, placeId).input('reason', sql.NVarChar(255), reason)
      .input('prev', sql.VarChar(20), cur.recordset[0].status).input('admin', sql.Int, adminId)
      .query(`INSERT INTO dbo.place_lock_logs (place_id, reason, previous_status, locked_by)
              VALUES (@id, @reason, @prev, @admin)`);
    await new sql.Request(tx).input('id', sql.Int, placeId)
      .query("UPDATE dbo.places SET status='LOCKED', updated_at=SYSDATETIME() WHERE place_id=@id");
    await tx.commit();
  } catch (e) { await tx.rollback(); throw e; }
  res.json({ success: true, message: 'Đã khóa địa điểm.' });
});

// PATCH /api/admin/places/:id/unlock  (về trạng thái trước khi khóa)
router.patch('/places/:id/unlock', async (req, res) => {
  const placeId = id(req.params.id);
  const adminId = res.locals.authUserId as number;

  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    const cur = await new sql.Request(tx).input('id', sql.Int, placeId)
      .query<{ status: string }>('SELECT status FROM dbo.places WITH (UPDLOCK) WHERE place_id = @id');
    if (!cur.recordset[0]) throw new AuthError(404, 'Không tìm thấy địa điểm.');
    if (cur.recordset[0].status !== 'LOCKED') throw new AuthError(409, 'Địa điểm không ở trạng thái bị khóa.');

    const log = await new sql.Request(tx).input('id', sql.Int, placeId).query<{ log_id: number; previous_status: string }>(`
      SELECT TOP (1) log_id, previous_status FROM dbo.place_lock_logs
      WHERE place_id = @id AND unlocked_at IS NULL ORDER BY log_id DESC`);
    const restoreTo = log.recordset[0]?.previous_status ?? 'ACTIVE';

    if (log.recordset[0]) {
      await new sql.Request(tx).input('log', sql.Int, log.recordset[0].log_id).input('admin', sql.Int, adminId)
        .query('UPDATE dbo.place_lock_logs SET unlocked_by=@admin, unlocked_at=SYSDATETIME() WHERE log_id=@log');
    }
    await new sql.Request(tx).input('id', sql.Int, placeId).input('st', sql.VarChar(20), restoreTo)
      .query('UPDATE dbo.places SET status=@st, updated_at=SYSDATETIME() WHERE place_id=@id');
    await tx.commit();
  } catch (e) { await tx.rollback(); throw e; }
  res.json({ success: true, message: 'Đã mở khóa địa điểm.' });
});

// ================= ĐÁNH GIÁ =================
/**
 * TẠM THỜI: tính lại điểm trung bình ngay trong transaction.
 * Khi Long có hàm dùng chung thì thay thân hàm này bằng lời gọi hàm của Long (giữ nguyên chữ ký).
 */
async function recalcPlaceRating(tx: sql.Transaction, placeId: number): Promise<void> {
  await new sql.Request(tx).input('id', sql.Int, placeId).query(`
    UPDATE p SET review_count = x.cnt, avg_rating = x.avg_rating
    FROM dbo.places p WITH (UPDLOCK)
    CROSS APPLY (SELECT COUNT(*) AS cnt,
                        ISNULL(CAST(ROUND(AVG(CAST(r.rating AS decimal(4,2))), 1) AS decimal(2,1)), 0) AS avg_rating
                 FROM dbo.reviews r WHERE r.place_id = p.place_id AND r.status = 'APPROVED') x
    WHERE p.place_id = @id`);
}

const reviewListSchema = pageSchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'HIDDEN', 'ALL']).default('PENDING'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

// GET /api/admin/reviews?status=PENDING
router.get('/reviews', async (req, res) => {
  const f = reviewListSchema.parse(req.query);
  const r = await getPool().request()
    .input('status', sql.VarChar(20), f.status === 'ALL' ? null : f.status)
    .input('rating', sql.Int, f.rating ?? null)
    .input('offset', sql.Int, (f.page - 1) * f.limit).input('limit', sql.Int, f.limit)
    .query(`
      SELECT rv.review_id, rv.place_id, p.name AS place_name, rv.user_id, u.full_name AS author,
             rv.rating, rv.comment, rv.status, rv.created_at, COUNT(*) OVER() AS total
      FROM dbo.reviews rv
      JOIN dbo.places p ON p.place_id = rv.place_id
      JOIN dbo.users u ON u.user_id = rv.user_id
      WHERE (@status IS NULL OR rv.status = @status) AND (@rating IS NULL OR rv.rating = @rating)
      ORDER BY rv.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  const items = r.recordset;
  res.json({ success: true, data: { items, total: items[0]?.total ?? 0, page: f.page, limit: f.limit } });
});

// PATCH /api/admin/reviews/:id   body: { action: 'APPROVE' | 'HIDE' }
router.patch('/reviews/:id', async (req, res) => {
  const reviewId = id(req.params.id);
  const { action } = z.object({ action: z.enum(['APPROVE', 'HIDE']) }).parse(req.body);
  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'HIDDEN';
  const adminId = res.locals.authUserId as number;

  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    const cur = await new sql.Request(tx).input('id', sql.Int, reviewId)
      .query<{ place_id: number }>('SELECT place_id FROM dbo.reviews WITH (UPDLOCK) WHERE review_id = @id');
    if (!cur.recordset[0]) throw new AuthError(404, 'Không tìm thấy đánh giá.');

    await new sql.Request(tx).input('id', sql.Int, reviewId).input('st', sql.VarChar(20), newStatus).input('admin', sql.Int, adminId)
      .query(`UPDATE dbo.reviews SET status=@st, moderated_by=@admin, moderated_at=SYSDATETIME(), updated_at=SYSDATETIME()
              WHERE review_id=@id`);
    // Luôn tính lại, kể cả khi chuyển APPROVED -> HIDDEN
    await recalcPlaceRating(tx, cur.recordset[0].place_id);
    await tx.commit();
  } catch (e) { await tx.rollback(); throw e; }
  res.json({ success: true, message: newStatus === 'APPROVED' ? 'Đã duyệt đánh giá.' : 'Đã ẩn đánh giá.' });
});

export default router;
