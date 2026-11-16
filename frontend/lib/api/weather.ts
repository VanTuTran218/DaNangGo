import { apiRequest } from "@/lib/api/client";
import type {
  NormalizedWeatherResponse,
  WeatherPlacePreset,
} from "@/types/weather";

export interface GetWeatherParams {
  place?: string;
  placeId?: number | null;
  date?: string;
  days?: number;
}

export async function getWeather(
  params: GetWeatherParams = {}
): Promise<NormalizedWeatherResponse> {
  const search = new URLSearchParams();
  if (params.placeId) search.set("placeId", String(params.placeId));
  else if (params.place) search.set("place", params.place);
  if (params.date) search.set("date", params.date);
  if (params.days) search.set("days", String(params.days));

  const qs = search.toString();
  const res = await apiRequest<NormalizedWeatherResponse>(
    `/api/weather${qs ? `?${qs}` : ""}`
  );
  if (!res.data) {
    throw new Error(res.message || "Không tải được dữ liệu thời tiết.");
  }
  return res.data;
}

export async function getWeatherPlaces(): Promise<WeatherPlacePreset[]> {
  const res = await apiRequest<WeatherPlacePreset[]>("/api/weather/places");
  return res.data ?? [];
}
