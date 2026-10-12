export type ServiceType = 'STAY' | 'TABLE' | 'TICKET';
export type PartnerPlaceCategory = 'luutru' | 'amthuc' | 'diemdulich';
export type PartnerPlaceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'TRANSFER';
export type PartnerAccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LOCKED';

export interface PartnerDashboardStats {
  totalPlaces: number;
  totalViews: number;
  totalBookings: number;
  avgRating: number;
}

export interface PartnerPlace {
  id: string;
  name: string;
  category: PartnerPlaceCategory;
  description: string;
  address: string;
  area: string;
  priceMin: number;
  priceMax?: number;
  priceUnit?: string;
  openHours: string;
  openDays: string[];
  amenities: string[];
  images: string[];
  lat: number;
  lng: number;
  status: PartnerPlaceStatus;
  rejectReason?: string;
  createdAt: string;
}

export interface PartnerBooking {
  id: string;
  bookingCode: string;
  placeId: string;
  placeName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  numGuests: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  createdAt: string;
}

export interface PartnerReviewReply {
  content: string;
  createdAt: string;
}

export interface PartnerReview {
  id: string;
  placeId: string;
  placeName: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: PartnerReviewReply;
}

export interface PartnerProfile {
  id: string;
  businessName: string;
  serviceType: ServiceType;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  status: PartnerAccountStatus;
  rejectReason?: string;
}

export interface DailyBookingStat {
  date: string;
  count: number;
}
