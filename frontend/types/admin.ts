export type UserAccountStatus = 'ACTIVE' | 'LOCKED';
export type PartnerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';
export type PlaceCategory = 'luutru' | 'amthuc' | 'diemdulich';
export type PlaceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type ReviewStatus = 'ACTIVE' | 'HIDDEN';
export type QuestionType = 'STAR' | 'TEXT';

export interface AdminDashboardStats {
  totalUsers: number;
  totalPartners: number;
  pendingPartners: number;
  totalPlaces: number;
  totalReviews: number;
  totalSurveys: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'USER' | 'PARTNER' | 'ADMIN';
  status: UserAccountStatus;
  createdAt: string;
  avatarUrl?: string;
}

export interface AdminPartnerItem {
  id: string;
  userId: string;
  businessName: string;
  serviceType: 'STAY' | 'TABLE' | 'TICKET';
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  status: PartnerApprovalStatus;
  rejectReason?: string;
  createdAt: string;
}

export interface AdminPlaceItem {
  id: string;
  name: string;
  category: PlaceCategory;
  partnerId?: string;
  partnerName?: string;
  address: string;
  priceText: string;
  status: PlaceStatus;
  createdAt: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
}

export interface AdminReviewItem {
  id: string;
  placeId: string;
  placeName: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  isReported: boolean;
  reportReason?: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: QuestionType;
}

export interface SurveySummary {
  questionId: string;
  averageStar?: number;
  totalAnswers: number;
  sampleResponses?: string[];
}

export interface AdminSurveyItem {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  responseCount: number;
  createdAt: string;
  summaries?: SurveySummary[];
}

export interface AdminTodoItem {
  id: string;
  type: 'PENDING_PARTNER' | 'REPORTED_REVIEW' | 'PENDING_PLACE';
  title: string;
  description: string;
  targetId: string;
  createdAt: string;
}

export interface DailyUserStat {
  date: string;
  count: number;
}
