import { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { TIER_CONFIG } from '@/lib/constants/tiers';
import { EarnRules } from './EarnRules';
import { PrivilegeCard } from './PrivilegeCard';
import { Loader2, X } from 'lucide-react';
import type { User } from '@/types/user';
import { registerVip } from '@/lib/api/auth';

interface VipLandingProps {
  user: User | null;
  updateUser: (data: Partial<User>) => void;
}

const mockPrivileges = [
  {
    id: '1',
    title: 'Giảm 10% Khách sạn ven biển',
    category: 'Khách sạn',
    tier: 'Silver' as const,
    code: 'DNGHOTEL10',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
    desc: 'Áp dụng cho tất cả khách sạn dọc biển Mỹ Khê.',
  },
  {
    id: '2',
    title: 'Tặng 1 món khai vị tại nhà hàng',
    category: 'Ẩm thực',
    tier: 'Gold' as const,
    code: 'DNGFOOD',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=500&q=80',
    desc: 'Nhà hàng hải sản cao cấp trong hệ thống.',
  },
  {
    id: '3',
    title: 'Vé cáp treo Bà Nà miễn phí (1 chiều)',
    category: 'Vé tham quan',
    tier: 'Diamond' as const,
    code: 'DNGBANA',
    image: 'https://images.unsplash.com/photo-1627885067615-5d9c228d4474?w=500&q=80',
    desc: 'Ưu đãi cực sốc cho thành viên Kim Cương.',
  }
];

export function VipLanding({ user, updateUser }: VipLandingProps) {
  const shouldReduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'register-vip') {
      if (!user) {
        router.push('/dang-nhap?intent=vip');
      } else {
        setShowModal(true);
      }
    }
  }, [searchParams, user, router]);

  const handleRegister = async () => {
    if (!agreed) return;
    setActivating(true);
    try {
      const res = await registerVip();
      if (res.success && res.user) {
        try {
          // @ts-ignore
          const confetti = (await import('canvas-confetti')).default;
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
        setShowModal(false);
        updateUser(res.user);
      }
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Hero Banner */}
      <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80)',
            transform: 'translateZ(0)'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.h1 
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Đặc quyền thành viên DanangGo
          </motion.h1>
          <motion.p 
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-200 mb-8"
          >
            Trải nghiệm Đà Nẵng trọn vẹn hơn với vô vàn ưu đãi độc quyền dành riêng cho bạn.
          </motion.p>
          
          {user ? (
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-full text-lg hover:shadow-lg transition-all flex items-center justify-center mx-auto min-w-[280px]"
            >
              Đăng ký thành viên VIP
            </button>
          ) : (
            <Link 
              href="/dang-nhap?intent=vip"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-full text-lg hover:bg-blue-700 hover:shadow-lg transition-all"
            >
              Đăng ký thành viên VIP
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {/* Tier Comparison */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Các Hạng Thành Viên</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Silver', 'Gold', 'Diamond'].map((t, idx) => {
              const tierInfo = TIER_CONFIG[t as keyof typeof TIER_CONFIG];
              return (
                <motion.div
                  key={t}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.15 }}
                  className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col ${t === 'Gold' ? 'transform md:-translate-y-4 shadow-2xl border-yellow-200' : ''}`}
                >
                  {t === 'Gold' && (
                    <div className="absolute top-0 inset-x-0 bg-yellow-500 text-white text-center text-xs font-bold py-1 uppercase tracking-wider">
                      Phổ biến
                    </div>
                  )}
                  <div className={`p-8 pb-6 bg-gradient-to-br ${tierInfo.gradient} text-white ${t === 'Gold' ? 'pt-10' : ''}`}>
                    <h3 className="text-2xl font-bold mb-1">{tierInfo.name}</h3>
                    <p className="opacity-90 text-sm">{tierInfo.label}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-black">{tierInfo.minPoints}</span>
                      <span className="text-sm opacity-80 ml-1">điểm</span>
                    </div>
                  </div>
                  <div className="p-8 flex-1">
                    <ul className="space-y-4">
                      {tierInfo.benefits.map((b, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-700">
                          <svg className="w-5 h-5 text-green-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Earn Rules */}
        <EarnRules />

        {/* Preview Privileges */}
        <div className="mt-16 mb-20">
          <h2 className="text-2xl font-bold text-center mb-8">Hé lộ Đặc Quyền</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockPrivileges.map((p, idx) => (
              <PrivilegeCard 
                key={p.id} 
                privilege={p} 
                isLocked={true} 
                idx={idx} 
              />
            ))}
          </div>
        </div>
        
        {/* CTA */}
        <div className="bg-blue-600 rounded-3xl p-10 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng để tận hưởng?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">Hàng ngàn ưu đãi đang chờ đón bạn. Tham gia cộng đồng VIP ngay hôm nay hoàn toàn miễn phí.</p>
          {!user ? (
            <Link 
              href="/dang-nhap?intent=vip"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-50 transition-colors"
            >
              Đăng ký thành viên VIP
            </Link>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-50 transition-colors"
            >
              Đăng ký thành viên VIP
            </button>
          )}
        </div>
      </div>

      {/* Modal Đăng ký VIP */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Xác nhận đăng ký thành viên VIP</h3>
                <p className="text-sm text-gray-500 mt-2">Trải nghiệm Đà Nẵng trọn vẹn hơn với vô vàn ưu đãi độc quyền.</p>
              </div>

              <div className="mb-6 bg-gray-50 p-4 rounded-xl text-sm text-gray-700 h-32 overflow-y-auto border border-gray-100">
                <p className="font-semibold mb-2">Quy chế thành viên DanangGo VIP:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Thành viên VIP sẽ được hưởng các ưu đãi theo từng hạng (Silver, Gold, Diamond).</li>
                  <li>Điểm tích lũy không có giá trị quy đổi thành tiền mặt.</li>
                  <li>DanangGo có quyền thay đổi quy chế mà không cần báo trước.</li>
                  <li>Quyết định của DanangGo là quyết định cuối cùng trong mọi trường hợp tranh chấp.</li>
                </ul>
              </div>

              <label className="flex items-center gap-3 cursor-pointer mb-6 group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-gray-300 group-hover:border-orange-500 transition-colors bg-white shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <svg
                    className={`w-3.5 h-3.5 text-orange-600 absolute pointer-events-none transition-transform duration-200 ${agreed ? 'scale-100' : 'scale-0'}`}
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7L6 10L11 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700 font-medium">Tôi đồng ý với Quy chế thành viên</span>
              </label>

              <button
                onClick={handleRegister}
                disabled={!agreed || activating}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {activating ? (
                  <><Loader2 className="animate-spin mr-2 w-5 h-5" /> Đang xử lý...</>
                ) : (
                  'Xác nhận đăng ký'
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
