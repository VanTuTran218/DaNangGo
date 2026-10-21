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
    const duration = 600; // ms
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
      iconBg: 'bg-teal-50 text-teal-600 border-teal-100',
    },
    {
      title: 'Đang hoạt động',
      value: active,
      desc: 'Hiển thị công khai',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Chờ phê duyệt',
      value: pending,
      desc: 'Ban quản trị tiếp nhận',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Bị khóa (Admin)',
      value: locked,
      desc: 'Tạm ngưng phục vụ',
      icon: Lock,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: idx * 0.08, ease: 'easeOut' }}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {stat.title}
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                <Counter target={stat.value} />
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{stat.desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${stat.iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
