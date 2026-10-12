'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';
import { register } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  redirectTo: string;
}

export default function RegisterForm({ onSwitchToLogin, redirectTo }: RegisterFormProps) {
  const router = useRouter();
  const { login: setAuthUser } = useAuth();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'USER' | 'PARTNER'>('USER');
  const [businessName, setBusinessName] = useState('');
  const [serviceType, setServiceType] = useState<'STAY' | 'TABLE' | 'TICKET'>('STAY');
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
    
    if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Email không hợp lệ';
    if (phone.trim() && !/^(0\d{9}|\+?84\d{9})$/.test(phone.trim().replace(/[\s().-]/g, ''))) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (role === 'PARTNER' && businessName.trim().length < 2) newErrors.businessName = 'Vui lòng nhập tên doanh nghiệp/cơ sở';
    
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

  const isFormValid = name && email && password.length >= 8 && confirmPassword === password && agreedToTerms && (role !== 'PARTNER' || businessName.trim().length >= 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, businessName: true, password: true, confirmPassword: true, agreedToTerms: true });
    
    if (!validate()) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const res = await register({
        name, email: email.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}), role,
        password, confirmPassword, agreedToTerms,
        ...(role === 'PARTNER' ? { partner: { businessName: businessName.trim(), serviceType } } : {}),
      });
      if (res.success) {
        if (res.user) setAuthUser(res.user);
        setIsSuccess(true);
        setTimeout(() => {
          if (intent === 'vip') {
            router.push('/vip?action=register-vip');
          } else {
            router.push(redirectTo || '/');
          }
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
          Đăng ký miễn phí để lưu lịch trình và đánh giá địa điểm
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
        <label htmlFor="reg-email" className="text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="nhap@email.com"
            className={`block w-full pl-10 pr-4 py-2.5 bg-white border ${
              touched.email && errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
            } rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`}
          />
        </div>
        {touched.email && errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-phone" className="text-sm font-medium text-gray-700">Số điện thoại <span className="text-gray-400">(không bắt buộc)</span></label>
        <input id="reg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => handleBlur('phone')} placeholder="09xxxxxxxx" className={`block w-full px-4 py-2.5 bg-white border ${touched.phone && errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'} rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`} />
        {touched.phone && errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-role" className="text-sm font-medium text-gray-700">Loại tài khoản <span className="text-red-500">*</span></label>
        <select id="reg-role" value={role} onChange={(e) => setRole(e.target.value as 'USER' | 'PARTNER')} className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200">
          <option value="USER">Khách du lịch</option><option value="PARTNER">Đối tác</option>
        </select>
      </div>
      {role === 'PARTNER' && <>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="partner-business" className="text-sm font-medium text-gray-700">Tên doanh nghiệp/cơ sở <span className="text-red-500">*</span></label>
          <input id="partner-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} onBlur={() => handleBlur('businessName')} className={`block w-full px-4 py-2.5 bg-white border ${touched.businessName && errors.businessName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'} rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow duration-200`} />
          {touched.businessName && errors.businessName && <p className="text-sm text-red-500 mt-1">{errors.businessName}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="partner-service" className="text-sm font-medium text-gray-700">Loại dịch vụ <span className="text-red-500">*</span></label>
          <select id="partner-service" value={serviceType} onChange={(e) => setServiceType(e.target.value as 'STAY' | 'TABLE' | 'TICKET')} className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow duration-200"><option value="STAY">Lưu trú</option><option value="TABLE">Ẩm thực</option><option value="TICKET">Vé tham quan</option></select>
        </div>
      </>}

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
    </motion.form>
  );
}
