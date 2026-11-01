export type ItineraryItemType = 'attraction' | 'food' | 'hotel' | 'transport' | 'entertainment';
export type MealSlot = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';

export interface ItineraryRequest {
  budget: number;
  days: number;
  guestCount: number;
  startDate: string;
  needs: Array<'accommodation' | 'food' | 'attractions' | 'entertainment'>;
  accType?: string;
  stars?: number;
  prefs: string[];
}

export interface GeneratedItineraryItem {
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

export interface FoodSuggestion {
  catalogPlaceId: number;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  price: number;
  mealSlot: MealSlot;
}

export interface DaySuggestions {
  day: number;
  date?: string;
  breakfast: FoodSuggestion[];
  lunch: FoodSuggestion[];
  snack: FoodSuggestion[];
  dinner: FoodSuggestion[];
}

export interface ItineraryFoodSelection {
  day: number;
  mealPeriod: MealSlot;
  catalogPlaceId: number;
}

export interface GeneratedItinerary {
  itineraryId?: number;
  status?: 'DRAFT';
  startDate?: string;
  guestCount?: number;
  needs?: string[];
  days: Array<{ day: number; date?: string; items: GeneratedItineraryItem[] }>;
  suggestions: DaySuggestions[];
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
  recommendations: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    imageUrl: string;
  }>;
  generatedAt: string;
  trainingExampleId?: number;
}

export interface ManagedItineraryItem extends GeneratedItineraryItem {
  day: number;
  unitPrice: number;
  quantity: number;
}

export interface ManagedItinerary {
  id: number;
  title: string;
  status: "DRAFT" | "SAVED" | "ARCHIVED";
  startDate: string;
  dayCount: number;
  guestCount: number;
  budget: number;
  estimatedTotal: number;
  budgetStatus: "within-budget" | "over-budget";
  itemCount?: number;
  imageUrl?: string | null;
  items: ManagedItineraryItem[];
}

export interface ManagedItineraryUpdate {
  title: string;
  startDate: string;
  dayCount: number;
  guestCount: number;
  budget: number;
  items: ManagedItineraryItem[];
}

export interface ItineraryCatalogOption {
  catalogPlaceId: number;
  itemType: Exclude<ItineraryItemType, "transport">;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  price: number;
  durationMinutes: number | null;
  priceBasis: "PER_PERSON" | "PER_ROOM";
  roomCapacity: number | null;
  mealPeriod: MealSlot | null;
}

/** Lựa chọn của user cho 1 ngày */
export interface DayFoodSelections {
  day: number;
  breakfast: FoodSuggestion | null;
  lunch: FoodSuggestion | null;
  snack: FoodSuggestion | null;
  dinner: FoodSuggestion | null;
}
