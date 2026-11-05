"use client";
import ConsentCheckbox from "./ConsentCheckbox";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import {
  OVERALL_SATISFACTION_OPTIONS,
  QUICK_SURVEY_LIKES,
  QUICK_SURVEY_IMPROVEMENTS,
  INITIAL_QUICK_SURVEY_DATA,
  type QuickSurveyFormData,
} from "@/constants/survey";
import NpsScale from "./NpsScale";
import ChipSelect from "./ChipSelect";
import { recordSurveyDismiss, submitQuickSurvey } from "@/lib/api/surveys";

interface SurveyQuickSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryId?: string | number;
}

export default function SurveyQuickSheet({
  isOpen,
  onClose,
  itineraryId,
}: SurveyQuickSheetProps) {
  const [step, setStep] = useState(1); // 1 -> 5, 6 là hoàn thành
  const [formData, setFormData] = useState<QuickSurveyFormData>(
    INITIAL_QUICK_SURVEY_DATA,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");
  if (!isOpen) return null;

  const handleDismiss = (action: "LATER" | "NEVER") => {
    recordSurveyDismiss(action, itineraryId);
    onClose();
  };

  const handleSelectSatisfaction = (score: number) => {
    setFormData((prev) => ({ ...prev, overallSatisfaction: score }));
    // Tự động chuyển câu khi chọn
    setTimeout(() => setStep(2), 250);
  };

  const handleSelectNps = (score: number) => {
    setFormData((prev) => ({ ...prev, npsScore: score }));
    // Tự động chuyển câu khi chọn
    setTimeout(() => setStep(5), 250);
  };

  const handleSubmit = async () => {
    if (
      !formData.consentAgreed ||
      !formData.overallSatisfaction ||
      formData.npsScore == null
    ) {
      setSubmitError(
        "Vui lòng chấm điểm, chọn điểm giới thiệu và đồng ý trước khi gửi.",
      );
      return;
    }
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await submitQuickSurvey(formData, itineraryId);
      setStep(6); // Chuyển sang màn hình cảm ơn
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Chưa gửi được khảo sát. Bạn thử lại nhé.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none flex justify-center px-3 sm:px-6 pb-3 sm:pb-5">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="pointer-events-auto w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 sm:p-6 overflow-hidden relative"
        >
          {/* Header thanh tiêu đề & nút đóng */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-none">
                  Khảo sát nhanh trải nghiệm
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  Khoảng 30 giây · 5 câu hỏi
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDismiss("LATER")}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng khảo sát nhanh"
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thanh tiến độ 5 chấm */}
          {step <= 5 && (
            <div className="flex items-center justify-center gap-2 my-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-6 bg-teal-600"
                      : s < step
                        ? "w-2 bg-teal-300"
                        : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>
          )}

          {/* NỘI DUNG TỪNG CÂU HỎI */}
          <div className="py-2 min-h-[190px] flex flex-col justify-center">
            {/* Câu 1: Hài lòng tổng thể */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800 text-center">
                  1. Bạn cảm thấy chuyến đi Đà Nẵng thế nào?
                </p>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {OVERALL_SATISFACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => handleSelectSatisfaction(opt.score)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        formData.overallSatisfaction === opt.score
                          ? "bg-teal-50 border-teal-500 scale-105 shadow-sm"
                          : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">{opt.emoji}</span>
                      <span className="text-[10px] font-semibold text-slate-600 line-clamp-1">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Câu 2: Điều bạn thích nhất */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800">
                  2. Điều bạn ấn tượng & thích nhất ở Đà Nẵng?
                </p>
                <ChipSelect
                  name="bestLikes"
                  options={QUICK_SURVEY_LIKES}
                  selectedValues={formData.bestLikes}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, bestLikes: v }))
                  }
                />
                <ConsentCheckbox
                  checked={formData.consentAgreed}
                  onChange={(consentAgreed) =>
                    setFormData((prev) => ({ ...prev, consentAgreed }))
                  }
                />
                {submitError && (
                  <p role="alert" className="text-xs text-rose-600">
                    {submitError}
                  </p>
                )}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-teal-700 transition-colors cursor-pointer"
                  >
                    Tiếp tục <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Câu 3: Điều cần cải thiện nhất */}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800">
                  3. Theo bạn, Đà Nẵng cần cải thiện điều gì nhất?
                </p>
                <ChipSelect
                  name="improvements"
                  options={QUICK_SURVEY_IMPROVEMENTS}
                  selectedValues={formData.improvements}
                  onChange={(v) =>
                    setFormData((prev) => ({ ...prev, improvements: v }))
                  }
                />
                <ConsentCheckbox
                  checked={formData.consentAgreed}
                  onChange={(consentAgreed) =>
                    setFormData((prev) => ({ ...prev, consentAgreed }))
                  }
                />
                {submitError && (
                  <p role="alert" className="text-xs text-rose-600">
                    {submitError}
                  </p>
                )}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-teal-700 transition-colors cursor-pointer"
                  >
                    Tiếp tục <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Câu 4: Mức sẵn sàng giới thiệu */}
            {step === 4 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800 text-center">
                  4. Mức độ sẵn sàng giới thiệu Đà Nẵng cho bạn bè? (0–10)
                </p>
                <NpsScale
                  value={formData.npsScore}
                  onChange={handleSelectNps}
                />
              </div>
            )}

            {/* Câu 5: Góp ý ngắn */}
            {step === 5 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800">
                  5. Bạn có lời nhắn gửi thêm nào cho Đà Nẵng không?
                </p>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.quickFeedback}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quickFeedback: e.target.value,
                    }))
                  }
                  placeholder="Gợi ý một điểm đến bạn thích hoặc lời góp ý nhỏ..."
                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:bg-white focus:outline-hidden"
                />
                <ConsentCheckbox
                  checked={formData.consentAgreed}
                  onChange={(consentAgreed) =>
                    setFormData((prev) => ({ ...prev, consentAgreed }))
                  }
                />
                {submitError && (
                  <p role="alert" className="text-xs text-rose-600">
                    {submitError}
                  </p>
                )}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              </div>
            )}

            {/* Bước 6: Hoàn thành & Thank You */}
            {step === 6 && (
              <div className="text-center py-2 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Cảm ơn phản hồi nhanh của bạn!
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Ý kiến của bạn đã được ghi nhận. Để chia sẻ sâu hơn về lưu
                  trú, ẩm thực và chi tiêu, bạn có thể tham gia bản đầy đủ.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Link
                    href="/khao-sat"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors text-center"
                  >
                    Làm khảo sát đầy đủ (~3 phút)
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer action "Không hỏi lại" */}
          {step <= 5 && (
            <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Ý kiến ẩn danh
              </span>
              <button
                type="button"
                onClick={() => handleDismiss("NEVER")}
                className="hover:text-slate-600 underline cursor-pointer"
              >
                Không hỏi lại
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
