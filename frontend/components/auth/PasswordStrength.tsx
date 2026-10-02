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

  const colors = [
    'bg-gray-200', // 0
    'bg-red-500',  // 1
    'bg-orange-500', // 2
    'bg-yellow-500', // 3
    'bg-green-500' // 4
  ];

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-transparent'}`}
              style={{ width: i <= score ? '100%' : '0%' }}
            ></div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 text-right">{label}</p>
    </div>
  );
}
