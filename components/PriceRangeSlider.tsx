'use client';

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}

export default function PriceRangeSlider({ min, max, value, onChange }: Props) {
  const leftPct = ((value[0] - min) / (max - min)) * 100;
  const rightPct = ((value[1] - min) / (max - min)) * 100;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-3">
        Khoảng giá/đêm
      </label>
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
        {/* Active range */}
        <div
          className="absolute h-1.5 bg-teal-500 rounded-full"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={100000}
          value={value[0]}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), value[1] - 100000);
            onChange([v, value[1]]);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={100000}
          value={value[1]}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), value[0] + 100000);
            onChange([value[0], v]);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab"
        />
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <span>{value[0].toLocaleString('vi-VN')}đ</span>
        <span>{value[1].toLocaleString('vi-VN')}đ</span>
      </div>
    </div>
  );
}
