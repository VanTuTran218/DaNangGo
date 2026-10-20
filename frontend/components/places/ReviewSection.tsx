'use client';

import { motion } from 'framer-motion';
import { Star, Users, MessageSquareQuote, ThumbsUp } from 'lucide-react';

interface ReviewSectionProps {
  avgRating: number;
  reviewCount: number;
  placeName: string;
}

export default function ReviewSection({
  avgRating,
  reviewCount,
  placeName,
}: ReviewSectionProps) {
  // Tỷ lệ phân bố số sao mô phỏng dựa trên avgRating
  const starDistribution = [
    { star: 5, percentage: 78, count: Math.round(reviewCount * 0.78) },
    { star: 4, percentage: 15, count: Math.round(reviewCount * 0.15) },
    { star: 3, percentage: 5, count: Math.round(reviewCount * 0.05) },
    { star: 2, percentage: 1, count: Math.round(reviewCount * 0.01) },
    { star: 1, percentage: 1, count: Math.round(reviewCount * 0.01) },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="p-1.5 bg-amber-100 text-amber-600 rounded-xl shadow-sm">
          <Star size={18} className="fill-amber-500 text-amber-500" />
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2942]">
          Đánh giá từ cộng đồng du khách
        </h2>
      </div>

      {/* TỔNG QUAN ĐIỂM SỐ & THANH PHÂN BỐ SAO ANIMATE */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 p-6 rounded-2xl bg-amber-50/40 border border-amber-100 items-center">
        {/* Điểm tổng kết */}
        <div className="sm:col-span-5 text-center sm:text-left sm:border-r border-amber-200/60 sm:pr-6">
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#0f2942] tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-gray-400">/ 5.0</span>
          </div>

          <div className="flex justify-center sm:justify-start gap-1 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                className={
                  s <= Math.round(avgRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }
              />
            ))}
          </div>

          <p className="text-xs font-semibold text-gray-500">
            Dựa trên {reviewCount.toLocaleString('vi-VN')} lượt trải nghiệm thực tế
          </p>
        </div>

        {/* Các thanh phân bố sao (Animation tăng dần độ rộng khi view tới) */}
        <div className="sm:col-span-7 space-y-2">
          {starDistribution.map((item) => (
            <div key={item.star} className="flex items-center gap-3 text-xs">
              <span className="font-bold text-gray-600 w-10 shrink-0 flex items-center gap-1">
                {item.star} <Star size={11} className="fill-amber-400 text-amber-400" />
              </span>

              {/* Thanh progress bar */}
              <div className="flex-1 h-2.5 bg-amber-100/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: (5 - item.star) * 0.1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                />
              </div>

              <span className="text-gray-400 font-medium w-10 text-right shrink-0">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KHỐI KẾT NỐI API ĐÁNH GIÁ (LONG) */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-gray-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
          <MessageSquareQuote size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0f2942]">
            Khu vực chia sẻ cảm nhận & Hình ảnh thực tế
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
            Dữ liệu đánh giá chi tiết được đồng bộ theo thời gian thực từ Module Đánh giá & Phản hồi du khách của DanangGo.
          </p>
        </div>
        <button
          onClick={() =>
            alert(
              `Chức năng gửi bài đánh giá cho "${placeName}" sẽ mở khi thành viên Long kết nối API Reviews!`
            )
          }
          className="px-5 py-2.5 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-xs font-bold text-orange-600 rounded-xl transition-all shadow-sm"
        >
          Viết đánh giá của bạn
        </button>
      </div>
    </div>
  );
}
