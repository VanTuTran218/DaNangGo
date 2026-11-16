import { getPool, sql } from '../../config/db';
import { AuthError } from '../auth/auth.errors';
import {
  VIETNAM_TIMEZONE,
  addDaysVN,
  diffDaysVN,
  formatDayLabelVN,
  getVietnamToday,
  hourToPeriod,
} from './weather.timezone';
import {
  DANANG_BOUNDS,
  DEFAULT_FORECAST_DAYS,
  MAX_FORECAST_DAYS,
  type WeatherQueryInput,
} from './weather.validation';
import type {
  NormalizedWeatherResponse,
  WeatherCurrent,
  WeatherDailyItem,
  WeatherHourlyItem,
  WeatherLocationInfo,
  WeatherPlacePreset,
} from './weather.types';

export type WeatherFetcher = (url: string, init?: RequestInit) => Promise<Response>;

const OPEN_METEO_SOURCE = {
  name: 'Open-Meteo',
  url: 'https://open-meteo.com/',
  license: 'CC BY 4.0',
  attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)',
} as const;

const CACHE_TTL_MS = Number(process.env.WEATHER_CACHE_TTL_MS || 10 * 60 * 1000); // 10 phút
const STALE_MAX_MS = Number(process.env.WEATHER_STALE_MAX_MS || 6 * 60 * 60 * 1000); // 6 giờ
const REQUEST_TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS || 6000); // 6 giây

interface CacheEntry {
  data: NormalizedWeatherResponse;
  storedAtMs: number;
}

const weatherCache = new Map<string, CacheEntry>();

export function clearWeatherCache(): void {
  weatherCache.clear();
}

export function getCityDefaultConfig() {
  return {
    name: process.env.WEATHER_CITY_NAME || 'Đà Nẵng (Trung tâm thành phố)',
    areaLabel: 'Đà Nẵng — Cấp thành phố',
    latitude: Number(process.env.WEATHER_CITY_LAT || 16.0544),
    longitude: Number(process.env.WEATHER_CITY_LON || 108.2022),
  };
}

const WMO_DESCRIPTION_VI: Record<number, string> = {
  0: 'Trời quang',
  1: 'Ít mây',
  2: 'Có mây rải rác',
  3: 'Nhiều mây',
  45: 'Có sương mù',
  48: 'Sương mù dày',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn vừa',
  55: 'Mưa phùn dày',
  56: 'Mưa phùn lạnh nhẹ',
  57: 'Mưa phùn lạnh dày',
  61: 'Mưa nhỏ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  66: 'Mưa lạnh nhẹ',
  67: 'Mưa lạnh to',
  71: 'Tuyết nhẹ',
  73: 'Tuyết vừa',
  75: 'Tuyết dày',
  77: 'Hạt băng',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào rất to',
  85: 'Mưa tuyết nhẹ',
  86: 'Mưa tuyết to',
  95: 'Có giông',
  96: 'Giông kèm mưa đá nhẹ',
  99: 'Giông kèm mưa đá lớn',
};

export function describeWmoCode(code: number | null): string {
  if (code === null || !Number.isFinite(code)) return 'Chưa có mô tả thời tiết';
  return WMO_DESCRIPTION_VI[code] ?? 'Thời tiết biến đổi';
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function isWithinBounds(lat: number, lon: number): boolean {
  return (
    lat >= DANANG_BOUNDS.minLat &&
    lat <= DANANG_BOUNDS.maxLat &&
    lon >= DANANG_BOUNDS.minLon &&
    lon <= DANANG_BOUNDS.maxLon
  );
}

interface PlaceCoordRow {
  place_id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

async function resolvePlaceLocation(input: {
  placeId?: number;
  place?: string;
  lat?: number;
  lon?: number;
}): Promise<WeatherLocationInfo> {
  const city = getCityDefaultConfig();

  if (input.lat !== undefined && input.lon !== undefined) {
    return {
      name: input.place || `Tọa độ (${input.lat.toFixed(4)}, ${input.lon.toFixed(4)})`,
      areaLabel: input.place ? `${input.place} (Tọa độ chỉ định)` : 'Khu vực Đà Nẵng (Tọa độ chỉ định)',
      scope: 'PLACE',
      placeId: null,
      latitude: Number(input.lat.toFixed(4)),
      longitude: Number(input.lon.toFixed(4)),
      resolvedFrom: 'COORDINATES',
    };
  }

  if (input.placeId !== undefined || input.place) {
    try {
      const pool = getPool();
      const req = pool.request();
      let row: PlaceCoordRow | undefined;

      if (input.placeId !== undefined) {
        const res = await req
          .input('placeId', sql.Int, input.placeId)
          .query<PlaceCoordRow>(`
            SELECT TOP 1 place_id, name, address, CAST(latitude AS FLOAT) AS latitude, CAST(longitude AS FLOAT) AS longitude
            FROM dbo.places
            WHERE place_id = @placeId AND status = 'ACTIVE'
          `);
        row = res.recordset[0];
      } else if (input.place) {
        const cleanPlace = input.place.trim();
        const res = await req
          .input('kw', sql.NVarChar(150), `%${cleanPlace}%`)
          .query<PlaceCoordRow>(`
            SELECT TOP 1 place_id, name, address, CAST(latitude AS FLOAT) AS latitude, CAST(longitude AS FLOAT) AS longitude
            FROM dbo.places
            WHERE status = 'ACTIVE' AND (name LIKE @kw OR address LIKE @kw)
            ORDER BY CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 0 ELSE 1 END, avg_rating DESC
          `);
        row = res.recordset[0];
      }

      if (row && row.latitude !== null && row.longitude !== null && isWithinBounds(row.latitude, row.longitude)) {
        return {
          name: row.name,
          areaLabel: `${row.name} (Tọa độ đã xác minh trong danh mục)`,
          scope: 'PLACE',
          placeId: row.place_id,
          latitude: Number(row.latitude.toFixed(4)),
          longitude: Number(row.longitude.toFixed(4)),
          resolvedFrom: 'CATALOG',
        };
      }

      // Địa điểm có trong yêu cầu nhưng chưa có tọa độ trong danh mục -> fallback cấp thành phố & nói rõ phạm vi
      if (input.place) {
        return {
          name: city.name,
          areaLabel: `Đà Nẵng — Cấp thành phố (chưa có tọa độ riêng cho "${input.place}")`,
          scope: 'CITY',
          placeId: row?.place_id ?? null,
          latitude: city.latitude,
          longitude: city.longitude,
          resolvedFrom: 'CITY_DEFAULT',
        };
      }
    } catch {
      // Nếu DB chưa sẵn sàng (VD trong unit test không mock DB) -> fallback mốc thành phố
      if (input.place) {
        return {
          name: city.name,
          areaLabel: `Đà Nẵng — Cấp thành phố (chưa tra được tọa độ cho "${input.place}")`,
          scope: 'CITY',
          placeId: null,
          latitude: city.latitude,
          longitude: city.longitude,
          resolvedFrom: 'CITY_DEFAULT',
        };
      }
    }
  }

  return {
    name: city.name,
    areaLabel: city.areaLabel,
    scope: 'CITY',
    placeId: null,
    latitude: city.latitude,
    longitude: city.longitude,
    resolvedFrom: 'CITY_DEFAULT',
  };
}

interface OpenMeteoPayload {
  current?: {
    time?: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    relative_humidity_2m?: number | null;
    precipitation?: number | null;
    weather_code?: number | null;
    wind_speed_10m?: number | null;
    wind_gusts_10m?: number | null;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: Array<number | null>;
    precipitation_probability?: Array<number | null>;
    precipitation?: Array<number | null>;
    weather_code?: Array<number | null>;
    wind_speed_10m?: Array<number | null>;
  };
  daily?: {
    time?: string[];
    weather_code?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
    precipitation_probability_max?: Array<number | null>;
    wind_speed_10m_max?: Array<number | null>;
  };
  updated_at?: string;
}

function buildOpenMeteoUrl(lat: number, lon: number, days: number): string {
  const baseUrl = process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast';
  const url = new URL(baseUrl);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', VIETNAM_TIMEZONE);
  url.searchParams.set('forecast_days', String(days));
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m'
  );
  url.searchParams.set(
    'hourly',
    'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m'
  );
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max'
  );
  if (process.env.WEATHER_API_KEY) {
    url.searchParams.set('apikey', process.env.WEATHER_API_KEY);
  }
  return url.toString();
}

function normalizeOpenMeteoPayload(
  raw: OpenMeteoPayload,
  location: WeatherLocationInfo,
  options: {
    requestedDate: string | null;
    startDate: string;
    endDate: string;
    days: number;
    fetchedAt: string;
    now: Date;
  }
): NormalizedWeatherResponse {
  const hourlyTimes = raw.hourly?.time ?? [];
  const hourly: WeatherHourlyItem[] = hourlyTimes.map((isoTime, idx) => {
    const [datePart = '', timePart = '00:00'] = isoTime.split('T');
    const hour = Number(timePart.slice(0, 2)) || 0;
    const weatherCode = toNullableNumber(raw.hourly?.weather_code?.[idx]);
    return {
      time: isoTime,
      date: datePart,
      hour,
      hourLabel: `${String(hour).padStart(2, '0')}:00`,
      period: hourToPeriod(hour),
      temperature: toNullableNumber(raw.hourly?.temperature_2m?.[idx]),
      weatherCode,
      description: describeWmoCode(weatherCode),
      precipitationProbability: toNullableNumber(raw.hourly?.precipitation_probability?.[idx]),
      precipitation: toNullableNumber(raw.hourly?.precipitation?.[idx]),
      windSpeed: toNullableNumber(raw.hourly?.wind_speed_10m?.[idx]),
    };
  });

  const dailyTimes = raw.daily?.time ?? [];
  const daily: WeatherDailyItem[] = dailyTimes.map((dateStr, idx) => {
    const weatherCode = toNullableNumber(raw.daily?.weather_code?.[idx]);
    return {
      date: dateStr,
      dayLabel: formatDayLabelVN(dateStr, options.now),
      weatherCode,
      description: describeWmoCode(weatherCode),
      tempMin: toNullableNumber(raw.daily?.temperature_2m_min?.[idx]),
      tempMax: toNullableNumber(raw.daily?.temperature_2m_max?.[idx]),
      precipitationProbabilityMax: toNullableNumber(raw.daily?.precipitation_probability_max?.[idx]),
      precipitationSum: toNullableNumber(raw.daily?.precipitation_sum?.[idx]),
      windSpeedMax: toNullableNumber(raw.daily?.wind_speed_10m_max?.[idx]),
    };
  });

  let current: WeatherCurrent | null = null;
  if (raw.current && typeof raw.current.time === 'string') {
    const code = toNullableNumber(raw.current.weather_code);
    const matchingHourly = hourly.find((h) => h.time === raw.current?.time) ?? null;
    current = {
      time: raw.current.time,
      temperature: toNullableNumber(raw.current.temperature_2m),
      apparentTemperature: toNullableNumber(raw.current.apparent_temperature),
      weatherCode: code,
      description: describeWmoCode(code),
      precipitationProbability: matchingHourly?.precipitationProbability ?? null,
      precipitation: toNullableNumber(raw.current.precipitation),
      windSpeed: toNullableNumber(raw.current.wind_speed_10m),
      windGusts: toNullableNumber(raw.current.wind_gusts_10m),
      humidity: toNullableNumber(raw.current.relative_humidity_2m),
    };
  }

  return {
    location,
    timezone: VIETNAM_TIMEZONE,
    requestedDate: options.requestedDate,
    forecastRange: {
      startDate: options.startDate,
      endDate: options.endDate,
      days: options.days,
    },
    fetchedAt: options.fetchedAt,
    providerUpdatedAt: typeof raw.updated_at === 'string' ? raw.updated_at : null,
    stale: false,
    staleReason: null,
    source: { ...OPEN_METEO_SOURCE },
    current,
    hourly,
    daily,
    alerts: {
      state: 'UNAVAILABLE',
      scope: 'Việt Nam / Đà Nẵng',
      message:
        'Nguồn Open-Meteo không cung cấp dữ liệu cảnh báo thiên tai chính thức tại Việt Nam. Vui lòng theo dõi Trung tâm Dự báo Khí tượng Thủy văn Quốc gia (nchmf.gov.vn) để cập nhật cảnh báo bão, lũ, giông lốc.',
      source: 'Open-Meteo (không hỗ trợ cảnh báo chính thức tại Việt Nam)',
      items: [],
    },
    marineAvailable: false,
  };
}

export async function getWeatherForecast(
  query: Partial<WeatherQueryInput> = {},
  options: {
    fetcher?: WeatherFetcher;
    now?: Date;
  } = {}
): Promise<NormalizedWeatherResponse> {
  const now = options.now ?? new Date();
  const todayVN = getVietnamToday(now);
  const fetcher: WeatherFetcher = options.fetcher ?? ((url, init) => fetch(url, init));

  let days = query.days ?? DEFAULT_FORECAST_DAYS;
  let requestedDate: string | null = query.date ?? null;

  if (requestedDate) {
    const diff = diffDaysVN(todayVN, requestedDate);
    if (diff < 0) {
      throw new AuthError(400, `Ngày ${requestedDate} đã qua; chỉ hỗ trợ dự báo từ hôm nay (${todayVN}).`);
    }
    if (diff >= MAX_FORECAST_DAYS) {
      throw new AuthError(400, `Chỉ hỗ trợ dự báo tối đa ${MAX_FORECAST_DAYS} ngày kể từ hôm nay (${todayVN}).`);
    }
    days = Math.min(MAX_FORECAST_DAYS, Math.max(days, diff + 1));
  }

  const location = await resolvePlaceLocation({
    placeId: query.placeId,
    place: query.place,
    lat: query.lat,
    lon: query.lon,
  });

  const startDate = todayVN;
  const endDate = addDaysVN(todayVN, days - 1);
  const cacheKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)},${days}`;
  const nowMs = now.getTime();
  const cached = weatherCache.get(cacheKey);

  if (cached && nowMs - cached.storedAtMs <= CACHE_TTL_MS) {
    return {
      ...cached.data,
      location,
      requestedDate,
    };
  }

  const url = buildOpenMeteoUrl(location.latitude, location.longitude, days);

  try {
    const response = await fetcher(url, {
      method: 'GET',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    });

    if (response.status === 429) {
      throw new AuthError(429, 'Nguồn dự báo thời tiết đang bị giới hạn tần suất gọi. Vui lòng thử lại sau ít phút.');
    }
    if (!response.ok) {
      throw new AuthError(502, `Nguồn thời tiết phản hồi lỗi HTTP ${response.status}.`);
    }

    const raw = (await response.json()) as OpenMeteoPayload;
    if (!raw || (!raw.hourly && !raw.daily && !raw.current)) {
      throw new AuthError(502, 'Nguồn thời tiết trả về dữ liệu không đầy đủ.');
    }

    const fetchedAt = now.toISOString();
    const normalized = normalizeOpenMeteoPayload(raw, location, {
      requestedDate,
      startDate,
      endDate,
      days,
      fetchedAt,
      now,
    });

    weatherCache.set(cacheKey, { data: normalized, storedAtMs: nowMs });
    return normalized;
  } catch (err) {
    // Nếu còn cache cũ trong hạn tối đa -> trả stale cache kèm cảnh báo rõ ràng
    if (cached && nowMs - cached.storedAtMs <= STALE_MAX_MS) {
      return {
        ...cached.data,
        location,
        requestedDate,
        stale: true,
        staleReason:
          err instanceof Error && err.name === 'TimeoutError'
            ? 'Kết nối nguồn thời tiết quá thời gian chờ; đang hiển thị dữ liệu đã lưu tạm.'
            : 'Nguồn thời tiết tạm thời gián đoạn; đang hiển thị dữ liệu đã lưu tạm.',
      };
    }

    if (err instanceof AuthError) throw err;
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new AuthError(504, 'Kết nối tới nguồn dự báo thời tiết quá thời gian chờ. Vui lòng thử lại.');
    }
    throw new AuthError(503, 'Không thể kết nối tới nguồn dự báo thời tiết lúc này. Vui lòng thử lại sau.');
  }
}

export async function listWeatherPresets(): Promise<WeatherPlacePreset[]> {
  const city = getCityDefaultConfig();
  const presets: WeatherPlacePreset[] = [
    {
      placeId: null,
      name: city.name,
      areaLabel: city.areaLabel,
      scope: 'CITY',
      latitude: city.latitude,
      longitude: city.longitude,
    },
  ];

  try {
    const rows = await getPool().request().query<PlaceCoordRow>(`
      SELECT TOP 6 place_id, name, address, CAST(latitude AS FLOAT) AS latitude, CAST(longitude AS FLOAT) AS longitude
      FROM dbo.places
      WHERE status = 'ACTIVE'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (
          name LIKE N'%Bà Nà%'
          OR name LIKE N'%Mỹ Khê%'
          OR name LIKE N'%Sơn Trà%'
          OR name LIKE N'%Ngũ Hành Sơn%'
          OR name LIKE N'%Cầu Rồng%'
        )
      ORDER BY avg_rating DESC, review_count DESC
    `);

    for (const row of rows.recordset) {
      if (row.latitude !== null && row.longitude !== null && isWithinBounds(row.latitude, row.longitude)) {
        presets.push({
          placeId: row.place_id,
          name: row.name,
          areaLabel: `${row.name} (Tọa độ đã xác minh)`,
          scope: 'PLACE',
          latitude: Number(row.latitude.toFixed(4)),
          longitude: Number(row.longitude.toFixed(4)),
        });
      }
    }
  } catch {
    // Trả tối thiểu mốc thành phố nếu DB không khả dụng
  }

  return presets;
}
