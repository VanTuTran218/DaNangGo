#!/bin/bash

# Create necessary directories
mkdir -p types lib/api components/auth app/\(auth\)/dang-nhap

# 1. types/user.ts
cat << 'INNER_EOF' > types/user.ts
export interface LoginPayload {
  identifier: string; // email or phone
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  identifier: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    tier: 'Silver' | 'Gold' | 'Diamond';
    avatarUrl?: string;
  };
  error?: string;
}
INNER_EOF

# 2. lib/api/auth.ts
cat << 'INNER_EOF' > lib/api/auth.ts
import { LoginPayload, RegisterPayload, AuthResponse } from '@/types/user';

// TODO: Replace with real API calls to your backend
// Example: const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { method:'POST', body:JSON.stringify(payload) })

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  await delay(1200); // Simulate network
  // TODO: Replace with: return await fetch('/api/auth/login', { method:'POST', ... }).then(r => r.json())
  if (!payload.identifier || !payload.password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ thông tin.' };
  }
  // Mock success for any valid-looking credentials
  return {
    success: true,
    user: { id: '1', name: 'Thành viên DanangGo', email: payload.identifier, tier: 'Silver' },
  };
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  await delay(1400);
  // TODO: Replace with real API
  if (!payload.name || !payload.identifier || !payload.password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ thông tin.' };
  }
  if (payload.password !== payload.confirmPassword) {
    return { success: false, error: 'Mật khẩu xác nhận không khớp.' };
  }
  return {
    success: true,
    user: { id: '2', name: payload.name, email: payload.identifier, tier: 'Silver' },
  };
}
INNER_EOF

# 3. components/auth/PasswordField.tsx
cat << 'INNER_EOF' > components/auth/PasswordField.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const isValid = !error && value.length >= 8;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`block w-full pl-10 pr-12 py-2.5 bg-white border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
          } rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        {isValid && (
          <div className="absolute inset-y-0 right-8 pr-1 flex items-center pointer-events-none text-green-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="text-sm text-red-500 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
INNER_EOF

# 4. components/auth/PasswordStrength.tsx
cat << 'INNER_EOF' > components/auth/PasswordStrength.tsx
'use client';

import { useMemo } from 'react';

export default function PasswordStrength({ password }: { password: string }) {
  const { score, label } = useMemo(() => {
    let s = 0;
    if (!password) {
      return { score: 0, label: '' };
    }
    if (password.length > 0) s += 1;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) s += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) s += 1;

    let l = '';
    if (s === 1) l = 'Yếu';
    else if (s === 2) l = 'Trung bình';
    else if (s === 3) l = 'Khá';
    else if (s === 4) l = 'Mạnh';

    return { score: Math.min(s, 4), label: l };
  }, [password]);

  const colors = [
    'bg-gray-200', // 0
    'bg-red-500',  // 1
    'bg-orange-500', // 2
    'bg-yellow-500', // 3
    'bg-green-500' // 4
  ];

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-transparent'}`}
              style={{ width: i <= score ? '100%' : '0%' }}
            ></div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-right">{label}</p>
    </div>
  );
}
INNER_EOF

# 5. components/auth/SocialButtons.tsx
cat << 'INNER_EOF' > components/auth/SocialButtons.tsx
'use client';

import { useState } from 'react';

export default function SocialButtons() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoadingGoogle(false);
  };

  const handleFacebook = async () => {
    setLoadingFacebook(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoadingFacebook(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loadingGoogle || loadingFacebook}
        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-700 font-medium hover:bg-gray-50 hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loadingGoogle ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Google
      </button>
      <button
        type="button"
        onClick={handleFacebook}
        disabled={loadingGoogle || loadingFacebook}
        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-700 font-medium hover:bg-gray-50 hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {loadingFacebook ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        Facebook
      </button>
    </div>
  );
}
INNER_EOF

# 6. components/auth/AuthHeroPanel.tsx
cat << 'INNER_EOF' > components/auth/AuthHeroPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AnimatedCounter from '@/components/AnimatedCounter';

interface AuthHeroPanelProps {
  activeTab: 'login' | 'register';
}

const IMAGES = [
  'https://images.unsplash.com/photo-1559493442-0eaaba8bb6ce?q=80&w=1600',
  'https://images.unsplash.com/photo-1582650949186-c5dc3bba5b7c?q=80&w=1600',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=1600'
];

export default function AuthHeroPanel({ activeTab }: AuthHeroPanelProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const title = activeTab === 'login'
    ? 'Chào mừng bạn trở lại cộng đồng DanangGo Club'
    : 'Gia nhập cộng đồng DanangGo Club';

  const desc = activeTab === 'login'
    ? 'Hàng trăm điểm đến, ẩm thực và lịch trình cá nhân hóa chờ đón bạn.'
    : 'Tích điểm mỗi lần đặt chỗ, nhận ưu đãi Hạng Bạc ngay khi đăng ký và truy cập các deal độc quyền.';

  // Highlight DanangGo Club
  const renderTitle = (text: string) => {
    const parts = text.split('DanangGo Club');
    return (
      <>
        {parts[0]}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
          DanangGo Club
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="hidden lg:block relative h-full w-full overflow-hidden">
      {/* Slideshow */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { scale: [1, 1.05] }}
            transition={{ duration: 6, ease: 'linear' }}
            className="w-full h-full relative"
          >
            <Image
              src={IMAGES[currentImage]}
              alt="Danang Background"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-black/50 to-transparent" />

      {/* Particles */}
      {!shouldReduceMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full opacity-20"
              style={{
                width: Math.random() * 4 + 4 + 'px',
                height: Math.random() * 4 + 4 + 'px',
                left: Math.random() * 100 + '%',
                bottom: '-5%'
              }}
              animate={{
                y: [0, -1000],
                x: [0, (Math.random() - 0.5) * 100],
                opacity: [0.15, 0.3, 0]
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-12 text-white pb-16 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="flex flex-col gap-6"
        >
          <motion.div className="flex flex-col items-start gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20">
              <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">
                Đặc quyền hội viên DanangGo
              </span>
            </div>
            <span className="text-xs tracking-widest uppercase opacity-80">
              Cẩm nang du lịch số #1 Đà Nẵng
            </span>
          </motion.div>

          <motion.h2 
            key={activeTab}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl font-bold leading-tight"
          >
            {renderTitle(title)}
          </motion.h2>

          <motion.p 
            key={`${activeTab}-desc`}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-lg text-white/80"
          >
            {desc}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 mt-4"
          >
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-2xl font-bold">
                <AnimatedCounter to={120} />K+
              </span>
              <span className="text-sm text-white/70">Members</span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-2xl font-bold">
                <AnimatedCounter to={4.9} decimals={1} />
              </span>
              <span className="text-sm text-white/70">Đánh giá</span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-2xl font-bold">
                <AnimatedCounter to={25} />%
              </span>
              <span className="text-sm text-white/70">Tiết kiệm trung bình</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
INNER_EOF

# 7. components/auth/LoginForm.tsx
cat << 'INNER_EOF' > components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PasswordField from './PasswordField';
import SocialButtons from './SocialButtons';
import { login } from '@/lib/api/auth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  redirectTo: string;
}

export default function LoginForm({ onSwitchToRegister, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ identifier?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!identifier) {
      newErrors.identifier = 'Vui lòng nhập email hoặc số điện thoại';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(identifier);
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
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const res = await login({ identifier, password, rememberMe });
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push(redirectTo || '/');
        }, 800);
      } else {
        setErrors({ general: res.error });
        setShakeKey(prev => prev + 1);
      }
    } catch (err) {
      setErrors({ general: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      animate={shakeKey > 0 ? { x: [0, -10, 10, -10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5 w-full max-w-md mx-auto"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
          Email hoặc Số điện thoại <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onBlur={() => {
              setTouched(prev => ({ ...prev, identifier: true }));
              validate();
            }}
            placeholder="nhap@email.com hoặc 09xxxx"
            className={`block w-full pl-10 pr-4 py-2.5 bg-white border ${
              touched.identifier && errors.identifier ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
            } rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`}
          />
        </div>
        {touched.identifier && errors.identifier && (
          <p className="text-sm text-red-500 mt-1">{errors.identifier}</p>
        )}
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Mật khẩu"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => {
          setTouched(prev => ({ ...prev, password: true }));
          validate();
        }}
        error={touched.password ? errors.password : undefined}
        required
      />

      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex items-center justify-center w-5 h-5 rounded border border-gray-300 group-hover:border-teal-500 transition-colors bg-white">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="peer sr-only"
            />
            <svg
              className={`w-3.5 h-3.5 text-teal-600 absolute pointer-events-none transition-transform duration-200 ${rememberMe ? 'scale-100' : 'scale-0'}`}
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M3 7L6 10L11 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={rememberMe ? 'path-animate' : ''}
              />
            </svg>
          </div>
          <span className="text-sm text-gray-600 select-none">Ghi nhớ đăng nhập</span>
        </label>
        <a href="#" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
          Quên mật khẩu?
        </a>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 text-center">{errors.general}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isSuccess}
        className="relative w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 mt-2 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-80"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSuccess ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <>
            ĐĂNG NHẬP NGAY
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Hoặc tiếp tục với</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <SocialButtons />

      <p className="text-center text-sm text-gray-600 mt-4">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-teal-600 font-bold hover:underline focus:outline-none"
        >
          Đăng ký ngay
        </button>
      </p>

      <style jsx>{`
        .path-animate {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: draw 0.3s forwards ease-out;
        }
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </motion.form>
  );
}
INNER_EOF

# 8. components/auth/RegisterForm.tsx
cat << 'INNER_EOF' > components/auth/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';
import { register } from '@/lib/api/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  redirectTo: string;
}

export default function RegisterForm({ onSwitchToLogin, redirectTo }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
    
    if (!identifier) {
      newErrors.identifier = 'Vui lòng nhập email hoặc số điện thoại';
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(identifier);
      if (!isEmail && !isPhone) {
        newErrors.identifier = 'Email hoặc số điện thoại không hợp lệ';
      }
    }
    
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

  const isFormValid = name && identifier && password.length >= 8 && confirmPassword === password && agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, identifier: true, password: true, confirmPassword: true, agreedToTerms: true });
    
    if (!validate()) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const res = await register({ name, identifier, password, confirmPassword, agreedToTerms });
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push(redirectTo || '/');
        }, 800);
      } else {
        setErrors({ general: res.error || 'Đăng ký thất bại' });
        setShakeKey(prev => prev + 1);
      }
    } catch (err) {
      setErrors({ general: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate();
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      animate={shakeKey > 0 ? { x: [0, -10, 10, -10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 w-full max-w-md mx-auto"
    >
      {/* Benefit Line */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-start gap-3 mb-2">
        <span className="text-xl leading-none">🎉</span>
        <p className="text-sm text-teal-800 font-medium">
          Đăng ký miễn phí và nhận ngay ưu đãi Hạng Bạc
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="Nguyễn Văn A"
            className={`block w-full pl-10 pr-4 py-2.5 bg-white border ${
              touched.name && errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
            } rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`}
          />
        </div>
        {touched.name && errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-identifier" className="text-sm font-medium text-gray-700">
          Email hoặc Số điện thoại <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="reg-identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onBlur={() => handleBlur('identifier')}
            placeholder="nhap@email.com hoặc 09xxxx"
            className={`block w-full pl-10 pr-4 py-2.5 bg-white border ${
              touched.identifier && errors.identifier ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
            } rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`}
          />
        </div>
        {touched.identifier && errors.identifier && <p className="text-sm text-red-500 mt-1">{errors.identifier}</p>}
      </div>

      <div className="flex flex-col">
        <PasswordField
          id="reg-password"
          name="password"
          label="Mật khẩu"
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
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={() => handleBlur('confirmPassword')}
        error={touched.confirmPassword ? errors.confirmPassword : undefined}
        required
      />

      <label className="flex items-start gap-3 cursor-pointer group mt-2">
        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 rounded border border-gray-300 group-hover:border-teal-500 transition-colors bg-white shrink-0">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="peer sr-only"
          />
          <svg
            className={`w-3.5 h-3.5 text-teal-600 absolute pointer-events-none transition-transform duration-200 ${agreedToTerms ? 'scale-100' : 'scale-0'}`}
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3 7L6 10L11 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={agreedToTerms ? 'path-animate' : ''}
            />
          </svg>
        </div>
        <span className="text-sm text-gray-600">
          Tôi đồng ý với <a href="#" className="text-teal-600 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-teal-600 hover:underline">Chính sách bảo mật</a>
        </span>
      </label>
      {touched.agreedToTerms && errors.agreedToTerms && <p className="text-sm text-red-500">{errors.agreedToTerms}</p>}

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
          <p className="text-sm text-red-600 text-center">{errors.general}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || isSuccess || (Object.keys(touched).length > 0 && !isFormValid)}
        className="relative w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors duration-200 mt-4 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isSuccess ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          'ĐĂNG KÝ TÀI KHOẢN'
        )}
      </button>

      <p className="text-center text-sm text-gray-600 mt-4">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-teal-600 font-bold hover:underline focus:outline-none"
        >
          Đăng nhập ngay
        </button>
      </p>

      <style jsx>{`
        .path-animate {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: draw 0.3s forwards ease-out;
        }
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </motion.form>
  );
}
INNER_EOF

# 9. components/auth/AuthCard.tsx
cat << 'INNER_EOF' > components/auth/AuthCard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import AuthHeroPanel from './AuthHeroPanel';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthCardProps {
  initialTab: 'login' | 'register';
  redirectTo: string;
}

export default function AuthCard({ initialTab, redirectTo }: AuthCardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [direction, setDirection] = useState(-1);

  const handleTabChange = (newTab: 'login' | 'register') => {
    if (newTab === activeTab) return;
    setDirection(newTab === 'register' ? 1 : -1);
    setActiveTab(newTab);
    const search = newTab === 'register' ? '?tab=dang-ky' : '';
    const redirectSearch = redirectTo && redirectTo !== '/' ? `${search ? '&' : '?'}redirect=${encodeURIComponent(redirectTo)}` : '';
    router.replace(`/dang-nhap${search}${redirectSearch}`, { scroll: false });
  };

  const slideVariants = {
    initial: (dir: number) => ({
      x: dir * 30,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: (dir: number) => ({
      x: dir * -30,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 px-4 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-400/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400/6 rounded-full blur-2xl pointer-events-none" />

      {/* Back to home link */}
      <a 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium z-10 group"
      >
        <motion.span whileHover={{ x: -4 }}>←</motion.span>
        Về trang chủ
      </a>

      <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2 relative z-10 border border-gray-100 min-h-[700px]">
        {/* Left: AuthHeroPanel */}
        <AuthHeroPanel activeTab={activeTab} />

        {/* Right: Form panel */}
        <div className="flex flex-col relative">
          {/* Mobile hero header */}
          <div className="lg:hidden h-36 bg-gradient-to-r from-[#0f2942] to-teal-600 flex flex-col items-center justify-center text-white px-4 text-center">
            <svg className="w-10 h-10 mb-2" viewBox="0 0 40 40" fill="none">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0z" fill="currentColor" fillOpacity="0.1"/>
              <path d="M12.5 25L20 12l7.5 13H12.5z" fill="currentColor"/>
            </svg>
            <h1 className="text-xl font-bold">DanangGo</h1>
          </div>

          <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
            {/* Logo area for desktop */}
            <div className="hidden lg:flex justify-center mb-8">
              <svg className="w-12 h-12 text-teal-600" viewBox="0 0 40 40" fill="none">
                <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0z" fill="currentColor" fillOpacity="0.1"/>
                <path d="M12.5 25L20 12l7.5 13H12.5z" fill="currentColor"/>
              </svg>
            </div>

            <div className="w-full max-w-md mx-auto mb-8">
              <LayoutGroup>
                <div className="flex relative p-1 bg-gray-100 rounded-xl">
                  {['login', 'register'].map((tab) => {
                    const isSelected = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab as 'login' | 'register')}
                        className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors z-10 ${
                          isSelected ? 'text-teal-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="auth-tab-indicator"
                            className="absolute inset-0 bg-white rounded-lg shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <span className="relative z-10">{tab === 'login' ? 'Đăng nhập' : 'Đăng ký'}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            <div className="relative">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {activeTab === 'login' ? (
                    <LoginForm 
                      onSwitchToRegister={() => handleTabChange('register')} 
                      redirectTo={redirectTo}
                    />
                  ) : (
                    <RegisterForm 
                      onSwitchToLogin={() => handleTabChange('login')} 
                      redirectTo={redirectTo}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
INNER_EOF

# 10. app/(auth)/layout.tsx
cat << 'INNER_EOF' > app/\(auth\)/layout.tsx
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Đăng nhập | DanangGo',
  description: 'Đăng nhập hoặc tạo tài khoản DanangGo để nhận ưu đãi Hạng Bạc và lịch trình cá nhân hóa.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
INNER_EOF

# 11. app/(auth)/dang-nhap/page.tsx
cat << 'INNER_EOF' > app/\(auth\)/dang-nhap/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AuthCard from '@/components/auth/AuthCard';

function AuthContent() {
  const params = useSearchParams();
  const tab = params.get('tab') === 'dang-ky' ? 'register' : 'login';
  const redirectTo = params.get('redirect') || '/';
  return <AuthCard initialTab={tab} redirectTo={redirectTo} />;
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AuthContent />
    </Suspense>
  );
}
INNER_EOF

bash -c "npx tsc --noEmit"
