'use client';

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
    'bg-[#E6D9B7]/15',
    'bg-rose-400',
    'bg-[#E87B39]',
    'bg-[#E6D9B7]',
    'bg-[#2DD4BF]',
  ];

  const textColors = [
    'text-[#94B0B3]',
    'text-rose-300',
    'text-[#F5B281]',
    'text-[#E6D9B7]',
    'text-[#2DD4BF]',
  ];

  return (
    <div className="mt-2 flex flex-col gap-1.5 w-full">
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((i) => {
          const isActive = i <= score;
          return (
            <div
              key={i}
              className="flex-1 rounded-full bg-[#E6D9B7]/12 overflow-hidden"
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
        <span className="text-[#94B0B3]">Độ mạnh mật khẩu</span>
        <span className={`font-semibold ${textColors[score]}`}>{label}</span>
      </div>
    </div>
  );
}
