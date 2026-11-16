import { Router } from 'express';
import { weatherQuerySchema } from './weather.validation';
import { getWeatherForecast, listWeatherPresets } from './weather.service';

const router = Router();

/**
 * GET /api/weather
 * Truy vấn dự báo thời tiết Đà Nẵng hoặc địa điểm cụ thể đã chuẩn hóa
 */
router.get('/', async (req, res) => {
  const parsed = weatherQuerySchema.parse({
    placeId: req.query.placeId,
    place: req.query.place,
    lat: req.query.lat,
    lon: req.query.lon,
    date: req.query.date,
    days: req.query.days,
  });

  const data = await getWeatherForecast(parsed);
  res.json({
    success: true,
    data,
    message: data.stale
      ? 'Lấy dự báo thời tiết từ bộ nhớ đệm tạm thời (dữ liệu cũ).'
      : 'Lấy dự báo thời tiết thành công.',
  });
});

/**
 * GET /api/weather/places
 * Danh sách mốc địa điểm có tọa độ xác minh để chọn nhanh
 */
router.get('/places', async (_req, res) => {
  const data = await listWeatherPresets();
  res.json({
    success: true,
    data,
    message: 'Lấy danh sách khu vực thời tiết thành công.',
  });
});

export default router;
