export type ItineraryItemType = 'attraction' | 'food' | 'hotel' | 'transport';

export interface ItineraryRequest {
  budget: number;
  days: number;
  guestCount: number;
  startDate: string;
  needs: Array<'accommodation' | 'food' | 'attractions'>;
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
}

export interface GeneratedItinerary {
  itineraryId?: number;
  status?: 'DRAFT';
  startDate?: string;
  guestCount?: number;
  days: Array<{ day: number; date?: string; items: GeneratedItineraryItem[] }>;
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
  trainingExampleId: number;
}
