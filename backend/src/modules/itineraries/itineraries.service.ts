import {
  ITINERARY_PREFERENCES,
  type GeneratedItinerary,
  type GenerateItineraryInput,
  type ItineraryCatalogPlace,
  type ItineraryItem,
  type ItineraryPreference,
  type MealPeriod,
} from './itineraries.types';

const MEAL_PERIODS: Array<{ period: MealPeriod; time: string; label: string }> = [
  { period: 'BREAKFAST', time: '08:00', label: 'Bữa sáng' },
  { period: 'LUNCH', time: '12:00', label: 'Bữa trưa' },
  { period: 'DINNER', time: '18:30', label: 'Bữa tối' },
];
const DAILY_TRANSPORT_BUDGET = 80_000;
const CONTINGENCY_RATE = 0.08;

export class ItineraryCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ItineraryCatalogError';
  }
}

export function generateItinerary(
  input: GenerateItineraryInput,
  catalog: ItineraryCatalogPlace[],
): GeneratedItinerary {
  const needsStay = input.needs.includes('accommodation');
  const needsFood = input.needs.includes('food');
  const needsAttractions = input.needs.includes('attractions');
  const stays = catalog
    .filter((place) =>
      place.kind === 'STAY'
      && (!input.accType || place.accommodationType === input.accType)
      && (!input.stars || input.accType === 'Cắm trại' || place.stars === input.stars)
      && (place.priceBasis === 'PER_PERSON' || (place.roomCapacity !== null && place.roomCapacity > 0)),
    )
    .sort((left, right) => left.price - right.price);
  const accommodation = needsStay ? stays[0] : undefined;

  const foodsByPeriod = new Map<MealPeriod, ItineraryCatalogPlace[]>();
  if (needsFood) {
    for (const { period } of MEAL_PERIODS) {
      const options = catalog
        .filter((place) => place.kind === 'FOOD' && place.mealPeriod === period)
        .sort((left, right) => {
          const leftPreferred = left.preferences.some((preference) => input.prefs.includes(preference));
          const rightPreferred = right.preferences.some((preference) => input.prefs.includes(preference));
          return Number(rightPreferred) - Number(leftPreferred) || left.price - right.price;
        });
      foodsByPeriod.set(period, options);
    }
  }

  const foodChoices = Array.from({ length: input.days }, (_, dayIndex) =>
    MEAL_PERIODS.map(({ period }) => {
      if (!needsFood) return undefined;
      const options = foodsByPeriod.get(period);
      return options?.[dayIndex % options.length];
    }),
  );
  const foodCost = foodChoices.flat().reduce((total, food) => total + (food?.price ?? 0) * input.guestCount, 0);
  const nights = Math.max(input.days - 1, 0);
  const accommodationQuantity = accommodation?.priceBasis === 'PER_ROOM'
    ? Math.ceil(input.guestCount / (accommodation.roomCapacity ?? 1))
    : input.guestCount;
  const accommodationCost = (accommodation?.price ?? 0) * nights * accommodationQuantity;
  const transportCost = input.days * DAILY_TRANSPORT_BUDGET * input.guestCount;
  const contingency = Math.ceil(input.budget * CONTINGENCY_RATE);
  const minimumBudget = accommodationCost + foodCost + transportCost + contingency;

  const preferredAttractions = catalog
    .filter((place) =>
      needsAttractions
      && place.kind === 'ATTRACTION'
      && place.preferences.some((preference) => input.prefs.includes(preference)),
    )
    .sort((left, right) => left.price - right.price);
  const otherAttractions = catalog
    .filter((place) => needsAttractions && place.kind === 'ATTRACTION' && !preferredAttractions.includes(place))
    .sort((left, right) => left.price - right.price);
  const attractionPool = [...preferredAttractions, ...otherAttractions];
  const remainingForAttractions = Math.max(input.budget - minimumBudget, 0);
  const dailyAttractionBudget = Math.floor(remainingForAttractions / input.days);
  const usedAttractionIds = new Set<number>();
  const days: GeneratedItinerary['days'] = [];
  let skippedAttractionDays = 0;
  let skippedMealCount = 0;

  for (let dayIndex = 0; dayIndex < input.days; dayIndex += 1) {
    const day = dayIndex + 1;
    const items: ItineraryItem[] = [];
    const meals = foodChoices[dayIndex];
    if (!meals) throw new ItineraryCatalogError(`Không thể tạo dữ liệu bữa ăn cho ngày ${day}.`);

    MEAL_PERIODS.forEach(({ period, time, label }, mealIndex) => {
      const food = meals[mealIndex];
      if (!needsFood) return;
      if (!food) {
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

    const attraction = attractionPool.find((place) =>
      !usedAttractionIds.has(place.id)
      && place.price * input.guestCount <= dailyAttractionBudget
      && canScheduleVisit(place),
    );
    if (attraction) {
      usedAttractionIds.add(attraction.id);
      items.push({
        id: `d${day}-attraction`,
        time: getVisitStartTime(attraction),
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
    } else if (needsAttractions) {
      skippedAttractionDays += 1;
    }

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

    if (accommodation && day <= nights) {
      items.push({
        id: `d${day}-accommodation`,
        time: '21:00',
        title: `${accommodation.name} (ước tính)`,
        description: `${accommodation.description} Giá tham khảo mỗi người/đêm; thực tế tùy ngày và loại phòng.`,
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

  const attractionsCost = days.flatMap((day) => day.items)
    .filter((item) => item.type === 'attraction')
    .reduce((total, item) => total + item.estimatedCost, 0);
  const estimatedTotal = accommodationCost + foodCost + transportCost + attractionsCost + contingency;
  const remainingBudget = input.budget - estimatedTotal;
  const notices = [
    'Đây là lịch trình tham khảo, không phải đặt chỗ. Giá có thể thay đổi; hãy kiểm tra với địa điểm trước khi đi.',
    'Dự toán có khoản dự phòng bằng 8% ngân sách đã nhập.',
    'API chỉ đường nội bộ chưa được cung cấp; chi phí di chuyển hiện là mức ước tính theo ngày, chưa dựa trên quãng đường thực tế.',
  ];
  if (needsStay && !accommodation) {
    notices.push('Chưa tìm thấy lựa chọn lưu trú phù hợp trong danh mục; lịch vẫn được tạo nháp để bạn điều chỉnh.');
  }
  if (needsStay && accommodation) {
    if (!accommodation.roomType || !accommodation.roomCapacity) {
      notices.push('Danh mục chưa có loại phòng hoặc sức chứa thực tế; giá lưu trú hiện là tham khảo, chưa thể xác định số phòng chính xác.');
    }
  }
  if (skippedMealCount > 0) {
    notices.push(`Danh mục chưa có đủ địa điểm cho ${skippedMealCount} bữa; các bữa chưa tìm thấy được để trống trong bản nháp.`);
  }
  if (needsAttractions && catalog.some((place) =>
    place.kind === 'ATTRACTION'
    && (place.openingTime === null || place.closingTime === null || place.visitDurationMinutes === null),
  )) {
    notices.push('Danh mục chưa có đủ giờ mở cửa hoặc thời lượng tham quan; khung giờ tham quan hiện là gợi ý sơ bộ.');
  }
  if (remainingBudget < 0) {
    notices.push(`Dự toán hiện vượt ngân sách ${Math.abs(remainingBudget).toLocaleString('vi-VN')}đ. Đây chỉ là cảnh báo tham khảo.`);
  }
  if (skippedAttractionDays > 0) {
    notices.push(`Có ${skippedAttractionDays} ngày chưa chọn điểm tham quan vì giá tham khảo vượt phần ngân sách còn lại. Bạn vẫn có thể thêm điểm hoặc điều chỉnh kế hoạch.`);
  }
  if (input.prefs.length === 0) {
    notices.push('Bạn chưa chọn sở thích; các địa điểm được chọn theo giá tham khảo, không ưu tiên chủ đề cụ thể.');
  }

  const usedFoodIds = new Set(foodChoices.flat().filter((food) => food !== undefined).map((food) => food.id));
  const recommendations = catalog
    .filter((place) =>
      (needsFood && place.kind === 'FOOD' && !usedFoodIds.has(place.id))
      || (needsAttractions && place.kind === 'ATTRACTION' && !usedAttractionIds.has(place.id)),
    )
    .sort((left, right) => {
      const leftMatches = left.preferences.some((preference) => input.prefs.includes(preference));
      const rightMatches = right.preferences.some((preference) => input.prefs.includes(preference));
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

  return {
    startDate: input.startDate,
    guestCount: input.guestCount,
    needs: input.needs,
    days,
    summary: {
      budget: input.budget,
      estimatedTotal,
      remainingBudget,
      budgetStatus: remainingBudget >= 0 ? 'within-budget' : 'over-budget',
      overBudgetAmount: Math.max(-remainingBudget, 0),
      costs: {
        accommodation: accommodationCost,
        food: foodCost,
        transport: transportCost,
        attractions: attractionsCost,
        contingency,
      },
    },
    notices,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

export function isItineraryPreference(value: unknown): value is ItineraryPreference {
  return typeof value === 'string'
    && ITINERARY_PREFERENCES.includes(value as ItineraryPreference);
}

function canScheduleVisit(place: ItineraryCatalogPlace): boolean {
  if (!place.closingTime) return true;
  const close = toMinutes(place.closingTime);
  const visitStart = toMinutes(getVisitStartTime(place));
  const visitDuration = place.visitDurationMinutes ?? 120;
  return close !== null
    && visitStart !== null
    && visitStart + visitDuration <= close
    && visitStart + visitDuration <= 12 * 60;
}

function getVisitStartTime(place: ItineraryCatalogPlace): string {
  const opening = place.openingTime ? toMinutes(place.openingTime) : null;
  const start = Math.max(9 * 60 + 30, opening ?? 9 * 60 + 30);
  return `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
}

function toMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
