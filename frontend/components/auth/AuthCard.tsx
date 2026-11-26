'use client';

/**
 * AuthCard — Nocturnal Club Sanctuary Split Container (/dang-nhap)
 * ────────────────────────────────────────────────────────────────
 * - Left Panel (47%): AuthHeroPanel — Cinematic Da Nang showcase & telemetry
 * - Right Panel (53%): Frosted Obsidian Smoked-Glass Auth Form with spring Champagne tabs
 * - Preserves 100% routing, query params (?tab=dang-ky, ?redirect, ?intent), session check & redirect
 */

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
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
      transition: { duration: 0.24, ease: 'easeOut' as const },
    },
    exit: (dir: number) => ({
      x: dir * -14,
      opacity: 0,
      transition: { duration: 0.16, ease: 'easeIn' as const },
    }),
  };

  return (
    <AuthCardFrame
      footer={
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94B0B3] hover:text-[#E6D9B7] transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Đăng nhập quản trị</span>
        </Link>
      }
    >
      {/* ── NÚT VỀ TRANG CHỦ (FROSTED DARK GLASS PILL) ── */}
      <Link
        href="/"
        className="absolute top-4 sm:top-6 left-4 sm:left-6 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#06151C]/82 hover:bg-[#0B2330] backdrop-blur-xl border border-[#E6D9B7]/30 hover:border-[#E6D9B7]/65 text-[#E6D9B7] hover:text-[#FFFDF5] text-xs font-semibold shadow-[0_10px_26px_rgba(2,10,15,0.45)] transition-all duration-200 group"
        aria-label="Quay về trang chủ DanangGo"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Về trang chủ</span>
      </Link>

      {/* ── CONTAINER HAI CỘT: LEFT (47%) - RIGHT (53%) ── */}
      <div className="w-full overflow-hidden grid lg:grid-cols-[47%_53%] min-h-[600px] lg:h-[min(820px,88dvh)] relative">
        {/* Left: Cinematic Nocturnal Showcase */}
        <AuthHeroPanel activeTab={activeTab} />

        {/* Right: Frosted Smoked-Glass Form Sanctuary */}
        <div className="flex flex-col relative w-full bg-[#071821]/92 lg:border-l border-[#E6D9B7]/14 min-h-0 h-full overflow-hidden">
          {/* ── HEADER DI ĐỘNG (MOBILE ONLY) ── */}
          <div className="lg:hidden bg-[#05141C] pt-16 pb-5 px-4 flex flex-col items-center justify-center text-[#FFFDF5] text-center border-b border-[#E6D9B7]/14 shrink-0">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/branding/danang-logo.png"
                alt="Biểu trưng Đà Nẵng"
                width={38}
                height={38}
                className="w-9 h-9 object-contain shrink-0"
              />
              <span className="text-xl font-black uppercase tracking-wider font-display">
                <span className="text-[#FFFDF5]">Danang</span>
                <span className="text-[#E87B39]">Go</span>
              </span>
            </div>
            <p className="text-[#E6D9B7]/75 text-[10.5px] tracking-[0.22em] uppercase mt-1.5">
              Cẩm nang du lịch Đà Nẵng
            </p>
          </div>

          {/* ── NỘI DUNG FORM PANEL ── */}
          <div
            data-lenis-prevent
            className="flex-1 min-h-0 w-full px-6 py-6 sm:px-9 sm:py-7 lg:px-11 lg:py-8 overflow-y-auto bando-sidebar-scroll flex flex-col justify-start"
          >
            <div className={`w-full max-w-[420px] mx-auto flex flex-col ${activeTab === 'login' ? 'my-auto' : ''}`}>
              {/* Brand & Two-Tone Editorial Heading */}
              <div className="hidden lg:flex flex-col items-center justify-center mb-6 shrink-0 text-center">
                <div className="flex items-center gap-2.5 mb-3">
                  <img
                    src="/images/branding/danang-logo.png"
                    alt="Biểu trưng Đà Nẵng"
                    width={38}
                    height={38}
                    className="w-9 h-9 object-contain shrink-0"
                  />
                  <span className="text-xl font-black uppercase tracking-[0.08em] font-display">
                    <span className="text-[#FFFDF5]">Danang</span>
                    <span className="text-[#E87B39]">Go</span>
                  </span>
                </div>

                <h1 className="cinematic-condensed uppercase text-2xl sm:text-[1.95rem] font-bold text-[#FFFDF5] tracking-[0.015em] leading-tight">
                  {activeTab === 'login' ? (
                    <>
                      Chào mừng{' '}
                      <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">
                        trở lại
                      </span>
                    </>
                  ) : (
                    <>
                      Tạo tài khoản{' '}
                      <span className="home-serif italic font-normal normal-case text-[#E6D9B7]">
                        hội viên
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-xs sm:text-[13px] text-[#94B0B3] mt-1.5 max-w-xs leading-relaxed">
                  {activeTab === 'login'
                    ? 'Đăng nhập để tiếp tục hành trình khám phá và đồng bộ lịch trình của bạn.'
                    : 'Gia nhập DanangGo Club miễn phí để mở khóa đặc quyền du lịch Đà Nẵng.'}
                </p>
              </div>

              {/* ── ANIMATED CHAMPAGNE SEGMENTED CONTROL ── */}
              <div className="w-full mb-5 shrink-0">
                <LayoutGroup id="auth-tabs">
                  <div className="flex relative p-1 bg-[#0A202B]/90 rounded-xl border border-[#E6D9B7]/18">
                    {(['login', 'register'] as const).map((tab) => {
                      const isSelected = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => handleTabChange(tab)}
                          className={`relative flex-1 py-2.5 text-xs sm:text-[13px] font-semibold rounded-lg transition-colors duration-200 z-10 cursor-pointer text-center ${
                            isSelected ? 'text-[#06151C]' : 'text-[#CBD9DA]/80 hover:text-[#FFFDF5]'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="auth-tab-indicator"
                              className="absolute inset-0 bg-[#E6D9B7] rounded-lg shadow-[0_6px_16px_rgba(230,217,183,0.25)]"
                              transition={{ type: 'spring', bounce: 0.16, duration: 0.35 }}
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
