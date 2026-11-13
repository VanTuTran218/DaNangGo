'use client';

/**
 * LoginForm — Biểu mẫu đăng nhập DanangGo cao cấp
 * ───────────────────────────────────────────────
 * - Thiết kế chuẩn Modern Coastal Luxury & Glassmorphism 2.0
 * - Chiều cao input 50px, border-radius 12px, font Be Vietnam Pro
 * - Hiệu ứng focus viền ngọc lam (Turquoise #11C5C6) cùng shadow nhẹ
 * - Nút submit gradient Sunset Orange (#FF6A00) kèm hiệu ứng hover nâng nhẹ & shimmer
 * - Giữ nguyên 100% logic đăng nhập, validation, rememberMe và bước xác thực OTP
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, ArrowRight, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import PasswordField from './PasswordField';
import SocialButtons from './SocialButtons';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import VerifyEmailStep from './VerifyEmailStep';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  redirectTo: string;
  initialIdentifier?: string;
  successMessage?: string;
}

export default function LoginForm({
  onSwitchToRegister,
  initialIdentifier,
  successMessage,
}: LoginFormProps) {
  const { login: setAuthUser } = useAuth();

  const [identifier, setIdentifier] = useState(initialIdentifier || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [notice, setNotice] = useState(successMessage || '');
  // Khi đăng nhập mà email chưa xác thực → chuyển sang bước OTP
  const [verifyData, setVerifyData] = useState<{ email: string; maskedEmail: string } | null>(null);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!identifier) {
      newErrors.identifier = 'Vui lòng nhập email hoặc số điện thoại';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /^(0\d{9}|\+?84\d{9})$/.test(identifier.replace(/[\s().-]/g, ''));
      if (!isEmail && !isPhone) {
        newErrors.identifier = 'Email hoặc số điện thoại không hợp lệ';
      }
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    if (!validate()) {
      setShakeKey((prev) => prev + 1);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await login({ identifier, password, rememberMe });
      if (res.success) {
        if (res.user) setAuthUser(res.user);
        setIsSuccess(true);
      } else {
        if (res.code === 'EMAIL_NOT_VERIFIED' && res.maskedEmail) {
          setVerifyData({ email: identifier.trim().toLowerCase(), maskedEmail: res.maskedEmail });
        } else {
          setErrors({ general: res.error });
          setShakeKey((prev) => prev + 1);
        }
      }
    } catch {
      setErrors({ general: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
      setShakeKey((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySuccess = (verifiedEmail: string) => {
    setVerifyData(null);
    setNotice('Xác thực email thành công! Vui lòng đăng nhập.');
    setIdentifier(verifiedEmail);
    setPassword('');
  };

  // Nếu chuyển sang bước OTP
  if (verifyData) {
    return (
      <AnimatePresence mode="wait">
        <VerifyEmailStep
          key="login-verify"
          email={verifyData.email}
          maskedEmail={verifyData.maskedEmail}
          onSuccess={handleVerifySuccess}
          onBack={() => setVerifyData(null)}
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
      {/* Thông báo thành công từ bước trước */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm font-medium shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </motion.div>
      )}

      {/* ── Ô NHẬP IDENTIFIER (EMAIL HOẶC SỐ ĐIỆN THOẠI) ── */}
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor="identifier"
          className="text-sm font-medium text-slate-700 flex items-center justify-between"
        >
          <span>
            Email hoặc Số điện thoại <span className="text-rose-500">*</span>
          </span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-5 h-5" />
          </div>
          <input
            id="identifier"
            type="text"
            autoComplete="username"
            aria-label="Email hoặc số điện thoại"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, identifier: true }));
              validate();
            }}
            placeholder="nhap@email.com hoặc 09xxxx"
            className={`block w-full pl-11 pr-4 h-[50px] bg-slate-50/50 hover:bg-white focus:bg-white border ${
              touched.identifier && errors.identifier
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                : 'border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
            } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 text-sm`}
          />
        </div>
        <AnimatePresence>
          {touched.identifier && errors.identifier && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="text-xs text-rose-500 mt-0.5 flex items-center gap-1 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.identifier}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Ô NHẬP MẬT KHẨU ── */}
      <PasswordField
        id="password"
        name="password"
        label="Mật khẩu"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => {
          setTouched((prev) => ({ ...prev, password: true }));
          validate();
        }}
        error={touched.password ? errors.password : undefined}
        required
      />

      {/* ── CHECKBOX GHI NHỚ ĐĂNG NHẬP & QUÊN MẬT KHẨU ── */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2.5 cursor-pointer group select-none">
          <div className="relative flex items-center justify-center w-5 h-5 rounded-md border border-slate-300 group-hover:border-[#11C5C6] transition-colors bg-white shadow-xs">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="peer sr-only"
            />
            <Check
              className={`w-3.5 h-3.5 text-[#087E9C] transition-transform duration-200 ${
                rememberMe ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              strokeWidth={3}
            />
          </div>
          <span className="text-xs sm:text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
            Ghi nhớ đăng nhập
          </span>
        </label>
        <Link
          href="/quen-mat-khau"
          className="text-xs sm:text-sm text-[#087E9C] hover:text-[#11C5C6] font-semibold transition-colors"
        >
          Quên mật khẩu?
        </Link>
      </div>

      {/* ── LỖI TỔNG QUÁT ── */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs sm:text-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="flex-1 text-center font-medium">{errors.general}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NÚT ĐĂNG NHẬP (CTA) ── */}
      <button
        type="submit"
        disabled={isLoading || isSuccess}
        className="group relative w-full h-[52px] px-6 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden cursor-pointer mt-1"
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
            <span>ĐĂNG NHẬP THÀNH CÔNG</span>
          </span>
        ) : (
          <>
            <span>ĐĂNG NHẬP NGAY</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>

      {/* ── PHÂN CÁCH MẠNG XÃ HỘI ── */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-slate-200/80" />
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase tracking-wider font-medium">
          Hoặc tiếp tục với
        </span>
        <div className="flex-grow border-t border-slate-200/80" />
      </div>

      <SocialButtons />

      {/* ── CHUYỂN SANG ĐĂNG KÝ ── */}
      <p className="text-center text-xs sm:text-sm text-slate-600 mt-2">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#087E9C] hover:text-[#11C5C6] font-bold hover:underline focus:outline-none transition-colors cursor-pointer"
        >
          Đăng ký ngay
        </button>
      </p>
    </motion.form>
  );
}
