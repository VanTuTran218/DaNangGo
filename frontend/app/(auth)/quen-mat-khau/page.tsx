'use client';

/**
 * Trang Quên Mật Khẩu — 3 bước OTP (tái dùng VerifyEmailStep):
 *  Bước 1: Nhập email → gọi forgotPassword API
 *  Bước 2: Nhập mã OTP (VerifyEmailStep với onVerify/onResend override)
 *  Bước 3: Nhập mật khẩu mới + xác nhận → gọi resetPasswordOtp
 */

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import VerifyEmailStep from '@/components/auth/VerifyEmailStep';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { forgotPassword, verifyResetOtp, resetPasswordOtp } from '@/lib/api/auth';
import { maskEmail } from '@/lib/utils/maskEmail';

type Step = 'email' | 'otp' | 'new-password';


export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  // Bước 1
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Bước 2 — verified code được giữ lại để truyền lên API bước 3
  const [verifiedCode, setVerifiedCode] = useState('');

  // Bước 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  /* ── Bước 1: gửi OTP ─────────────────────────────────────── */
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setEmailError('');
    setEmailLoading(true);
    await forgotPassword(trimmed); // luôn OK dù email tồn tại hay không
    setMaskedEmail(maskEmail(trimmed));
    setEmailLoading(false);
    setStep('otp');
  }

  /* ── Bước 2: tái dùng VerifyEmailStep với override ──────── */
  function handleOtpSuccess(_email: string, code: string) {
    setVerifiedCode(code);
    setStep('new-password');
  }

  /* Override verifyEmail → verifyResetOtp */
  async function handleVerify(em: string, code: string) {
    const res = await verifyResetOtp(em, code);
    if (res.success) {
      // Giữ code lại trước khi VerifyEmailStep gọi onSuccess
      setVerifiedCode(code);
    }
    return res;
  }

  /* Override resendCode → forgotPassword (gửi lại OTP reset) */
  async function handleResendReset(em: string) {
    await forgotPassword(em);
    return { success: true };
  }

  /* ── Bước 3: đặt mật khẩu mới ───────────────────────────── */
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
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      <section className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12">

        <Link href="/dang-nhap" className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại đăng nhập
        </Link>

        <AnimatePresence mode="wait">

          {/* ── BƯỚC 1: NHẬP EMAIL ── */}
          {step === 'email' && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mt-8"
            >
              <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
              <p className="text-sm text-gray-600 mt-2 mb-6">
                Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.
              </p>
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fp-email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    className={`block w-full px-4 py-2.5 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200 ${emailError ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="you@example.com"
                  />
                  {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                </div>
                <button
                  disabled={emailLoading}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {emailLoading
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang gửi…</>
                    : 'GỬI MÃ XÁC NHẬN'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── BƯỚC 2: NHẬP OTP (tái dùng VerifyEmailStep) ── */}
          {step === 'otp' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mt-8"
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

          {/* ── BƯỚC 3: ĐẶT MẬT KHẨU MỚI ── */}
          {step === 'new-password' && (
            <motion.div
              key="step-new-password"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mt-8"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Đặt mật khẩu mới</h2>
                <p className="text-sm text-gray-500 mt-1">Mã đã được xác thực. Nhập mật khẩu mới cho tài khoản.</p>
              </div>

              {pwSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 px-4 py-4 bg-teal-50 border border-teal-300 rounded-xl"
                >
                  <svg className="w-6 h-6 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-semibold text-teal-700">Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập…</p>
                </motion.div>
              ) : (
                <form onSubmit={handleNewPassword} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwError(''); }}
                      className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200"
                      placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
                    />
                    {newPassword && <PasswordStrength password={newPassword} />}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPwError(''); }}
                      className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-red-500">Mật khẩu không khớp.</p>
                    )}
                  </div>

                  {pwError && (
                    <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-red-600">{pwError}</p>
                    </div>
                  )}

                  <button
                    disabled={pwLoading}
                    className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 shadow-lg shadow-orange-500/30 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {pwLoading
                      ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý…</>
                      : 'ĐẶT LẠI MẬT KHẨU'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('otp')}
                    className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Quay lại nhập mã
                  </button>
                </form>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </section>
    </div>
  );
}
