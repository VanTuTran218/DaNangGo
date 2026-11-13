'use client';

/**
 * PasswordField — Ô nhập mật khẩu chuẩn giao diện cao cấp
 * ──────────────────────────────────────────────────────────
 * - Chiều cao 50px đồng nhất với toàn bộ hệ thống form
 * - Icon Lock căn chỉnh hoàn hảo, đổi màu khi focus
 * - Nút ẩn/hiện mật khẩu mượt mà với icon Eye / EyeOff
 * - Dấu tích xanh khi mật khẩu hợp lệ (>= 8 ký tự, không lỗi)
 * - Tương thích hoàn toàn với handler và validation hiện có
 */

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
        className="text-sm font-medium text-slate-700 flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </span>
      </label>

      <div className="relative flex items-center">
        {/* Icon Lock bên trái */}
        <div
          className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${
            error
              ? 'text-rose-400'
              : isFocused
              ? 'text-[#087E9C]'
              : 'text-slate-400'
          }`}
        >
          <Lock className="w-5 h-5" />
        </div>

        {/* Input */}
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
          className={`block w-full pl-11 pr-20 h-[50px] bg-slate-50/50 hover:bg-white focus:bg-white border ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
              : 'border-slate-200 hover:border-slate-300 focus:border-[#11C5C6] focus:ring-4 focus:ring-[#11C5C6]/15'
          } rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 text-sm`}
        />

        {/* Cụm biểu tượng bên phải (Check hợp lệ + Nút ẩn/hiện) */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {isValid && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-emerald-500 p-1 pointer-events-none"
              title="Độ dài mật khẩu đạt chuẩn"
            >
              <Check className="w-4 h-4" strokeWidth={3} />
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-lg transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Thông báo lỗi */}
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs text-rose-500 mt-0.5 flex items-center gap-1 font-medium"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
