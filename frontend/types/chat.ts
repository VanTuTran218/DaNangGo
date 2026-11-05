export type ChatSender = "USER" | "AI";

export interface ChatPlaceCard {
  placeId: number;
  name: string;
  placeType: "ACCOMMODATION" | "RESTAURANT" | "ATTRACTION";
  address: string | null;
  districtName?: string | null;
  rating: number;
  reviewCount: number;
  imageUrl?: string | null;
  priceText?: string | null;
  detailUrl: string;
  /** Lý do AI gợi ý địa điểm này (từ ChatAnswerSchema). */
  reason?: string;
  distanceKm?: number;
  distanceOriginName?: string;
  stayFacts?: {
    hours?: {
      checkIn: string;
      checkOut: string;
      sourceUrl: string;
      checkedOn: string;
    };
    rooms: {
      name: string;
      occupancyText: string;
      sourceUrl: string;
      checkedOn: string;
    }[];
    publicRates: {
      roomName: string;
      nightlyVnd: number;
      includedGuests: number;
      validFrom: string;
      validTo: string;
      conditions: string;
      sourceUrl: string;
      checkedOn: string;
    }[];
    notices: string[];
  };
}

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  places?: ChatPlaceCard[];
  travelPlan?: ChatTravelPlan;
  comparison?: ChatComparison;
  quickReplies?: string[];
  actionLink?: {
    text: string;
    url: string;
  };
  feedback?: "helpful" | "unhelpful" | null;
  savedItineraryId?: number;
  createdAt: string;
}

export interface SendMessageResponse {
  sessionId: number;
  message: ChatMessage;
}

export interface ChatPlanItem {
  id?: string;
  durationMinutes?: number;
  estimatedCost?: number | null;
  kind?: "arrival" | "departure" | "rest";
  title: string;
  detail: string;
  place?: ChatPlaceCard;
}
export interface ChatComparison {
  places: ChatPlaceCard[];
  rows: { label: string; values: string[] }[];
  notices: string[];
}
export interface ChatTravelPlan {
  preferences?: {
    arrivalTime?: string;
    departureTime?: string;
    transport?: "car" | "motorbike" | "taxi" | "walk" | "bus";
    adults?: number;
    children?: number;
    childAges: number[];
    hasChildren?: boolean;
    seniors?: boolean;
    avoidWalking?: boolean;
    pace?: "gentle" | "active";
  };
  questions?: string[];
  title: string;
  dayCount: number;
  guestCount: number | null;
  startDate: string | null;
  budget: number | null;
  assumptions: string[];
  days: {
    day: number;
    date: string | null;
    area: string;
    periods: { label: string; time: string; items: ChatPlanItem[] }[];
  }[];
  groups: { title: string; places: ChatPlaceCard[] }[];
  costs: {
    accommodation: number | null;
    tickets: number | null;
    knownSubtotal: number | null;
    foodAllowance: number | null;
    remaining: number | null;
    transportAllowance?: number;
    contingencyAllowance?: number;
    contingencyPercent?: number;
    projectedSubtotal?: number;
    roomNote: string;
  };
  notes: string[];
}

export interface ChatSessionSummary {
  id: number;
  title: string;
  updatedAt: string;
}
export interface ChatLocation {
  latitude: number;
  longitude: number;
  radiusKm: 2 | 5 | 10;
}
