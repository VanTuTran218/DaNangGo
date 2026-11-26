'use client';

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
      className="flex flex-col gap-4 w-full py-1"
    >
      {/* Thông báo thành công */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-[#0A2C2E]/85 border border-[#2DD4BF]/35 rounded-xl flex items-center gap-2.5 text-[#A7F3D0] text-xs sm:text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
          <span>{notice}</span>
        </motion.div>
      )}

      {/* ── EMAIL HOẶC SỐ ĐIỆN THOẠI ── */}
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor="identifier"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90"
        >
          Email hoặc Số điện thoại <span className="text-[#E87B39]">*</span>
        </label>
        <div className="relative flex items-center group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94B0B3] group-focus-within:text-[#E6D9B7] transition-colors">
            <Mail className="w-[17px] h-[17px]" />
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
            className={`auth-dark-input block w-full pl-10 pr-4 h-[48px] bg-[#0A202B]/90 hover:bg-[#0D2835] focus:bg-[#0D2835] border ${
              touched.identifier && errors.identifier
                ? 'border-rose-400/75 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                : 'border-[#E6D9B7]/20 hover:border-[#E6D9B7]/40 focus:border-[#E6D9B7]/75 focus:ring-2 focus:ring-[#E6D9B7]/14'
            } rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none transition-all duration-200 text-sm`}
          />
        </div>
        <AnimatePresence>
          {touched.identifier && errors.identifier && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="text-xs text-rose-300 mt-0.5 flex items-center gap-1.5 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errors.identifier}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── MẬT KHẨU ── */}
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

      {/* ── GHI NHỚ & QUÊN MẬT KHẨU ── */}
      <div className="flex items-center justify-between pt-0.5">
        <label className="flex items-center gap-2.5 cursor-pointer group select-none">
          <div
            className={`relative flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border transition-colors ${
              rememberMe
                ? 'bg-[#E6D9B7] border-[#E6D9B7]'
                : 'border-[#E6D9B7]/30 bg-[#0A202B] group-hover:border-[#E6D9B7]/65'
            }`}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="peer sr-only"
            />
            <Check
              className={`w-3 h-3 text-[#06151C] transition-transform duration-150 ${
                rememberMe ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
              strokeWidth={3}
            />
          </div>
          <span className="text-xs sm:text-[13px] text-[#CBD9DA] group-hover:text-[#FFFDF5] transition-colors">
            Ghi nhớ đăng nhập
          </span>
        </label>
        <Link
          href="/quen-mat-khau"
          className="text-xs sm:text-[13px] text-[#E6D9B7] hover:text-[#FFFDF5] font-semibold transition-colors hover:underline"
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
            className="p-3 bg-[#311417]/90 border border-rose-400/40 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs sm:text-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="flex-1 font-medium">{errors.general}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NÚT ĐĂNG NHẬP ── */}
      <button
        type="submit"
        disabled={isLoading || isSuccess}
        className="group relative w-full h-[50px] px-6 text-[#FFFDF5] font-bold text-xs sm:text-sm uppercase tracking-[0.14em] rounded-xl bg-gradient-to-r from-[#E87B39] via-[#DC6C2B] to-[#CC5E20] border border-[#FFFDF5]/20 shadow-[0_14px_30px_rgba(232,123,57,0.38),inset_0_1px_0_rgba(255,253,245,0.28)] hover:brightness-108 active:scale-[0.985] transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden cursor-pointer mt-1"
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transition-transform" />

        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSuccess ? (
          <span className="flex items-center gap-2">
            <Check className="w-5 h-5" strokeWidth={3} />
            <span>Đăng nhập thành công</span>
          </span>
        ) : (
          <>
            <span>Đăng nhập ngay</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>

      {/* ── PHÂN CÁCH MẠNG XÃ HỘI ── */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[#E6D9B7]/14" />
        <span className="flex-shrink-0 mx-3.5 text-[#94B0B3] text-[10.5px] uppercase tracking-[0.16em] font-semibold">
          Hoặc tiếp tục với
        </span>
        <div className="flex-grow border-t border-[#E6D9B7]/14" />
      </div>

      <SocialButtons />

      {/* ── CHUYỂN SANG ĐĂNG KÝ ── */}
      <p className="text-center text-xs sm:text-[13px] text-[#94B0B3] mt-1">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[#E6D9B7] hover:text-[#FFFDF5] font-bold hover:underline focus:outline-none transition-colors cursor-pointer"
        >
          Đăng ký ngay
        </button>
      </p>
    </motion.form>
  );
}
