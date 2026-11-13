'use client';

/**
 * PasswordStrength — Thanh đánh giá độ mạnh mật khẩu trực quan
 * ─────────────────────────────────────────────────────────────
 * - 4 phân đoạn mượt mà tương ứng với 4 cấp độ: Yếu / Trung bình / Khá / Mạnh
 * - Màu sắc hài hòa theo hệ màu thương hiệu: Đỏ hồng → Hổ phách → Xanh ngọc → Xanh lá
 * - Giữ nguyên 100% logic tính điểm (score) và nhãn (label)
 */

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

  if (!password) return null;

  const segmentColors = [
    'bg-slate-200',
    'bg-rose-500',    // Yếu
    'bg-amber-500',   // Trung bình
    'bg-cyan-500',    // Khá
    'bg-emerald-500', // Mạnh
  ];

  const textColors = [
    'text-slate-400',
    'text-rose-600',
    'text-amber-600',
    'text-cyan-600',
    'text-emerald-600',
  ];

  return (
    <div className="mt-2 flex flex-col gap-1.5 w-full">
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((i) => {
          const isActive = i <= score;
          return (
            <div
              key={i}
              className="flex-1 rounded-full bg-slate-200/80 overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isActive ? segmentColors[score] : 'bg-transparent'
                }`}
                style={{ width: isActive ? '100%' : '0%' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Độ mạnh mật khẩu</span>
        <span className={`font-semibold ${textColors[score]}`}>{label}</span>
      </div>
    </div>
  );
}
