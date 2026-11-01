'use client';

import { motion } from 'framer-motion';

interface DataPoint {
  date: string;
  count: number;
}

interface ColumnChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  barColor?: string;
}

export default function ColumnChart({
  data,
  title,
  subtitle,
  barColor = '#0d9488', // teal-600
}: ColumnChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
        {data.map((item, index) => {
          const heightPercent = Math.max(10, Math.round((item.count / maxCount) * 100));
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-xs font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.count}
              </span>
              <div className="w-full max-w-[36px] bg-gray-100 rounded-t-lg h-full flex items-end overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="w-full rounded-t-lg transition-colors group-hover:brightness-110"
                  style={{ backgroundColor: barColor }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{item.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
