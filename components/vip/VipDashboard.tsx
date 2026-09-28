import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TIER_CONFIG } from '@/lib/constants/tiers';
import { EarnRules } from './EarnRules';
import { PrivilegeCard, Privilege } from './PrivilegeCard';
import type { User, Tier } from '@/types/user';

interface VipDashboardProps {
  user: User;
}

const allPrivileges: Privilege[] = [
  {
    id: '1',
    title: 'Giảm 10% Khách sạn ven biển',
    category: 'Khách sạn',
    tier: 'Silver',
    code: 'DNGHOTEL10',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
    desc: 'Áp dụng cho tất cả khách sạn dọc biển Mỹ Khê.',
  },
  {
    id: '2',
    title: 'Giảm 15% Resort Cao cấp',
    category: 'Khách sạn',
    tier: 'Gold',
    code: 'DNGRESORT15',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80',
    desc: 'Kỳ nghỉ đẳng cấp tại hệ thống resort đối tác.',
  },
  {
    id: '3',
    title: 'Tặng 1 món khai vị tại nhà hàng',
    category: 'Ẩm thực',
    tier: 'Silver',
    code: 'DNGFOODS',
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=500&q=80',
    desc: 'Tại nhà hàng hải sản cao cấp trong hệ thống.',
  },
  {
    id: '4',
    title: 'Giảm 20% Hóa đơn Ẩm thực',
    category: 'Ẩm thực',
    tier: 'Diamond',
    code: 'DNGFOOD20',
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=500&q=80',
    desc: 'Thưởng thức ẩm thực đỉnh cao với ưu đãi khủng.',
  },
  {
    id: '5',
    title: 'Vé cáp treo Bà Nà miễn phí (1 chiều)',
    category: 'Vé tham quan',
    tier: 'Diamond',
    code: 'DNGBANA',
    image: 'https://images.unsplash.com/photo-1627885067615-5d9c228d4474?w=500&q=80',
    desc: 'Ưu đãi cực sốc cho thành viên Kim Cương.',
  },
  {
    id: '6',
    title: 'Giảm 5% Vé Sun World',
    category: 'Vé tham quan',
    tier: 'Silver',
    code: 'DNGSUN5',
    image: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=500&q=80',
    desc: 'Khám phá Sun World với giá tiết kiệm hơn.',
  }
];

const TIER_LEVELS: Record<Tier, number> = {
  None: 0,
  Silver: 1,
  Gold: 2,
  Diamond: 3
};

const CATEGORIES = ['Tất cả', 'Khách sạn', 'Ẩm thực', 'Vé tham quan'];

export function VipDashboard({ user }: VipDashboardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  
  const membership = user.membership;
  const currentTierInfo = TIER_CONFIG[membership.tier];
  const userTierLevel = TIER_LEVELS[membership.tier];
  
  const points = membership.points || 0;
  const nextTierPoints = membership.nextTierPoints || 1000;
  const progressPercent = Math.min(100, Math.max(0, (points / nextTierPoints) * 100));

  const filteredPrivileges = useMemo(() => {
    if (activeCategory === 'Tất cả') return allPrivileges;
    return allPrivileges.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const joinDate = membership.joinedAt ? new Date(membership.joinedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Card */}
        <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-r ${currentTierInfo.gradient} shadow-2xl p-8 md:p-12 mb-12 text-white`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 border-4 border-white/40 p-1 flex items-center justify-center overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-bold mb-3 backdrop-blur-sm">
                {currentTierInfo.label}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 text-white/80 text-sm mb-6">
                <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> Mã thẻ: DNG-VIP-{user.id.substring(0,6).toUpperCase()}</span>
                <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Tham gia từ {joinDate}</span>
              </div>

              {/* Progress Bar */}
              <div className="max-w-xl">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>{points} điểm</span>
                  <span>{nextTierPoints} điểm</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                {points < nextTierPoints && (
                  <p className="text-xs mt-2 text-white/70">
                    Cần thêm {nextTierPoints - points} điểm để lên hạng tiếp theo
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center md:justify-start gap-2 mb-8 overflow-x-auto pb-4 hide-scrollbar">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === category ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {activeCategory === category && (
                <motion.div
                  layoutId="activeCategoryIndicator"
                  className="absolute inset-0 bg-gray-900 rounded-full"
                  initial={false}
                  transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{category}</span>
            </button>
          ))}
        </div>

        {/* Privilege Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredPrivileges.map((privilege, idx) => {
            const reqLevel = TIER_LEVELS[privilege.tier];
            const isLocked = reqLevel > userTierLevel;
            const targetMinPoints = TIER_CONFIG[privilege.tier].minPoints;
            const missingPoints = Math.max(0, targetMinPoints - points);

            return (
              <PrivilegeCard
                key={privilege.id}
                privilege={privilege}
                isLocked={isLocked}
                missingPoints={isLocked ? missingPoints : 0}
                idx={idx}
              />
            );
          })}
        </div>

        {/* Earn Rules */}
        <EarnRules />
      </div>
    </div>
  );
}
