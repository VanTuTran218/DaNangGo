import { apiPost } from './client';
import { repairTextEncoding } from '@/lib/utils/repair-text-encoding';

export type RecommendationType = 'ACCOMMODATION' | 'RESTAURANT' | 'ATTRACTION';

export interface RecommendationRequest {
  budget: number;
  types: RecommendationType[];
  districtId?: number;
  cuisineIds: number[];
  tasteIds: number[];
  attractionCategoryIds: number[];
  accommodationTypes: ('HOTEL' | 'HOMESTAY' | 'RESORT' | 'HOSTEL' | 'APARTMENT')[];
  starRatings: number[];
}

export interface RecommendationItem {
  place_id: number;
  place_type: RecommendationType;
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

export interface RecommendationResponse {
  budget: number;
  groups: {
    accommodations: RecommendationItem[];
    restaurants: RecommendationItem[];
    attractions: RecommendationItem[];
  };
}

export async function getRecommendations(input: RecommendationRequest) {
  const response = await apiPost<RecommendationResponse>('/api/recommendations', input);
  if (!response.data) throw new Error('Máy chủ không trả về danh sách gợi ý.');
  const repairItems = (items: RecommendationItem[]) => items.map((item) => ({
    ...item,
    name: repairTextEncoding(item.name),
    address: item.address ? repairTextEncoding(item.address) : null,
    district_name: item.district_name ? repairTextEncoding(item.district_name) : null,
    cuisine_name: item.cuisine_name ? repairTextEncoding(item.cuisine_name) : null,
    category_name: item.category_name ? repairTextEncoding(item.category_name) : null,
  }));
  return {
    ...response.data,
    groups: {
      accommodations: repairItems(response.data.groups.accommodations),
      restaurants: repairItems(response.data.groups.restaurants),
      attractions: repairItems(response.data.groups.attractions),
    },
  };
}
