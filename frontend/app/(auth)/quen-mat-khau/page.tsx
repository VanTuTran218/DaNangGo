'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, ShieldCheck, Check, AlertCircle, KeyRound } from 'lucide-react';
import AuthCardFrame from '@/components/auth/AuthCardFrame';
import VerifyEmailStep from '@/components/auth/VerifyEmailStep';
import PasswordField from '@/components/auth/PasswordField';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { forgotPassword, verifyResetOtp, resetPasswordOtp } from '@/lib/api/auth';
import { maskEmail } from '@/lib/utils/maskEmail';

type Step = 'email' | 'otp' | 'new-password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const [verifiedCode, setVerifiedCode] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setEmailError('');
    setEmailLoading(true);
    await forgotPassword(trimmed);
    setMaskedEmail(maskEmail(trimmed));
    setEmailLoading(false);
    setStep('otp');
  }

  async function handleVerify(em: string, code: string) {
    const res = await verifyResetOtp(em, code);
    if (res.success) {
      setVerifiedCode(code);
    }
    return res;
  }

  async function handleResendReset(em: string) {
    await forgotPassword(em);
    return { success: true };
  }

  async function handleNewPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setPwError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setPwError('');
    setPwLoading(true);
    const res = await resetPasswordOtp(email.trim(), verifiedCode, newPassword, confirmPassword);
    setPwLoading(false);
    if (res.success) {
      setPwSuccess(true);
      setTimeout(() => router.push('/dang-nhap'), 2000);
    } else {
      setPwError(res.error ?? 'Không thể đặt lại mật khẩu. Vui lòng thử lại từ đầu.');
    }
  }

  return (
    <AuthCardFrame maxWidthClass="max-w-[500px]">
      <section className="p-7 sm:p-10">
        <Link
          href="/dang-nhap"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/24 bg-[#0A202B]/85 px-3.5 py-1.5 text-xs font-semibold text-[#E6D9B7] hover:border-[#E6D9B7]/60 hover:text-[#FFFDF5] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại đăng nhập
        </Link>

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24 }}
              className="mt-7"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0A2532] border border-[#E6D9B7]/28 flex items-center justify-center text-[#E6D9B7] mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="cinematic-condensed uppercase text-2xl sm:text-3xl font-bold text-[#FFFDF5]">
                Quên <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">mật khẩu?</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#94B0B3] mt-2 mb-6 leading-relaxed">
                Nhập email đã đăng ký tài khoản DanangGo. Chúng tôi sẽ gửi mã OTP 6 số để khôi phục mật khẩu cho bạn.
              </p>
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fp-email" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90">
                    Email <span className="text-[#E87B39]">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <Mail className="w-4 h-4 absolute left-3.5 text-[#94B0B3] group-focus-within:text-[#E6D9B7] transition-colors pointer-events-none" />
                    <input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                      className={`auth-dark-input block w-full pl-10 pr-4 h-[48px] bg-[#0A202B]/90 border rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none text-sm transition-all ${
                        emailError ? 'border-rose-400/75' : 'border-[#E6D9B7]/22 focus:border-[#E6D9B7]/75'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-rose-300 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      {emailError}
                    </p>
                  )}
                </div>
                <button
                  disabled={emailLoading}
                  className="w-full h-[50px] px-4 rounded-xl bg-gradient-to-r from-[#E87B39] via-[#DC6C2B] to-[#CC5E20] border border-[#FFFDF5]/20 text-[#FFFDF5] text-xs sm:text-sm font-bold uppercase tracking-[0.14em] shadow-[0_14px_30px_rgba(232,123,57,0.38)] hover:brightness-108 active:scale-[0.985] transition-all disabled:opacity-65 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {emailLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi…
                    </>
                  ) : (
                    'Gửi mã xác nhận'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24 }}
              className="mt-6"
            >
              <VerifyEmailStep
                email={email.trim()}
                maskedEmail={maskedEmail}
                onSuccess={() => setStep('new-password')}
                onBack={() => setStep('email')}
                onVerify={handleVerify}
                onResend={handleResendReset}
                backLabel="Đổi email / Quay lại"
              />
            </motion.div>
          )}

          {step === 'new-password' && (
            <motion.div
              key="step-new-password"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24 }}
              className="mt-6"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#0A2532] border border-[#2DD4BF]/32 flex items-center justify-center mx-auto mb-3 text-[#2DD4BF]">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="cinematic-condensed uppercase text-2xl font-bold text-[#FFFDF5]">
                  Đặt mật khẩu <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">mới</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#94B0B3] mt-1">
                  Mã đã được xác thực. Nhập mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              {pwSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 px-4 py-4 bg-[#0A2C2E]/90 border border-[#2DD4BF]/45 rounded-xl"
                >
                  <Check className="w-5 h-5 text-[#2DD4BF] shrink-0" strokeWidth={3} />
                  <p className="text-sm font-semibold text-[#A7F3D0]">
                    Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập…
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleNewPassword} className="flex flex-col gap-4">
                  <div>
                    <PasswordField
                      id="new-password"
                      name="newPassword"
                      label="Mật khẩu mới"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwError(''); }}
                      placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
                      required
                    />
                    <PasswordStrength password={newPassword} />
                  </div>

                  <PasswordField
                    id="confirm-password"
                    name="confirmPassword"
                    label="Xác nhận mật khẩu"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPwError(''); }}
                    placeholder="Nhập lại mật khẩu mới"
                    error={confirmPassword && newPassword !== confirmPassword ? 'Mật khẩu không khớp.' : undefined}
                    required
                  />

                  {pwError && (
                    <div className="flex items-start gap-2 px-3.5 py-3 bg-[#311417]/90 border border-rose-400/40 rounded-xl text-xs sm:text-sm text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p>{pwError}</p>
                    </div>
                  )}

                  <button
                    disabled={pwLoading}
                    className="w-full h-[50px] px-4 rounded-xl bg-gradient-to-r from-[#E87B39] via-[#DC6C2B] to-[#CC5E20] border border-[#FFFDF5]/20 text-[#FFFDF5] text-xs sm:text-sm font-bold uppercase tracking-[0.14em] shadow-[0_14px_30px_rgba(232,123,57,0.38)] hover:brightness-108 active:scale-[0.985] transition-all disabled:opacity-65 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {pwLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý…
                      </>
                    ) : (
                      'Đặt lại mật khẩu'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('otp')}
                    className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#94B0B3] hover:text-[#FFFDF5] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại nhập mã
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </AuthCardFrame>
  );
}
