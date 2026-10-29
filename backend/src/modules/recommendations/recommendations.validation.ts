import { z } from 'zod';

export const recommendationRequestSchema = z.object({
  budget: z.number().safe().int().positive(),
  types: z.array(z.enum(['ACCOMMODATION', 'RESTAURANT', 'ATTRACTION'])).min(1).max(3),
  districtId: z.number().int().positive().optional(),
  cuisineIds: z.array(z.number().int().positive()).max(100).default([]),
  tasteIds: z.array(z.number().int().positive()).max(100).default([]),
  attractionCategoryIds: z.array(z.number().int().positive()).max(100).default([]),
  accommodationTypes: z.array(z.enum(['HOTEL', 'HOMESTAY', 'RESORT', 'HOSTEL', 'APARTMENT'])).max(5).default([]),
  starRatings: z.array(z.number().int().min(1).max(5)).max(5).default([]),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.types).size !== value.types.length) {
    ctx.addIssue({ code: 'custom', message: 'Loại địa điểm không được lặp lại.' });
  }
  if (!value.types.includes('RESTAURANT') && (value.cuisineIds.length || value.tasteIds.length)) {
    ctx.addIssue({ code: 'custom', message: 'Cuisine và khẩu vị chỉ áp dụng cho ăn uống.' });
  }
  if (!value.types.includes('ATTRACTION') && value.attractionCategoryIds.length) {
    ctx.addIssue({ code: 'custom', message: 'Loại tham quan chỉ áp dụng cho điểm tham quan.' });
  }
  if (!value.types.includes('ACCOMMODATION') && (value.accommodationTypes.length || value.starRatings.length)) {
    ctx.addIssue({ code: 'custom', message: 'Loại lưu trú và hạng sao chỉ áp dụng cho lưu trú.' });
  }
});

export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;
