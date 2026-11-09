import { Router, type Request, type Response } from 'express';
import {
  ITINERARY_PREFERENCES,
  type AccommodationType,
  type GenerateItineraryInput,
  type ItineraryFoodSelection,
  type ItineraryItemType,
  type ItineraryNeed,
  type ItineraryPreference,
  type MealPeriod,
  type ItineraryCatalogPlace,
  type ManagedItineraryItem,
  type ManagedItineraryCatalogOption,
} from './itineraries.types';
import {
  generateItinerary,
  isItineraryPreference,
  ItinerarySelectionError,
  searchItineraryCatalog,
} from './itineraries.service';
import {
  deleteManagedItinerary,
  getItineraryCatalog,
  getManagedItineraries,
  getManagedItinerary,
  getUserItineraryPreferences,
  saveDraftItinerary,
  updateManagedItinerary,
  type ManagedItineraryUpdate,
} from './itineraries.repository';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();
const ACCOMMODATION_TYPES: AccommodationType[] = ['Khách sạn', 'Resort', 'Homestay', 'Cắm trại'];
const ITINERARY_NEEDS: ItineraryNeed[] = ['accommodation', 'food', 'attractions'];
const MEAL_PERIODS: MealPeriod[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'];
const ITINERARY_ITEM_TYPES: ItineraryItemType[] = ['attraction', 'food', 'hotel', 'transport', 'entertainment'];
const CATALOG_PLACE_KINDS = ['STAY', 'FOOD', 'ATTRACTION', 'ENTERTAINMENT'] as const;

function parseSearchPrice(value: unknown): number | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const price = Number(value);
  return Number.isFinite(price) ? price : null;
}

function isCatalogPlaceKind(value: unknown): value is (typeof CATALOG_PLACE_KINDS)[number] {
  return CATALOG_PLACE_KINDS.some((kind) => kind === value);
}

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) return res.status(401).json({ success: false, message: 'Cần đăng nhập để xem lịch trình.' });

  try {
    const itineraries = await getManagedItineraries(user.id);
    return res.json({ success: true, data: { itineraries } });
  } catch (error) {
    console.error('Lỗi tải danh sách lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải danh sách lịch trình.' });
  }
});

router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Cần đăng nhập để tải sở thích.' });
  }

  try {
    const preferences = await getUserItineraryPreferences(user.id);
    return res.json({ success: true, data: { preferences } });
  } catch (error) {
    console.error('Lỗi tải sở thích lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải sở thích đã lưu.' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  const query = req.query.q;
  const kind = req.query.type;
  const minPrice = parseSearchPrice(req.query.minPrice);
  const maxPrice = parseSearchPrice(req.query.maxPrice);

  if ((query !== undefined && (typeof query !== 'string' || query.trim().length > 100))
    || (kind !== undefined && !isCatalogPlaceKind(kind))
    || minPrice === null
    || maxPrice === null
    || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)) {
    return res.status(400).json({ success: false, message: 'Bộ lọc tìm kiếm không hợp lệ.' });
  }

  try {
    const catalog = await getItineraryCatalog();
    const results = searchItineraryCatalog(catalog, {
      ...(typeof query === 'string' && query.trim() ? { query: query.trim() } : {}),
      ...(isCatalogPlaceKind(kind) ? { kind } : {}),
      ...(minPrice === undefined ? {} : { minPrice }),
      ...(maxPrice === undefined ? {} : { maxPrice }),
    });
    return res.json({ success: true, data: { items: results.places, suggestions: results.suggestions } });
  } catch (error) {
    console.error('Lỗi tìm kiếm địa điểm:', error);
    return res.status(500).json({ success: false, message: 'Không thể tìm kiếm địa điểm lúc này.' });
  }
});

router.get('/attractions', requireAuth, async (req: Request, res: Response) => {
  if (!req.authenticatedUser) {
    return res.status(401).json({ success: false, message: 'Cần đăng nhập để tải danh sách điểm tham quan.' });
  }

  try {
    const catalog = await getItineraryCatalog();
    const attractions = catalog
      .filter((place) => place.kind === 'ATTRACTION')
      .map((place) => ({
        catalogPlaceId: place.id,
        name: place.name,
        description: place.description,
        address: place.address,
        imageUrl: place.imageUrl,
        price: place.price,
        durationMinutes: place.visitDurationMinutes,
      }));
    return res.json({ success: true, data: { attractions } });
  } catch (error) {
    console.error('Lỗi tải danh sách điểm tham quan:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải danh sách điểm tham quan.' });
  }
});

router.get('/options', requireAuth, async (req: Request, res: Response) => {
  if (!req.authenticatedUser) {
    return res.status(401).json({ success: false, message: 'Cần đăng nhập để tải danh sách hoạt động.' });
  }

  try {
    const catalog = await getItineraryCatalog();
    const itemTypeByKind: Partial<Record<ItineraryCatalogPlace['kind'], ManagedItineraryCatalogOption['itemType']>> = {
      ATTRACTION: 'attraction',
      FOOD: 'food',
      STAY: 'hotel',
      ENTERTAINMENT: 'entertainment',
    };
    const options = catalog.flatMap((place) => {
      const itemType = itemTypeByKind[place.kind];
      if (!itemType) return [];
      return [{
        catalogPlaceId: place.id,
        itemType,
        name: place.name,
        description: place.description,
        address: place.address,
        imageUrl: place.imageUrl,
        price: place.price,
        durationMinutes: place.visitDurationMinutes,
        priceBasis: place.priceBasis,
        roomCapacity: place.roomCapacity,
        mealPeriod: place.mealPeriod,
      }];
    });
    return res.json({ success: true, data: { options } });
  } catch (error) {
    console.error('Lỗi tải danh sách hoạt động lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải danh sách hoạt động.' });
  }
});

router.post('/preview', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Cần đăng nhập để xem gợi ý lịch trình.' });
  }

  const input = parseInput(req.body);
  if (!input) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ. Cần ngân sách dương, 1–3 ngày, số người nguyên dương, ngày bắt đầu hợp lệ và ít nhất một nhu cầu.',
      allowedNeeds: ITINERARY_NEEDS,
      allowedPreferences: ITINERARY_PREFERENCES,
    });
  }

  try {
    const catalog = await getItineraryCatalog();
    const itinerary = generateItinerary(input, catalog);
    return res.json({ success: true, data: itinerary });
  } catch (error) {
    console.error('Lỗi tạo gợi ý lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo gợi ý lịch trình lúc này.' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Cần đăng nhập để tạo lịch trình.' });
  }

  const input = parseInput(req.body);
  if (!input) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ. Cần ngân sách dương, 1–3 ngày, số người nguyên dương, ngày bắt đầu hợp lệ và ít nhất một nhu cầu.',
      allowedNeeds: ITINERARY_NEEDS,
      allowedPreferences: ITINERARY_PREFERENCES,
    });
  }
  const foodSelections = parseFoodSelections(req.body, input.days);
  if (foodSelections === null) {
    return res.status(400).json({
      success: false,
      message: 'Lựa chọn địa điểm ăn uống không hợp lệ. Mỗi buổi chỉ chọn tối đa một địa điểm trong đúng ngày.',
    });
  }

  try {
    const catalog = await getItineraryCatalog();
    const itinerary = generateItinerary(input, catalog, foodSelections);
    const saved = await saveDraftItinerary(input, itinerary, user.id);
    return res.status(201).json({
      success: true,
      data: { ...itinerary, itineraryId: saved.itineraryId, status: 'DRAFT' },
      trainingExampleId: saved.trainingExampleId,
    });
  } catch (error) {
    if (error instanceof ItinerarySelectionError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Lỗi lưu lịch trình đã chọn:', error);
    return res.status(500).json({ success: false, message: 'Không thể lưu lịch trình lúc này.' });
  }
});

router.get('/:itineraryId', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) return res.status(401).json({ success: false, message: 'Cần đăng nhập để xem lịch trình.' });
  const itineraryId = parseItineraryId(req.params.itineraryId);
  if (itineraryId === null) return res.status(400).json({ success: false, message: 'Mã lịch trình không hợp lệ.' });

  try {
    const itinerary = await getManagedItinerary(itineraryId, user.id);
    if (!itinerary) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình.' });
    return res.json({ success: true, data: { itinerary } });
  } catch (error) {
    console.error('Lỗi tải chi tiết lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải chi tiết lịch trình.' });
  }
});

router.put('/:itineraryId', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) return res.status(401).json({ success: false, message: 'Cần đăng nhập để sửa lịch trình.' });
  const itineraryId = parseItineraryId(req.params.itineraryId);
  if (itineraryId === null) return res.status(400).json({ success: false, message: 'Mã lịch trình không hợp lệ.' });
  const update = parseManagedItineraryUpdate(req.body);
  if (!update) {
    return res.status(400).json({
      success: false,
      message: 'Thông tin lịch trình không hợp lệ. Kiểm tra tiêu đề, ngày đi, số ngày (1–3), số khách, ngân sách và các hoạt động.',
    });
  }

  try {
    const catalog = await getItineraryCatalog();
    const normalizedUpdate = applyCatalogPlaceDetails(update, catalog);
    if (!normalizedUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn hoạt động từ danh sách gợi ý phù hợp với từng loại trước khi lưu.',
      });
    }

    const updated = await updateManagedItinerary(itineraryId, user.id, normalizedUpdate);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình.' });
    const itinerary = await getManagedItinerary(itineraryId, user.id);
    if (!itinerary) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình sau khi cập nhật.' });
    return res.json({ success: true, data: { itinerary } });
  } catch (error) {
    console.error('Lỗi cập nhật lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật lịch trình lúc này.' });
  }
});

router.delete('/:itineraryId', requireAuth, async (req: Request, res: Response) => {
  const user = req.authenticatedUser;
  if (!user) return res.status(401).json({ success: false, message: 'Cần đăng nhập để xóa lịch trình.' });
  const itineraryId = parseItineraryId(req.params.itineraryId);
  if (itineraryId === null) return res.status(400).json({ success: false, message: 'Mã lịch trình không hợp lệ.' });

  try {
    const deleted = await deleteManagedItinerary(itineraryId, user.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch trình.' });
    return res.json({ success: true, message: 'Đã xóa lịch trình.' });
  } catch (error) {
    console.error('Lỗi xóa lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa lịch trình lúc này.' });
  }
});

function parseItineraryId(value: string | string[] | undefined): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function applyCatalogPlaceDetails(
  update: ManagedItineraryUpdate,
  catalog: ItineraryCatalogPlace[],
): ManagedItineraryUpdate | null {
  const kindByItemType: Partial<Record<ManagedItineraryCatalogOption['itemType'], ItineraryCatalogPlace['kind']>> = {
    attraction: 'ATTRACTION',
    food: 'FOOD',
    hotel: 'STAY',
    entertainment: 'ENTERTAINMENT',
  };
  const items: ManagedItineraryItem[] = [];
  for (const item of update.items) {
    if (item.type === 'transport') {
      items.push(item);
      continue;
    }
    const expectedKind = kindByItemType[item.type];
    const place = item.catalogPlaceId === undefined
      ? undefined
      : catalog.find((candidate) => candidate.id === item.catalogPlaceId && candidate.kind === expectedKind);
    if (!place) return null;
    items.push({
      ...item,
      title: place.name,
      description: place.description,
      location: place.address,
      // The catalog is the source of truth for linked places. This also repairs
      // saved items that still carry an obsolete image URL from an older catalog.
      imageUrl: place.imageUrl,
      unitPrice: place.price,
      estimatedCost: place.price * item.quantity,
      durationMinutes: place.visitDurationMinutes,
    });
  }
  return { ...update, items };
}

export function parseManagedItineraryUpdate(value: unknown): ManagedItineraryUpdate | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const { title, startDate, dayCount, guestCount, budget, items } = body;
  if (
    typeof title !== 'string'
    || title.trim().length === 0
    || title.length > 200
    || typeof startDate !== 'string'
    || !isValidDate(startDate)
    || typeof dayCount !== 'number'
    || !Number.isInteger(dayCount)
    || dayCount < 1
    || dayCount > 3
    || typeof guestCount !== 'number'
    || !Number.isSafeInteger(guestCount)
    || guestCount < 1
    || guestCount > 2_147_483_647
    || typeof budget !== 'number'
    || !Number.isSafeInteger(budget)
    || budget <= 0
    || budget >= 10_000_000_000_000_000
    || !Array.isArray(items)
    || items.length > 200
  ) return null;

  const parsedItems: ManagedItineraryItem[] = [];
  for (const [index, candidate] of items.entries()) {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) return null;
    const item = candidate as Record<string, unknown>;
    const {
      day, time, title: itemTitle, description, type, location, imageUrl,
      unitPrice, quantity, durationMinutes, catalogPlaceId,
    } = item;
    if (
      typeof day !== 'number'
      || !Number.isInteger(day)
      || day < 1
      || day > dayCount
      || typeof time !== 'string'
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
      || typeof itemTitle !== 'string'
      || itemTitle.length > 300
      || typeof description !== 'string'
      || description.length > 2000
      || typeof type !== 'string'
      || !ITINERARY_ITEM_TYPES.includes(type as ItineraryItemType)
      || (location !== undefined && (typeof location !== 'string' || location.length > 500))
      || (imageUrl !== undefined && (
        typeof imageUrl !== 'string'
        || imageUrl.length > 1000
        || ((catalogPlaceId === undefined || type === 'transport') && imageUrl.length > 0 && !isAllowedItineraryImage(imageUrl))
      ))
      || typeof unitPrice !== 'number'
      || !Number.isSafeInteger(unitPrice)
      || unitPrice < 0
      || unitPrice >= 10_000_000_000_000_000
      || typeof quantity !== 'number'
      || !Number.isSafeInteger(quantity)
      || quantity < 1
      || quantity > 2_147_483_647
      || !Number.isSafeInteger(unitPrice * quantity)
      || (durationMinutes !== undefined && durationMinutes !== null && (
        typeof durationMinutes !== 'number'
        || !Number.isInteger(durationMinutes)
        || durationMinutes < 1
        || durationMinutes > 32_767
      ))
      || (catalogPlaceId !== undefined && (
        typeof catalogPlaceId !== 'number'
        || !Number.isSafeInteger(catalogPlaceId)
        || catalogPlaceId <= 0
      ))
    ) return null;

    parsedItems.push({
      id: `day-${day}-item-${index + 1}`,
      day,
      time,
      title: itemTitle.trim() || 'Hoạt động mới',
      description,
      type: type as ItineraryItemType,
      ...(typeof location === 'string' && location.length > 0 ? { location } : {}),
      ...(typeof imageUrl === 'string' && imageUrl.length > 0 ? { imageUrl } : {}),
      estimatedCost: unitPrice * quantity,
      ...(typeof catalogPlaceId === 'number' ? { catalogPlaceId } : {}),
      unitPrice,
      quantity,
      ...(typeof durationMinutes === 'number' ? { durationMinutes } : {}),
    });
  }

  const itemsTotal = parsedItems.reduce((total, item) => total + item.estimatedCost, 0);
  if (!Number.isSafeInteger(itemsTotal + Math.ceil(budget * 0.08))) return null;

  return {
    title: title.trim(),
    startDate,
    dayCount,
    guestCount,
    budget,
    items: parsedItems,
  };
}

function isAllowedItineraryImage(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && ['images.unsplash.com', 'plus.unsplash.com'].includes(url.hostname);
  } catch {
    return false;
  }
}

function parseFoodSelections(value: unknown, days: number): ItineraryFoodSelection[] | undefined | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const selectionsValue = (value as Record<string, unknown>).foodSelections;
  if (selectionsValue === undefined) return undefined;
  if (!Array.isArray(selectionsValue) || selectionsValue.length > days * MEAL_PERIODS.length) return null;

  const seenSlots = new Set<string>();
  const selections: ItineraryFoodSelection[] = [];
  for (const selection of selectionsValue) {
    if (typeof selection !== 'object' || selection === null || Array.isArray(selection)) return null;
    const candidate = selection as Record<string, unknown>;
    if (
      typeof candidate.day !== 'number'
      || !Number.isInteger(candidate.day)
      || candidate.day < 1
      || candidate.day > days
      || typeof candidate.mealPeriod !== 'string'
      || !MEAL_PERIODS.includes(candidate.mealPeriod as MealPeriod)
      || typeof candidate.catalogPlaceId !== 'number'
      || !Number.isSafeInteger(candidate.catalogPlaceId)
      || candidate.catalogPlaceId <= 0
    ) {
      return null;
    }
    const slot = `${candidate.day}:${candidate.mealPeriod}`;
    if (seenSlots.has(slot)) return null;
    seenSlots.add(slot);
    selections.push({
      day: candidate.day,
      mealPeriod: candidate.mealPeriod as MealPeriod,
      catalogPlaceId: candidate.catalogPlaceId,
    });
  }
  return selections;
}

function parseInput(value: unknown): GenerateItineraryInput | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const { budget, days, guestCount, startDate, needs, accType, stars, prefs } = body;

  if (
    typeof budget !== 'number'
    || !Number.isFinite(budget)
    || budget <= 0
    || budget >= 10_000_000_000_000_000
    || typeof days !== 'number'
    || !Number.isInteger(days)
    || days < 1
    || days > 3
    || typeof guestCount !== 'number'
    || !Number.isSafeInteger(guestCount)
    || guestCount <= 0
    || guestCount > 2_147_483_647
    || typeof startDate !== 'string'
    || !isValidDate(startDate)
    || !Array.isArray(needs)
    || needs.length === 0
    || needs.some((need) => !ITINERARY_NEEDS.includes(need as ItineraryNeed))
    || new Set(needs).size !== needs.length
    || (accType !== undefined && (typeof accType !== 'string' || !ACCOMMODATION_TYPES.includes(accType as AccommodationType)))
    || (stars !== undefined && (typeof stars !== 'number' || ![3, 4, 5].includes(stars)))
    || (prefs !== undefined && (
      !Array.isArray(prefs)
      || prefs.length > ITINERARY_PREFERENCES.length
      || !prefs.every(isItineraryPreference)
    ))
    || (needs.includes('accommodation') && stars !== undefined && accType === undefined)
  ) {
    return null;
  }

  return {
    budget,
    days,
    guestCount,
    startDate,
    needs: needs as ItineraryNeed[],
    prefs: (prefs ?? []) as ItineraryPreference[],
    ...(accType === undefined ? {} : { accType: accType as AccommodationType }),
    ...(stars === undefined ? {} : { stars }),
  };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  if (value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export default router;
