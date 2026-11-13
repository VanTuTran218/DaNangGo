'use client';

/**
 * RegisterForm — Biểu mẫu đăng ký DanangGo cao cấp
 * ───────────────────────────────────────────────
 * - Thiết kế chuẩn Modern Coastal Luxury & Glassmorphism 2.0
 * - Phân nhóm thông tin trực quan: Thông tin cá nhân, Phân loại tài khoản, Thiết lập bảo mật, Điều khoản
 * - Đồng bộ chiều cao input/select 50px, border-radius 12px, font Be Vietnam Pro
 * - Cuộn tự nhiên, nút Đăng ký luôn có đủ khoảng trống ở cuối
 * - Giữ nguyên 100% các field gửi lên backend, validation nghiệp vụ và bước OTP
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  ChevronDown,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';
import { register } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import VerifyEmailStep from './VerifyEmailStep';

interface RegisterFormProps {
  onSwitchToLogin: (registeredEmail?: string) => void;
  redirectTo: string;
}

export default function RegisterForm({ onSwitchToLogin, redirectTo }: RegisterFormProps) {
  const router = useRouter();
  const { login: setAuthUser } = useAuth();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'USER' | 'PARTNER'>('USER');
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState<'STAY' | 'TABLE' | 'TICKET'>('STAY');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Bước xác thực email (null = chưa vào bước xác thực)
  const [verifyData, setVerifyData] = useState<{ email: string; maskedEmail: string } | null>(null);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập họ tên';

    if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Email không hợp lệ';
    if (phone.trim() && !/^(0\d{9}|\+?84\d{9})$/.test(phone.trim().replace(/[\s().-]/g, '')))
      newErrors.phone = 'Số điện thoại không hợp lệ';
    if (role === 'PARTNER' && businessName.trim().length < 2)
      newErrors.businessName = 'Vui lòng nhập tên doanh nghiệp/cơ sở';

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = 'Mật khẩu phải chứa cả chữ và số';
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!agreedToTerms) {
      newErrors.agreedToTerms = 'Bạn phải đồng ý với điều khoản';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid =
    name &&
    email &&
    password.length >= 8 &&
    confirmPassword === password &&
    agreedToTerms &&
    (role !== 'PARTNER' || businessName.trim().length >= 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      phone: true,
      businessName: true,
      password: true,
      confirmPassword: true,
      agreedToTerms: true,
    });

    if (!validate()) {
      setShakeKey((prev) => prev + 1);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await register({
        name,
        email: email.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        role,
        password,
        confirmPassword,
        agreedToTerms,
        ...(role === 'PARTNER' ? { partner: { businessName: businessName.trim(), serviceType } } : {}),
      });
      if (res.success && res.email && res.maskedEmail) {
        setVerifyData({ email: res.email, maskedEmail: res.maskedEmail });
      } else if (res.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ general: res.error || 'Email này đã được đăng ký.', generalCode: 'EMAIL_ALREADY_EXISTS' });
        setShakeKey((prev) => prev + 1);
      } else {
        setErrors({ general: res.error || 'Đăng ký thất bại' });
        setShakeKey((prev) => prev + 1);
      }
    } catch {
      setErrors({ general: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
      setShakeKey((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleVerifySuccess = (verifiedEmail: string) => {
    onSwitchToLogin(verifiedEmail);
  };

  const handleBackToRegister = () => {
    setVerifyData(null);
    setErrors({});
  };

  // Nếu đang ở bước xác thực OTP
  if (verifyData) {
    return (
      <AnimatePresence mode="wait">
        <VerifyEmailStep
          key="verify"
          email={verifyData.email}
          maskedEmail={verifyData.maskedEmail}
          onSuccess={handleVerifySuccess}
          onBack={handleBackToRegister}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5 w-full max-w-md mx-auto py-1"
    >
      {/* ── BANNER LỢI ÍCH ── */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50/60 border border-teal-200/60 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[#087E9C]" />
        </div>
        <p className="text-xs sm:text-sm text-teal-900 font-medium leading-snug">
          Đăng ký miễn phí để nhận ưu đãi Hạng Bạc và lưu lịch trình thông minh.
        </p>
      </div>

      {/* ── NHÓM 1: THÔNG TIN CÁ NHÂN ── */}
      <div className="flex flex-col gap-4">
        {/* Họ và tên */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Nguyễn Văn A"
              className={`block w-full pl-11 pr-4 h-[50px] bg-slate-50/50 hover:bg-white focus:bg-white border ${
                touched.name && errors.name
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                  : 'border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
              } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 text-sm`}
            />
          </div>
          {touched.name && errors.name && (
            <p role="alert" className="text-xs text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="reg-email" className="text-sm font-medium text-slate-700">
            Email <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="nhap@email.com"
              className={`block w-full pl-11 pr-4 h-[50px] bg-slate-50/50 hover:bg-white focus:bg-white border ${
                touched.email && errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                  : 'border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
              } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 text-sm`}
            />
          </div>
          {touched.email && errors.email && (
            <p role="alert" className="text-xs text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Số điện thoại */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="reg-phone" className="text-sm font-medium text-slate-700 flex items-center justify-between">
            <span>Số điện thoại <span className="text-slate-400 font-normal">(không bắt buộc)</span></span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="09xxxxxxxx"
              className={`block w-full pl-11 pr-4 h-[50px] bg-slate-50/50 hover:bg-white focus:bg-white border ${
                touched.phone && errors.phone
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                  : 'border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
              } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 text-sm`}
            />
          </div>
          {touched.phone && errors.phone && (
            <p role="alert" className="text-xs text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── NHÓM 2: PHÂN LOẠI TÀI KHOẢN (USER / PARTNER) ── */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="reg-role" className="text-sm font-medium text-slate-700">
            Loại tài khoản <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'USER' | 'PARTNER')}
              className="block w-full px-4 pr-10 h-[50px] bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15 rounded-xl text-slate-900 focus:outline-none transition-all duration-200 text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="USER">Khách du lịch (Cá nhân)</option>
              <option value="PARTNER">Đối tác kinh doanh (Cơ sở lưu trú / Ẩm thực / Điểm tham quan)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Các trường mở rộng cho ĐỐI TÁC */}
        <AnimatePresence>
          {role === 'PARTNER' && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3.5 p-4 bg-teal-50/40 border border-teal-200/60 rounded-xl"
            >
              {/* Tên doanh nghiệp/cơ sở */}
              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="partner-business" className="text-sm font-medium text-slate-700">
                  Tên doanh nghiệp / Cơ sở <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <input
                    id="partner-business"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onBlur={() => handleBlur('businessName')}
                    placeholder="VD: Khách sạn Sông Hàn, Nhà hàng Biển Đông"
                    className={`block w-full pl-11 pr-4 h-[50px] bg-white border ${
                      touched.businessName && errors.businessName
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                        : 'border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
                    } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 text-sm`}
                  />
                </div>
                {touched.businessName && errors.businessName && (
                  <p role="alert" className="text-xs text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.businessName}</span>
                  </p>
                )}
              </div>

              {/* Loại dịch vụ */}
              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="partner-service" className="text-sm font-medium text-slate-700">
                  Loại dịch vụ <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <select
                    id="partner-service"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as 'STAY' | 'TABLE' | 'TICKET')}
                    className="block w-full pl-11 pr-10 h-[50px] bg-white border border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15 rounded-xl text-slate-900 focus:outline-none transition-all duration-200 text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="STAY">Lưu trú (Khách sạn, Resort, Homestay)</option>
                    <option value="TABLE">Ẩm thực (Nhà hàng, Quán ăn, Cafe)</option>
                    <option value="TICKET">Vé tham quan & Trải nghiệm du lịch</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── NHÓM 3: THIẾT LẬP BẢO MẬT (MẬT KHẨU) ── */}
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col w-full">
          <PasswordField
            id="reg-password"
            name="password"
            label="Mật khẩu"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            error={touched.password ? errors.password : undefined}
            required
          />
          <PasswordStrength password={password} />
        </div>

        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          required
        />
      </div>

      {/* ── NHÓM 4: ĐIỀU KHOẢN VÀ CHÍNH SÁCH ── */}
      <div className="pt-1">
        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded-md border border-slate-300 group-hover:border-[#11C5C6] transition-colors bg-white shadow-xs shrink-0">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer sr-only"
            />
            <Check
              className={`w-3.5 h-3.5 text-[#087E9C] transition-transform duration-200 ${
                agreedToTerms ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              strokeWidth={3}
            />
          </div>
          <span className="text-xs sm:text-sm text-slate-600 leading-normal">
            Tôi đồng ý với{' '}
            <a
              href="/dieu-khoan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#087E9C] hover:text-[#11C5C6] font-semibold underline underline-offset-2 transition-colors"
            >
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a
              href="/chinh-sach"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#087E9C] hover:text-[#11C5C6] font-semibold underline underline-offset-2 transition-colors"
            >
              Chính sách bảo mật
            </a>
          </span>
        </label>
        {touched.agreedToTerms && errors.agreedToTerms && (
          <p role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium pl-8">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.agreedToTerms}</span>
          </p>
        )}
      </div>

      {/* ── LỖI TỔNG QUÁT ── */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-1.5 text-rose-700 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="font-medium">{errors.general}</p>
            </div>
            {errors.generalCode === 'EMAIL_ALREADY_EXISTS' && (
              <button
                type="button"
                onClick={() => onSwitchToLogin(email.trim())}
                className="text-xs text-[#087E9C] hover:text-[#11C5C6] font-semibold underline underline-offset-2 text-left cursor-pointer pl-6"
              >
                Đăng nhập với email này ngay →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NÚT ĐĂNG KÝ TÀI KHOẢN (CTA) ── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || isSuccess || (Object.keys(touched).length > 0 && !isFormValid)}
          className="group relative w-full h-[52px] px-6 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 50%, #FF6A00 100%)',
          }}
        >
          {/* Shimmer ánh sáng quét ngang khi hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transition-transform" />

          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isSuccess ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" strokeWidth={3} />
              <span>ĐĂNG KÝ THÀNH CÔNG</span>
            </span>
          ) : (
            <span>ĐĂNG KÝ TÀI KHOẢN</span>
          )}
        </button>
      </div>

      {/* ── CHUYỂN SANG ĐĂNG NHẬP ── */}
      <p className="text-center text-xs sm:text-sm text-slate-600 mt-2 pb-6 sm:pb-8">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="text-[#087E9C] hover:text-[#11C5C6] font-bold hover:underline focus:outline-none transition-colors cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </p>
    </motion.form>
  );
}
