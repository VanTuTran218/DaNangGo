export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'CANCELLED';
export type SubscriptionPaymentStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface SubscriptionPackage {
  package_id: number;
  package_code: string;
  name: string;
  duration_months: number;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface PartnerSubscriptionItem {
  id: number;
  transactionCode: string;
  bankInfo?: BankTransferInfo;
  qrUrl?: string | null;
  partnerId: number;
  packageId: number;
  packageName: string;
  durationMonths: number;
  price: number;
  subscriptionStatus: SubscriptionStatus;
  paymentStatus: SubscriptionPaymentStatus;
  paymentMethod: string;
  paymentReference: string | null;
  paymentProofNote: string | null;
  paymentSubmittedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  confirmedBy: number | null;
  confirmedAt: string | null;
  adminName?: string | null;
  rejectionReason: string | null;
  isRenewal: boolean;
  businessName?: string;
  contactPhone?: string | null;
  partnerEmail?: string;
  partnerUserName?: string;
  automaticConfirmationEnabled: boolean;
}

export interface BankTransferInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
}

export interface CreateSubscriptionResponse {
  subscription: PartnerSubscriptionItem;
  bankInfo: BankTransferInfo;
  transferSyntax: string;
  qrUrl: string | null;
}

export interface PartnerCurrentSubscriptionResponse {
  hasActiveSubscription: boolean;
  currentSubscription: PartnerSubscriptionItem | null;
  daysRemaining: number;
  isExpiringSoon: boolean;
}

export interface RevenueStats {
  totalRevenue: number;
  totalConfirmedCount: number;
  totalPendingCount: number;
  totalRejectedCount: number;
  activePackagesCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  byPackage: { packageCode: string; packageName: string; revenue: number; count: number }[];
  byDay: { date: string; revenue: number; count: number }[];
  byMonth: { month: string; revenue: number; count: number }[];
}
