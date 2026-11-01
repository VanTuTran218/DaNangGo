'use client';

/**
 * VerifyEmailStep
 * ──────────────
 * Bước xác thực email bằng OTP 6 số.
 * - 6 ô input riêng, tự focus, tự submit khi đủ 6 số
 * - Hỗ trợ dán toàn bộ mã (paste)
 * - Hỗ trợ Backspace xóa và lùi ô
 * - Đếm ngược 60 giây để gửi lại mã
 * - Hiển thị lỗi rõ ràng
 * - Animation fade + slide khi mount
 */

import { useRef, useState, useEffect, useCallback, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { verifyEmail, resendCode } from '@/lib/api/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

interface VerifyEmailStepProps {
  email: string;
  maskedEmail: string;
  onSuccess: (email: string) => void;
  onBack: () => void;
  /** Override hàm xác thực mã (default: verifyEmail từ api/auth) */
  onVerify?: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  /** Override hàm gửi lại mã (default: resendCode từ api/auth) */
  onResend?: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Text nút Back tuỳ chỉnh */
  backLabel?: string;
}

export default function VerifyEmailStep({ email, maskedEmail, onSuccess, onBack, onVerify, onResend, backLabel }: VerifyEmailStepProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sentNotice, setSentNotice] = useState('Mã xác nhận đã được gửi tới email của bạn.');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Bắt đầu đếm ngược */
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    // Focus ô đầu khi mount
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCountdown]);

  /** Cập nhật digits và tự focus ô tiếp theo */
  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit khi nhập đủ
    if (newDigits.every((d) => d !== '') && digit) {
      handleSubmit(newDigits.join(''));
    }
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    updateDigit(index, e.target.value);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /** Hỗ trợ dán cả mã */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setError('');
    // Focus vào ô sau ký tự cuối được dán
    const nextIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();
    // Auto-submit nếu đủ 6 số
    if (pasted.length === OTP_LENGTH) {
      handleSubmit(newDigits.join(''));
    }
  };

  const handleSubmit = async (code?: string) => {
    const otpCode = code ?? digits.join('');
    if (otpCode.length !== OTP_LENGTH || isLoading || isSuccess) return;

    setIsLoading(true);
    setError('');
    try {
      const verifyFn = onVerify ?? verifyEmail;
      const res = await verifyFn(email, otpCode);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => onSuccess(email), 1200);
      } else {
        setError(res.error ?? 'Mã xác nhận không đúng.');
        // Xóa các ô khi sai để nhập lại dễ hơn
        setDigits(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    setSentNotice('');
    try {
      const resendFn = onResend ?? resendCode;
      const res = await resendFn(email);
      if (res.success) {
        setSentNotice('Mã mới đã được gửi tới email của bạn.');
        startCountdown();
        setDigits(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setError(res.error ?? 'Không thể gửi lại mã. Vui lòng thử lại.');
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-5 w-full max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Xác thực email của bạn</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mã xác nhận đã được gửi tới
          </p>
          <p className="text-sm font-semibold text-teal-700 mt-0.5">{maskedEmail}</p>
        </div>
      </div>

      {/* Sent notice */}
      {sentNotice && !error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {sentNotice}
        </motion.div>
      )}

      {/* OTP Inputs */}
      <div className="flex gap-3 justify-center">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={isLoading || isSuccess}
            className={`
              w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none
              transition-all duration-150 caret-transparent
              ${isSuccess
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : error
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : digit
                    ? 'border-teal-500 bg-teal-50/60 text-teal-900'
                    : 'border-gray-200 bg-white text-gray-900 focus:border-teal-500 focus:bg-teal-50/30'
              }
              disabled:opacity-70 disabled:cursor-not-allowed
            `}
            aria-label={`Chữ số thứ ${i + 1}`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
        >
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Success message */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-300 rounded-xl"
        >
          <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold text-teal-700">Xác thực thành công! Đang chuyển hướng...</p>
        </motion.div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!isComplete || isLoading || isSuccess}
        className="relative w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl
                   transition-colors duration-200 shadow-lg shadow-orange-500/30
                   flex items-center justify-center gap-2
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSuccess ? (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Đã xác thực
          </>
        ) : (
          'XÁC NHẬN MÃ'
        )}
      </button>

      {/* Resend & expiry info */}
      <div className="text-center text-sm text-gray-500">
        <p className="mb-1">Mã có hiệu lực trong <strong className="text-gray-700">10 phút</strong></p>
        {countdown > 0 ? (
          <p>
            Gửi lại mã sau{' '}
            <span className="font-semibold text-teal-600 tabular-nums">{countdown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-teal-600 font-semibold hover:underline focus:outline-none disabled:opacity-60"
          >
            {isResending ? 'Đang gửi...' : 'Gửi lại mã'}
          </button>
        )}
      </div>

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel ?? 'Đổi email / Quay lại đăng ký'}
      </button>
    </motion.div>
  );
}
