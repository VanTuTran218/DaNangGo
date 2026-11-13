'use client';

import { useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getActivePackages,
  getCurrentSubscription,
  getMySubscriptions,
  registerSubscription,
  submitPaymentProof,
} from '@/lib/api/subscription';
import type {
  CreateSubscriptionResponse,
  PartnerSubscriptionItem,
  SubscriptionPackage,
} from '@/types/subscription';
import PartnerStatusBadge from '@/components/partner/PartnerStatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Crown,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

export default function PartnerSubscriptionPage() {
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeInstruction, setActiveInstruction] = useState<CreateSubscriptionResponse | null>(null);
  const [proofSubscription, setProofSubscription] = useState<PartnerSubscriptionItem | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentNoteInput, setPaymentNoteInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    data: packages,
    loading: loadingPackages,
    error: errorPackages,
    reload: reloadPackages,
  } = useAsyncData(getActivePackages);

  const {
    data: currentSubData,
    loading: loadingCurrent,
    reload: reloadCurrent,
  } = useAsyncData(getCurrentSubscription);

  const {
    data: history,
    loading: loadingHistory,
    reload: reloadHistory,
  } = useAsyncData(getMySubscriptions);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast('Đã sao chép nội dung chuyển khoản!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegisterConfirm = async () => {
    if (!selectedPackage) return;
    setActionLoading(true);
    try {
      const isRenewal = Boolean(currentSubData?.hasActiveSubscription);
      const res = await registerSubscription(selectedPackage.package_id, isRenewal);
      setActiveInstruction(res);
      setSelectedPackage(null);
      showToast('Đã tạo yêu cầu đăng ký gói. Vui lòng chuyển khoản theo hướng dẫn.');
      reloadCurrent();
      reloadHistory();
    } catch (err: any) {
      showToast(err?.message || 'Không thể đăng ký gói. Vui lòng thử lại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubId = proofSubscription?.id || activeInstruction?.subscription.id;
    if (!targetSubId) return;
    const automaticConfirmationEnabled = Boolean(
      activeInstruction?.subscription.automaticConfirmationEnabled ||
        proofSubscription?.automaticConfirmationEnabled
    );

    if (!paymentRefInput.trim() && !paymentNoteInput.trim()) {
      showToast(
        automaticConfirmationEnabled
          ? 'Không cần gửi thông tin bổ sung nếu SePay đã tự nhận diện giao dịch. Nếu chưa được xác nhận, hãy nhập mã giao dịch để Admin đối soát.'
          : 'SePay chưa bật tự đối soát. Hãy nhập mã giao dịch hoặc ghi chú để Admin kiểm tra khoản chuyển.',
        'error'
      );
      return;
    }

    setActionLoading(true);
    try {
      await submitPaymentProof(targetSubId, paymentRefInput, paymentNoteInput);
      showToast(
        automaticConfirmationEnabled
          ? 'Đã gửi thông tin bổ sung. SePay sẽ tự xác nhận khi giao dịch khớp.'
          : 'Đã gửi thông tin cho Admin đối soát. Gói sẽ được kích hoạt sau khi Admin xác nhận.'
      );
      setActiveInstruction(null);
      setProofSubscription(null);
      setPaymentRefInput('');
      setPaymentNoteInput('');
      reloadCurrent();
      reloadHistory();
    } catch (err: any) {
      showToast(err?.message || 'Không thể gửi thông tin thanh toán.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const current = currentSubData?.currentSubscription;
  const isExpiringSoon = currentSubData?.isExpiringSoon;
  const daysRemaining = currentSubData?.daysRemaining ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-extrabold text-[#14233B] flex items-center gap-2.5 tracking-tight">
            <span className="w-10 h-10 rounded-xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] inline-flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </span>
            <span>Gói hoạt động nền tảng</span>
          </h1>
          <p className="text-sm text-[#68798A] mt-1.5">
            Đăng ký gói dịch vụ để đăng cơ sở kinh doanh, quản lý dịch vụ và tiếp cận khách du lịch tại Đà Nẵng.
          </p>
        </div>
        <button
          onClick={() => {
            reloadPackages();
            reloadCurrent();
            reloadHistory();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#14233B] bg-white border border-[#E2ECEC] rounded-xl hover:bg-[#E9F8F5]/60 hover:border-[#BDE8E0] hover:text-[#008F89] shadow-2xs transition-all self-start active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-xs ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-[#E9F8F5] text-[#073B3A] border-[#BDE8E0]'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* A. Thẻ Gói Đang Hoạt Động */}
      {loadingCurrent ? (
        <div className="p-7 bg-white rounded-[22px] border border-[#E2ECEC] animate-pulse space-y-3">
          <div className="h-6 w-1/3 bg-slate-200 rounded-md" />
          <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
        </div>
      ) : current ? (
        <div
          className={`relative overflow-hidden p-6 sm:p-8 rounded-[22px] border shadow-md transition-all ${
            isExpiringSoon
              ? 'bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-50 border-amber-200/90 text-amber-950'
              : 'bg-gradient-to-br from-[#052E2D] via-[#073B3A] to-[#008F89] text-white border-[#073B3A]'
          }`}
        >
          {/* Họa tiết sóng biển nhẹ trong thẻ gói */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-15 overflow-hidden">
            <svg
              className="w-full h-28 text-white"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,35 C300,115 650,-30 1200,55 L1200,120 L0,120 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                    isExpiringSoon
                      ? 'bg-amber-100 text-[#FF8A24]'
                      : 'bg-white/12 border border-white/15 text-[#FF8A24]'
                  }`}
                >
                  <Crown className="w-5 h-5 fill-current" />
                </div>
                <span
                  className={`text-xs uppercase font-extrabold tracking-widest ${
                    isExpiringSoon ? 'text-amber-800' : 'text-[#6EE7B7]'
                  }`}
                >
                  Gói dịch vụ đang kích hoạt
                </span>
                <PartnerStatusBadge status={current.subscriptionStatus} />
              </div>

              <div>
                <h2
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isExpiringSoon ? 'text-[#14233B]' : 'text-white'
                  }`}
                >
                  {current.packageName} ({current.durationMonths} tháng)
                </h2>
              </div>

              {/* Chia nhóm thông tin ngày bắt đầu, ngày hết hạn, số ngày còn lại */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div
                  className={`px-4 py-2.5 rounded-xl border ${
                    isExpiringSoon
                      ? 'bg-white/80 border-amber-200 text-amber-950'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1.5 ${
                      isExpiringSoon ? 'text-[#68798A]' : 'text-teal-100/80'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Ngày bắt đầu
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    {current.startDate
                      ? new Date(current.startDate).toLocaleDateString('vi-VN')
                      : '---'}
                  </p>
                </div>

                <div
                  className={`px-4 py-2.5 rounded-xl border ${
                    isExpiringSoon
                      ? 'bg-white/80 border-amber-200 text-amber-950'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1.5 ${
                      isExpiringSoon ? 'text-[#68798A]' : 'text-teal-100/80'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Ngày hết hạn
                  </p>
                  <p className="text-sm font-bold mt-0.5">
                    {current.endDate
                      ? new Date(current.endDate).toLocaleDateString('vi-VN')
                      : '---'}
                  </p>
                </div>

                <div
                  className={`px-4 py-2.5 rounded-xl border ${
                    isExpiringSoon
                      ? 'bg-amber-100/80 border-amber-300 text-amber-950'
                      : 'bg-white/15 border-white/25 text-white'
                  }`}
                >
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1.5 ${
                      isExpiringSoon ? 'text-amber-800' : 'text-[#6EE7B7]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF8A24]" />
                    Thời hạn còn lại
                  </p>
                  <p className="text-sm font-extrabold mt-0.5 underline decoration-[#FF8A24] underline-offset-4">
                    {daysRemaining} ngày
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="#pricing-section"
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center shadow-md active:scale-[0.98] ${
                  isExpiringSoon
                    ? 'bg-[#FF8A24] hover:bg-[#f07b16] text-white'
                    : 'bg-[#FF8A24] hover:bg-[#f07b16] text-white shadow-black/20'
                }`}
              >
                Gia hạn thêm thời gian
              </a>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="relative z-10 mt-5 pt-4 border-t border-amber-200/80 flex items-center gap-2.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Gói của bạn sắp hết hạn trong {daysRemaining} ngày tới. Hãy đăng ký gia hạn sớm để duy trì hoạt động cơ sở liên tục, thời hạn mới sẽ được tự động cộng nối tiếp!
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-amber-50/90 border border-amber-200 rounded-[20px] text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#14233B]">
                Bạn chưa có gói hoạt động đang hiệu lực
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                Để đăng cơ sở dịch vụ mới (khách sạn, nhà hàng, điểm tham quan) và quản lý kinh doanh trên DaNangGo, bạn cần đăng ký và kích hoạt một trong các gói bên dưới.
              </p>
            </div>
          </div>
          <a
            href="#pricing-section"
            className="px-5 py-2.5 bg-[#FF8A24] hover:bg-[#f07b16] text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs transition-all"
          >
            Chọn gói đăng ký ngay
          </a>
        </div>
      )}

      {/* B. Bảng Giá Gói Đăng Ký */}
      <div id="pricing-section" className="space-y-6 pt-2">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="inline-block px-3 py-1 rounded-full bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] text-[11px] font-bold uppercase tracking-wider">
            Membership Đối Tác
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#14233B]">
            Bảng giá gói đăng ký DaNangGo
          </h2>
          <p className="text-xs sm:text-sm text-[#68798A]">
            Giá niêm yết chính thức từ SQL Server. Thanh toán qua chuyển khoản ngân hàng và được Admin đối soát xác nhận.
          </p>
        </div>

        {loadingPackages ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 bg-white border border-[#E2ECEC] rounded-[20px] animate-pulse p-6"
              />
            ))}
          </div>
        ) : errorPackages ? (
          <div className="p-6 bg-rose-50 rounded-[20px] border border-rose-200 text-rose-700 text-center">
            <p className="font-semibold mb-2">{errorPackages}</p>
            <button
              onClick={reloadPackages}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold text-xs"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
            {(packages || []).map((pkg) => {
              const isBestValue = pkg.package_code === '6_MONTHS';
              const isMaxSaving = pkg.package_code === '1_YEAR';

              return (
                <div
                  key={pkg.package_id}
                  className={`bg-white rounded-[20px] p-6 sm:p-7 border transition-all duration-200 relative flex flex-col justify-between h-full hover:-translate-y-1 ${
                    isBestValue
                      ? 'border-[#008F89] ring-2 ring-[#14B8A6]/20 shadow-lg'
                      : isMaxSaving
                      ? 'border-[#BDE8E0] hover:border-[#008F89] shadow-sm hover:shadow-md'
                      : 'border-[#E2ECEC] hover:border-[#BDE8E0] shadow-xs hover:shadow-md'
                  }`}
                >
                  {isBestValue && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#073B3A] to-[#008F89] text-white text-[11px] font-extrabold uppercase px-4 py-1 rounded-full shadow-sm tracking-wider whitespace-nowrap">
                      Phổ biến nhất
                    </span>
                  )}
                  {isMaxSaving && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF8A24] text-white text-[11px] font-extrabold uppercase px-4 py-1 rounded-full shadow-sm tracking-wider whitespace-nowrap">
                      Tiết kiệm nhất
                    </span>
                  )}

                  <div className="space-y-5">
                    <div className="border-b border-[#E2ECEC] pb-4">
                      <h3 className="text-lg font-extrabold text-[#14233B]">{pkg.name}</h3>
                      <p className="text-xs text-[#68798A] mt-1.5 min-h-[34px] leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="py-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[32px] font-extrabold text-[#14233B] tracking-tight">
                          {Number(pkg.price).toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs font-bold text-[#68798A]">VNĐ</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-[#E9F8F5] text-[#008F89] text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Thời hạn: {pkg.duration_months} tháng sử dụng</span>
                      </div>
                    </div>

                    {/* Quyền lợi */}
                    <ul className="space-y-3 text-xs sm:text-[13px] text-[#14233B]/90 pt-3 border-t border-[#E2ECEC]/80">
                      <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#E9F8F5] text-[#008F89] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                        <span>Đăng tải và quản lý cơ sở không giới hạn</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#E9F8F5] text-[#008F89] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                        <span>Hiển thị trên bản đồ số & gợi ý lộ trình</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#E9F8F5] text-[#008F89] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                        <span>Nhận và phản hồi đánh giá của khách du lịch</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#E9F8F5] text-[#008F89] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                        <span>Gia hạn tự động cộng nối tiếp thời gian</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 mt-2">
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full h-11 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] ${
                        isBestValue
                          ? 'bg-[#008F89] hover:bg-[#073B3A] text-white shadow-md shadow-[#008F89]/20'
                          : isMaxSaving
                          ? 'bg-[#FF8A24] hover:bg-[#f07b16] text-white shadow-md shadow-[#FF8A24]/20'
                          : 'bg-[#14233B] hover:bg-[#073B3A] text-white shadow-xs'
                      }`}
                    >
                      {current ? 'Đăng ký gia hạn' : 'Đăng ký gói này'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lịch sử đăng ký & gia hạn gói */}
      <div className="space-y-4 pt-6 border-t border-[#E2ECEC]">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#14233B]">
            Lịch sử đăng ký & gia hạn gói
          </h2>
          <p className="text-xs sm:text-sm text-[#68798A] mt-0.5">
            Theo dõi tình trạng xét duyệt thanh toán, mã tham chiếu và thời hạn từng gói.
          </p>
        </div>

        {loadingHistory ? (
          <div className="p-10 bg-white rounded-[20px] border border-[#E2ECEC] animate-pulse text-center text-xs text-[#68798A]">
            Đang tải lịch sử đăng ký...
          </div>
        ) : !history || history.length === 0 ? (
          <div className="p-12 bg-white rounded-[20px] border border-[#E2ECEC] text-center space-y-2.5">
            <div className="w-14 h-14 rounded-full bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center mx-auto">
              <PackageCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#14233B]">Chưa có lịch sử đăng ký</p>
            <p className="text-xs text-[#68798A]">
              Các gói bạn đăng ký sẽ hiển thị đầy đủ tại đây.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-[#E2ECEC] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-[13px] border-collapse">
                <thead className="bg-[#EEF7F6]/90 border-b border-[#E2ECEC] text-[#073B3A] text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Mã giao dịch</th>
                    <th className="px-5 py-4">Tên gói</th>
                    <th className="px-5 py-4">Số tiền (VNĐ)</th>
                    <th className="px-5 py-4">Thời hạn gói</th>
                    <th className="px-5 py-4">Thanh toán</th>
                    <th className="px-5 py-4">Trạng thái gói</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2ECEC]/80 text-[#14233B]">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F6FAFA] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#008F89]">
                        {item.transactionCode}
                        {item.isRenewal && (
                          <span className="block text-[10px] text-[#68798A] font-sans font-semibold mt-0.5">
                            (Gia hạn)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#14233B]">
                        {item.packageName}
                        <span className="block text-[#68798A] font-normal text-[11px] mt-0.5">
                          Tạo ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-extrabold text-[#14233B]">
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-5 py-4 text-[#68798A] font-medium">
                        {item.startDate && item.endDate ? (
                          <>
                            {new Date(item.startDate).toLocaleDateString('vi-VN')} -{' '}
                            {new Date(item.endDate).toLocaleDateString('vi-VN')}
                          </>
                        ) : (
                          <span className="text-[#68798A]/70 italic">Chờ kích hoạt</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <PartnerStatusBadge
                          status={item.paymentStatus}
                          customLabel={
                            item.paymentStatus === 'PAID'
                              ? 'Đã thanh toán'
                              : item.paymentStatus === 'REJECTED'
                              ? 'Từ chối'
                              : 'Chờ đối soát'
                          }
                        />
                        {item.paymentReference && (
                          <span className="block text-[11px] text-[#68798A] mt-1">
                            Ref: {item.paymentReference}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <PartnerStatusBadge
                          status={item.subscriptionStatus}
                          customLabel={
                            item.subscriptionStatus === 'ACTIVE'
                              ? 'Đang hoạt động'
                              : item.subscriptionStatus === 'EXPIRED'
                              ? 'Hết hạn'
                              : item.subscriptionStatus === 'REJECTED'
                              ? 'Đã từ chối'
                              : 'Chờ kích hoạt'
                          }
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {item.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => {
                              setProofSubscription(item);
                              setPaymentRefInput(item.paymentReference || '');
                              setPaymentNoteInput(item.paymentProofNote || '');
                            }}
                            className="px-3.5 py-2 bg-[#E9F8F5] hover:bg-[#008F89] text-[#008F89] hover:text-white border border-[#BDE8E0] font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Gửi mã CK
                          </button>
                        )}
                        {item.rejectionReason && (
                          <span
                            title={item.rejectionReason}
                            className="inline-block text-[11px] text-rose-600 font-semibold cursor-help"
                          >
                            Lý do từ chối: {item.rejectionReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Registration Dialog */}
      <ConfirmDialog
        isOpen={Boolean(selectedPackage)}
        onClose={() => setSelectedPackage(null)}
        onConfirm={handleRegisterConfirm}
        title={
          current
            ? `Xác nhận gia hạn ${selectedPackage?.name}`
            : `Xác nhận đăng ký ${selectedPackage?.name}`
        }
        description={`Bạn đang chuẩn bị đăng ký ${selectedPackage?.name} với mức phí ${Number(
          selectedPackage?.price || 0
        ).toLocaleString('vi-VN')} VNĐ cho thời hạn ${
          selectedPackage?.duration_months
        } tháng. Hệ thống sẽ tạo mã giao dịch để bạn chuyển khoản thanh toán.`}
        confirmText="Tạo mã giao dịch"
        loading={actionLoading}
      />

      {/* Payment Instruction & Proof Modal */}
      {(activeInstruction || proofSubscription) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B3A]/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E2ECEC] relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveInstruction(null);
                setProofSubscription(null);
              }}
              className="absolute right-4 top-4 p-1.5 text-[#68798A] hover:text-[#14233B] hover:bg-[#F6FAFA] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E9F8F5] border border-[#BDE8E0] text-[#008F89] flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14233B]">
                  Thông tin chuyển khoản ngân hàng
                </h3>
                <p className="text-xs text-[#68798A]">
                  Vui lòng chuyển khoản chính xác nội dung bên dưới.
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                activeInstruction?.subscription.automaticConfirmationEnabled ||
                proofSubscription?.automaticConfirmationEnabled
                  ? 'border-[#BDE8E0] bg-[#E9F8F5] text-[#073B3A]'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {activeInstruction?.subscription.automaticConfirmationEnabled ||
              proofSubscription?.automaticConfirmationEnabled
                ? 'Backend đã có khóa xác thực webhook. Tự đối soát chỉ hoạt động nếu webhook SePay đã được tạo và trỏ đến hệ thống này. Hãy chuyển đúng số tiền và giữ nguyên nội dung chuyển khoản.'
                : 'SePay chưa được cấu hình tự động. Sau khi chuyển khoản, giao dịch sẽ chờ Admin đối soát và xác nhận để kích hoạt gói.'}
            </div>

            {(activeInstruction?.qrUrl || proofSubscription?.qrUrl) && (
              <div className="flex justify-center rounded-2xl border border-[#E2ECEC] bg-[#F6FAFA] p-4">
                <img
                  src={activeInstruction?.qrUrl || proofSubscription?.qrUrl || ''}
                  alt="Mã QR chuyển khoản gói dịch vụ"
                  className="h-56 w-56 object-contain"
                />
              </div>
            )}

            {/* Bank Card Info */}
            <div className="p-5 bg-gradient-to-br from-[#052E2D] to-[#073B3A] text-white rounded-2xl space-y-3.5 shadow-md">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs uppercase tracking-wider text-teal-100/70 font-semibold">
                  Ngân hàng
                </span>
                <span className="text-sm font-bold text-[#6EE7B7]">
                  {activeInstruction?.bankInfo.bankName ||
                    proofSubscription?.bankInfo?.bankName ||
                    'Chưa cấu hình'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs uppercase tracking-wider text-teal-100/70 font-semibold">
                  Số tài khoản
                </span>
                <span className="text-base font-mono font-bold text-white tracking-widest">
                  {activeInstruction?.bankInfo.accountNumber ||
                    proofSubscription?.bankInfo?.accountNumber ||
                    'Chưa cấu hình'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs uppercase tracking-wider text-teal-100/70 font-semibold">
                  Chủ tài khoản
                </span>
                <span className="text-xs font-bold text-white uppercase">
                  {activeInstruction?.bankInfo.accountHolder ||
                    proofSubscription?.bankInfo?.accountHolder ||
                    'Chưa cấu hình'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs uppercase tracking-wider text-teal-100/70 font-semibold">
                  Số tiền cần chuyển
                </span>
                <span className="text-lg font-black text-[#FF8A24]">
                  {Number(
                    activeInstruction?.subscription.price || proofSubscription?.price || 0
                  ).toLocaleString('vi-VN')}{' '}
                  VNĐ
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <span className="text-xs uppercase tracking-wider text-teal-100/70 font-semibold block">
                  Nội dung chuyển khoản (mã riêng cho yêu cầu này):
                </span>
                <div className="flex items-center justify-between p-3 bg-black/25 rounded-xl border border-white/15 font-mono text-xs text-[#6EE7B7] font-bold">
                  <span>
                    {activeInstruction?.subscription.transactionCode ||
                      proofSubscription?.transactionCode}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `${
                          activeInstruction?.subscription.transactionCode ||
                          proofSubscription?.transactionCode
                        }`
                      )
                    }
                    className="p-1 hover:text-white transition-colors"
                    title="Sao chép"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Form submit proof */}
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#14233B]">
                  Mã giao dịch ngân hàng (nếu có)
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã trên biên nhận để Admin dễ đối soát"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl text-xs font-semibold text-[#14233B] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#14233B]">
                  Ghi chú đối soát (nếu có)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm tên ngân hàng chuyển, tên người chuyển khoản..."
                  value={paymentNoteInput}
                  onChange={(e) => setPaymentNoteInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F6FAFA] border border-[#E2ECEC] rounded-xl text-xs text-[#14233B] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2ECEC]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveInstruction(null);
                    setProofSubscription(null);
                  }}
                  className="px-4 py-2.5 bg-[#F6FAFA] hover:bg-slate-100 text-[#14233B] border border-[#E2ECEC] font-bold text-xs rounded-xl transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#008F89] hover:bg-[#073B3A] text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {actionLoading ? 'Đang gửi...' : 'Gửi thông tin bổ sung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
