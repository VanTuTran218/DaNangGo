'use client';

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  theme?: 'light' | 'dark';
  hideLabel?: boolean;
}

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  theme = 'light',
  hideLabel = false,
}: Props) {
  const leftPct = ((value[0] - min) / (max - min)) * 100;
  const rightPct = ((value[1] - min) / (max - min)) * 100;
  const isDark = theme === 'dark';

  return (
    <div>
      {!hideLabel && (
        <label
          className={`block text-xs font-medium mb-3 ${
            isDark ? 'text-[#E6D9B7]' : 'text-gray-700'
          }`}
        >
          Khoảng giá/đêm
        </label>
      )}
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div
          className={`absolute w-full h-1.5 rounded-full ${
            isDark ? 'bg-white/14' : 'bg-gray-200'
          }`}
        />
        {/* Active range */}
        <div
          className={`absolute h-1.5 rounded-full ${
            isDark
              ? 'bg-gradient-to-r from-[#E6D9B7] to-[#E87B39]'
              : 'bg-teal-500'
          }`}
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={100000}
          value={value[0]}
          aria-label="Giá tối thiểu mỗi đêm"
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), value[1] - 100000);
            onChange([v, value[1]]);
          }}
          className={`absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab ${
            isDark
              ? '[&::-webkit-slider-thumb]:bg-[#FFF8E9] [&::-webkit-slider-thumb]:border-[#E87B39]'
              : '[&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:border-white'
          }`}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={100000}
          value={value[1]}
          aria-label="Giá tối đa mỗi đêm"
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), value[0] + 100000);
            onChange([value[0], v]);
          }}
          className={`absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab ${
            isDark
              ? '[&::-webkit-slider-thumb]:bg-[#FFF8E9] [&::-webkit-slider-thumb]:border-[#E87B39]'
              : '[&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:border-white'
          }`}
        />
      </div>
      <div
        className={`flex justify-between mt-2 text-[11px] font-mono ${
          isDark ? 'text-[#E6D9B7]/85' : 'text-gray-500'
        }`}
      >
        <span>{value[0].toLocaleString('vi-VN')}đ</span>
        <span>{value[1].toLocaleString('vi-VN')}đ</span>
      </div>
    </div>
  );
}
