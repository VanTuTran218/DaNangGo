import { apiRequest } from "./client";

export interface PlaceImage {
  image_id: number;
  image_url: string;
  is_cover: boolean;
}

export interface PlaceRoomType {
  room_type_id: number;
  name: string;
  capacity: number;
  price_per_night: number;
  original_price: number | null;
  room_count: number;
}

export interface PlaceAmenity {
  amenity_id: number;
  name: string;
  icon?: string | null;
}

export interface PlaceDetail {
  place_id: number;
  place_type: string;
  name: string;
  description: string | null;
  address: string | null;
  district_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cover_image: string | null;
  image_url?: string | null;
  images?: PlaceImage[];
  avg_rating: number;
  review_count: number;
  status: string;
  booking_url?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  // Các trường riêng cho lưu trú (ACCOMMODATION)
  accommodation_type?: "HOTEL" | "HOMESTAY" | "RESORT";
  star_rating?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  rooms?: PlaceRoomType[];
  amenities?: PlaceAmenity[];
}

export interface PlacesFilterParams {
  type?: string;
  category?: string;
  district_id?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  capacity?: number | string;
  amenity_ids?: string;
  accommodation_type?: string;
  min_rating?: number | string;
  q?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export type PlaceListItem = Pick<
  PlaceDetail,
  | "place_id"
  | "place_type"
  | "name"
  | "address"
  | "cover_image"
  | "avg_rating"
  | "review_count"
  | "status"
  | "price_min"
  | "price_max"
  | "accommodation_type"
  | "star_rating"
>;

export async function getPlaces(
  params: PlacesFilterParams = {},
): Promise<PlaceListItem[]> {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, String(val));
    }
  }
  const qs = query.toString() ? `?${query.toString()}` : "";
  const response = await apiRequest<PlaceListItem[]>(`/api/places${qs}`);
  return response.data || [];
}

export async function getPlace(placeId: string): Promise<PlaceDetail> {
  const response = await apiRequest<PlaceDetail>(
    `/api/places/${encodeURIComponent(placeId)}`,
  );
  return response.data!;
}
