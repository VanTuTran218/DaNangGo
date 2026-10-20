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
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  AlertTriangle,
  Building,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Crown,
  FileText,
  HelpCircle,
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

    if (!paymentRefInput.trim()) {
      showToast('Vui lòng nhập mã giao dịch ngân hàng / mã tham chiếu.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await submitPaymentProof(targetSubId, paymentRefInput, paymentNoteInput);
      showToast('Đã gửi thông tin chuyển khoản. Ban quản trị sẽ đối soát và kích hoạt gói sớm nhất.');
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-teal-600" />
            Gói hoạt động nền tảng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Đăng ký gói dịch vụ để đăng cơ sở kinh doanh, quản lý dịch vụ và tiếp cận khách du lịch tại Đà Nẵng.
          </p>
        </div>
        <button
          onClick={() => {
            reloadPackages();
            reloadCurrent();
            reloadHistory();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current Package Status Banner */}
      {loadingCurrent ? (
        <div className="p-6 bg-white rounded-2xl border border-gray-100 animate-pulse space-y-3">
          <div className="h-6 w-1/3 bg-gray-200 rounded-md" />
          <div className="h-4 w-1/2 bg-gray-100 rounded-md" />
        </div>
      ) : current ? (
        <div
          className={`p-6 rounded-2xl border shadow-xs transition-all ${
            isExpiringSoon
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-gradient-to-br from-teal-900 to-emerald-950 text-white border-teal-800'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className={`w-6 h-6 ${isExpiringSoon ? 'text-amber-600' : 'text-amber-400'}`} />
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                  Gói dịch vụ đang kích hoạt
                </span>
                <StatusBadge status={current.subscriptionStatus} />
              </div>
              <h2 className={`text-2xl font-black ${isExpiringSoon ? 'text-amber-950' : 'text-white'}`}>
                {current.packageName} ({current.durationMonths} tháng)
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs opacity-90 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Ngày bắt đầu:{' '}
                  {current.startDate ? new Date(current.startDate).toLocaleDateString('vi-VN') : '---'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Ngày hết hạn:{' '}
                  {current.endDate ? new Date(current.endDate).toLocaleDateString('vi-VN') : '---'}
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Còn lại: <span className="underline">{daysRemaining} ngày</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#pricing-section"
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  isExpiringSoon
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                    : 'bg-white hover:bg-gray-100 text-teal-950 shadow-md'
                }`}
              >
                Gia hạn thêm thời gian
              </a>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center gap-2 text-xs font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Gói của bạn sắp hết hạn trong {daysRemaining} ngày tới. Hãy đăng ký gia hạn sớm để duy trì hoạt động cơ
                sở liên tục, thời hạn mới sẽ được tự động cộng nối tiếp!
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-base">Bạn chưa có gói hoạt động đang hiệu lực</h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                Để đăng cơ sở dịch vụ mới (khách sạn, nhà hàng, điểm tham quan) và quản lý kinh doanh trên DaNangGo, bạn
                cần đăng ký và kích hoạt một trong các gói bên dưới.
              </p>
            </div>
          </div>
          <a
            href="#pricing-section"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs"
          >
            Chọn gói đăng ký ngay
          </a>
        </div>
      )}

      {/* Pricing Section */}
      <div id="pricing-section" className="space-y-4 pt-2">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl font-bold text-gray-900">Bảng giá gói đăng ký DaNangGo</h2>
          <p className="text-xs text-gray-500">
            Giá niêm yết chính thức từ SQL Server. Thanh toán qua chuyển khoản ngân hàng và được Admin đối soát xác nhận.
          </p>
        </div>

        {loadingPackages ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-white border border-gray-100 rounded-2xl animate-pulse p-6" />
            ))}
          </div>
        ) : errorPackages ? (
          <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-center">
            <p className="font-semibold mb-2">{errorPackages}</p>
            <button
              onClick={reloadPackages}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(packages || []).map((pkg) => {
              const isBestValue = pkg.package_code === '6_MONTHS';
              const isMaxSaving = pkg.package_code === '1_YEAR';

              return (
                <div
                  key={pkg.package_id}
                  className={`bg-white rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                    isBestValue
                      ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 shadow-xs'
                  }`}
                >
                  {isBestValue && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs tracking-wider">
                      Phổ biến nhất
                    </span>
                  )}
                  {isMaxSaving && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-xs tracking-wider">
                      Tiết kiệm nhất
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 min-h-[32px]">{pkg.description}</p>
                    </div>

                    <div className="py-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">
                          {Number(pkg.price).toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs font-bold text-gray-500">VNĐ</span>
                      </div>
                      <p className="text-xs text-teal-600 font-semibold mt-1">
                        Thời hạn: {pkg.duration_months} tháng sử dụng
                      </p>
                    </div>

                    {/* Feature bullets */}
                    <ul className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Đăng tải và quản lý cơ sở không giới hạn</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Hiển thị trên bản đồ số & gợi ý lộ trình</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Nhận và phản hồi đánh giá của khách du lịch</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Gia hạn tự động cộng nối tiếp thời gian</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all ${
                        isBestValue
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-900/20'
                          : 'bg-gray-900 hover:bg-black text-white shadow-xs'
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

      {/* Subscription History Section */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Lịch sử đăng ký & gia hạn gói</h2>
          <p className="text-xs text-gray-500">
            Theo dõi tình trạng xét duyệt thanh toán, mã tham chiếu và thời hạn từng gói.
          </p>
        </div>

        {loadingHistory ? (
          <div className="p-8 bg-white rounded-2xl border border-gray-100 animate-pulse text-center text-xs text-gray-400">
            Đang tải lịch sử đăng ký...
          </div>
        ) : !history || history.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-gray-100 text-center space-y-2">
            <PackageCheck className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Chưa có lịch sử giao dịch gói</p>
            <p className="text-xs text-gray-400">Các gói bạn đăng ký sẽ hiển thị đầy đủ tại đây.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Mã giao dịch</th>
                    <th className="p-4">Tên gói</th>
                    <th className="p-4">Số tiền (VNĐ)</th>
                    <th className="p-4">Thời hạn gói</th>
                    <th className="p-4">Thanh toán</th>
                    <th className="p-4">Trạng thái gói</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-gray-900">
                        {item.transactionCode}
                        {item.isRenewal && (
                          <span className="block text-[10px] text-teal-600 font-sans font-semibold">
                            (Gia hạn)
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        {item.packageName}
                        <span className="block text-gray-400 text-[11px]">
                          Tạo ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-4 text-gray-600">
                        {item.startDate && item.endDate ? (
                          <>
                            {new Date(item.startDate).toLocaleDateString('vi-VN')} -{' '}
                            {new Date(item.endDate).toLocaleDateString('vi-VN')}
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Chờ kích hoạt</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge
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
                          <span className="block text-[11px] text-gray-500 mt-1">
                            Ref: {item.paymentReference}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge
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
                      <td className="p-4 text-right">
                        {item.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => {
                              setProofSubscription(item);
                              setPaymentRefInput(item.paymentReference || '');
                              setPaymentNoteInput(item.paymentProofNote || '');
                            }}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1"
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
        title={current ? `Xác nhận gia hạn ${selectedPackage?.name}` : `Xác nhận đăng ký ${selectedPackage?.name}`}
        description={`Bạn đang chuẩn bị đăng ký ${selectedPackage?.name} với mức phí ${Number(
          selectedPackage?.price || 0
        ).toLocaleString('vi-VN')} VNĐ cho thời hạn ${selectedPackage?.duration_months} tháng. Hệ thống sẽ tạo mã giao dịch để bạn chuyển khoản thanh toán.`}
        confirmText="Tạo mã giao dịch"
        loading={actionLoading}
      />

      {/* Payment Instruction & Proof Modal */}
      {(activeInstruction || proofSubscription) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setActiveInstruction(null);
                setProofSubscription(null);
              }}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Thông tin chuyển khoản ngân hàng</h3>
                <p className="text-xs text-gray-500">Vui lòng chuyển khoản chính xác nội dung bên dưới.</p>
              </div>
            </div>

            {/* Bank Card Info */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-3.5 shadow-md">
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Ngân hàng</span>
                <span className="text-sm font-bold text-teal-400">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Số tài khoản</span>
                <span className="text-base font-mono font-bold text-white tracking-widest">999988886868</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Chủ tài khoản</span>
                <span className="text-xs font-bold text-white uppercase">DANANGGO TRAVEL CO LTD</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700/80 pb-3">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Số tiền cần chuyển</span>
                <span className="text-lg font-black text-amber-400">
                  {Number(
                    activeInstruction?.subscription.price || proofSubscription?.price || 0
                  ).toLocaleString('vi-VN')}{' '}
                  VNĐ
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                  Nội dung chuyển khoản (Bắt buộc):
                </span>
                <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-700 font-mono text-xs text-teal-300 font-bold">
                  <span>
                    DANANGGO{' '}
                    {activeInstruction?.subscription.transactionCode || proofSubscription?.transactionCode}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `DANANGGO ${
                          activeInstruction?.subscription.transactionCode || proofSubscription?.transactionCode
                        }`
                      )
                    }
                    className="p-1 hover:text-white transition-colors"
                    title="Sao chép"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Form submit proof */}
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Mã giao dịch ngân hàng / Mã tham chiếu sau khi chuyển <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: MB123456789 hoặc FT261015..."
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Ghi chú đối soát (nếu có)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm tên ngân hàng chuyển, tên người chuyển khoản..."
                  value={paymentNoteInput}
                  onChange={(e) => setPaymentNoteInput(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveInstruction(null);
                    setProofSubscription(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {actionLoading ? 'Đang gửi...' : 'Gửi thông tin cho Admin đối soát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
