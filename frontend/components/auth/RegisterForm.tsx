'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building2,
  Compass,
  BedDouble,
  UtensilsCrossed,
  Ticket,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';
import { register } from '@/lib/api/auth';
import VerifyEmailStep from './VerifyEmailStep';

interface RegisterFormProps {
  onSwitchToLogin: (registeredEmail?: string) => void;
  redirectTo: string;
}

const SERVICE_OPTIONS: { value: 'STAY' | 'TABLE' | 'TICKET'; label: string; icon: typeof BedDouble }[] = [
  { value: 'STAY', label: 'Lưu trú', icon: BedDouble },
  { value: 'TABLE', label: 'Ẩm thực', icon: UtensilsCrossed },
  { value: 'TICKET', label: 'Vé tham quan', icon: Ticket },
];

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
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
  const [shakeKey, setShakeKey] = useState(0);

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

  if (verifyData) {
    return (
      <AnimatePresence mode="wait">
        <VerifyEmailStep
          key="verify"
          email={verifyData.email}
          maskedEmail={verifyData.maskedEmail}
          onSuccess={(verifiedEmail) => onSwitchToLogin(verifiedEmail)}
          onBack={() => {
            setVerifyData(null);
            setErrors({});
          }}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 w-full py-1"
    >
      {/* ── BANNER ĐẶC QUYỀN ── */}
      <div className="bg-[#0A2330]/85 border border-[#E6D9B7]/22 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-[#E87B39] shrink-0" />
        <p className="text-xs text-[#CBD9DA] leading-snug">
          Miễn phí đăng ký · Nhận ngay ưu đãi <strong className="text-[#E6D9B7]">Hạng Bạc</strong> &amp; lưu lịch trình AI.
        </p>
      </div>

      {/* ── NHÓM 1: THÔNG TIN CÁ NHÂN ── */}
      <div className="flex flex-col gap-3.5">
        {/* Họ và tên */}
        <div className="flex flex-col gap-1.5 w-full">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90">
            Họ và tên <span className="text-[#E87B39]">*</span>
          </label>
          <div className="relative flex items-center group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94B0B3] group-focus-within:text-[#E6D9B7] transition-colors">
              <User className="w-[17px] h-[17px]" />
            </div>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Nguyễn Văn A"
              className={`auth-dark-input block w-full pl-10 pr-4 h-[46px] bg-[#0A202B]/90 hover:bg-[#0D2835] focus:bg-[#0D2835] border ${
                touched.name && errors.name
                  ? 'border-rose-400/75 focus:border-rose-400'
                  : 'border-[#E6D9B7]/20 hover:border-[#E6D9B7]/40 focus:border-[#E6D9B7]/75'
              } rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none transition-all text-sm`}
            />
          </div>
          {touched.name && errors.name && (
            <p role="alert" className="text-xs text-rose-300 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Email + Số điện thoại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90">
              Email <span className="text-[#E87B39]">*</span>
            </label>
            <div className="relative flex items-center group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94B0B3] group-focus-within:text-[#E6D9B7] transition-colors">
                <Mail className="w-4 h-4" />
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
                className={`auth-dark-input block w-full pl-9 pr-3 h-[46px] bg-[#0A202B]/90 hover:bg-[#0D2835] focus:bg-[#0D2835] border ${
                  touched.email && errors.email
                    ? 'border-rose-400/75 focus:border-rose-400'
                    : 'border-[#E6D9B7]/20 hover:border-[#E6D9B7]/40 focus:border-[#E6D9B7]/75'
                } rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none transition-all text-sm`}
              />
            </div>
            {touched.email && errors.email && (
              <p role="alert" className="text-xs text-rose-300 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-phone" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90">
              SĐT <span className="normal-case font-normal text-[#94B0B3]">(tuỳ chọn)</span>
            </label>
            <div className="relative flex items-center group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94B0B3] group-focus-within:text-[#E6D9B7] transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="09xxxxxxxx"
                className={`auth-dark-input block w-full pl-9 pr-3 h-[46px] bg-[#0A202B]/90 hover:bg-[#0D2835] focus:bg-[#0D2835] border ${
                  touched.phone && errors.phone
                    ? 'border-rose-400/75 focus:border-rose-400'
                    : 'border-[#E6D9B7]/20 hover:border-[#E6D9B7]/40 focus:border-[#E6D9B7]/75'
                } rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none transition-all text-sm`}
              />
            </div>
            {touched.phone && errors.phone && (
              <p role="alert" className="text-xs text-rose-300 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── NHÓM 2: LOẠI TÀI KHOẢN (VISUAL CARDS) ── */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90">
          Loại tài khoản <span className="text-[#E87B39]">*</span>
        </span>
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Loại tài khoản">
          {[
            { value: 'USER' as const, title: 'Khách du lịch', hint: 'Khám phá & lịch trình', icon: Compass },
            { value: 'PARTNER' as const, title: 'Đối tác', hint: 'Khách sạn · Ẩm thực', icon: Building2 },
          ].map((opt) => {
            const active = role === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(opt.value)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-[#E6D9B7]/70 bg-[#102E3D]/95 shadow-[0_8px_20px_rgba(2,10,15,0.4)]'
                    : 'border-[#E6D9B7]/16 bg-[#0A202B]/75 hover:border-[#E6D9B7]/40'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                    active
                      ? 'bg-[#E87B39] border-[#E87B39] text-[#FFFDF5]'
                      : 'bg-[#06151C] border-[#E6D9B7]/18 text-[#E6D9B7]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-[#FFFDF5] truncate">{opt.title}</span>
                  <span className="block text-[10px] text-[#94B0B3] truncate">{opt.hint}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Các trường mở rộng cho ĐỐI TÁC */}
        <AnimatePresence>
          {role === 'PARTNER' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 p-3.5 bg-[#09212D]/90 border border-[#2DD4BF]/28 rounded-xl mt-1">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="partner-business" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]">
                    Tên doanh nghiệp / Cơ sở <span className="text-[#E87B39]">*</span>
                  </label>
                  <input
                    id="partner-business"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onBlur={() => handleBlur('businessName')}
                    placeholder="VD: Khách sạn Sông Hàn, Nhà hàng Biển Đông"
                    className={`auth-dark-input block w-full px-3.5 h-[44px] bg-[#06151C]/90 border ${
                      touched.businessName && errors.businessName
                        ? 'border-rose-400/75'
                        : 'border-[#E6D9B7]/22 focus:border-[#E6D9B7]/75'
                    } rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none text-sm`}
                  />
                  {touched.businessName && errors.businessName && (
                    <p role="alert" className="text-xs text-rose-300 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{errors.businessName}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]">
                    Loại dịch vụ <span className="text-[#E87B39]">*</span>
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SERVICE_OPTIONS.map((svc) => {
                      const active = serviceType === svc.value;
                      const Icon = svc.icon;
                      return (
                        <button
                          key={svc.value}
                          type="button"
                          onClick={() => setServiceType(svc.value)}
                          className={`flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-[#E6D9B7] border-[#E6D9B7] text-[#06151C]'
                              : 'bg-[#06151C]/80 border-[#E6D9B7]/18 text-[#CBD9DA] hover:border-[#E6D9B7]/45'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate max-w-full">{svc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── NHÓM 3: MẬT KHẨU ── */}
      <div className="flex flex-col gap-3.5">
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

      {/* ── ĐIỀU KHOẢN ── */}
      <div>
        <label className="flex items-start gap-2.5 cursor-pointer group select-none">
          <div
            className={`relative flex items-center justify-center w-[18px] h-[18px] mt-0.5 rounded-[5px] border transition-colors shrink-0 ${
              agreedToTerms
                ? 'bg-[#E6D9B7] border-[#E6D9B7]'
                : 'border-[#E6D9B7]/30 bg-[#0A202B] group-hover:border-[#E6D9B7]/65'
            }`}
          >
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="peer sr-only"
            />
            <Check
              className={`w-3 h-3 text-[#06151C] transition-transform duration-150 ${
                agreedToTerms ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              strokeWidth={3}
            />
          </div>
          <span className="text-xs text-[#CBD9DA] leading-relaxed">
            Tôi đồng ý với{' '}
            <a
              href="/dieu-khoan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E6D9B7] hover:text-[#FFFDF5] font-semibold underline underline-offset-2"
            >
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a
              href="/chinh-sach"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E6D9B7] hover:text-[#FFFDF5] font-semibold underline underline-offset-2"
            >
              Chính sách bảo mật
            </a>
          </span>
        </label>
        {touched.agreedToTerms && errors.agreedToTerms && (
          <p role="alert" className="text-xs text-rose-300 mt-1 flex items-center gap-1.5 font-medium pl-7">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
            className="p-3 bg-[#311417]/90 border border-rose-400/40 rounded-xl flex flex-col gap-1.5 text-rose-200 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="font-medium">{errors.general}</p>
            </div>
            {errors.generalCode === 'EMAIL_ALREADY_EXISTS' && (
              <button
                type="button"
                onClick={() => onSwitchToLogin(email.trim())}
                className="text-xs text-[#E6D9B7] hover:text-[#FFFDF5] font-semibold underline underline-offset-2 text-left cursor-pointer pl-6"
              >
                Đăng nhập với email này ngay →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NÚT ĐĂNG KÝ ── */}
      <button
        type="submit"
        disabled={isLoading || (Object.keys(touched).length > 0 && !isFormValid)}
        className="group relative w-full h-[50px] px-6 text-[#FFFDF5] font-bold text-xs sm:text-sm uppercase tracking-[0.14em] rounded-xl bg-gradient-to-r from-[#E87B39] via-[#DC6C2B] to-[#CC5E20] border border-[#FFFDF5]/20 shadow-[0_14px_30px_rgba(232,123,57,0.38),inset_0_1px_0_rgba(255,253,245,0.28)] hover:brightness-108 active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-55 disabled:cursor-not-allowed overflow-hidden cursor-pointer mt-1"
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transition-transform" />
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span>Đăng ký tài khoản</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>

      {/* ── CHUYỂN SANG ĐĂNG NHẬP ── */}
      <p className="text-center text-xs sm:text-[13px] text-[#94B0B3] pb-4">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="text-[#E6D9B7] hover:text-[#FFFDF5] font-bold hover:underline focus:outline-none transition-colors cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </p>
    </motion.form>
  );
}
