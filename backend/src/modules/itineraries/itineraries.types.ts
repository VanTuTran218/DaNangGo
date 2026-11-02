export const ITINERARY_PREFERENCES = [
  'Ẩm thực địa phương',
  'Biển & Nghỉ dưỡng',
  'Di sản & Văn hoá',
  'Phiêu lưu mạo hiểm',
  'Check-in sống ảo',
] as const;

export type ItineraryPreference = (typeof ITINERARY_PREFERENCES)[number];
export type AccommodationType = 'Khách sạn' | 'Resort' | 'Homestay' | 'Cắm trại';
export type ItineraryItemType = 'attraction' | 'food' | 'hotel' | 'transport' | 'entertainment';
export type CatalogPlaceKind = 'STAY' | 'FOOD' | 'ATTRACTION' | 'ENTERTAINMENT';
export type MealPeriod = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';
export type ItineraryNeed = 'accommodation' | 'food' | 'attractions' | 'entertainment';

export interface ItineraryCatalogPlace {
  id: number;
  slug: string;
  kind: CatalogPlaceKind;
  name: string;
  description: string;
  address: string;
  price: number;
  accommodationType: AccommodationType | null;
  stars: number | null;
  mealPeriod: MealPeriod | null;
  imageUrl: string;
  preferences: ItineraryPreference[];
  openingTime: string | null;
  closingTime: string | null;
  visitDurationMinutes: number | null;
  roomType: string | null;
  roomCapacity: number | null;
  priceBasis: 'PER_PERSON' | 'PER_ROOM';
}

export interface ManagedItineraryCatalogOption {
  catalogPlaceId: number;
  itemType: Exclude<ItineraryItemType, 'transport'>;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  price: number;
  durationMinutes: number | null;
  priceBasis: 'PER_PERSON' | 'PER_ROOM';
  roomCapacity: number | null;
  mealPeriod: MealPeriod | null;
}

export interface GenerateItineraryInput {
  budget: number;
  days: number;
  guestCount: number;
  startDate: string;
  needs: ItineraryNeed[];
  accType?: AccommodationType;
  stars?: number;
  prefs: ItineraryPreference[];
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: ItineraryItemType;
  location?: string;
  imageUrl?: string;
  estimatedCost: number;
  catalogPlaceId?: number;
  unitPrice?: number;
  durationMinutes?: number | null;
  quantity?: number;
}

export interface ItineraryRecommendation {
  id: string;
  title: string;
  category: string;
  price: number;
  imageUrl: string;
}

export interface ItineraryFoodSelection {
  day: number;
  mealPeriod: MealPeriod;
  catalogPlaceId: number;
}

export interface ItineraryFoodSuggestion {
  catalogPlaceId: number;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  price: number;
  mealSlot: MealPeriod;
}

export interface DayFoodSuggestions {
  day: number;
  date: string;
  breakfast: ItineraryFoodSuggestion[];
  lunch: ItineraryFoodSuggestion[];
  snack: ItineraryFoodSuggestion[];
  dinner: ItineraryFoodSuggestion[];
}

export interface GeneratedItinerary {
  itineraryId?: number;
  status?: 'DRAFT';
  startDate?: string;
  guestCount?: number;
  needs?: ItineraryNeed[];
  days: Array<{ day: number; date?: string; items: ItineraryItem[] }>;
  suggestions: DayFoodSuggestions[];
  summary: {
    budget: number;
    estimatedTotal: number;
    remainingBudget: number;
    budgetStatus: 'within-budget' | 'over-budget';
    overBudgetAmount: number;
    costs: {
      accommodation: number;
      food: number;
      transport: number;
      attractions: number;
      entertainment: number;
      contingency: number;
    };
  };
  notices: string[];
  recommendations: ItineraryRecommendation[];
  generatedAt: string;
}

export interface ManagedItineraryItem extends Omit<ItineraryItem, 'unitPrice' | 'quantity'> {
  day: number;
  unitPrice: number;
  quantity: number;
}

export interface ManagedItinerary {
  id: number;
  title: string;
  status: 'DRAFT' | 'SAVED' | 'ARCHIVED';
  startDate: string;
  dayCount: number;
  guestCount: number;
  budget: number;
  estimatedTotal: number;
  budgetStatus: 'within-budget' | 'over-budget';
  items: ManagedItineraryItem[];
}
