'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}

export default function PasswordField({
  id,
  name,
  label,
  placeholder = '••••••••',
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  required,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isValid = !error && value.length >= 8;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6D9B7]/90 flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-[#E87B39] ml-1">*</span>}
        </span>
      </label>

      <div className="relative flex items-center">
        <div
          className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${
            error
              ? 'text-rose-400'
              : isFocused
              ? 'text-[#E6D9B7]'
              : 'text-[#94B0B3]'
          }`}
        >
          <Lock className="w-[17px] h-[17px]" />
        </div>

        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`auth-dark-input block w-full pl-10 pr-20 h-[48px] bg-[#0A202B]/90 hover:bg-[#0D2835] focus:bg-[#0D2835] border ${
            error
              ? 'border-rose-400/75 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20'
              : 'border-[#E6D9B7]/20 hover:border-[#E6D9B7]/40 focus:border-[#E6D9B7]/75 focus:ring-2 focus:ring-[#E6D9B7]/14'
          } rounded-xl text-[#FFFDF5] placeholder:text-[#94B0B3]/55 focus:outline-none transition-all duration-200 text-sm`}
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {isValid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[#2DD4BF] p-1 pointer-events-none"
              title="Độ dài mật khẩu đạt chuẩn"
            >
              <Check className="w-4 h-4" strokeWidth={2.8} />
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-[#94B0B3] hover:text-[#FFFDF5] hover:bg-[#123342] rounded-lg transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs text-rose-300 mt-0.5 flex items-center gap-1.5 font-medium"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
