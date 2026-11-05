'use client';

interface TextAreaWithCounterProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}

export default function TextAreaWithCounter({
  id,
  value,
  onChange,
  maxLength = 500,
  placeholder = 'Chia sẻ chi tiết cảm nhận của bạn, điều bạn ấn tượng nhất hoặc điều Đà Nẵng cần hoàn thiện thêm...',
  rows = 4,
  ariaLabel = 'Ý kiến đóng góp tự do',
}: TextAreaWithCounterProps) {
  const currentLength = value.length;
  const isNearLimit = currentLength >= maxLength * 0.9;
  const isAtLimit = currentLength >= maxLength;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <textarea
          id={id}
          value={value}
          maxLength={maxLength}
          rows={rows}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 bg-white rounded-2xl border border-slate-200/90 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-hidden transition-all duration-200 leading-relaxed placeholder:text-slate-400 resize-y min-h-[110px]"
        />
      </div>

      <div className="flex items-center justify-between text-[11px] px-1 font-medium">
        <span className="text-slate-400">
          Ý kiến của bạn sẽ được tổng hợp ẩn danh gửi Sở Du lịch
        </span>
        <span
          className={`font-mono font-bold transition-colors ${
            isAtLimit
              ? 'text-rose-600 font-extrabold'
              : isNearLimit
              ? 'text-amber-600'
              : 'text-slate-400'
          }`}
        >
          {currentLength}/{maxLength}
        </span>
      </div>
    </div>
  );
}
