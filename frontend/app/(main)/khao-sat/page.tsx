"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Send,
  Loader2,
  ShieldCheck,
  Users,
  Compass,
  Sparkles,
  Info,
  Mail,
  Award,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// Components chung của website
import SiteFooter from "@/components/places/SiteFooter";
import ScrollToTop from "@/components/places/ScrollToTop";
import ToastNotification, {
  type ToastItem,
} from "@/components/ui/ToastNotification";

// Sub-components khảo sát
import SurveyHero from "@/components/survey/SurveyHero";
import SurveyQuickSheet from "@/components/survey/SurveyQuickSheet";
import QuestionCard from "@/components/survey/QuestionCard";
import ChoiceCards from "@/components/survey/ChoiceCards";
import ProvinceSelect from "@/components/survey/ProvinceSelect";
import RatingMatrix from "@/components/survey/RatingMatrix";
import NpsScale from "@/components/survey/NpsScale";
import TextAreaWithCounter from "@/components/survey/TextAreaWithCounter";
import ConsentCheckbox from "@/components/survey/ConsentCheckbox";
import SurveyThankYou from "@/components/survey/SurveyThankYou";

// Cấu hình & Dữ liệu
import {
  TRIP_PURPOSE_OPTIONS,
  DURATION_OPTIONS,
  OVERALL_SATISFACTION_OPTIONS,
  INITIAL_FULL_SURVEY_DATA,
  type FullSurveyFormData,
} from "@/constants/survey";

// API & Storage Helper
import {
  loadSurveyDraft,
  saveSurveyDraft,
  clearSurveyDraft,
  submitFullSurvey,
  getSurveyInviteMeta,
  type SurveyAppreciationInfo,
} from "@/lib/api/surveys";
import SurveyCustomForm, {
  SurveyPublicList,
} from "@/components/survey/SurveyCustomForm";
import { ApiError } from "@/lib/api/client";

export default function SurveyPage() {
  const { user } = useAuth();
  const [customSurveyId, setCustomSurveyId] = useState<number | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [formData, setFormData] = useState<FullSurveyFormData>(
    INITIAL_FULL_SURVEY_DATA,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [appreciationResult, setAppreciationResult] = useState<
    SurveyAppreciationInfo | undefined
  >(undefined);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [alreadyCompletedForTrip, setAlreadyCompletedForTrip] = useState(false);

  // Đọc tham số URL (nếu có gắn với lịch trình cụ thể)
  const [itineraryId, setItineraryId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "quick") setQuickOpen(true);
      const surveyId = Number(params.get("surveyId"));
      if (Number.isSafeInteger(surveyId) && surveyId > 0)
        setCustomSurveyId(surveyId);
      const itin = params.get("itineraryId");
      if (itin) {
        setItineraryId(itin);
        // Kiểm tra xem lịch trình này đã làm khảo sát chưa
        const meta = getSurveyInviteMeta();
        if (meta.completedItineraries.includes(itin)) {
          setAlreadyCompletedForTrip(true);
        }
      }
    }
  }, []);

  // Khôi phục bản nháp từ sessionStorage khi mount
  useEffect(() => {
    const draft = loadSurveyDraft();
    if (draft && draft.tripPurpose) {
      setFormData(draft);
      setHasDraftNotice(true);
    }
  }, []);

  // Tự động điền sẵn email và tên của tài khoản đang đăng nhập để nhận thư tri ân
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        recipientEmail: prev.recipientEmail || user.email,
        recipientName: prev.recipientName || user.name || "",
      }));
    }
  }, [user]);

  // Tự động lưu bản nháp vào sessionStorage khi form thay đổi
  useEffect(() => {
    if (!isCompleted && formData.tripPurpose) {
      saveSurveyDraft(formData);
    }
  }, [formData, isCompleted]);

  // Hàm cập nhật từng trường dữ liệu
  const updateField = <K extends keyof FullSurveyFormData>(
    field: K,
    value: FullSurveyFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Xóa lỗi của trường tương ứng khi người dùng tương tác
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Xác thực toàn bộ form (bản rút gọn, 1 trang)
  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.tripPurpose)
      newErrors.tripPurpose = "Vui lòng chọn mục đích chính của chuyến đi";
    if (!formData.stayDuration)
      newErrors.stayDuration = "Vui lòng chọn số ngày lưu trú";
    if (!formData.originProvince)
      newErrors.originProvince =
        "Vui lòng chọn tỉnh/thành hoặc quốc gia bạn đến từ";
    if (Object.values(formData.experienceRatings).every((v) => v === 0))
      newErrors.experienceRatings =
        'Vui lòng đánh giá ít nhất 1 hạng mục hoặc bấm "Chưa sử dụng"';
    if (formData.overallSatisfaction === 0)
      newErrors.overallSatisfaction = "Vui lòng chọn mức độ hài lòng tổng thể";
    if (formData.npsScore === null)
      newErrors.npsScore = "Vui lòng chấm điểm mức độ sẵn sàng giới thiệu (0–10)";
    const cleanEmail = formData.recipientEmail?.trim() ?? "";
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      newErrors.recipientEmail = "Địa chỉ email nhận thư tri ân chưa đúng định dạng";
    if (!formData.consentAgreed)
      newErrors.consentAgreed =
        "Bạn cần đồng ý chia sẻ dữ liệu ẩn danh để gửi khảo sát";
    setErrors(newErrors);
    return newErrors;
  };

  // Gửi toàn bộ khảo sát
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateForm();
    const firstErrorKey = Object.keys(found)[0];
    if (firstErrorKey) {
      document
        .getElementById(firstErrorKey)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitFullSurvey(formData, itineraryId ?? undefined);
      clearSurveyDraft();
      setAppreciationResult(res.appreciation);
      setIsCompleted(true);
      window.scrollTo({ top: 360, behavior: "smooth" });
      setToast({
        type: "success",
        title: "Thành công",
        message: res.message || "Cảm ơn ý kiến quý giá của bạn!",
      });
    } catch (err: unknown) {
      console.error("[Survey] Gửi thất bại", err);
      let errorMsg =
        "Không thể gửi khảo sát. Vui lòng kiểm tra lại kết nối và thử lại.";
      if (err instanceof ApiError) {
        // Nêu nguyên văn thông báo từ backend khi lỗi 400 validation theo RÀNG BUỘC 4
        errorMsg = err.message || "Lỗi kiểm tra thông tin từ máy chủ.";
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setToast({
        type: "error",
        title: "Lỗi gửi khảo sát",
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa trắng form để làm lại từ đầu
  const handleResetDraft = () => {
    clearSurveyDraft();
    setFormData(INITIAL_FULL_SURVEY_DATA);
    setHasDraftNotice(false);
    setErrors({});
  };

  if (customSurveyId) return <SurveyCustomForm id={customSurveyId} />;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-[#f0f9fa]/50 to-[#fef8f4]/60 text-slate-800 flex flex-col font-sans">
      {/* 1. ĐẦU TRANG: Navbar chung của DaNangGo */}

      {/* 2. HERO nhẹ: gradient xanh ngọc, sóng SVG trôi chậm, 3 huy hiệu */}
      <SurveyHero />
      <SurveyQuickSheet
        isOpen={quickOpen}
        onClose={() => setQuickOpen(false)}
      />

      {/* 3. THÂN TRANG: Card wizard chính & Sidebar hỗ trợ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14">
        {!isCompleted && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-white p-5">
            <div>
              <h2 className="font-bold text-slate-800">
                Bạn muốn góp ý nhanh?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Chọn bản 5 câu hoặc trả lời 7 câu hỏi chính bên dưới. Hãy chia
                sẻ theo trải nghiệm thực tế của bạn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
            >
              Làm khảo sát nhanh
            </button>
          </div>
        )}
        <SurveyPublicList />
        {/* Thông báo đã từng gửi khảo sát cho lịch trình này */}
        {alreadyCompletedForTrip && !isCompleted && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">
                  Bạn đã gửi khảo sát cho chuyến đi này rồi!
                </p>
                <p className="text-xs text-teal-700">
                  DaNangGo trân trọng cảm ơn những đóng góp quý giá của bạn. Bạn
                  vẫn có thể gửi thêm phản hồi mới nếu muốn cập nhật.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlreadyCompletedForTrip(false)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shrink-0"
            >
              Làm lại khảo sát
            </button>
          </div>
        )}

        {/* Thông báo đang dùng bản nháp tự lưu */}
        {hasDraftNotice && !isCompleted && (
          <div className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hệ thống đã tự động khôi phục câu trả lời bạn đang làm dở từ
                phiên trước.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetDraft}
              className="font-bold underline hover:text-amber-800 cursor-pointer shrink-0"
            >
              Làm mới từ đầu
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT CHÍNH: Card Wizard khảo sát bo tròn rounded-3xl */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8 md:p-10 relative overflow-hidden">
              {isCompleted ? (
                /* Màn hình sau khi gửi thành công */
                <SurveyThankYou
                  formData={formData}
                  appreciation={appreciationResult}
                />
              ) : (
                <form
                  onSubmit={handleSubmitSurvey}
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="space-y-5">
                    {/* 1. Mục đích chuyến đi */}
                    <QuestionCard
                      id="tripPurpose"
                      title="1. Mục đích chính chuyến đi Đà Nẵng của bạn?"
                      required
                      error={errors.tripPurpose}
                    >
                      <ChoiceCards
                        name="tripPurpose"
                        options={TRIP_PURPOSE_OPTIONS}
                        selectedValue={formData.tripPurpose}
                        onChange={(val) => updateField("tripPurpose", val)}
                        columns={2}
                      />
                    </QuestionCard>

                    {/* 2. Số ngày lưu trú */}
                    <QuestionCard
                      id="stayDuration"
                      title="2. Bạn lưu trú tại Đà Nẵng bao lâu?"
                      required
                      error={errors.stayDuration}
                    >
                      <ChoiceCards
                        name="stayDuration"
                        options={DURATION_OPTIONS}
                        selectedValue={formData.stayDuration}
                        onChange={(val) => updateField("stayDuration", val)}
                        columns={2}
                      />
                    </QuestionCard>

                    {/* 3. Đến từ đâu */}
                    <QuestionCard
                      id="originProvince"
                      title="3. Bạn đến từ tỉnh/thành phố hoặc quốc gia nào?"
                      required
                      error={errors.originProvince}
                    >
                      <ProvinceSelect
                        value={formData.originProvince}
                        onChange={(val) => updateField("originProvince", val)}
                      />
                    </QuestionCard>

                    {/* 4. Đánh giá nhanh dịch vụ */}
                    <QuestionCard
                      id="experienceRatings"
                      title="4. Bạn đánh giá các dịch vụ chính thế nào?"
                      description='Chấm 1–5 sao, hoặc chọn "Chưa sử dụng"'
                      required
                      error={errors.experienceRatings}
                    >
                      <RatingMatrix
                        values={formData.experienceRatings}
                        onChange={(catId, score) =>
                          updateField("experienceRatings", {
                            ...formData.experienceRatings,
                            [catId]: score,
                          })
                        }
                      />
                    </QuestionCard>

                    {/* 5. Hài lòng tổng thể */}
                    <QuestionCard
                      id="overallSatisfaction"
                      title="5. Mức độ hài lòng tổng thể về chuyến đi?"
                      required
                      error={errors.overallSatisfaction}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {OVERALL_SATISFACTION_OPTIONS.map((opt) => {
                          const isSelected =
                            formData.overallSatisfaction === opt.score;
                          return (
                            <button
                              key={opt.score}
                              type="button"
                              onClick={() =>
                                updateField("overallSatisfaction", opt.score)
                              }
                              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                isSelected
                                  ? `bg-teal-50 border-teal-500 ring-2 ${opt.ring} shadow-sm scale-102`
                                  : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                              }`}
                            >
                              <span className="text-3xl sm:text-4xl">
                                {opt.emoji}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </QuestionCard>

                    {/* 6. NPS 0–10 */}
                    <QuestionCard
                      id="npsScore"
                      title="6. Bạn có sẵn lòng giới thiệu Đà Nẵng cho người thân, bạn bè?"
                      description="0 = Hoàn toàn không, 10 = Chắc chắn sẽ giới thiệu"
                      required
                      error={errors.npsScore}
                    >
                      <NpsScale
                        value={formData.npsScore}
                        onChange={(score) => updateField("npsScore", score)}
                      />
                    </QuestionCard>

                    {/* 7. Góp ý (tùy chọn) */}
                    <QuestionCard
                      id="feedbackText"
                      title="7. Góp ý thêm của bạn (không bắt buộc)"
                    >
                      <TextAreaWithCounter
                        value={formData.feedbackText}
                        onChange={(val) => updateField("feedbackText", val)}
                        maxLength={500}
                      />
                    </QuestionCard>

                    {/* Khung nhận Thư Tri Ân Du Khách Đà Nẵng & Chứng nhận điện tử qua Email */}
                    <div
                      id="recipientEmail"
                      className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-cyan-50/40 to-amber-50/50 p-4 sm:p-5 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Nhận Thư Tri Ân & Chứng nhận Du khách Đà Nẵng qua Email (Tùy chọn)
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            Hệ thống sẽ tự động gửi ngay{" "}
                            <strong>Chứng nhận Đại sứ Du lịch Văn minh Đà Nẵng</strong>{" "}
                            kèm <strong>Mã quà tặng tri ân</strong> về email của bạn sau khi gửi khảo sát.
                            Email được băm ẩn danh và tách biệt hoàn toàn với câu trả lời thống kê.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tên hiển thị trên chứng nhận
                          </label>
                          <input
                            type="text"
                            maxLength={120}
                            value={formData.recipientName ?? ""}
                            onChange={(e) =>
                              updateField("recipientName", e.target.value)
                            }
                            placeholder="VD: Nguyễn Văn A"
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Email nhận thư tri ân & quà tặng
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              maxLength={160}
                              value={formData.recipientEmail ?? ""}
                              onChange={(e) =>
                                updateField("recipientEmail", e.target.value)
                              }
                              placeholder="ban@example.com"
                              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>

                      {errors.recipientEmail && (
                        <p role="alert" className="text-xs font-semibold text-rose-600">
                          {errors.recipientEmail}
                        </p>
                      )}
                    </div>

                    <ConsentCheckbox
                      checked={formData.consentAgreed}
                      onChange={(val) => updateField("consentAgreed", val)}
                      error={errors.consentAgreed}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Dữ liệu được bảo vệ an toàn
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-auto px-7 sm:px-9 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-teal-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang gửi khảo sát...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Gửi khảo sát
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* CỘT PHỤ DESKTOP: Thông tin & Lợi ích du khách */}
          <aside className="lg:col-span-4 space-y-5">
            {/* Card 1: Vì sao khảo sát quan trọng */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Compass className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Vì sao ý kiến của bạn quan trọng?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mỗi chia sẻ của du khách giúp DaNangGo nhận biết những điểm cần
                cải thiện về thông tin điểm đến, trải nghiệm dịch vụ và cách tư
                vấn chuyến đi.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>Nâng cao chất lượng dịch vụ ăn uống & lưu trú</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Xử lý tình trạng chặt chém giá cả & kẹt xe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>Bảo tồn cảnh quan biển xanh – sạch – đẹp</span>
                </div>
              </div>
            </div>

            {/* Card 2: Cam kết ẩn danh */}
            <div className="bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-transparent rounded-3xl p-6 border border-teal-200/60 space-y-2.5">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Cam kết ẩn danh & Bảo mật</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khảo sát này <strong>hoàn toàn ẩn danh</strong>. Chúng tôi không
                thu thập họ tên, số điện thoại hay số tài khoản ngân hàng của
                bạn. Dữ liệu chỉ dùng phục vụ thống kê tổng hợp.
              </p>
            </div>

            {/* Card 3: Thống kê số lượng đóng góp */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400">
                    Cộng đồng du khách
                  </span>
                  <p className="text-lg font-black text-slate-900">
                    Mỗi ý kiến đều đáng quý
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cảm ơn bạn đã góp thêm một góc nhìn để DaNangGo phục vụ du khách
                tốt hơn.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* 4. DẢI CTA GRADIENT CUỐI TRANG: "Sắp có chuyến đi mới?" */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mb-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-700 p-8 sm:p-12 text-white shadow-xl shadow-cyan-600/20">
          <div className="relative z-10 max-w-2xl text-center sm:text-left space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-cyan-100 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-300" />
              Tối ưu trải nghiệm du lịch
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sắp có chuyến đi mới? Để DaNangGo lên lịch trình cho bạn!
            </h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Tự động gợi ý điểm tham quan, quán ăn chuẩn vị và tối ưu hóa tuyến
              đường di chuyển trong tích tắc.
            </p>
            <div className="pt-2">
              <Link
                href="/lich-trinh/tao-moi"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-teal-800 font-bold text-sm shadow-lg hover:bg-orange-50 hover:text-orange-600 transition-all hover:scale-105"
              >
                Tạo lịch trình ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CUỐI TRANG: SiteFooter chung 4 cột & ScrollToTop */}
      <SiteFooter />
      <ScrollToTop />

      {/* TOAST THÔNG BÁO DÙNG CHUNG CỦA DỰ ÁN */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
