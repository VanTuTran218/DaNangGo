"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Home,
  CalendarPlus,
  Share2,
  Copy,
  Sparkles,
  Award,
  Gift,
  MailCheck,
  Eye,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import type { FullSurveyFormData } from "@/constants/survey";
import {
  fetchSurveyCertificate,
  type SurveyAppreciationInfo,
} from "@/lib/api/surveys";
import {
  OVERALL_SATISFACTION_OPTIONS,
  VIETNAM_PROVINCES,
} from "@/constants/survey";

interface SurveyThankYouProps {
  formData?: FullSurveyFormData;
  appreciation?: SurveyAppreciationInfo;
}

// Màu thương hiệu DaNangGo cho các hạt confetti Framer Motion
const CONFETTI_COLORS = [
  "#0d9488", // teal-600
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#fbbf24", // amber-400
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
];

export default function SurveyThankYou({
  formData,
  appreciation,
}: SurveyThankYouProps) {
  const [copied, setCopied] = useState(false);
  const [copiedReward, setCopiedReward] = useState(false);
  const [emailModalHtml, setEmailModalHtml] = useState<string | null>(null);
  const [loadingEmailPreview, setLoadingEmailPreview] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleOpenEmailPreview = async () => {
    if (!appreciation?.certificateCode) return;
    setLoadingEmailPreview(true);
    try {
      const cert = await fetchSurveyCertificate(appreciation.certificateCode);
      setEmailModalHtml(cert.emailHtml);
    } catch {
      // ignore
    } finally {
      setLoadingEmailPreview(false);
    }
  };

  // Đếm số hạng mục đã đánh giá
  const ratedCount = formData
    ? Object.values(formData.experienceRatings).filter((score) => score > 0)
        .length
    : 4;

  const satisfactionOption = OVERALL_SATISFACTION_OPTIONS.find(
    (opt) => opt.score === formData?.overallSatisfaction,
  );

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://dananggo.vn";
    const shareData = {
      title: "DaNangGo — Nền tảng Du lịch Thông minh Đà Nẵng",
      text: "Cùng mình chia sẻ trải nghiệm để chung tay xây dựng du lịch Đà Nẵng ngày càng tuyệt vời hơn!",
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback copy
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Tạo các hạt confetti thuần Framer Motion (không dùng thư viện ngoài)
  const particles = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 260 + 20),
    y: Math.random() * 320 + 80,
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.7 + 0.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="relative text-center py-8 sm:py-12 px-4 max-w-xl mx-auto overflow-hidden">
      {/* Hiệu ứng Confetti nhẹ nhàng bằng Framer Motion */}
      {!prefersReduced && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -top-20">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [1, 1, 0],
                rotate: p.rotate,
                scale: p.scale,
              }}
              transition={{
                duration: 2.2,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: "absolute",
                width: p.id % 3 === 0 ? "10px" : "8px",
                height: p.id % 2 === 0 ? "10px" : "6px",
                backgroundColor: p.color,
                borderRadius: p.id % 4 === 0 ? "50%" : "3px",
              }}
            />
          ))}
        </div>
      )}

      {/* Biểu tượng cảm ơn thành công */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-xl shadow-teal-500/25 mb-6"
      >
        <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
      </motion.div>

      {/* Tiêu đề cảm ơn */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          Ghi nhận ý kiến thành công
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cảm ơn bạn đã chia sẻ cùng DaNangGo!
        </h2>
      </motion.div>

      {/* Tóm tắt nội dung đã chia sẻ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs sm:text-sm text-slate-700"
      >
        <p className="font-semibold text-slate-900">
          Tóm tắt đóng góp của bạn:
        </p>
        <ul className="space-y-1.5 list-disc list-inside text-slate-600">
          <li>
            Đã đánh giá chi tiết{" "}
            <strong className="text-teal-700">{ratedCount} hạng mục</strong>{" "}
            trải nghiệm dịch vụ.
          </li>
          {satisfactionOption && (
            <li>
              Mức độ hài lòng tổng thể:{" "}
              <strong className="text-slate-800">
                {satisfactionOption.emoji} {satisfactionOption.label}
              </strong>
            </li>
          )}
          {formData?.originProvince && (
            <li>
              Du khách đến từ địa phương:{" "}
              <strong className="text-slate-800">
                {VIETNAM_PROVINCES.find(
                  (p) => p.value === formData.originProvince,
                )?.label ?? formData.originProvince}
              </strong>
            </li>
          )}
          <li>
            Phản hồi đã được lưu để tổng hợp thống kê và cải thiện trải nghiệm
            trên DaNangGo.
          </li>
        </ul>
      </motion.div>

      {/* Thẻ Chứng nhận Đại sứ Du lịch Đà Nẵng & Mã quà tri ân (nếu người dùng nhận thư tri ân) */}
      {appreciation?.certificateCode && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 rounded-3xl border-2 border-teal-500/80 bg-gradient-to-br from-amber-50/70 via-teal-50/70 to-cyan-50/70 p-5 sm:p-6 text-left shadow-md space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700">
                  Chứng nhận điện tử
                </p>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Đại Sứ Du Lịch Văn Minh Đà Nẵng
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 font-mono text-xs font-extrabold text-teal-900">
              {appreciation.certificateCode}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 space-y-1">
            <p>
              Trao tặng du khách:{" "}
              <strong className="text-teal-800">
                {appreciation.recipientName || "Bạn du khách Đà Nẵng"}
              </strong>
            </p>
            {appreciation.maskedEmail && (
              <p
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  appreciation.sent ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                <MailCheck className="w-4 h-4 shrink-0" />
                {appreciation.sent
                  ? `Thư tri ân và chứng nhận đã được gửi tự động tới ${appreciation.maskedEmail}`
                  : appreciation.status === "SKIPPED_COOLDOWN"
                    ? `Chứng nhận đã cấp trên web (email ${appreciation.maskedEmail} đã nhận 1 thư tri ân trong 30 ngày qua)`
                    : `Đã cấp chứng nhận trực tiếp trên web cho ${appreciation.maskedEmail} (máy chủ Gmail SMTP hiện đang chạm giới hạn gửi trong ngày của Google)`}
              </p>
            )}
          </div>

          {appreciation.rewardCode && (
            <div className="rounded-2xl bg-white/90 border border-orange-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-orange-800 uppercase">
                    Mã quà tri ân chuyến tiếp theo
                  </p>
                  <p className="font-mono text-sm font-black text-orange-600">
                    {appreciation.rewardCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    await navigator.clipboard.writeText(
                      appreciation.rewardCode!,
                    );
                    setCopiedReward(true);
                    setTimeout(() => setCopiedReward(false), 2000);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold text-xs cursor-pointer"
              >
                {copiedReward ? "Đã chép mã!" : "Sao chép mã"}
              </button>
            </div>
          )}

          {/* Nút Xem bản gốc Thư Tri Ân Email ngay trên trình duyệt hoặc qua hộp thư Ethereal */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loadingEmailPreview}
              onClick={handleOpenEmailPreview}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
              {loadingEmailPreview
                ? "Đang tải thư..."
                : "Xem toàn bộ Thư Tri Ân Email"}
            </button>
            {appreciation.previewUrl && (
              <a
                href={appreciation.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 font-bold text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở trong hộp thư Webmail thử nghiệm
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Modal xem trước toàn bộ nội dung HTML của Thư Tri Ân đã gửi */}
      {emailModalHtml && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Nội dung Thư Tri Ân & Chứng Nhận Du Khách Đà Nẵng
              </span>
              <button
                type="button"
                onClick={() => setEmailModalHtml(null)}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              title="Thư Tri Ân Du Khách Đà Nẵng"
              srcDoc={emailModalHtml}
              className="w-full h-[72vh] border-0 bg-white"
            />
          </div>
        </div>
      )}

      {/* Các nút hành động chính */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-xs hover:border-teal-400 hover:text-teal-700 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </Link>

        <Link
          href="/lich-trinh/tao-moi"
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
        >
          <CalendarPlus className="w-4 h-4" />
          Lên lịch trình mới
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Copy className="w-4 h-4 text-emerald-600" />
              Đã sao chép link!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Chia sẻ DaNangGo
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
