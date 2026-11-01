'use client';

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export default function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 rounded-xl w-full" />
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-none">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-6 bg-gray-100 rounded-lg flex-1"
                style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
