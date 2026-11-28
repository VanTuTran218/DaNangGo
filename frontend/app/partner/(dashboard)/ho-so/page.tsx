'use client';

import { useState, useEffect } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerProfile, updatePartnerProfile } from '@/lib/api/partner';
import PartnerStatusBadge from '@/components/partner/PartnerStatusBadge';
import {
  Building2,
  Save,
  X,
  FileText,
  PhoneCall,
  Mail,
  MapPin,
  Briefcase,
  Hash,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function PartnerProfilePage() {
  const { data: profile, loading, error, reload } = useAsyncData(getPartnerProfile);
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState<'STAY' | 'TABLE' | 'TICKET'>('STAY');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; taxCode?: string }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName);
      setServiceType(profile.serviceType);
      setTaxCode(profile.taxCode);
      setAddress(profile.address);
      setPhone(profile.phone);
      setEmail(profile.email);
      setFieldErrors({});
    }
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { phone?: string; taxCode?: string } = {};
    const cleanedPhone = phone.trim().replace(/\s+/g, '');
    const cleanedTaxCode = taxCode.trim().replace(/\s+/g, '');

    if (!/^\d{10}$/.test(cleanedPhone)) {
      nextErrors.phone = 'Số điện thoại liên hệ không hợp lệ (chỉ gồm 10 chữ số).';
    }
    if (!/^\d+$/.test(cleanedTaxCode)) {
      nextErrors.taxCode = 'Mã số thuế không hợp lệ (chỉ gồm chữ số).';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast(nextErrors.phone || nextErrors.taxCode || 'Vui lòng kiểm tra lại thông tin.', 'error');
      const firstErrorId = nextErrors.taxCode ? 'partner-tax-code' : 'partner-phone';
      if (typeof document !== 'undefined') {
        const el = document.getElementById(firstErrorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLElement).focus({ preventScroll: true });
        }
      }
      return;
    }

    setSaving(true);
    try {
      await updatePartnerProfile({
        businessName: businessName.trim(),
        serviceType,
        taxCode: taxCode.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      showToast(
        profile?.status === 'REJECTED'
          ? 'Đã cập nhật hồ sơ và gửi lại yêu cầu xét duyệt tới Quản trị viên.'
          : 'Cập nhật hồ sơ doanh nghiệp thành công.'
      );
      reload();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('partner-profile-updated'));
      }
    } catch (err: any) {
      showToast(err?.message || 'Cập nhật thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-[#68798A] font-semibold bg-white rounded-[22px] border border-[#E2ECEC] shadow-[0_8px_28px_rgba(7,59,58,0.04)]">
        <div className="w-8 h-8 border-2 border-[#008F89] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang tải hồ sơ doanh nghiệp...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-rose-700">
        <p className="font-semibold mb-2" role="alert">
          {error || 'Không tải được hồ sơ.'}
        </p>
        <button
          onClick={reload}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#008F89] bg-[#E9F8F5] px-2.5 py-1 rounded-full border border-[#14B8A6]/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Định danh đối tác
          </span>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#14233B] tracking-tight">
            Hồ sơ doanh nghiệp
          </h1>
          <p className="text-sm text-[#68798A] mt-0.5">
            Quản lý thông tin pháp lý và thông tin liên hệ chính thức của đối tác trên hệ thống DanangGo.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-[#E9F8F5] text-[#073B3A] border-[#14B8A6]/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#008F89] shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-[24px] border border-[#E2ECEC] shadow-[0_10px_30px_rgba(7,59,58,0.06)] overflow-hidden">
        {/* A. Header doanh nghiệp */}
        <div className="relative bg-gradient-to-r from-[#073B3A] via-[#064A48] to-[#008F89] p-6 sm:p-8 text-white overflow-hidden">
          {/* Decorative coastal wave SVG */}
          <svg
            className="absolute right-0 bottom-0 h-full w-72 text-white/[0.06] pointer-events-none"
            viewBox="0 0 200 120"
            fill="none"
          >
            <path
              d="M20 120C55 75 95 95 140 45C165 18 185 20 200 0V120H20Z"
              fill="currentColor"
            />
          </svg>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 text-[#2DD4BF] flex items-center justify-center shrink-0 shadow-inner">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {profile.businessName}
                </h2>
                <div className="flex flex-wrap items-center gap-2.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#E9F8F5]/85 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/15">
                    Mã đối tác: {profile.id}
                  </span>
                  <span className="text-xs text-[#E9F8F5]/75">
                    •{' '}
                    {profile.serviceType === 'STAY'
                      ? 'Lưu trú & Khách sạn'
                      : profile.serviceType === 'TABLE'
                      ? 'Nhà hàng & Ẩm thực'
                      : 'Vé & Tour tham quan'}
                  </span>
                </div>
              </div>
            </div>
            <div className="self-start sm:self-center">
              <PartnerStatusBadge status={profile.status} />
            </div>
          </div>
        </div>

        {/* B. Form thông tin */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Section 1: Thông tin pháp lý & Dịch vụ */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E2ECEC]">
              <div className="w-8 h-8 rounded-xl bg-[#E9F8F5] text-[#008F89] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14233B]">Thông tin pháp lý & Dịch vụ</h3>
                <p className="text-xs text-[#68798A]">
                  Thông tin đăng ký kinh doanh và lĩnh vực hoạt động chính của đơn vị
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="partner-business-name"
                className="block text-xs font-bold text-[#14233B] mb-1.5"
              >
                Tên doanh nghiệp / Cơ sở <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="partner-business-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm text-[#14233B] bg-[#F6FAFA]/60 border border-[#E2ECEC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/25 focus:border-[#14B8A6] transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="partner-service-type"
                  className="block text-xs font-bold text-[#14233B] mb-1.5"
                >
                  Loại dịch vụ chính
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="partner-service-type"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full h-11 pl-10 pr-4 text-sm text-[#14233B] bg-[#F6FAFA]/60 border border-[#E2ECEC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/25 focus:border-[#14B8A6] transition-all font-medium"
                  >
                    <option value="STAY">Khách sạn / Lưu trú (STAY)</option>
                    <option value="TABLE">Nhà hàng / Ẩm thực (TABLE)</option>
                    <option value="TICKET">Vé & Tour tham quan (TICKET)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="partner-tax-code"
                  className="block text-xs font-bold text-[#14233B] mb-1.5"
                >
                  Mã số thuế <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="partner-tax-code"
                    type="text"
                    required
                    value={taxCode}
                    onChange={(e) => {
                      setTaxCode(e.target.value);
                      if (fieldErrors.taxCode) {
                        setFieldErrors((prev) => ({ ...prev, taxCode: undefined }));
                      }
                    }}
                    className={`w-full h-11 pl-10 pr-4 text-sm text-[#14233B] bg-[#F6FAFA]/60 border rounded-xl focus:bg-white focus:outline-none transition-all font-medium ${
                      fieldErrors.taxCode
                        ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/30'
                        : 'border-[#E2ECEC] focus:ring-2 focus:ring-[#14B8A6]/25 focus:border-[#14B8A6]'
                    }`}
                  />
                </div>
                {fieldErrors.taxCode && (
                  <p role="alert" className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.taxCode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin liên hệ & Địa chỉ */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E2ECEC]">
              <div className="w-8 h-8 rounded-xl bg-[#E9F8F5] text-[#008F89] flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14233B]">Thông tin liên hệ & Địa chỉ</h3>
                <p className="text-xs text-[#68798A]">
                  Địa chỉ trụ sở và kênh liên lạc chính thức để nhận thông báo từ DanangGo
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="partner-address"
                className="block text-xs font-bold text-[#14233B] mb-1.5"
              >
                Địa chỉ đăng ký kinh doanh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="partner-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 text-sm text-[#14233B] bg-[#F6FAFA]/60 border border-[#E2ECEC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/25 focus:border-[#14B8A6] transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="partner-phone"
                  className="block text-xs font-bold text-[#14233B] mb-1.5"
                >
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="partner-phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) {
                        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }
                    }}
                    className={`w-full h-11 pl-10 pr-4 text-sm text-[#14233B] bg-[#F6FAFA]/60 border rounded-xl focus:bg-white focus:outline-none transition-all font-medium ${
                      fieldErrors.phone
                        ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/30'
                        : 'border-[#E2ECEC] focus:ring-2 focus:ring-[#14B8A6]/25 focus:border-[#14B8A6]'
                    }`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p role="alert" className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.phone}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="partner-email"
                  className="block text-xs font-bold text-[#14233B] mb-1.5"
                >
                  Email đăng ký <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#68798A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="partner-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 text-sm text-[#14233B] bg-[#F6FAFA]/60 border border-[#E2ECEC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/25 focus:border-[#14B8A6] transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* C. Nút cập nhật */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-[#E2ECEC]">
            <p className="text-xs text-[#68798A]">
              Các trường đánh dấu <span className="text-rose-500 font-bold">*</span> là thông tin bắt buộc.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#008F89] hover:bg-[#073B3A] disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-all duration-200 shadow-md shadow-[#008F89]/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
