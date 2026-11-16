export type WeatherScope = "CITY" | "PLACE";

export type WeatherAlertState = "ACTIVE" | "NONE" | "UNAVAILABLE";

export interface WeatherAlertItem {
  id: string;
  event: string;
  area: string;
  severity: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  description: string | null;
  source: string;
}

export interface WeatherAlertInfo {
  state: WeatherAlertState;
  scope: string;
  message: string;
  source: string;
  items: WeatherAlertItem[];
}

export type DayPeriod = "MORNING" | "NOON" | "AFTERNOON" | "EVENING" | "NIGHT";

export interface WeatherCurrent {
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
  weatherCode: number | null;
  description: string;
  precipitationProbability: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  windGusts: number | null;
  humidity: number | null;
}

export interface WeatherHourlyItem {
  time: string;
  date: string;
  hour: number;
  hourLabel: string;
  period: DayPeriod;
  temperature: number | null;
  weatherCode: number | null;
  description: string;
  precipitationProbability: number | null;
  precipitation: number | null;
  windSpeed: number | null;
}

export interface WeatherDailyItem {
  date: string;
  dayLabel: string;
  weatherCode: number | null;
  description: string;
  tempMin: number | null;
  tempMax: number | null;
  precipitationProbabilityMax: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
}

export interface WeatherLocationInfo {
  name: string;
  areaLabel: string;
  scope: WeatherScope;
  placeId: number | null;
  latitude: number;
  longitude: number;
  resolvedFrom: "CATALOG" | "CITY_DEFAULT" | "COORDINATES";
}

export interface WeatherSourceInfo {
  name: string;
  url: string;
  license: string;
  attribution: string;
}

export interface NormalizedWeatherResponse {
  location: WeatherLocationInfo;
  timezone: "Asia/Ho_Chi_Minh";
  requestedDate: string | null;
  forecastRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  fetchedAt: string;
  providerUpdatedAt: string | null;
  stale: boolean;
  staleReason: string | null;
  source: WeatherSourceInfo;
  current: WeatherCurrent | null;
  hourly: WeatherHourlyItem[];
  daily: WeatherDailyItem[];
  alerts: WeatherAlertInfo;
  marineAvailable: boolean;
}

export interface WeatherPlacePreset {
  placeId: number | null;
  name: string;
  areaLabel: string;
  scope: WeatherScope;
  latitude: number;
  longitude: number;
}
