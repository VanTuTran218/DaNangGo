'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import AuthHeroPanel from './AuthHeroPanel';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

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
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [direction, setDirection] = useState(-1);

  const handleTabChange = (newTab: 'login' | 'register') => {
    if (newTab === activeTab) return;
    setDirection(newTab === 'register' ? 1 : -1);
    setActiveTab(newTab);
    
    const params = new URLSearchParams();
    if (newTab === 'register') params.set('tab', 'dang-ky');
    if (redirectTo && redirectTo !== '/') params.set('redirect', redirectTo);
    if (intent) params.set('intent', intent);
    
    const searchString = params.toString();
    router.replace(`/dang-nhap${searchString ? `?${searchString}` : ''}`, { scroll: false });
  };

  const slideVariants = {
    initial: (dir: number) => ({
      x: dir * 30,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    exit: (dir: number) => ({
      x: dir * -30,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' as const }
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
                        <span className="relative z-10">{tab === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}</span>
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
