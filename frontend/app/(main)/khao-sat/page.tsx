"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  ShieldCheck,
  Award,
  Users,
  Compass,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";

// Components chung của website
import SiteFooter from "@/components/places/SiteFooter";
import ScrollToTop from "@/components/places/ScrollToTop";
import ToastNotification, {
  type ToastItem,
} from "@/components/ui/ToastNotification";

// Sub-components khảo sát
import SurveyHero from "@/components/survey/SurveyHero";
import SurveyQuickSheet from "@/components/survey/SurveyQuickSheet";
import SurveyStepper from "@/components/survey/SurveyStepper";
import SurveyStepCard from "@/components/survey/SurveyStepCard";
import QuestionCard from "@/components/survey/QuestionCard";
import ChoiceCards from "@/components/survey/ChoiceCards";
import ChipSelect from "@/components/survey/ChipSelect";
import BudgetSlider from "@/components/survey/BudgetSlider";
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
  TRAVEL_COMPANION_OPTIONS,
  VISIT_FREQUENCY_OPTIONS,
  INFORMATION_CHANNELS,
  EXPENSE_CATEGORIES,
  OVERALL_SATISFACTION_OPTIONS,
  ISSUE_CHIPS,
  AGE_GROUP_OPTIONS,
  DANANGGO_FEATURE_OPTIONS,
  DANANGGO_ACCURACY_OPTIONS,
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
} from "@/lib/api/surveys";
import SurveyCustomForm, {
  SurveyPublicList,
} from "@/components/survey/SurveyCustomForm";
import { ApiError } from "@/lib/api/client";

export default function SurveyPage() {
  const [customSurveyId, setCustomSurveyId] = useState<number | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [formData, setFormData] = useState<FullSurveyFormData>(
    INITIAL_FULL_SURVEY_DATA,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [alreadyCompletedForTrip, setAlreadyCompletedForTrip] = useState(false);
  const [, startTransition] = useTransition();

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

  // Xác thực từng bước
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.tripPurpose)
        newErrors.tripPurpose = "Vui lòng chọn mục đích chính của chuyến đi";
      if (!formData.stayDuration)
        newErrors.stayDuration = "Vui lòng chọn số ngày lưu trú";
      if (!formData.travelCompanion)
        newErrors.travelCompanion = "Vui lòng chọn người đồng hành cùng bạn";
      if (!formData.originProvince)
        newErrors.originProvince =
          "Vui lòng chọn tỉnh/thành hoặc quốc gia bạn đến từ";
      if (!formData.visitFrequency)
        newErrors.visitFrequency = "Vui lòng chọn tần suất đến Đà Nẵng";
    }

    if (step === 2) {
      if (formData.topExpenses.length === 0) {
        newErrors.topExpenses =
          "Vui lòng chọn ít nhất 1 khoản chi tiêu lớn nhất";
      }
    }

    if (step === 3) {
      // Kiểm tra ma trận: ít nhất 3 hạng mục đã được chấm sao hoặc đánh dấu chưa dùng
      const unrated = Object.entries(formData.experienceRatings).filter(
        ([, score]) => score === 0,
      );
      if (unrated.length === 8) {
        newErrors.experienceRatings =
          'Vui lòng đánh giá các hạng mục bạn đã trải nghiệm hoặc bấm "Chưa sử dụng"';
      }
    }

    if (step === 4) {
      if (formData.overallSatisfaction === 0) {
        newErrors.overallSatisfaction =
          "Vui lòng chọn mức độ hài lòng tổng thể";
      }
      if (formData.npsScore === null) {
        newErrors.npsScore =
          "Vui lòng chấm điểm mức độ sẵn sàng giới thiệu (0–10)";
      }
      if (!formData.consentAgreed) {
        newErrors.consentAgreed =
          "Bạn cần đồng ý chia sẻ dữ liệu ẩn danh để gửi khảo sát";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Chuyển sang bước tiếp theo
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      // Cuộn nhẹ lên câu hỏi có lỗi
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.getElementById(firstErrorKey);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setDirection("next");
    startTransition(() => {
      setCurrentStep((prev) => Math.min(4, prev + 1));
    });
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  // Quay lại bước trước
  const handleBack = () => {
    setDirection("prev");
    startTransition(() => {
      setCurrentStep((prev) => Math.max(1, prev - 1));
    });
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  // Gửi toàn bộ khảo sát
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const step of [1, 2, 3, 4])
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }

    setIsSubmitting(true);
    try {
      const res = await submitFullSurvey(formData, itineraryId ?? undefined);
      clearSurveyDraft();
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
    setCurrentStep(1);
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
                Chọn bản 5 câu hoặc tiếp tục khảo sát đầy đủ bên dưới. Hãy chia
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
                <SurveyThankYou formData={formData} />
              ) : (
                <form
                  onSubmit={handleSubmitSurvey}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Thanh tiến độ Stepper 4 bước */}
                  <SurveyStepper
                    currentStep={currentStep}
                    onStepClick={(step) => {
                      if (step < currentStep) {
                        setDirection("prev");
                        setCurrentStep(step);
                      }
                    }}
                  />

                  {/* NỘI DUNG 4 BƯỚC VỚI ANIMATION SLIDE */}
                  <div className="min-h-[460px]">
                    <AnimatePresence mode="wait" custom={direction}>
                      {/* BƯỚC 1: CHUYẾN ĐI CỦA BẠN */}
                      {currentStep === 1 && (
                        <SurveyStepCard
                          key="step-1"
                          direction={direction}
                          stepKey={1}
                        >
                          <div className="space-y-5">
                            {/* 1.1 Mục đích chuyến đi */}
                            <QuestionCard
                              id="tripPurpose"
                              title="1. Mục đích chính chuyến đi Đà Nẵng của bạn là gì?"
                              required
                              error={errors.tripPurpose}
                            >
                              <ChoiceCards
                                name="tripPurpose"
                                options={TRIP_PURPOSE_OPTIONS}
                                selectedValue={formData.tripPurpose}
                                onChange={(val) =>
                                  updateField("tripPurpose", val)
                                }
                                columns={2}
                              />
                            </QuestionCard>

                            {/* 1.2 Số ngày lưu trú */}
                            <QuestionCard
                              id="stayDuration"
                              title="2. Bạn dự định hoặc đã lưu trú tại Đà Nẵng trong bao lâu?"
                              required
                              error={errors.stayDuration}
                            >
                              <ChoiceCards
                                name="stayDuration"
                                options={DURATION_OPTIONS}
                                selectedValue={formData.stayDuration}
                                onChange={(val) =>
                                  updateField("stayDuration", val)
                                }
                                columns={2}
                              />
                            </QuestionCard>

                            {/* 1.3 Đi cùng ai */}
                            <QuestionCard
                              id="travelCompanion"
                              title="3. Bạn đến Đà Nẵng cùng với ai?"
                              required
                              error={errors.travelCompanion}
                            >
                              <ChoiceCards
                                name="travelCompanion"
                                options={TRAVEL_COMPANION_OPTIONS}
                                selectedValue={formData.travelCompanion}
                                onChange={(val) =>
                                  updateField("travelCompanion", val)
                                }
                                columns={2}
                              />
                            </QuestionCard>

                            {/* 1.4 Đến từ đâu */}
                            <QuestionCard
                              id="originProvince"
                              title="4. Bạn đến từ tỉnh/thành phố hoặc quốc gia nào?"
                              description="Giúp thống kê luồng du khách nội địa và quốc tế tới Đà Nẵng"
                              required
                              error={errors.originProvince}
                            >
                              <ProvinceSelect
                                value={formData.originProvince}
                                onChange={(val) =>
                                  updateField("originProvince", val)
                                }
                              />
                            </QuestionCard>

                            {/* 1.5 Lần đầu hay quay lại */}
                            <QuestionCard
                              id="visitFrequency"
                              title="5. Đây là lần thứ mấy bạn đến với Đà Nẵng?"
                              required
                              error={errors.visitFrequency}
                            >
                              <ChoiceCards
                                name="visitFrequency"
                                options={VISIT_FREQUENCY_OPTIONS}
                                selectedValue={formData.visitFrequency}
                                onChange={(val) =>
                                  updateField("visitFrequency", val)
                                }
                                columns={1}
                              />
                            </QuestionCard>

                            {/* 1.6 Kênh thông tin biết đến */}
                            <QuestionCard
                              id="informationChannels"
                              title="6. Bạn biết đến và lên kế hoạch du lịch Đà Nẵng qua những kênh nào?"
                              description="Có thể chọn nhiều kênh bạn đã tham khảo"
                            >
                              <ChipSelect
                                name="informationChannels"
                                options={INFORMATION_CHANNELS}
                                selectedValues={formData.informationChannels}
                                onChange={(vals) =>
                                  updateField("informationChannels", vals)
                                }
                              />
                            </QuestionCard>
                          </div>
                        </SurveyStepCard>
                      )}

                      {/* BƯỚC 2: CHI TIÊU DU LỊCH */}
                      {currentStep === 2 && (
                        <SurveyStepCard
                          key="step-2"
                          direction={direction}
                          stepKey={2}
                        >
                          <div className="space-y-6">
                            {/* 2.1 Thanh trượt chi tiêu mỗi người mỗi ngày */}
                            <QuestionCard
                              id="dailyBudget"
                              title="1. Ước tính tổng chi tiêu trung bình của mỗi người trong 1 ngày?"
                              description="Bao gồm chi phí ăn uống, lưu trú, vé tham quan và di chuyển nội thành (không tính vé máy bay/tàu hỏa)"
                              required
                            >
                              <BudgetSlider
                                value={formData.dailyBudget}
                                onChange={(val) =>
                                  updateField("dailyBudget", val)
                                }
                              />
                            </QuestionCard>

                            {/* 2.2 Khoản chi lớn nhất */}
                            <QuestionCard
                              id="topExpenses"
                              title="2. Khoản nào chiếm ngân sách lớn nhất trong chuyến đi của bạn?"
                              description="Chọn các khoản chiếm tỷ trọng chi tiêu nhiều nhất (chọn 1–3 mục)"
                              required
                              error={errors.topExpenses}
                            >
                              <ChipSelect
                                name="topExpenses"
                                options={EXPENSE_CATEGORIES}
                                selectedValues={formData.topExpenses}
                                onChange={(vals) =>
                                  updateField("topExpenses", vals)
                                }
                                maxSelect={3}
                              />
                            </QuestionCard>
                          </div>
                        </SurveyStepCard>
                      )}

                      {/* BƯỚC 3: ĐÁNH GIÁ TRẢI NGHIỆM */}
                      {currentStep === 3 && (
                        <SurveyStepCard
                          key="step-3"
                          direction={direction}
                          stepKey={3}
                        >
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 text-xs text-teal-900 leading-relaxed">
                              <p className="font-bold mb-1">
                                ⭐ Đánh giá chi tiết 8 hạng mục dịch vụ du lịch
                                Đà Nẵng
                              </p>
                              Chấm từ 1 đến 5 sao theo mức độ hài lòng thực tế
                              của bạn. Nếu chưa sử dụng dịch vụ nào trong chuyến
                              đi, bạn hãy chọn nút &quot;Chưa sử dụng&quot;.
                            </div>

                            <QuestionCard
                              id="experienceRatings"
                              title="Chất lượng các dịch vụ tại Đà Nẵng theo đánh giá của bạn:"
                              required
                              error={errors.experienceRatings}
                            >
                              <RatingMatrix
                                values={formData.experienceRatings}
                                onChange={(catId, score) => {
                                  updateField("experienceRatings", {
                                    ...formData.experienceRatings,
                                    [catId]: score,
                                  });
                                }}
                              />
                            </QuestionCard>
                          </div>
                        </SurveyStepCard>
                      )}

                      {/* BƯỚC 4: TỔNG THỂ & GÓP Ý */}
                      {currentStep === 4 && (
                        <SurveyStepCard
                          key="step-4"
                          direction={direction}
                          stepKey={4}
                        >
                          <div className="space-y-6">
                            {/* 4.1 Hài lòng tổng thể */}
                            <QuestionCard
                              id="overallSatisfaction"
                              title="1. Mức độ hài lòng tổng thể của bạn về chuyến đi Đà Nẵng?"
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
                                        updateField(
                                          "overallSatisfaction",
                                          opt.score,
                                        )
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

                            {/* 4.2 Thang đo NPS 0–10 */}
                            <QuestionCard
                              id="npsScore"
                              title="2. Bạn có sẵn lòng giới thiệu du lịch Đà Nẵng cho bạn bè, người thân?"
                              description="Thang điểm từ 0 (Hoàn toàn không) đến 10 (Chắc chắn sẽ giới thiệu)"
                              required
                              error={errors.npsScore}
                            >
                              <NpsScale
                                value={formData.npsScore}
                                onChange={(score) =>
                                  updateField("npsScore", score)
                                }
                              />
                            </QuestionCard>

                            {/* 4.3 Những vấn đề đã gặp */}
                            <QuestionCard
                              id="issuesFaced"
                              title="3. Bạn có gặp bất kỳ trở ngại hay vấn đề nào trong chuyến đi?"
                              description="Chọn những vấn đề bạn đã gặp phải để chính quyền thành phố kịp thời xử lý"
                            >
                              <ChipSelect
                                name="issuesFaced"
                                options={ISSUE_CHIPS}
                                selectedValues={formData.issuesFaced}
                                onChange={(vals) =>
                                  updateField("issuesFaced", vals)
                                }
                              />
                            </QuestionCard>

                            {/* 4.4 Góp ý tự do */}
                            <QuestionCard
                              id="feedbackText"
                              title="4. Ý kiến đóng góp hoặc đề xuất cải thiện của bạn cho Đà Nẵng:"
                              description="Chia sẻ thêm bất cứ điều gì bạn mong muốn Đà Nẵng làm tốt hơn trong tương lai"
                            >
                              <TextAreaWithCounter
                                value={formData.feedbackText}
                                onChange={(val) =>
                                  updateField("feedbackText", val)
                                }
                                maxLength={500}
                              />
                            </QuestionCard>

                            {/* 4.5 Phần tùy chọn: Nhóm tuổi & Đánh giá ứng dụng DaNangGo */}
                            <div className="pt-4 border-t border-slate-100 space-y-5">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                Phần khảo sát thêm (Tùy chọn)
                              </span>

                              {/* Nhóm tuổi */}
                              <QuestionCard
                                id="ageGroup"
                                title="Nhóm tuổi của bạn:"
                              >
                                <ChoiceCards
                                  name="ageGroup"
                                  options={AGE_GROUP_OPTIONS}
                                  selectedValue={formData.ageGroup || ""}
                                  onChange={(val) =>
                                    updateField("ageGroup", val)
                                  }
                                  columns={3}
                                />
                              </QuestionCard>

                              {/* Đánh giá ứng dụng DaNangGo */}
                              <QuestionCard
                                id="mostUsefulFeature"
                                title="Tính năng nào của DaNangGo hỗ trợ bạn tốt nhất?"
                              >
                                <ChoiceCards
                                  name="mostUsefulFeature"
                                  options={DANANGGO_FEATURE_OPTIONS}
                                  selectedValue={
                                    formData.mostUsefulFeature || ""
                                  }
                                  onChange={(val) =>
                                    updateField("mostUsefulFeature", val)
                                  }
                                  columns={2}
                                />
                              </QuestionCard>

                              <QuestionCard
                                id="itineraryAccuracy"
                                title="Lịch trình gợi ý của DaNangGo có sát với thực tế di chuyển không?"
                              >
                                <ChoiceCards
                                  name="itineraryAccuracy"
                                  options={DANANGGO_ACCURACY_OPTIONS}
                                  selectedValue={
                                    formData.itineraryAccuracy || ""
                                  }
                                  onChange={(val) =>
                                    updateField("itineraryAccuracy", val)
                                  }
                                  columns={1}
                                />
                              </QuestionCard>
                            </div>

                            {/* 4.6 Hộp đồng ý ẩn danh (Bắt buộc) */}
                            <ConsentCheckbox
                              checked={formData.consentAgreed}
                              onChange={(val) =>
                                updateField("consentAgreed", val)
                              }
                              error={errors.consentAgreed}
                            />
                          </div>
                        </SurveyStepCard>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* NÚT ĐIỀU HƯỚNG QUAY LẠI / TIẾP TỤC / GỬI KHẢO SÁT */}
                  {/* Trên mobile: dính đáy màn hình (sticky bottom) với safe-area */}
                  <div className="sticky sm:static bottom-0 inset-x-0 -mx-5 sm:mx-0 -mb-5 sm:mb-0 p-4 sm:p-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-t-0 border-slate-200/80 z-20 flex items-center justify-between gap-3 pt-4 sm:pt-6">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Dữ liệu được bảo vệ an toàn
                      </span>
                    )}

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="ml-auto px-6 sm:px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer hover:gap-3"
                      >
                        Tiếp tục
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
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
                    )}
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
