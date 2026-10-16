import { Router } from 'express';
import { getRouteOptions, resolveRouteQuery, routeQuerySchema } from './travel.service';

const router = Router();

// GET /api/routes?toPlaceId=5&from=16.06,108.22&modes=WALK,CAR
// hoặc  /api/routes?fromPlaceId=3&toPlaceId=5
router.get('/', async (req, res) => {
  const query = routeQuerySchema.parse(req.query);
  const { from, to, codes } = await resolveRouteQuery(query);
  const results = await getRouteOptions(from, to, codes);
  res.json({ success: true, data: results });
});

export default router;
