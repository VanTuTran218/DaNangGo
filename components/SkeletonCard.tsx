'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
      <div className="h-52 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="flex justify-between items-end pt-1">
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32" />
          </div>
          <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}
