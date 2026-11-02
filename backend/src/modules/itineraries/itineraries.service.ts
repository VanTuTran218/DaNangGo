import {
  ITINERARY_PREFERENCES,
  type GeneratedItinerary,
  type DayFoodSuggestions,
  type GenerateItineraryInput,
  type ItineraryCatalogPlace,
  type ItineraryFoodSelection,
  type ItineraryItem,
  type ItineraryPreference,
  type MealPeriod,
} from './itineraries.types';

// ---------------------------------------------------------------------------
// Hằng số cấu hình
// ---------------------------------------------------------------------------

/**
 * Các bữa ăn được hỗ trợ. SNACK không có trong DB (cột mealPeriod chỉ chứa
 * BREAKFAST | LUNCH | DINNER), nên được xử lý riêng từ các địa điểm FOOD
 * giá thấp thay vì tìm qua mealPeriod.
 */
const MEAL_PERIODS: Array<{ period: MealPeriod; time: string; label: string }> = [
  { period: 'BREAKFAST', time: '08:00', label: 'Bữa sáng' },
  { period: 'LUNCH',     time: '12:00', label: 'Bữa trưa' },
  { period: 'SNACK',     time: '15:30', label: 'Ăn vặt' },
  { period: 'DINNER',    time: '18:30', label: 'Bữa tối' },
];

/** Số gợi ý tối đa cho mỗi bữa trong mỗi ngày */
const MAX_FOOD_SUGGESTIONS_PER_PERIOD = 5;

/** Khung giờ ưu tiên cho mỗi lượt tham quan trong ngày */
const DAILY_ATTRACTION_TIMES = ['09:30', '13:30'];

/** Chi phí di chuyển mỗi người mỗi ngày (VNĐ) — ước tính nội đô */
const DAILY_TRANSPORT_BUDGET = 80_000;

/**
 * Tỷ lệ dự phòng (8% ngân sách đầu vào).
 * Dự phòng được trừ trước để tránh chi tiêu hết toàn bộ ngân sách.
 */
const CONTINGENCY_RATE = 0.08;

/**
 * Tỷ lệ ngân sách còn lại (sau chi phí cố định) dành cho giải trí.
 * 20% còn lại sau ăn uống / lưu trú / vận chuyển / dự phòng được dành cho
 * giải trí; phần còn lại (80%) dành cho tham quan.
 */
const ENTERTAINMENT_BUDGET_RATIO = 0.20;

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ItineraryCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ItineraryCatalogError';
  }
}

export class ItinerarySelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ItinerarySelectionError';
  }
}

// ---------------------------------------------------------------------------
// Catalog search
// ---------------------------------------------------------------------------

export interface CatalogSearchFilters {
  query?: string;
  kind?: ItineraryCatalogPlace['kind'];
  minPrice?: number;
  maxPrice?: number;
}

export function searchItineraryCatalog(
  catalog: ItineraryCatalogPlace[],
  filters: CatalogSearchFilters,
): { places: ItineraryCatalogPlace[]; suggestions: string[] } {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLocaleLowerCase('vi');
  const terms = filters.query?.trim().split(/\s+/).filter(Boolean).map(normalize) ?? [];
  const places = catalog.filter((place) => {
    if (filters.kind && place.kind !== filters.kind) return false;
    if (filters.minPrice !== undefined && place.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && place.price > filters.maxPrice) return false;
    if (terms.length === 0) return true;

    const searchableText = normalize(`${place.name} ${place.description} ${place.address}`);
    return terms.every((term) => searchableText.includes(term));
  });
  const suggestionPlaces = terms.length === 0
    ? []
    : places.filter((place) => terms.every((term) => normalize(place.name).includes(term)));
  const suggestions = Array.from(new Set((suggestionPlaces.length > 0 ? suggestionPlaces : places)
    .map((place) => place.name))).slice(0, 6);

  return { places, suggestions };
}

// ---------------------------------------------------------------------------
// Itinerary generation
// ---------------------------------------------------------------------------

export function generateItinerary(
  input: GenerateItineraryInput,
  catalog: ItineraryCatalogPlace[],
  selectedFood?: ItineraryFoodSelection[],
): GeneratedItinerary {
  // ── 0. Bước kiểm tra đầu vào ──────────────────────────────────────────────
  const needsStay          = input.needs.includes('accommodation');
  const needsFood          = input.needs.includes('food');
  const needsAttractions   = input.needs.includes('attractions');
  const needsEntertainment = input.needs.includes('entertainment');

  if (selectedFood && selectedFood.length > 0 && !needsFood) {
    throw new ItinerarySelectionError('Không thể chọn địa điểm ăn uống khi lịch không có nhu cầu ăn uống.');
  }

  // ── 1. Chỗ ở ──────────────────────────────────────────────────────────────
  const stays = catalog
    .filter((place) =>
      place.kind === 'STAY'
      && (!input.accType || place.accommodationType === input.accType)
      && (!input.stars   || input.accType === 'Cắm trại' || place.stars === input.stars)
      && (place.priceBasis === 'PER_PERSON' || (place.roomCapacity !== null && place.roomCapacity > 0)),
    )
    .sort((left, right) => left.price - right.price);
  const accommodation = needsStay ? stays[0] : undefined;

  const nights = Math.max(input.days - 1, 0);
  const accommodationQuantity = accommodation?.priceBasis === 'PER_ROOM'
    ? Math.ceil(input.guestCount / (accommodation.roomCapacity ?? 1))
    : input.guestCount;

  // Chi phí lưu trú = giá/đêm × số đêm × số phòng (hoặc số người)
  const accommodationCost = (accommodation?.price ?? 0) * nights * accommodationQuantity;

  // ── 2. Ăn uống ────────────────────────────────────────────────────────────
  const foodsByPeriod = new Map<MealPeriod, ItineraryCatalogPlace[]>();
  if (needsFood) {
    for (const { period } of MEAL_PERIODS) {
      if (period === 'SNACK') {
        const options = catalog
          .filter((place) => place.kind === 'FOOD' && (place.mealPeriod === 'SNACK' || place.price <= 50_000))
          .sort((left, right) => left.price - right.price);
        foodsByPeriod.set('SNACK', options.slice(0, MAX_FOOD_SUGGESTIONS_PER_PERIOD));
        continue;
      }

      const options = catalog
        .filter((place) => place.kind === 'FOOD' && place.mealPeriod === period)
        .sort((left, right) => {
          const leftPreferred  = left.preferences.some((pref) => input.prefs.includes(pref));
          const rightPreferred = right.preferences.some((pref) => input.prefs.includes(pref));
          // Bữa tối: ưu tiên nhà hàng lên đầu
          const leftRestaurant  = period === 'DINNER' && /nhà hàng/i.test(left.name);
          const rightRestaurant = period === 'DINNER' && /nhà hàng/i.test(right.name);
          return (
            Number(rightRestaurant) - Number(leftRestaurant)
            || Number(rightPreferred) - Number(leftPreferred)
            || left.price - right.price
          );
        });
      foodsByPeriod.set(period, options.slice(0, MAX_FOOD_SUGGESTIONS_PER_PERIOD));
    }
  }

  const snackOptions = foodsByPeriod.get('SNACK') ?? [];

  /**
   * Mỗi ngày chọn một món cho từng bữa (hoặc dùng lựa chọn của người dùng).
   * Nếu không có lựa chọn (selectedFood), xoay vòng theo dayIndex cho 3 bữa chính.
   */
  const foodChoices = Array.from({ length: input.days }, (_, dayIndex) =>
    MEAL_PERIODS.map(({ period }) => {
      if (!needsFood) return undefined;
      // Khi không có selectedFood (tự động tạo lịch), mặc định chỉ tạo 3 bữa chính: BREAKFAST, LUNCH, DINNER
      if (!selectedFood && period === 'SNACK') return undefined;
      const options = foodsByPeriod.get(period);
      if (!options || options.length === 0) return undefined;
      if (selectedFood) {
        const selection = selectedFood.find(
          (choice) => choice.day === dayIndex + 1 && choice.mealPeriod === period,
        );
        if (!selection) return undefined;
        const selectedPlace = options.find((place) => place.id === selection.catalogPlaceId);
        if (!selectedPlace) {
          throw new ItinerarySelectionError(
            `Địa điểm đã chọn không phù hợp với buổi ${period.toLowerCase()}.`,
          );
        }
        return selectedPlace;
      }
      return options[dayIndex % options.length];
    }),
  );

  // Chi phí ăn uống = tổng giá các bữa × số khách
  const foodCost = foodChoices
    .flat()
    .reduce((total, food) => total + (food?.price ?? 0) * input.guestCount, 0);

  // ── 3. Di chuyển ──────────────────────────────────────────────────────────
  // Chi phí di chuyển = 80.000đ × số ngày × số khách (ước tính nội đô)
  const transportCost = input.days * DAILY_TRANSPORT_BUDGET * input.guestCount;

  // ── 4. Phân bổ ngân sách ──────────────────────────────────────────────────
  /**
   * Thứ tự ưu tiên phân bổ:
   *   1. Dự phòng (8% ngân sách đầu vào) — đặt trước, không động vào
   *   2. Lưu trú  (chi phí cố định)
   *   3. Ăn uống  (chi phí cố định)
   *   4. Di chuyển (chi phí cố định)
   *   5. Phần còn lại → chia: 20% giải trí, 80% tham quan
   */
  const contingency                  = Math.ceil(input.budget * CONTINGENCY_RATE);
  const fixedCosts                   = accommodationCost + foodCost + transportCost + contingency;
  const remainingBudgetForActivities = Math.max(input.budget - fixedCosts, 0);

  // Ngân sách giải trí: 20% phần còn lại
  const entertainmentBudgetTotal = Math.floor(remainingBudgetForActivities * ENTERTAINMENT_BUDGET_RATIO);
  // Ngân sách tham quan: 80% phần còn lại
  const attractionBudgetTotal    = remainingBudgetForActivities - entertainmentBudgetTotal;

  // Ngân sách tham quan / giải trí chia đều theo ngày
  const dailyAttractionBudget    = input.days > 0 ? Math.floor(attractionBudgetTotal / input.days) : 0;
  const dailyEntertainmentBudget = input.days > 0 ? Math.floor(entertainmentBudgetTotal / input.days) : 0;

  // ── 5. Pool địa điểm ──────────────────────────────────────────────────────
  const preferredAttractions = catalog
    .filter((place) =>
      needsAttractions &&
      place.kind === 'ATTRACTION' &&
      place.preferences.some((pref) => input.prefs.includes(pref)),
    )
    .sort((left, right) => left.price - right.price);

  const otherAttractions = catalog
    .filter((place) =>
      needsAttractions &&
      place.kind === 'ATTRACTION' &&
      !preferredAttractions.includes(place),
    )
    .sort((left, right) => left.price - right.price);

  const attractionPool      = [...preferredAttractions, ...otherAttractions];
  const usedAttractionIds   = new Set<number>();

  const entertainmentPool    = catalog
    .filter((place) => needsEntertainment && place.kind === 'ENTERTAINMENT')
    .sort((left, right) => left.price - right.price);
  const usedEntertainmentIds = new Set<number>();

  // ── 6. Khởi tạo thông báo + vòng lặp tạo ngày ────────────────────────────
  const notices: string[] = [];
  // Thông báo tĩnh luôn hiển thị (đặt trước vòng lặp)
  notices.push('Đây là lịch trình tham khảo, không phải đặt chỗ. Giá có thể thay đổi; hãy kiểm tra với địa điểm trước khi đi.');
  notices.push('Dự toán có khoản dự phòng bằng 8% ngân sách đã nhập.');
  notices.push('Chi phí di chuyển là ước tính nội đô (80.000đ/người/ngày); chưa tính quãng đường thực tế.');

  if (remainingBudgetForActivities === 0) {
    notices.push('Ngân sách còn lại sau chi phí cố định là 0đ; lịch trình sẽ không thể thêm tham quan hay giải trí. Hãy tăng ngân sách hoặc giảm số ngày / số khách.');
  }

  const days: GeneratedItinerary['days'] = [];
  let skippedAttractionSlots = 0;
  let skippedMealCount       = 0;

  for (let dayIndex = 0; dayIndex < input.days; dayIndex += 1) {
    const day   = dayIndex + 1;
    const items: ItineraryItem[] = [];
    const meals = foodChoices[dayIndex];
    if (!meals) throw new ItineraryCatalogError(`Không thể tạo dữ liệu bữa ăn cho ngày ${day}.`);

    // Bữa ăn
    MEAL_PERIODS.forEach(({ period, time, label }, mealIndex) => {
      const food = meals[mealIndex];
      if (!needsFood) return;
      if (!food) {
        if (!selectedFood && period === 'SNACK') return;
        if (selectedFood) return;
        skippedMealCount += 1;
        return;
      }
      items.push({
        id: `d${day}-${period.toLowerCase()}`,
        time,
        title: `${label}: ${food.name}`,
        description: `${food.description} Chi phí tham khảo ${food.price.toLocaleString('vi-VN')}đ/người.`,
        type: 'food',
        location: food.address,
        imageUrl: food.imageUrl,
        estimatedCost: food.price * input.guestCount,
        catalogPlaceId: food.id,
        unitPrice: food.price,
        quantity: input.guestCount,
      });
    });

    // Tham quan: tối đa 2 điểm/ngày
    if (needsAttractions) {
      DAILY_ATTRACTION_TIMES.forEach((preferredTime, attractionIndex) => {
        const attraction = attractionPool.find((place) => {
          if (usedAttractionIds.has(place.id)) return false;
          if (!canScheduleVisit(place, preferredTime)) return false;
          return true;
        });

        if (!attraction) {
          skippedAttractionSlots += 1;
          return;
        }

        usedAttractionIds.add(attraction.id);
        items.push({
          id: `d${day}-attraction-${attractionIndex + 1}`,
          time: getVisitStartTime(attraction, preferredTime),
          title: attraction.name,
          description: attraction.description,
          type: 'attraction',
          location: attraction.address,
          imageUrl: attraction.imageUrl,
          estimatedCost: attraction.price * input.guestCount,
          catalogPlaceId: attraction.id,
          unitPrice: attraction.price,
          quantity: input.guestCount,
          durationMinutes: attraction.visitDurationMinutes,
        });
      });
    }

    // Giải trí: tối đa 1 hoạt động/ngày, trong giới hạn ngân sách giải trí/ngày
    if (needsEntertainment) {
      const entertainmentItem = entertainmentPool.find((place) => {
        if (usedEntertainmentIds.has(place.id)) return false;
        if (!canScheduleVisit(place)) return false;
        if (dailyEntertainmentBudget > 0 && place.price * input.guestCount > dailyEntertainmentBudget) return false;
        if (dailyEntertainmentBudget === 0 && place.price > 0) return false;
        return true;
      });

      if (entertainmentItem) {
        usedEntertainmentIds.add(entertainmentItem.id);
        items.push({
          id: `d${day}-entertainment`,
          time: getVisitStartTime(entertainmentItem),
          title: entertainmentItem.name,
          description: entertainmentItem.description,
          type: 'entertainment',
          location: entertainmentItem.address,
          imageUrl: entertainmentItem.imageUrl,
          estimatedCost: entertainmentItem.price * input.guestCount,
          catalogPlaceId: entertainmentItem.id,
          unitPrice: entertainmentItem.price,
          quantity: input.guestCount,
          durationMinutes: entertainmentItem.visitDurationMinutes,
        });
      } else if (remainingBudgetForActivities > 0) {
        // Chỉ cảnh báo khi ngân sách có nhưng không tìm được địa điểm phù hợp
        notices.push(`Không tìm được địa điểm giải trí phù hợp ngân sách cho ngày ${day}.`);
      }
    }

    // Di chuyển
    items.push({
      id: `d${day}-transport`,
      time: '16:30',
      title: 'Di chuyển trong thành phố',
      description: 'Dự trù chi phí đi lại theo ngày; chưa được tính từ quãng đường thực tế.',
      type: 'transport',
      location: 'Đà Nẵng',
      estimatedCost: DAILY_TRANSPORT_BUDGET * input.guestCount,
      unitPrice: DAILY_TRANSPORT_BUDGET,
    });

    // Chỗ ở (trừ ngày cuối — check-out)
    if (accommodation && day <= nights) {
      items.push({
        id: `d${day}-accommodation`,
        time: '21:00',
        title: `${accommodation.name} (ước tính)`,
        description: `${accommodation.description} Giá tham khảo mỗi đêm; thực tế tùy ngày và loại phòng.`,
        type: 'hotel',
        location: accommodation.address,
        imageUrl: accommodation.imageUrl,
        estimatedCost: accommodation.price * accommodationQuantity,
        catalogPlaceId: accommodation.id,
        unitPrice: accommodation.price,
        quantity: accommodationQuantity,
      });
    }

    const date = new Date(`${input.startDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + dayIndex);
    days.push({
      day,
      date: date.toISOString().slice(0, 10),
      items: items.sort((left, right) => left.time.localeCompare(right.time)),
    });
  }

  // ── 7. Tổng hợp chi phí thực tế ───────────────────────────────────────────
  const allItems          = days.flatMap((d) => d.items);
  const attractionsCost   = allItems.filter((i) => i.type === 'attraction').reduce((s, i) => s + i.estimatedCost, 0);
  const entertainmentCost = allItems.filter((i) => i.type === 'entertainment').reduce((s, i) => s + i.estimatedCost, 0);
  const estimatedTotal    = accommodationCost + foodCost + transportCost + attractionsCost + entertainmentCost + contingency;
  const remainingBudget   = input.budget - estimatedTotal;

  // ── 8. Thông báo động (sau vòng lặp) ──────────────────────────────────────
  if (needsStay && !accommodation) {
    notices.push('Chưa tìm thấy lựa chọn lưu trú phù hợp trong danh mục; lịch vẫn được tạo nháp để bạn điều chỉnh.');
  }
  if (needsStay && accommodation && (!accommodation.roomType || !accommodation.roomCapacity)) {
    notices.push('Danh mục chưa có loại phòng hoặc sức chứa thực tế; giá lưu trú hiện là tham khảo, chưa thể xác định số phòng chính xác.');
  }
  if (skippedMealCount > 0) {
    notices.push(`Danh mục chưa có đủ địa điểm cho ${skippedMealCount} bữa; các bữa chưa tìm thấy được để trống trong bản nháp.`);
  }
  if (skippedAttractionSlots > 0) {
    notices.push(`còn thiếu ${skippedAttractionSlots} gợi ý tham quan (hạn mức: 2 điểm/ngày). Nguyên nhân có thể do catalog chưa đủ địa điểm.`);
  }
  if (needsAttractions && catalog.some((place) =>
    place.kind === 'ATTRACTION' &&
    (place.openingTime === null || place.closingTime === null || place.visitDurationMinutes === null),
  )) {
    notices.push('Một số địa điểm tham quan chưa có đầy đủ giờ mở cửa/thời lượng; khung giờ hiển thị là gợi ý sơ bộ.');
  }
  if (input.prefs.length === 0) {
    notices.push('Bạn chưa chọn sở thích; địa điểm được chọn theo giá từ thấp đến cao, không ưu tiên chủ đề cụ thể.');
  }
  if (remainingBudget < 0) {
    notices.push(
      `Dự toán vượt ngân sách ${Math.abs(remainingBudget).toLocaleString('vi-VN')}đ. ` +
      'Hãy tăng ngân sách, giảm số ngày, số khách, hoặc bỏ bớt nhu cầu.',
    );
  }

  // ── 9. Gợi ý bữa ăn theo từng ngày (suggestions) ─────────────────────────
  const usedFoodIds = new Set(
    foodChoices.flat().filter((food): food is ItineraryCatalogPlace => food !== undefined).map((food) => food.id),
  );

  const suggestions: DayFoodSuggestions[] = Array.from({ length: input.days }, (_, dayIndex) => {
    const date = new Date(`${input.startDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + dayIndex);
    const daySuggestions: DayFoodSuggestions = {
      day: dayIndex + 1,
      date: date.toISOString().slice(0, 10),
      breakfast: [],
      lunch: [],
      snack: snackOptions.map((place) => ({
        catalogPlaceId: place.id,
        name: place.name,
        description: place.description,
        address: place.address,
        imageUrl: place.imageUrl,
        price: place.price,
        mealSlot: 'SNACK' as const,
      })),
      dinner: [],
    };

    for (const { period } of MEAL_PERIODS) {
      daySuggestions[period.toLowerCase() as Lowercase<MealPeriod>] = (foodsByPeriod.get(period) ?? []).map((place) => ({
        catalogPlaceId: place.id,
        name: place.name,
        description: place.description,
        address: place.address,
        imageUrl: place.imageUrl,
        price: place.price,
        mealSlot: period,
      }));
    }

    return daySuggestions;
  });

  // ── 10. Gợi ý bổ sung (recommendations) ──────────────────────────────────
  const recommendations = catalog
    .filter((place) =>
      (needsFood        && place.kind === 'FOOD'       && !usedFoodIds.has(place.id))
      || (needsAttractions && place.kind === 'ATTRACTION' && !usedAttractionIds.has(place.id)),
    )
    .sort((left, right) => {
      const leftMatches  = left.preferences.some((pref) => input.prefs.includes(pref));
      const rightMatches = right.preferences.some((pref) => input.prefs.includes(pref));
      return Number(rightMatches) - Number(leftMatches) || left.price - right.price;
    })
    .slice(0, 8)
    .map((place) => ({
      id: `${place.kind.toLowerCase()}-${place.id}`,
      title: place.name,
      category: place.kind === 'FOOD' ? 'Ẩm thực' : 'Tham quan',
      price: place.price,
      imageUrl: place.imageUrl,
    }));

  // ── 11. Trả về kết quả ────────────────────────────────────────────────────
  return {
    startDate: input.startDate,
    guestCount: input.guestCount,
    needs: input.needs,
    days,
    suggestions,
    summary: {
      budget: input.budget,
      estimatedTotal,
      remainingBudget,
      budgetStatus: remainingBudget >= 0 ? 'within-budget' : 'over-budget',
      overBudgetAmount: Math.max(-remainingBudget, 0),
      costs: {
        accommodation: accommodationCost,
        food:          foodCost,
        transport:     transportCost,
        attractions:   attractionsCost,
        entertainment: entertainmentCost,
        contingency,
      },
    },
    notices,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Preference guard
// ---------------------------------------------------------------------------

export function isItineraryPreference(value: unknown): value is ItineraryPreference {
  return typeof value === 'string' && ITINERARY_PREFERENCES.includes(value as ItineraryPreference);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Kiểm tra xem có thể xếp lịch tham quan vào khung giờ ưu tiên không */
function canScheduleVisit(place: ItineraryCatalogPlace, preferredTime = '09:30'): boolean {
  if (!place.closingTime) return true;
  const close      = toMinutes(place.closingTime);
  const visitStart = toMinutes(getVisitStartTime(place, preferredTime));
  const duration   = place.visitDurationMinutes ?? 120;
  return close !== null && visitStart !== null && visitStart + duration <= close;
}

/** Tính giờ bắt đầu thực tế (không sớm hơn giờ mở cửa) */
function getVisitStartTime(place: ItineraryCatalogPlace, preferredTime = '09:30'): string {
  const opening      = place.openingTime ? toMinutes(place.openingTime) : null;
  const preferredMin = toMinutes(preferredTime) ?? 9 * 60 + 30;
  const start        = Math.max(preferredMin, opening ?? preferredMin);
  return `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
}

/** Chuyển chuỗi "HH:MM" thành số phút kể từ 0:00 */
function toMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours   = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
