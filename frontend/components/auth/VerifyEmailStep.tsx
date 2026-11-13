'use client';

/**
 * VerifyEmailStep
 * ──────────────
 * Bước xác thực email bằng mã OTP 6 số:
 * - 6 ô input tách rời, tự động focus ô kế tiếp khi nhập số
 * - Hỗ trợ dán (paste) toàn bộ mã OTP
 * - Hỗ trợ phím Backspace xóa và lùi ô mượt mà
 * - Đếm ngược 60s để gửi lại mã OTP
 * - Nút xác nhận phủ gradient Sunset Orange đồng bộ với toàn hệ thống
 * - Giữ nguyên 100% API xác thực và luồng xử lý
 */

import { useRef, useState, useEffect, useCallback, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, AlertCircle, ArrowLeft, Send } from 'lucide-react';
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

export default function VerifyEmailStep({
  email,
  maskedEmail,
  onSuccess,
  onBack,
  onVerify,
  onResend,
  backLabel,
}: VerifyEmailStepProps) {
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
    setTimeout(() => inputRefs.current[0]?.focus(), 120);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    // Auto-submit khi nhập đủ 6 số
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

  /** Hỗ trợ dán cả mã OTP */
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
    const nextIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-5 w-full max-w-md mx-auto py-2"
    >
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#087E9C] shadow-xs">
            <Mail className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#11C5C6] text-white flex items-center justify-center text-xs shadow-xs">
            <Send className="w-3 h-3" />
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Xác thực email của bạn
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Mã xác nhận 6 số đã được gửi tới
          </p>
          <p className="text-sm font-semibold text-[#087E9C] mt-0.5">{maskedEmail}</p>
        </div>
      </div>

      {/* Thông báo đã gửi */}
      {sentNotice && !error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-50/80 border border-teal-200/80 rounded-xl text-xs sm:text-sm text-teal-800 font-medium"
        >
          <Check className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2.5} />
          <span>{sentNotice}</span>
        </motion.div>
      )}

      {/* 6 ô OTP Inputs */}
      <div className="flex gap-2 sm:gap-3 justify-center py-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
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
              w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none
              transition-all duration-150 caret-transparent font-mono shadow-xs
              ${
                isSuccess
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : error
                  ? 'border-rose-400 bg-rose-50/50 text-rose-700'
                  : digit
                  ? 'border-[#11C5C6] bg-teal-50/40 text-slate-900 ring-2 ring-[#11C5C6]/15'
                  : 'border-slate-200 bg-white text-slate-900 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
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
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Success message */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-800"
        >
          <Check className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={3} />
          <span>Xác thực thành công! Đang chuyển hướng...</span>
        </motion.div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!isComplete || isLoading || isSuccess}
        className="group relative w-full h-[52px] px-6 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #FF6A00 0%, #FF8533 50%, #FF6A00 100%)',
        }}
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transition-transform" />

        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSuccess ? (
          <>
            <Check className="w-5 h-5" strokeWidth={3} />
            <span>ĐÃ XÁC THỰC</span>
          </>
        ) : (
          <span>XÁC NHẬN MÃ</span>
        )}
      </button>

      {/* Gửi lại mã & Thời gian hiệu lực */}
      <div className="text-center text-xs sm:text-sm text-slate-500">
        <p className="mb-1">
          Mã có hiệu lực trong <strong className="text-slate-700">10 phút</strong>
        </p>
        {countdown > 0 ? (
          <p>
            Gửi lại mã sau{' '}
            <span className="font-semibold text-[#087E9C] tabular-nums font-mono">
              {countdown}s
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-[#087E9C] hover:text-[#11C5C6] font-semibold hover:underline focus:outline-none disabled:opacity-60 cursor-pointer"
          >
            {isResending ? 'Đang gửi mã mới...' : 'Gửi lại mã OTP'}
          </button>
        )}
      </div>

      {/* Nút quay lại */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer pt-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel ?? 'Đổi email / Quay lại đăng ký'}</span>
      </button>
    </motion.div>
  );
}
