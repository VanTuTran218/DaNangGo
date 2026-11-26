'use client';

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
  onVerify?: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  onResend?: (email: string) => Promise<{ success: boolean; error?: string }>;
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
    setTimeout(() => inputRefs.current[0]?.focus(), 120);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCountdown]);

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
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
          <div className="w-15 h-15 rounded-2xl bg-[#0A2532] border border-[#E6D9B7]/30 flex items-center justify-center text-[#E6D9B7]">
            <Mail className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#E87B39] text-[#FFFDF5] flex items-center justify-center text-xs shadow-sm">
            <Send className="w-3 h-3" />
          </div>
        </div>

        <div>
          <h2 className="cinematic-condensed uppercase text-2xl font-bold text-[#FFFDF5]">
            Xác thực <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">email</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#94B0B3] mt-1">
            Mã xác nhận 6 số đã được gửi tới
          </p>
          <p className="text-sm font-semibold text-[#2DD4BF] mt-0.5">{maskedEmail}</p>
        </div>
      </div>

      {/* Sent notice */}
      {sentNotice && !error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0A2C2E]/80 border border-[#2DD4BF]/32 rounded-xl text-xs text-[#A7F3D0] font-medium"
        >
          <Check className="w-4 h-4 text-[#2DD4BF] shrink-0" strokeWidth={2.5} />
          <span>{sentNotice}</span>
        </motion.div>
      )}

      {/* 6 OTP Inputs */}
      <div className="flex gap-2 sm:gap-2.5 justify-center py-1">
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
            className={`w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-150 caret-transparent font-mono ${
              isSuccess
                ? 'border-[#2DD4BF] bg-[#0A2C2E] text-[#2DD4BF]'
                : error
                ? 'border-rose-400/80 bg-[#311417]/70 text-rose-200'
                : digit
                ? 'border-[#E6D9B7] bg-[#0D2A38] text-[#FFFDF5] ring-2 ring-[#E6D9B7]/20'
                : 'border-[#E6D9B7]/22 bg-[#0A202B] text-[#FFFDF5] focus:border-[#E6D9B7] focus:ring-2 focus:ring-[#E6D9B7]/20'
            } disabled:opacity-65 disabled:cursor-not-allowed`}
            aria-label={`Chữ số thứ ${i + 1}`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#311417]/90 border border-rose-400/40 rounded-xl text-xs sm:text-sm text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Success */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0A2C2E]/90 border border-[#2DD4BF]/45 rounded-xl text-xs sm:text-sm font-semibold text-[#A7F3D0]"
        >
          <Check className="w-5 h-5 text-[#2DD4BF] shrink-0" strokeWidth={3} />
          <span>Xác thực thành công! Đang chuyển hướng...</span>
        </motion.div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!isComplete || isLoading || isSuccess}
        className="group relative w-full h-[50px] px-6 text-[#FFFDF5] font-bold text-xs sm:text-sm uppercase tracking-[0.14em] rounded-xl bg-gradient-to-r from-[#E87B39] via-[#DC6C2B] to-[#CC5E20] border border-[#FFFDF5]/20 shadow-[0_14px_30px_rgba(232,123,57,0.38)] hover:brightness-108 active:scale-[0.985] transition-all flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSuccess ? (
          <>
            <Check className="w-5 h-5" strokeWidth={3} />
            <span>Đã xác thực</span>
          </>
        ) : (
          <span>Xác nhận mã</span>
        )}
      </button>

      {/* Resend countdown */}
      <div className="text-center text-xs text-[#94B0B3]">
        <p className="mb-1">
          Mã có hiệu lực trong <strong className="text-[#E6D9B7]">10 phút</strong>
        </p>
        {countdown > 0 ? (
          <p>
            Gửi lại mã sau{' '}
            <span className="font-semibold text-[#2DD4BF] tabular-nums font-mono">
              {countdown}s
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-[#E6D9B7] hover:text-[#FFFDF5] font-semibold hover:underline focus:outline-none disabled:opacity-60 cursor-pointer"
          >
            {isResending ? 'Đang gửi mã mới...' : 'Gửi lại mã OTP'}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#94B0B3] hover:text-[#FFFDF5] transition-colors cursor-pointer pt-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{backLabel ?? 'Đổi email / Quay lại đăng ký'}</span>
      </button>
    </motion.div>
  );
}
