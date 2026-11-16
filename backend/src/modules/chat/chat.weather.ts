import { normalize } from '../ai/ai.rules';
import {
  getWeatherForecast,
  type WeatherFetcher,
} from '../weather/weather.service';
import {
  addDaysVN,
  formatDateVi,
  getVietnamToday,
  parseWeatherDateQuery,
  periodLabelVi,
} from '../weather/weather.timezone';
import type {
  DayPeriod,
  NormalizedWeatherResponse,
  WeatherDailyItem,
  WeatherHourlyItem,
} from '../weather/weather.types';
import { searchPlacesForChat, type PlaceSearchRow } from './chat.repository';
import { editTravelPlan, withPlanItemIds } from './chat.plan-edit';
import type { ChatMessageDto, ChatPlaceCard, ChatTravelPlan } from './chat.types';
import type { AdvisorState } from './chat.advisor-state';

export type WeatherContextState = NonNullable<AdvisorState['weatherContext']>;

export interface WeatherChatResult {
  content: string;
  intent: 'WEATHER' | 'MODIFY_ITINERARY';
  places?: ChatPlaceCard[];
  travelPlan?: ChatTravelPlan;
  rescueChange?: { command: string; placeIds: number[] };
  quickReplies: string[];
  actionLink?: ChatMessageDto['actionLink'];
  warnings: string[];
  sources: NonNullable<ChatMessageDto['sources']>;
  nextWeatherContext?: WeatherContextState;
  /** Khi người dùng hỏi cả thời tiết lẫn quán ăn/tham quan, trả notice để ghép vào kết quả tư vấn địa điểm */
  multiNeedPrefix?: string;
}

const INDOOR_KEYWORDS = [
  'bao tang',
  'chua',
  'cho han',
  'cho con',
  'vincom',
  'lotte',
  'trung tam thuong mai',
  'cafe',
  'ca phe',
  'nha hang',
  'am thuc',
  'spa',
  'trong nha',
  'helios',
  'trien lam',
];

const OUTDOOR_KEYWORDS = [
  'bai bien',
  'my khe',
  'ba na',
  'son tra',
  'ngu hanh son',
  'cau rong',
  'ban dao',
  'cong vien',
  'bien',
  'nui',
];

const NAMED_PLACE_PATTERNS: Array<{ pattern: RegExp; query: string }> = [
  { pattern: /\b(ba na|ba na hills)\b/, query: 'Bà Nà' },
  { pattern: /\b(my khe)\b/, query: 'Mỹ Khê' },
  { pattern: /\b(son tra|linh ung)\b/, query: 'Sơn Trà' },
  { pattern: /\b(ngu hanh son)\b/, query: 'Ngũ Hành Sơn' },
  { pattern: /\b(cau rong)\b/, query: 'Cầu Rồng' },
  { pattern: /\b(hoi an)\b/, query: 'Hội An' },
];

function extractPlaceQuery(normalizedText: string): string | undefined {
  for (const item of NAMED_PLACE_PATTERNS) {
    if (item.pattern.test(normalizedText)) return item.query;
  }
  return undefined;
}

function extractPeriod(normalizedText: string): DayPeriod | undefined {
  if (/\b(buoi sang|sang nay|sang mai)\b/.test(normalizedText)) return 'MORNING';
  if (/\b(buoi trua|trua nay|trua mai)\b/.test(normalizedText)) return 'NOON';
  if (/\b(buoi chieu|chieu nay|chieu mai)\b/.test(normalizedText)) return 'AFTERNOON';
  if (/\b(buoi toi|toi nay|toi mai|dem)\b/.test(normalizedText)) return 'EVENING';
  return undefined;
}

export function isWeatherQuestion(rawMsg: string): boolean {
  const n = normalize(rawMsg);
  return /\b(thoi tiet|du bao|nhiet do|co mua|mua khong|troi mua|mua lon|mua rao|gio manh|canh bao.*(?:thoi tiet|bao|lu|nguy hiem)|di bien.*(?:khong|duoc khong|phu hop)|phu hop.*di bien|thang nao.*(?:da nang|du lich|dep|di)|di da nang.*thang nao|mua mua|mua nang|troi.*nong|qua nong|mang theo.*gi|mac gi|chuan bi gi|doi lich.*thoi tiet|thay doi lich.*thoi tiet|sua lich.*thoi tiet)\b/.test(
    n
  );
}

function isSeasonQuestion(n: string): boolean {
  return /\b(thang nao|mua nao).*\b(da nang|du lich|dep|di)|\bdi da nang.*thang nao\b/.test(n);
}

function isRainySeasonOrHotHypothetical(n: string): 'RAINY' | 'HOT' | null {
  if (/\b(mua mua|khi troi mua|neu troi mua|troi mua.*di dau|ba na.*troi mua|troi mua.*ba na)\b/.test(n)) {
    return 'RAINY';
  }
  if (/\b(qua nong|troi nong|nang nong|nang gat)\b/.test(n)) {
    return 'HOT';
  }
  return null;
}

function isBeachQuestion(n: string): boolean {
  return /\b(di bien|tam bien)\b/.test(n);
}

function isPackingQuestion(n: string): boolean {
  return /\b(mang theo|mac gi|chuan bi gi)\b/.test(n);
}

function isAlertQuestion(n: string): boolean {
  return /\b(canh bao|nguy hiem|bao lu|ap thap)\b/.test(n);
}

function isScheduleWeatherChange(n: string): boolean {
  return /\b(thay doi|doi|sua|chinh|cap nhat).*(lich trinh|lich|ke hoach).*thoi tiet|\btheo thoi tiet\b/.test(n);
}

function formatHourSummary(items: WeatherHourlyItem[], period?: DayPeriod): string {
  const filtered = period ? items.filter((h) => h.period === period) : items;
  const pick = (filtered.length ? filtered : items).filter((_, idx) => idx % 3 === 0).slice(0, 4);
  if (!pick.length) return 'Chưa có dữ liệu dự báo theo giờ.';
  return pick
    .map((h) => {
      const temp = h.temperature !== null ? `${Math.round(h.temperature)}°C` : 'chưa rõ °C';
      const rain = h.precipitationProbability !== null ? `mưa ${h.precipitationProbability}%` : 'chưa rõ % mưa';
      const wind = h.windSpeed !== null ? `gió ${Math.round(h.windSpeed)} km/h` : 'chưa rõ gió';
      return `• ${h.hourLabel} (${periodLabelVi(h.period)}): ${h.description}, ${temp}, ${rain}, ${wind}`;
    })
    .join('\n');
}

function formatDailySummary(day: WeatherDailyItem): string {
  const minT = day.tempMin !== null ? `${Math.round(day.tempMin)}°C` : '?';
  const maxT = day.tempMax !== null ? `${Math.round(day.tempMax)}°C` : '?';
  const rainProb = day.precipitationProbabilityMax !== null ? `${day.precipitationProbabilityMax}%` : 'chưa rõ';
  const rainSum = day.precipitationSum !== null ? `${day.precipitationSum} mm` : 'chưa rõ';
  const wind = day.windSpeedMax !== null ? `${Math.round(day.windSpeedMax)} km/h` : 'chưa rõ';
  return `${day.dayLabel}: ${day.description}, nhiệt độ ${minT}–${maxT}, xác suất mưa tối đa ${rainProb} (tổng lượng mưa ~${rainSum}), gió tối đa ${wind}.`;
}

function toChatCard(row: PlaceSearchRow): ChatPlaceCard {
  return {
    placeId: row.placeId,
    name: row.name,
    placeType: row.placeType,
    address: row.address ?? 'Đà Nẵng',
    districtName: row.districtName,
    rating: row.rating,
    reviewCount: row.reviewCount,
    imageUrl: row.imageUrl ?? null,
    priceText: row.priceText ?? null,
    detailUrl: row.detailUrl,
  };
}

async function fetchIndoorSuggestions(limit = 4): Promise<PlaceSearchRow[]> {
  try {
    const rows = await searchPlacesForChat({ limit: 120 });
    const indoor = rows.filter((r) => {
      const hay = normalize(`${r.name} ${r.description ?? ''}`);
      return INDOOR_KEYWORDS.some((kw) => hay.includes(kw)) && !OUTDOOR_KEYWORDS.some((kw) => hay.includes(kw));
    });
    if (indoor.length >= limit) return indoor.slice(0, limit);
    const restaurants = rows.filter((r) => r.placeType === 'RESTAURANT' && !indoor.some((i) => i.placeId === r.placeId));
    return [...indoor, ...restaurants].slice(0, limit);
  } catch {
    return [];
  }
}

function formatPlaceLine(row: PlaceSearchRow): string {
  const price =
    row.priceMin !== null && row.priceMin === 0
      ? 'Miễn phí'
      : row.priceMin !== null
      ? `từ ${row.priceMin.toLocaleString('vi-VN')}đ`
      : row.priceText ?? 'chưa có giá';
  return `• ${row.name} (${row.address ?? 'Đà Nẵng'} — ${price})`;
}

function buildSourceLine(weather: NormalizedWeatherResponse): string {
  const staleNote = weather.stale
    ? ` ⚠️ Đang dùng dữ liệu cache cũ (lấy lúc ${new Date(weather.fetchedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}).`
    : '';
  return `📍 Khu vực: ${weather.location.areaLabel} | Nguồn: ${weather.source.attribution} (lấy lúc ${new Date(weather.fetchedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}).${staleNote}`;
}

export async function handleWeatherChat(input: {
  rawMsg: string;
  hasOtherNeeds: boolean;
  advisorState?: AdvisorState;
  latestTravelPlan?: ChatTravelPlan;
  constraints: { dietaryRestricted?: boolean; excludedIds?: number[]; excludedNames?: string[] };
  now?: Date;
  weatherFetcher?: WeatherFetcher;
}): Promise<WeatherChatResult | null> {
  const n = normalize(input.rawMsg);
  if (!isWeatherQuestion(input.rawMsg)) return null;

  const now = input.now ?? new Date();
  const warnings: string[] = [];

  // 1. Câu hỏi thay đổi lịch trình theo thời tiết
  if (isScheduleWeatherChange(n)) {
    if (!input.latestTravelPlan) {
      return {
        content:
          'Hội thoại này chưa có lịch trình để điều chỉnh theo thời tiết. Bạn hãy cho Gô biết số ngày, số khách và ngân sách để lập lịch trước, hoặc mở công cụ Lịch trình.',
        intent: 'MODIFY_ITINERARY',
        quickReplies: ['Lên lịch 2 ngày Đà Nẵng cho 2 người ngân sách 3 triệu'],
        actionLink: { text: 'Mở lịch trình của bạn', url: '/lich-trinh' },
        warnings,
        sources: [],
      };
    }

    const today = getVietnamToday(now);
    const startDate = input.latestTravelPlan.startDate;
    if (!startDate || startDate < today) {
      return {
        content: 'Bạn khởi hành ngày nào? Gô cần ngày đi để đối chiếu đúng dự báo trước khi đổi lịch.',
        intent: 'MODIFY_ITINERARY',
        travelPlan: input.latestTravelPlan,
        quickReplies: [],
        warnings,
        sources: [],
      };
    }
    let weather: NormalizedWeatherResponse | null = null;
    try {
      weather = await getWeatherForecast({ days: 7 }, { now, fetcher: input.weatherFetcher });
      if (weather.stale && weather.staleReason) warnings.push(weather.staleReason);
    } catch {
      return {
        content:
          'Gô chưa lấy được dữ liệu dự báo thời tiết trực tiếp lúc này nên chưa thể tự động đổi lịch trình theo thời tiết. Bạn có thể kiểm tra trang Thời tiết hoặc nêu cụ thể mục muốn đổi sang điểm trong nhà.',
        intent: 'MODIFY_ITINERARY',
        travelPlan: input.latestTravelPlan,
        quickReplies: ['Mở trang Thời tiết Đà Nẵng'],
        actionLink: { text: 'Xem dự báo thời tiết', url: '/thoi-tiet' },
        warnings: ['Nguồn thời tiết tạm thời không khả dụng.'],
        sources: [],
      };
    }

    const indoorPlaces = await fetchIndoorSuggestions(5);

    // Tìm mục ngoài trời đầu tiên trong lịch trình và kiểm tra dự báo ngày tương ứng
    const allItems = withPlanItemIds(input.latestTravelPlan).days.flatMap((d) =>
      d.periods.flatMap((p) => p.items.map((item) => ({ day: d.day, periodTitle: p.label, item })))
    );
    const outdoorEntry = allItems.find((entry) => {
      const name = normalize(entry.item.place?.name ?? entry.item.title);
      const date = addDaysVN(startDate, entry.day - 1);
      const forecast = weather.daily.find((day) => day.date === date);
      return !weather.stale && (forecast?.precipitationProbabilityMax ?? 0) >= 60
        && OUTDOOR_KEYWORDS.some((kw) => name.includes(kw));
    });

    if (outdoorEntry?.item.place && indoorPlaces.length > 0) {
      const targetDate = addDaysVN(startDate, outdoorEntry.day - 1);
      const dayForecast = weather.daily.find((d) => d.date === targetDate);
      const replacement = indoorPlaces.find((p) => p.placeId !== outdoorEntry.item.place?.placeId) ?? indoorPlaces[0]!;
      const editCommand = `thay ${outdoorEntry.item.id} bang ${replacement.name}`;
      const catalog = [replacement];
      const edited = editTravelPlan(input.latestTravelPlan, editCommand, catalog, input.constraints);
      const changed = Boolean(edited.plan && edited.plan.revision !== input.latestTravelPlan.revision);

      const reasonWeather = dayForecast
        ? `${dayForecast.dayLabel}: ${dayForecast.description}, xác suất mưa tối đa ${dayForecast.precipitationProbabilityMax ?? '?'}%, nhiệt độ ${dayForecast.tempMin ?? '?'}–${dayForecast.tempMax ?? '?'}°C`
        : 'dự báo thời tiết trong ngày';

      if (changed && edited.plan) {
        return {
          content: `Dựa trên dự báo (${reasonWeather}), Gô đề xuất thay **${outdoorEntry.item.place.name}** (Ngày ${outdoorEntry.day} - ${outdoorEntry.periodTitle}) bằng điểm trong nhà **${replacement.name}** và giữ các mục khác. Tiền vé sau thay đổi: ${edited.plan.costs.tickets?.toLocaleString("vi-VN") ?? "chưa xác định"}${edited.plan.costs.tickets == null ? "" : "đ"}. Bạn muốn áp dụng không?\n\n${buildSourceLine(weather)}`,
          intent: 'MODIFY_ITINERARY',
          rescueChange: { command: editCommand, placeIds: [replacement.placeId] },
          quickReplies: ["Áp dụng phương án cứu lịch"],
          actionLink: { text: 'Mở công cụ tạo và lưu lịch trình', url: '/lich-trinh/tao-moi' },
          warnings,
          sources: [{ url: weather.source.url, checkedOn: weather.fetchedAt.slice(0, 10), label: weather.location.name, scope: weather.location.areaLabel }],
        };
      }
    }

    return {
      content: `Gô giữ nguyên lịch. Gô chỉ tự đổi điểm ngoài trời khi có dự báo còn hiệu lực cho đúng ngày với xác suất mưa tối đa từ 60% và có điểm thay phù hợp.\n\n${buildSourceLine(weather)}`,
      intent: 'MODIFY_ITINERARY',
      travelPlan: input.latestTravelPlan,
      quickReplies: indoorPlaces.slice(0, 2).map((p) => `Đổi sang ${p.name}`),
      actionLink: { text: 'Mở lịch trình', url: '/lich-trinh' },
      warnings,
      sources: [{ url: weather.source.url, checkedOn: weather.fetchedAt.slice(0, 10), label: weather.location.name, scope: weather.location.areaLabel }],
    };
  }

  // 2. Câu hỏi theo mùa / tháng nào đẹp nhất (chưa có dữ liệu khí hậu theo tháng có nguồn)
  if (isSeasonQuestion(n)) {
    return {
      content:
        'Gô chưa tích hợp bộ dữ liệu khí hậu trung bình theo từng tháng có nguồn đối chiếu nên chưa thể xếp hạng tháng nào đẹp nhất ở Đà Nẵng. Bạn dự định đi vào thời điểm nào và ưu tiên **tắm biển**, **tham quan** hay **nghỉ dưỡng** để Gô tư vấn lịch phù hợp hơn?',
      intent: 'WEATHER',
      quickReplies: ['Tôi ưu tiên tắm biển', 'Tôi thích tham quan & ẩm thực', 'Xem dự báo 7 ngày tới'],
      actionLink: { text: 'Xem thời tiết Đà Nẵng hiện tại', url: '/thoi-tiet' },
      warnings,
      sources: [],
    };
  }

  // 3. Phân tích ngày, khung giờ, địa điểm (kế thừa từ lượt trước cho câu "Tôi nên mang theo những gì?")
  const parsedDate = parseWeatherDateQuery(n, now);
  if (parsedDate.outOfRangeReason) {
    return {
      content: `${parsedDate.outOfRangeReason} Bạn có thể chọn ngày gần hơn hoặc xem dự báo 7 ngày tới trên trang Thời tiết.`,
      intent: 'WEATHER',
      quickReplies: ['Hôm nay Đà Nẵng có mưa không?', 'Thời tiết cuối tuần như thế nào?'],
      actionLink: { text: 'Mở trang Thời tiết', url: '/thoi-tiet' },
      warnings,
      sources: [],
    };
  }

  const explicitPlace = extractPlaceQuery(n);
  const explicitPeriod = extractPeriod(n);
  const prevCtx = input.advisorState?.weatherContext;

  const isPacking = isPackingQuestion(n);
  const hasExplicitDate = Boolean(parsedDate.label);
  const targetDate = hasExplicitDate ? parsedDate.date! : isPacking && prevCtx?.date ? prevCtx.date : parsedDate.date!;
  const targetDates = hasExplicitDate ? parsedDate.dates : isPacking && prevCtx?.dates?.length ? prevCtx.dates : parsedDate.dates;
  const targetPlace = explicitPlace ?? (isPacking ? prevCtx?.placeName : undefined);
  const targetPeriod = explicitPeriod ?? (isPacking ? prevCtx?.period : undefined);

  // Nếu hỏi "Tôi nên mang theo những gì?" mà chưa có ngày/địa điểm ở câu này lẫn lượt trước
  if (isPacking && !hasExplicitDate && !prevCtx?.date && !explicitPlace && !prevCtx?.placeName) {
    return {
      content:
        'Bạn dự định đi Đà Nẵng vào ngày nào và đến khu vực nào (biển Mỹ Khê, Bà Nà Hills hay trung tâm thành phố)? Nếu chuẩn bị chung theo điều kiện giả định: trời nắng cần mũ, kem chống nắng, nước uống; nếu có mưa hoặc lên Bà Nà Hills buổi chiều tối, bạn nên mang thêm áo mưa gọn nhẹ và áo khoác mỏng.',
      intent: 'WEATHER',
      quickReplies: ['Hôm nay Đà Nẵng có mưa không?', 'Ngày mai đi Bà Nà Hills mang gì?'],
      actionLink: { text: 'Xem thời tiết Đà Nẵng', url: '/thoi-tiet' },
      warnings,
      sources: [],
    };
  }

  // 4. Gọi cùng lớp tích hợp thời tiết ở backend
  let weather: NormalizedWeatherResponse;
  try {
    weather = await getWeatherForecast(
      {
        place: targetPlace,
        date: targetDates[targetDates.length - 1] ?? targetDate,
        days: 7,
      },
      { now, fetcher: input.weatherFetcher }
    );
    if (weather.stale && weather.staleReason) warnings.push(weather.staleReason);
  } catch (err) {
    const fallbackNotice =
      'Gô chưa lấy được dữ liệu thời tiết trực tiếp từ nhà cung cấp lúc này nên chưa thể xác nhận dự báo thực tế. Bạn có thể thử lại sau hoặc kiểm tra trang Thời tiết.';
    if (input.hasOtherNeeds) {
      return {
        content: fallbackNotice,
        multiNeedPrefix: fallbackNotice,
        intent: 'WEATHER',
        quickReplies: [],
        warnings: [err instanceof Error ? err.message : fallbackNotice],
        sources: [],
      };
    }
    const indoorFallback = isRainySeasonOrHotHypothetical(n) ? await fetchIndoorSuggestions(3) : [];
    const indoorText = indoorFallback.length
      ? `\n\nTuy nhiên, bạn có thể tham khảo các điểm trong nhà sau để dự phòng:\n${indoorFallback.map(formatPlaceLine).join('\n')}`
      : '';
    return {
      content: `${fallbackNotice}${indoorText}`,
      intent: 'WEATHER',
      places: indoorFallback.map(toChatCard),
      quickReplies: ['Mở trang Thời tiết', 'Gợi ý địa điểm trong nhà'],
      actionLink: { text: 'Mở trang Thời tiết', url: '/thoi-tiet' },
      warnings: [err instanceof Error ? err.message : fallbackNotice],
      sources: [],
    };
  }

  const nextWeatherContext: WeatherContextState = {
    date: targetDate,
    dates: targetDates,
    label: parsedDate.label ?? prevCtx?.label ?? formatDateVi(targetDate),
    ...(targetPlace ? { placeName: targetPlace } : {}),
    ...(targetPeriod ? { period: targetPeriod } : {}),
  };

  const sourcesMeta = [
    {
      url: weather.source.url,
      checkedOn: weather.fetchedAt.slice(0, 10),
      label: weather.location.name,
      scope: weather.location.areaLabel,
    },
  ];

  // 5. Câu hỏi cảnh báo thời tiết nguy hiểm
  if (isAlertQuestion(n)) {
    const alertText =
      weather.alerts.state === 'ACTIVE'
        ? `⚠️ Hiện có ${weather.alerts.items.length} cảnh báo thời tiết nguy hiểm tại ${weather.alerts.scope}:\n${weather.alerts.items
            .map((a) => `• ${a.event} (${a.area}) — Hiệu lực: ${a.effectiveFrom ?? '?'} đến ${a.effectiveTo ?? '?'} | Nguồn: ${a.source}`)
            .join('\n')}`
        : weather.alerts.state === 'NONE'
        ? `Nguồn ${weather.alerts.source} xác nhận hiện không có cảnh báo thời tiết nguy hiểm nào cho ${weather.alerts.scope}.`
        : `ℹ️ Trạng thái cảnh báo: Chưa có dữ liệu cảnh báo thiên tai chính thức cho khu vực (${weather.alerts.scope}). ${weather.alerts.message}`;

    return {
      content: `${alertText}\n\n${buildSourceLine(weather)}`,
      intent: 'WEATHER',
      quickReplies: ['Hôm nay Đà Nẵng có mưa không?', 'Thời tiết cuối tuần như thế nào?'],
      actionLink: { text: 'Xem chi tiết trên trang Thời tiết', url: '/thoi-tiet' },
      warnings,
      sources: sourcesMeta,
      nextWeatherContext,
    };
  }

  // 6. Câu hỏi giả định trời mưa / mùa mưa / Bà Nà khi trời mưa / quá nóng
  const hypo = isRainySeasonOrHotHypothetical(n);
  if (hypo) {
    const indoorPlaces = await fetchIndoorSuggestions(4);
    const dayForecast = weather.daily.find((d) => d.date === targetDate) ?? weather.daily[0];
    const hourItems = weather.hourly.filter((h) => h.date === targetDate);
    const baNaNote =
      targetPlace && /ba na/i.test(targetPlace)
        ? weather.location.resolvedFrom === 'CATALOG'
          ? `Tại **${weather.location.name}** (tọa độ xác minh ${weather.location.latitude}, ${weather.location.longitude}): nếu trời mưa hoặc sương mù dày, tầm nhìn cáp treo và khu ngoài trời sẽ hạn chế; bạn nên mang áo mưa gọn, giày chống trượt và ưu tiên các khu vui chơi trong nhà tại Bà Nà hoặc phương án dự phòng trong trung tâm.`
          : `Hiện hệ thống đang dùng dự báo cấp thành phố Đà Nẵng (chưa có tọa độ riêng cho Bà Nà Hills). Khu vực núi cao thường lạnh và dễ có mưa/sương mù hơn trung tâm; bạn nên cân nhắc phương án dự phòng trong nhà.`
        : '';

    const indoorListText = indoorPlaces.length
      ? `\n\nGợi ý điểm trong nhà phù hợp từ danh mục DaNangGo:\n${indoorPlaces.map(formatPlaceLine).join('\n')}`
      : '';

    const header =
      hypo === 'RAINY'
        ? baNaNote ||
          'Khi trời mưa hoặc vào mùa mưa, bạn nên ưu tiên các điểm tham quan, mua sắm và ẩm thực trong nhà. (Lưu ý: Gô chưa có dữ liệu khí hậu tổng hợp theo mùa, dưới đây là dự báo thực tế hiện tại kèm gợi ý trong nhà).'
        : 'Khi trời quá nóng, bạn nên tránh hoạt động ngoài trời vào khung 11:00–15:00, chuyển sang sáng sớm hoặc chiều muộn và ưu tiên các điểm trong nhà có điều hòa.';

    const forecastSnippet = dayForecast ? `\n\nDự báo ${formatDailySummary(dayForecast)}\n${formatHourSummary(hourItems, targetPeriod)}` : '';

    return {
      content: `${header}${forecastSnippet}${indoorListText}\n\n${buildSourceLine(weather)}`,
      intent: 'WEATHER',
      places: indoorPlaces.map(toChatCard),
      quickReplies: ['Đổi lịch trình theo thời tiết', 'Xem dự báo theo giờ'],
      actionLink: { text: 'Xem chi tiết Thời tiết', url: '/thoi-tiet' },
      warnings,
      sources: sourcesMeta,
      nextWeatherContext,
    };
  }

  // 7. Câu hỏi đi biển ("Ngày mai có phù hợp để đi biển không?")
  if (isBeachQuestion(n)) {
    const dayForecast = weather.daily.find((d) => d.date === targetDate) ?? weather.daily[0];
    const hourItems = weather.hourly.filter((h) => h.date === targetDate);
    const rainProb = dayForecast?.precipitationProbabilityMax;
    const windMax = dayForecast?.windSpeedMax;

    const conditionAssess =
      rainProb !== null && rainProb !== undefined && rainProb >= 60
        ? 'Xác suất mưa khá cao, có thể ảnh hưởng đến việc tắm biển và vui chơi ngoài trời.'
        : windMax !== null && windMax !== undefined && windMax >= 30
        ? 'Gió khá mạnh, cần thận trọng khi ra biển.'
        : 'Mưa và gió trên đất liền ở mức tương đối thuận lợi theo dự báo.';

    const marineNotice =
      '⚠️ Lưu ý an toàn biển: Nguồn hiện tại chưa cung cấp dữ liệu sóng biển, dòng chảy xa bờ (rip current) hay thủy triều, nên Gô **không khẳng định an toàn tắm biển** chỉ dựa vào mưa hay nhiệt độ. Bạn hãy quan sát cờ cảnh báo và tuân theo hướng dẫn của lực lượng cứu hộ bãi biển.';

    const content = `${dayForecast ? formatDailySummary(dayForecast) : ''}\n${formatHourSummary(hourItems, targetPeriod)}\n\n${conditionAssess}\n${marineNotice}\n\n${buildSourceLine(weather)}`;

    return {
      content,
      intent: 'WEATHER',
      quickReplies: ['Tôi nên mang theo những gì?', 'Gợi ý điểm tham quan trong nhà'],
      actionLink: { text: 'Xem chi tiết Thời tiết', url: '/thoi-tiet' },
      warnings,
      sources: sourcesMeta,
      nextWeatherContext,
    };
  }

  // 8. Câu hỏi mang theo gì (đã có ngữ cảnh ngày/địa điểm)
  if (isPacking) {
    const dayForecast = weather.daily.find((d) => d.date === targetDate) ?? weather.daily[0];
    const rainProb = dayForecast?.precipitationProbabilityMax ?? 0;
    const tempMax = dayForecast?.tempMax ?? 0;
    const tempMin = dayForecast?.tempMin ?? 99;
    const tips: string[] = [];
    if (rainProb >= 40) tips.push('• Ô/dù gấp hoặc áo mưa gọn nhẹ, túi chống nước cho điện thoại.');
    if (tempMax >= 31) tips.push('• Kem chống nắng, mũ rộng vành, kính râm và nước uống.');
    if (tempMin <= 22 || (targetPlace && /ba na/i.test(targetPlace))) {
      tips.push('• Áo khoác mỏng giữ ấm (đặc biệt khi đi sáng sớm, tối hoặc lên Bà Nà Hills).');
    }
    if (!tips.length) tips.push('• Trang phục thoáng mát, giày đi bộ thoải mái và áo khoác mỏng dự phòng.');

    const content = `Chuẩn bị đồ cho ${nextWeatherContext.label} tại **${weather.location.name}**:\n${dayForecast ? formatDailySummary(dayForecast) : ''}\n\nGợi ý mang theo:\n${tips.join('\n')}\n\n${buildSourceLine(weather)}`;
    return {
      content,
      intent: 'WEATHER',
      quickReplies: ['Có cảnh báo thời tiết nguy hiểm không?', 'Mở trang Thời tiết'],
      actionLink: { text: 'Xem chi tiết Thời tiết', url: '/thoi-tiet' },
      warnings,
      sources: sourcesMeta,
      nextWeatherContext,
    };
  }

  // 9. Câu hỏi dự báo chung (Hôm nay, Ngày mai, Cuối tuần, Ngày cụ thể, Địa điểm cụ thể)
  const dailyLines = targetDates
    .map((d) => weather.daily.find((item) => item.date === d))
    .filter((d): d is WeatherDailyItem => Boolean(d))
    .map(formatDailySummary);

  const hourItems = weather.hourly.filter((h) => h.date === targetDate);
  const hourlyText = !parsedDate.isWeekend && hourItems.length ? `\n\nChi tiết theo khung giờ (${formatDateVi(targetDate)}):\n${formatHourSummary(hourItems, targetPeriod)}` : '';

  const content = `${dailyLines.length ? dailyLines.join('\n') : 'Chưa có dữ liệu tổng hợp theo ngày.'}${hourlyText}\n\n${buildSourceLine(weather)}`;

  return {
    content,
    ...(input.hasOtherNeeds ? { multiNeedPrefix: content } : {}),
    intent: 'WEATHER',
    quickReplies: ['Tôi nên mang theo những gì?', 'Có cảnh báo thời tiết nguy hiểm không?'],
    actionLink: { text: 'Xem chi tiết trên trang Thời tiết', url: '/thoi-tiet' },
    warnings,
    sources: sourcesMeta,
    nextWeatherContext,
  };
}
