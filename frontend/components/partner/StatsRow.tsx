'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Store, CheckCircle2, Clock, Lock } from 'lucide-react';

interface StatsRowProps {
  total: number;
  active: number;
  pending: number;
  locked: number;
}

function Counter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (end <= 0) {
      setCount(0);
      return;
    }
    const duration = 600;
    const incrementTime = 20;
    const steps = duration / incrementTime;
    const stepValue = Math.ceil(end / steps);

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString('vi-VN')}</span>;
}

export default function StatsRow({ total, active, pending, locked }: StatsRowProps) {
  const items = [
    {
      title: 'Tổng quán ăn',
      value: total,
      desc: 'Cơ sở đã đăng ký',
      icon: Store,
      iconBg: 'bg-[#E9F8F5] text-[#008F89] border-[#BDE8E0]',
      accentBar: 'bg-[#008F89]',
    },
    {
      title: 'Đang hoạt động',
      value: active,
      desc: 'Hiển thị công khai',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      accentBar: 'bg-emerald-500',
    },
    {
      title: 'Chờ phê duyệt',
      value: pending,
      desc: 'Ban quản trị tiếp nhận',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      accentBar: 'bg-[#FF8A24]',
    },
    {
      title: 'Bị khóa (Admin)',
      value: locked,
      desc: 'Tạm ngưng phục vụ',
      icon: Lock,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      accentBar: 'bg-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-7">
      {items.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.06, ease: 'easeOut' }}
            className="group relative bg-white rounded-[20px] p-5 sm:p-6 border border-[#E2ECEC] hover:border-[#BDE8E0] shadow-xs hover:shadow-md hover:-translate-y-[3px] transition-all duration-200 flex items-center justify-between overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.accentBar} opacity-80`} />
            <div className="pl-1">
              <p className="text-xs font-semibold text-[#68798A] uppercase tracking-wider">
                {stat.title}
              </p>
              <h3 className="text-[28px] sm:text-[32px] font-extrabold text-[#14233B] mt-1.5 leading-none">
                <Counter target={stat.value} />
              </h3>
              <p className="text-[11px] text-[#68798A] mt-1">{stat.desc}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${stat.iconBg}`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
