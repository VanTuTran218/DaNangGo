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
  stayFacts?: import("./chat.stay-facts").ChatStayFacts;
}

export interface ChatMessageDto {
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

export interface SendMessageInput {
  sessionId?: number | null;
  message: string;
  location?: ChatLocation;
  userId?: number | null;
  /** Danh tính khách lấy từ cookie HttpOnly, không lấy từ JSON client. */
  guestId?: string;
}

export interface SendMessageResponse {
  sessionId: number;
  message: ChatMessageDto;
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
  preferences?: import("./chat.trip-preferences").TripPreferences;
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
