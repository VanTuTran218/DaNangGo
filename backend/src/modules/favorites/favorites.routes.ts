import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { AuthError } from '../auth/auth.errors';
import type { FavoritePlaceType } from './favorites.repository';
import { addFavorite, listFavoriteIds, listFavorites, removeFavorite } from './favorites.service';

const router = Router();
const placeTypeSchema = z.enum(['RESTAURANT', 'ACCOMMODATION', 'ATTRACTION', 'ALL']);

router.use(requireAuth('USER'), requireRole('USER', 'PARTNER'));

// Keep this fixed route before any placeId routes.
router.get('/ids', async (req, res) => {
  const placeIds = await listFavoriteIds(req.user!.user_id);
  res.json({ success: true, data: placeIds });
});

router.get('/', async (req, res) => {
  const query = z.object({
    type: z.preprocess((value) => value === '' ? undefined : value, placeTypeSchema.optional()).default('ALL'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(12),
  }).safeParse(req.query);
  if (!query.success) throw new AuthError(400, 'Tham số lọc hoặc phân trang không hợp lệ.');

  const result = await listFavorites({
    userId: req.user!.user_id,
    ...(query.data.type === 'ALL' ? {} : { type: query.data.type as FavoritePlaceType }),
    page: query.data.page,
    limit: query.data.limit,
  });
  res.json({
    success: true,
    data: result.data,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

router.post('/', async (req, res) => {
  const body = z.object({ place_id: z.number().int().positive() }).strict().safeParse(req.body);
  if (!body.success) throw new AuthError(400, 'place_id không hợp lệ.');
  await addFavorite(req.user!.user_id, body.data.place_id);
  res.status(200).json({ success: true, data: { place_id: body.data.place_id } });
});

router.delete('/:placeId', async (req, res) => {
  const placeId = z.coerce.number().int().positive().safeParse(req.params.placeId);
  if (!placeId.success) throw new AuthError(400, 'placeId không hợp lệ.');
  await removeFavorite(req.user!.user_id, placeId.data);
  res.json({ success: true, message: 'Đã bỏ địa điểm khỏi danh sách yêu thích.' });
});

export default router;
