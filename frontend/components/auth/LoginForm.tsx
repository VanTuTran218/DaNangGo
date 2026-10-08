'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PasswordField from './PasswordField';
import SocialButtons from './SocialButtons';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  redirectTo: string;
}

export default function LoginForm({ onSwitchToRegister, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { login: setAuthUser } = useAuth();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  
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
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const res = await login({ identifier, password, rememberMe });
      if (res.success) {
        if (res.user) setAuthUser(res.user);
        setIsSuccess(true);
        setTimeout(() => {
          if (res.user?.role === 'PARTNER') {
            router.push('/partner');
          } else if (intent === 'vip') {
            router.push('/vip?action=register-vip');
          } else {
            router.push(redirectTo || '/');
          }
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
        <Link href="/quen-mat-khau" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
          Quên mật khẩu?
        </Link>
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
    </motion.form>
  );
}
