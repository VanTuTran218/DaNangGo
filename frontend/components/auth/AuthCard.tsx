'use client';

/**
 * AuthCard
 * ────────
 * Container chính hai cột cho trang Đăng nhập / Đăng ký DanangGo:
 * - Left Panel (48%): AuthHeroPanel — Cinematic Da Nang visual & stats
 * - Right Panel (52%): Auth Form với Animated Segmented Control và typography sang trọng
 * - Logo thương hiệu DanangGo la bàn chính thống
 * - Vùng cuộn tự nhiên (auth-scrollbar), không bị cắt nội dung trên mọi độ phân giải màn hình
 * - Giữ nguyên 100% logic routing, query params (?tab=dang-ky), session check và redirect
 */

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import AuthHeroPanel from './AuthHeroPanel';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AuthCardFrame from './AuthCardFrame';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthRedirect } from '@/lib/auth-redirect';

interface AuthCardProps {
  initialTab: 'login' | 'register';
  redirectTo: string;
}

export default function AuthCard(props: AuthCardProps) {
  return (
    <Suspense>
      <AuthCardContent {...props} />
    </Suspense>
  );
}

function AuthCardContent({ initialTab, redirectTo }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [direction, setDirection] = useState(-1);
  const [prefilledIdentifier, setPrefilledIdentifier] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Chuyển trang tập trung cho cả phiên có sẵn và đăng nhập vừa thành công
  useEffect(() => {
    if (!loading && user) {
      router.replace(getAuthRedirect(user.role, redirectTo, intent));
    }
  }, [user, loading, redirectTo, intent, router]);

  const handleTabChange = (newTab: 'login' | 'register', registeredEmail?: string) => {
    if (newTab === activeTab && !registeredEmail) return;
    setDirection(newTab === 'register' ? 1 : -1);
    setActiveTab(newTab);
    if (registeredEmail) {
      setPrefilledIdentifier(registeredEmail);
      setSuccessMessage('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
    }

    const params = new URLSearchParams();
    if (newTab === 'register') params.set('tab', 'dang-ky');
    if (redirectTo && redirectTo !== '/') params.set('redirect', redirectTo);
    if (intent) params.set('intent', intent);

    const searchString = params.toString();
    router.replace(`/dang-nhap${searchString ? `?${searchString}` : ''}`, { scroll: false });
  };

  const slideVariants = {
    initial: (dir: number) => ({
      x: dir * 14,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' as const },
    },
    exit: (dir: number) => ({
      x: dir * -14,
      opacity: 0,
      transition: { duration: 0.18, ease: 'easeIn' as const },
    }),
  };

  return (
    <AuthCardFrame>
      {/* ── NÚT VỀ TRANG CHỦ (GÓC TRÊN TRÁI) ── */}
      <a
        href="/"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 z-30 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-slate-200/80 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-medium shadow-xs transition-all duration-200 group"
        aria-label="Quay về trang chủ DanangGo"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
        <span>Về trang chủ</span>
      </a>

      {/* ── CONTAINER HAI CỘT: LEFT (48%) - RIGHT (52%) ── */}
      <div className="w-full bg-white rounded-[1.75rem] overflow-hidden grid lg:grid-cols-[48%_52%] min-h-[600px] lg:h-[min(880px,94vh)] relative">
        {/* Left: AuthHeroPanel — Cinematic Da Nang */}
        <AuthHeroPanel activeTab={activeTab} />

        {/* Right: Auth Form Panel */}
        <div className="flex flex-col relative w-full bg-white min-h-0 h-full overflow-hidden">
          {/* ── HEADER DI ĐỘNG (MOBILE ONLY) ── */}
          <div className="lg:hidden bg-gradient-to-r from-[#061B30] via-[#087E9C] to-[#061B30] py-5 px-4 flex flex-col items-center justify-center text-white text-center shadow-inner shrink-0">
            <div className="flex items-center gap-2.5">
              <svg
                width="36"
                height="36"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              >
                <circle cx="60" cy="60" r="55" stroke="#11C5C6" strokeWidth="4" />
                <path d="M60 20 L68 52 L60 58 L52 52 Z" fill="#11C5C6" />
                <path d="M60 100 L52 68 L60 62 L68 68 Z" fill="rgba(255,255,255,0.4)" />
                <path d="M20 60 L52 52 L58 60 L52 68 Z" fill="rgba(255,255,255,0.4)" />
                <path d="M100 60 L68 68 L62 60 L68 52 Z" fill="#FF6A00" />
                <circle cx="60" cy="60" r="4.5" fill="white" />
              </svg>
              <span className="text-xl font-black uppercase tracking-wider font-display">
                <span className="text-[#11C5C6]">Danang</span>
                <span className="text-[#FF6A00]">Go</span>
              </span>
            </div>
            <p className="text-cyan-100/75 text-[11px] tracking-widest uppercase mt-1">
              Cẩm nang du lịch Đà Nẵng
            </p>
          </div>

          {/* ── NỘI DUNG FORM PANEL (CUỘN MƯỢT TỰ NHIÊN, KHÔNG LẤP LOGO) ── */}
          <div className="flex-1 min-h-0 w-full px-6 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8 xl:px-12 xl:py-8 overflow-y-auto auth-scrollbar flex flex-col justify-start">
            <div className={`w-full max-w-md mx-auto flex flex-col ${activeTab === 'login' ? 'my-auto' : ''}`}>
              {/* Logo thương hiệu chính thống trên desktop */}
              <div className="hidden lg:flex flex-col items-center justify-center mb-5 shrink-0">
                <div className="flex items-center gap-3">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_0_10px_rgba(17,197,198,0.35)]"
                  >
                    <circle cx="60" cy="60" r="55" stroke="#11C5C6" strokeWidth="4" />
                    <path d="M60 20 L68 52 L60 58 L52 52 Z" fill="#11C5C6" />
                    <path d="M60 100 L52 68 L60 62 L68 68 Z" fill="rgba(100,116,139,0.35)" />
                    <path d="M20 60 L52 52 L58 60 L52 68 Z" fill="rgba(100,116,139,0.35)" />
                    <path d="M100 60 L68 68 L62 60 L68 52 Z" fill="#FF6A00" />
                    <circle cx="60" cy="60" r="4.5" fill="#087E9C" />
                  </svg>
                  <span className="text-2xl font-black uppercase tracking-wider font-display">
                    <span className="text-[#087E9C]">Danang</span>
                    <span className="text-[#FF6A00]">Go</span>
                  </span>
                </div>

                {/* Tiêu đề & Dòng mô tả chào mừng */}
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 font-display">
                  {activeTab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 text-center max-w-sm">
                  {activeTab === 'login'
                    ? 'Đăng nhập để khám phá điểm đến và lịch trình cá nhân hóa.'
                    : 'Gia nhập DanangGo Club nhận ngay đặc quyền du lịch.'}
                </p>

                {/* Đường trang trí gradient nhỏ tinh tế */}
                <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#11C5C6] via-[#27E5DD] to-[#FF6A00] mt-2.5" />
              </div>

              {/* ── 5. TAB ĐĂNG NHẬP / ĐĂNG KÝ (ANIMATED SEGMENTED CONTROL) ── */}
              <div className="w-full max-w-md mx-auto mb-5 shrink-0">
                <LayoutGroup>
                  <div className="flex relative p-1 bg-slate-100/90 rounded-[14px] border border-slate-200/60 shadow-inner">
                    {(['login', 'register'] as const).map((tab) => {
                      const isSelected = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => handleTabChange(tab)}
                          className={`relative flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-[11px] transition-colors duration-200 z-10 cursor-pointer text-center ${
                            isSelected ? 'text-[#087E9C]' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="auth-tab-indicator"
                              className="absolute inset-0 bg-white rounded-[11px] shadow-sm border border-slate-200/50"
                              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                            />
                          )}
                          <span className="relative z-10">
                            {tab === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </LayoutGroup>
              </div>

              {/* ── BIỂU MẪU ĐĂNG NHẬP / ĐĂNG KÝ ── */}
              <div className="relative w-full">
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
                        initialIdentifier={prefilledIdentifier}
                        successMessage={successMessage}
                      />
                    ) : (
                      <RegisterForm
                        onSwitchToLogin={(email) => handleTabChange('login', email)}
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
    </AuthCardFrame>
  );
}
