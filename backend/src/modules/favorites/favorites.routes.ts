import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { AuthError } from '../auth/auth.errors';
import { favoriteOwnerPublicId, type FavoritePlaceType } from './favorites.repository';
import { addFavorite, listFavoriteIds, listFavorites, removeFavorite } from './favorites.service';

const router = Router();
router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
export const favoritePlaceIdSchema = z.number().int().positive().max(2147483647);
const placeTypeSchema = z.enum(['RESTAURANT', 'ACCOMMODATION', 'ATTRACTION', 'ALL']);

router.use(requireAuth('USER'), requireRole('USER', 'PARTNER'));
router.use(async (req, _res, next) => {
  const expectedOwner = req.get('X-Favorites-Owner');
  if (expectedOwner !== undefined) {
    if (expectedOwner.length > 100 || expectedOwner !== await favoriteOwnerPublicId(req.user!.user_id))
      throw new AuthError(409, 'Phiên đăng nhập đã thay đổi. Bạn tải lại trang trước khi cập nhật yêu thích nhé.');
  }
  next();
});

// Keep this fixed route before any placeId routes.
router.get('/ids', async (req, res) => {
  const placeIds = await listFavoriteIds(req.user!.user_id);
  res.json({ success: true, data: placeIds });
});

router.get('/', async (req, res) => {
  const query = z.object({
    type: z.preprocess((value) => value === '' ? undefined : value, placeTypeSchema.optional()).default('ALL'),
    page: z.coerce.number().int().positive().max(2147483647).default(1),
    limit: z.coerce.number().int().positive().max(100).default(12),
  }).refine(value => (value.page - 1) * value.limit <= 2147483647, 'Trang yêu cầu vượt giới hạn.').safeParse(req.query);
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
  const body = z.object({ place_id: favoritePlaceIdSchema }).strict().safeParse(req.body);
  if (!body.success) throw new AuthError(400, 'place_id không hợp lệ.');
  await addFavorite(req.user!.user_id, body.data.place_id);
  res.status(200).json({ success: true, data: { place_id: body.data.place_id } });
});

router.delete('/:placeId', async (req, res) => {
  const placeId = z.coerce.number().int().positive().max(2147483647).safeParse(req.params.placeId);
  if (!placeId.success) throw new AuthError(400, 'placeId không hợp lệ.');
  await removeFavorite(req.user!.user_id, placeId.data);
  res.json({ success: true, message: 'Đã bỏ địa điểm khỏi danh sách yêu thích.' });
});

export default router;
