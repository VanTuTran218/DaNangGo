import { Router, type Request, type Response } from 'express';
import {
  ITINERARY_PREFERENCES,
  type AccommodationType,
  type GenerateItineraryInput,
  type ItineraryNeed,
} from './itineraries.types';
import { generateItinerary, isItineraryPreference } from './itineraries.service';
import { getItineraryCatalog, getUserItineraryPreferences, saveDraftItinerary } from './itineraries.repository';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();
const ACCOMMODATION_TYPES: AccommodationType[] = ['Khách sạn', 'Resort', 'Homestay', 'Cắm trại'];
const ITINERARY_NEEDS: ItineraryNeed[] = ['accommodation', 'food', 'attractions'];

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

  try {
    const catalog = await getItineraryCatalog();
    const itinerary = generateItinerary(input, catalog);
    const saved = await saveDraftItinerary(input, itinerary, user.id);
    return res.status(201).json({
      success: true,
      data: { ...itinerary, itineraryId: saved.itineraryId, status: 'DRAFT' },
      trainingExampleId: saved.trainingExampleId,
    });
  } catch (error) {
    console.error('Lỗi tạo và lưu lịch trình:', error);
    return res.status(500).json({ success: false, message: 'Không thể tạo và lưu lịch trình lúc này.' });
  }
});

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
    prefs: (prefs ?? []) as GenerateItineraryInput['prefs'],
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
