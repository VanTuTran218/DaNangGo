import { z } from 'zod';

// Phạm vi tọa độ hỗ trợ cho khu vực Đà Nẵng & lân cận (Bà Nà Hills, Hải Vân, Ngũ Hành Sơn, Hội An giáp ranh)
export const DANANG_BOUNDS = {
  minLat: 15.70,
  maxLat: 16.35,
  minLon: 107.75,
  maxLon: 108.50,
} as const;

export const MAX_FORECAST_DAYS = 14;
export const DEFAULT_FORECAST_DAYS = 7;

export const weatherQuerySchema = z.object({
  placeId: z.coerce.number().int().positive().optional(),
  place: z.string().trim().min(1).max(120).optional(),
  lat: z.coerce
    .number()
    .min(DANANG_BOUNDS.minLat, `Vĩ độ phải nằm trong phạm vi Đà Nẵng (${DANANG_BOUNDS.minLat} – ${DANANG_BOUNDS.maxLat}).`)
    .max(DANANG_BOUNDS.maxLat, `Vĩ độ phải nằm trong phạm vi Đà Nẵng (${DANANG_BOUNDS.minLat} – ${DANANG_BOUNDS.maxLat}).`)
    .optional(),
  lon: z.coerce
    .number()
    .min(DANANG_BOUNDS.minLon, `Kinh độ phải nằm trong phạm vi Đà Nẵng (${DANANG_BOUNDS.minLon} – ${DANANG_BOUNDS.maxLon}).`)
    .max(DANANG_BOUNDS.maxLon, `Kinh độ phải nằm trong phạm vi Đà Nẵng (${DANANG_BOUNDS.minLon} – ${DANANG_BOUNDS.maxLon}).`)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày dự báo phải theo định dạng YYYY-MM-DD.')
    .optional(),
  days: z.coerce
    .number()
    .int()
    .min(1, 'Số ngày dự báo tối thiểu là 1.')
    .max(MAX_FORECAST_DAYS, `Số ngày dự báo tối đa là ${MAX_FORECAST_DAYS}.`)
    .default(DEFAULT_FORECAST_DAYS),
}).superRefine((value, ctx) => {
  if ((value.lat !== undefined) !== (value.lon !== undefined)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cần truyền đủ cả lat và lon khi truy vấn theo tọa độ.',
    });
  }
});

export type WeatherQueryInput = z.infer<typeof weatherQuerySchema>;
