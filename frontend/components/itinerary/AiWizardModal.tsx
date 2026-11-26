"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Hotel,
  Home,
  Tent,
  Palmtree,
  UtensilsCrossed,
  Mountain,
  Camera,
  CalendarDays,
  Users,
  Minus,
  Plus,
  Compass,
  Wallet,
  Star,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AiItineraryInput } from "@/components/ai/AiTools";

export interface ItineraryForm {
  budget: number;
  days: number;
  guestCount: number;
  startDate: string;
  needs: Array<"accommodation" | "food" | "attractions">;
  accType: string;
  stars: number;
  prefs: string[];
}

interface Props {
  isOpen: boolean;
  initialStep: number;
  formData: ItineraryForm;
  onChange: (data: Partial<ItineraryForm>) => void;
  onComplete: () => Promise<void>;
  onClose: () => void;
}

const BUDGET_PRESETS = [
  { value: 1500000, label: "1.5 Tr", tag: "Tiết kiệm" },
  { value: 3000000, label: "3.0 Tr", tag: "Vừa vặn" },
  { value: 5000000, label: "5.0 Tr", tag: "Thoải mái" },
  { value: 8000000, label: "8.0 Tr", tag: "Nghỉ dưỡng" },
];

const DAY_OPTIONS = [
  { value: 1, title: "1 ngày", sub: "Đi trong ngày" },
  { value: 2, title: "2 ngày", sub: "2N1Đ cuối tuần" },
  { value: 3, title: "3 ngày", sub: "3N2Đ trọn vẹn" },
];

const NEED_OPTIONS = [
  {
    id: "accommodation" as const,
    label: "Lưu trú",
    desc: "Khách sạn, resort hoặc homestay",
    icon: Hotel,
  },
  {
    id: "food" as const,
    label: "Ăn uống",
    desc: "Quán đặc sản chọn theo từng bữa",
    icon: UtensilsCrossed,
  },
  {
    id: "attractions" as const,
    label: "Tham quan",
    desc: "Danh thắng & điểm check-in nổi bật",
    icon: Mountain,
  },
];

const ACC_OPTIONS = [
  { id: "Khách sạn", icon: Hotel },
  { id: "Resort", icon: Palmtree },
  { id: "Homestay", icon: Home },
  { id: "Cắm trại", icon: Tent },
];

const STAR_OPTIONS = [
  { value: 3, label: "3 sao", desc: "Tiêu chuẩn" },
  { value: 4, label: "4 sao", desc: "Cao cấp" },
  { value: 5, label: "5 sao", desc: "Sang trọng" },
];

const PREF_OPTIONS = [
  {
    id: "Ẩm thực địa phương",
    sub: "Mì Quảng, hải sản, quán bản địa",
    icon: UtensilsCrossed,
  },
  {
    id: "Biển & Nghỉ dưỡng",
    sub: "Mỹ Khê, bán đảo Sơn Trà, thư giãn",
    icon: Palmtree,
  },
  {
    id: "Di sản & Văn hoá",
    sub: "Ngũ Hành Sơn, Bảo tàng Chăm",
    icon: Home,
  },
  {
    id: "Phiêu lưu mạo hiểm",
    sub: "Đèo Hải Vân, Bà Nà, khám phá",
    icon: Mountain,
  },
  {
    id: "Check-in sống ảo",
    sub: "Cầu Rồng, cầu Vàng, góc ảnh đẹp",
    icon: Camera,
  },
];

const STEPS = [
  { num: "01", label: "Ngân sách" },
  { num: "02", label: "Nhu cầu" },
  { num: "03", label: "Gu trải nghiệm" },
];

const MIN_SLIDER = 500000;
const MAX_SLIDER = 15000000;

export default function AiWizardModal({
  isOpen,
  initialStep,
  formData,
  onChange,
  onComplete,
  onClose,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setIsCalculating(false);
      setErrorMessage("");
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCalculating) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCalculating, onClose]);

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setIsCalculating(true);
    setErrorMessage("");
    try {
      await onComplete();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tạo lịch trình.",
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const isStepValid = () => {
    if (step === 0) {
      return (
        formData.budget > 0 &&
        Number.isInteger(formData.days) &&
        formData.days >= 1 &&
        formData.days <= 3 &&
        Number.isInteger(formData.guestCount) &&
        formData.guestCount > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(formData.startDate)
      );
    }
    if (step === 1) return formData.needs.length > 0;
    if (step === 2) return true;
    return false;
  };

  const handleBudgetInputChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/[^\d]/g, "");
    onChange({ budget: digitsOnly ? Number(digitsOnly) : 0 });
  };

  const sliderValue = Math.min(
    MAX_SLIDER,
    Math.max(MIN_SLIDER, formData.budget || MIN_SLIDER),
  );
  const sliderPercent =
    ((sliderValue - MIN_SLIDER) / (MAX_SLIDER - MIN_SLIDER)) * 100;
  const perGuestBudget =
    formData.budget > 0 && formData.guestCount > 0
      ? Math.round(formData.budget / formData.guestCount)
      : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
        {/* Nocturnal backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#020A0F]/82 backdrop-blur-md"
          onClick={() => {
            if (!isCalculating) onClose();
          }}
        />

        {/* Smoked-Glass Modal Shell */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 18 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[24px] border border-[#E6D9B7]/28 bg-[#071821]/96 text-[#FFFDF5] shadow-[0_32px_90px_rgba(0,0,0,0.72),0_0_0_1px_rgba(230,217,183,0.08)] backdrop-blur-2xl"
        >
          {/* Ambient radial glow + subtle Leica corner ticks */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top_center,rgba(45,212,191,0.12),transparent_70%)]" />
          <div className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-[#E6D9B7]/40 rounded-tl-[4px]" />
          <div className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-[#E6D9B7]/40 rounded-tr-[4px]" />

          {/* Header */}
          <div className="relative flex items-center justify-between gap-3 border-b border-[#E6D9B7]/14 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E87B39] to-[#C85A1D] text-[#FFFDF5] shadow-[0_8px_20px_rgba(232,123,57,0.34)]">
                <Compass size={19} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]/75">
                  Journey Architect // Đà Nẵng
                </p>
                <h2 className="truncate text-base sm:text-lg font-bold text-[#FFFDF5]">
                  Thiết kế lịch trình theo ngân sách
                </h2>
              </div>
            </div>
            <button
              type="button"
              aria-label="Đóng cửa sổ thiết kế lịch trình"
              onClick={onClose}
              disabled={isCalculating}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E6D9B7]/18 bg-white/[0.04] text-[#B4CED4] transition-colors hover:border-[#E6D9B7]/40 hover:bg-white/[0.1] hover:text-[#FFFDF5] disabled:opacity-40 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 3-Step Segmented Stepper */}
          <div className="relative border-b border-[#E6D9B7]/10 bg-[#05131B]/65 px-5 py-3 sm:px-6">
            <div className="grid grid-cols-3 gap-2">
              {STEPS.map((item, idx) => {
                const isActive = idx === step;
                const isDone = idx < step;
                const canJump = idx < step && !isCalculating;
                return (
                  <button
                    key={item.num}
                    type="button"
                    disabled={!canJump}
                    onClick={() => canJump && setStep(idx)}
                    className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                      isActive
                        ? "border-[#2DD4BF]/55 bg-[#2DD4BF]/12 text-[#FFFDF5]"
                        : isDone
                          ? "border-[#E6D9B7]/24 bg-[#E6D9B7]/8 text-[#E6D9B7] hover:border-[#E6D9B7]/45 cursor-pointer"
                          : "border-white/[0.06] bg-white/[0.02] text-[#6E8E98] cursor-default"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                        isActive
                          ? "bg-[#2DD4BF] text-[#031317]"
                          : isDone
                            ? "bg-[#E6D9B7] text-[#06151C]"
                            : "border border-white/15 text-[#6E8E98]"
                      }`}
                    >
                      {isDone ? <Check size={13} strokeWidth={2.8} /> : idx + 1}
                    </span>
                    <span className="truncate text-xs font-semibold">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Body */}
          <div
            data-lenis-prevent
            className="relative flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-6 sm:py-5"
          >
            {errorMessage && (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-rose-400/35 bg-rose-500/12 px-4 py-3 text-xs font-medium text-rose-200"
              >
                {errorMessage}
              </p>
            )}

            <AnimatePresence mode="wait">
              {/* STEP 1: NGÂN SÁCH & THỜI GIAN */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <AiItineraryInput dark onApply={onChange} />

                  {/* Budget Studio Card */}
                  <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#05131B]/78 p-4 space-y-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#FFFDF5]">
                          <Wallet size={15} className="text-[#E87B39]" />
                          Ngân sách dự kiến của bạn?
                        </h3>
                        <p className="mt-0.5 text-xs text-[#8FB0BA]">
                          Ngân sách tổng cho toàn bộ đoàn.
                        </p>
                      </div>
                      {perGuestBudget > 0 && formData.guestCount > 1 && (
                        <span className="rounded-full border border-[#E6D9B7]/22 bg-[#E6D9B7]/8 px-2.5 py-1 text-[11px] font-semibold text-[#E6D9B7]">
                          ~ {perGuestBudget.toLocaleString("vi-VN")}đ/người
                        </span>
                      )}
                    </div>

                    {/* Formatted Currency Input */}
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label="Ngân sách dự kiến (VNĐ)"
                        value={
                          formData.budget > 0
                            ? formData.budget.toLocaleString("vi-VN")
                            : ""
                        }
                        onChange={(e) => handleBudgetInputChange(e.target.value)}
                        className="auth-dark-input w-full rounded-xl border border-[#E6D9B7]/24 bg-[#041017] py-2.5 pl-4 pr-16 text-xl font-bold tracking-wide text-[#FFFDF5] placeholder:text-[#668692] outline-none transition-all focus:border-[#E87B39]/75 focus:ring-2 focus:ring-[#E87B39]/20 tabular-nums"
                        placeholder="4.500.000"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold tracking-widest text-[#E6D9B7]/80">
                        VNĐ
                      </span>
                    </div>

                    {/* Interactive Range Slider */}
                    <div className="space-y-1.5 pt-0.5">
                      <input
                        type="range"
                        aria-label="Điều chỉnh nhanh ngân sách"
                        min={MIN_SLIDER}
                        max={MAX_SLIDER}
                        step={250000}
                        value={sliderValue}
                        onChange={(e) =>
                          onChange({ budget: Number(e.target.value) })
                        }
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#E87B39]"
                        style={{
                          background: `linear-gradient(to right, #E87B39 0%, #E6D9B7 ${sliderPercent}%, rgba(230,217,183,0.16) ${sliderPercent}%, rgba(230,217,183,0.16) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-[10.5px] font-medium text-[#7DA0AC]">
                        <span>500K</span>
                        <span>5 Tr</span>
                        <span>10 Tr</span>
                        <span>15 Tr+</span>
                      </div>
                    </div>

                    {/* 4 Budget Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {BUDGET_PRESETS.map((preset) => {
                        const isSelected = formData.budget === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => onChange({ budget: preset.value })}
                            className={`rounded-xl border px-2 py-2 text-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#E87B39]/80 bg-[#E87B39]/18 text-[#FFFDF5] shadow-[0_4px_14px_rgba(232,123,57,0.22)]"
                                : "border-[#E6D9B7]/14 bg-white/[0.03] text-[#B4CED4] hover:border-[#E6D9B7]/35 hover:text-[#FFFDF5]"
                            }`}
                          >
                            <span className="block text-xs font-bold">
                              {preset.label}
                            </span>
                            <span
                              className={`block text-[10px] ${
                                isSelected ? "text-[#F0B47C]" : "text-[#7DA0AC]"
                              }`}
                            >
                              {preset.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Days + Guests + Start Date */}
                  <div className="grid gap-3.5">
                    <div>
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]/85">
                        Số ngày trải nghiệm
                      </span>
                      <div className="grid grid-cols-3 gap-2.5">
                        {DAY_OPTIONS.map((opt) => {
                          const isSelected = formData.days === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => onChange({ days: opt.value })}
                              className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[#2DD4BF]/75 bg-[#2DD4BF]/14 text-[#FFFDF5] shadow-[0_6px_18px_rgba(45,212,191,0.16)]"
                                  : "border-[#E6D9B7]/16 bg-[#05131B]/75 text-[#B4CED4] hover:border-[#E6D9B7]/36 hover:text-[#FFFDF5]"
                              }`}
                            >
                              <span className="block text-sm font-bold">
                                {opt.title}
                              </span>
                              <span
                                className={`block text-[11px] ${
                                  isSelected
                                    ? "text-[#5EEAD4]"
                                    : "text-[#7DA0AC]"
                                }`}
                              >
                                {opt.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Guest Stepper */}
                      <div className="rounded-xl border border-[#E6D9B7]/18 bg-[#05131B]/78 px-3.5 py-2.5">
                        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E6D9B7]/80">
                          <Users size={12} className="text-[#2DD4BF]" />
                          Số người
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            aria-label="Giảm số người"
                            onClick={() =>
                              onChange({
                                guestCount: Math.max(1, formData.guestCount - 1),
                              })
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6D9B7]/20 bg-white/[0.04] text-[#FFFDF5] transition-colors hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/15 cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="flex items-baseline gap-1">
                            <input
                              type="number"
                              aria-label="Số người"
                              min={1}
                              step={1}
                              value={formData.guestCount}
                              onChange={(event) =>
                                onChange({
                                  guestCount: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                })
                              }
                              className="w-12 bg-transparent text-center text-base font-bold text-[#FFFDF5] outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-[#8FB0BA]">người</span>
                          </div>
                          <button
                            type="button"
                            aria-label="Tăng số người"
                            onClick={() =>
                              onChange({
                                guestCount: formData.guestCount + 1,
                              })
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6D9B7]/20 bg-white/[0.04] text-[#FFFDF5] transition-colors hover:border-[#2DD4BF]/50 hover:bg-[#2DD4BF]/15 cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Start Date */}
                      <label className="block rounded-xl border border-[#E6D9B7]/18 bg-[#05131B]/78 px-3.5 py-2.5 focus-within:border-[#2DD4BF]/65 transition-colors">
                        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E6D9B7]/80">
                          <CalendarDays size={12} className="text-[#E87B39]" />
                          Ngày bắt đầu
                        </span>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(event) =>
                            onChange({ startDate: event.target.value })
                          }
                          style={{ colorScheme: "dark" }}
                          className="w-full bg-transparent text-sm font-semibold text-[#FFFDF5] outline-none cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: NHU CẦU VÀ LƯU TRÚ */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-lg font-bold text-[#FFFDF5]">
                      Bạn cần gợi ý những hạng mục nào?
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#9AB6BF]">
                      Chọn ít nhất một hạng mục. Đây là các thành phần sẽ đưa
                      vào lịch trình tham khảo của bạn.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {NEED_OPTIONS.map((item) => {
                      const isSelected = formData.needs.includes(item.id);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              needs: isSelected
                                ? formData.needs.filter((n) => n !== item.id)
                                : [...formData.needs, item.id],
                            })
                          }
                          className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#2DD4BF]/75 bg-[#2DD4BF]/12 shadow-[0_10px_26px_rgba(45,212,191,0.14)]"
                              : "border-[#E6D9B7]/16 bg-[#05131B]/75 hover:border-[#E6D9B7]/36"
                          }`}
                        >
                          <div className="mb-3 flex w-full items-center justify-between">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                isSelected
                                  ? "border-[#2DD4BF]/50 bg-[#2DD4BF]/20 text-[#5EEAD4]"
                                  : "border-[#E6D9B7]/16 bg-white/[0.04] text-[#8FB0BA]"
                              }`}
                            >
                              <Icon size={20} />
                            </span>
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                                isSelected
                                  ? "border-[#2DD4BF] bg-[#2DD4BF] text-[#031417]"
                                  : "border-white/20"
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-[#FFFDF5]">
                            {item.label}
                          </span>
                          <span className="mt-1 text-[11.5px] leading-snug text-[#8FB0BA]">
                            {item.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {formData.needs.includes("accommodation") && (
                    <div className="space-y-4 rounded-2xl border border-[#E6D9B7]/18 bg-[#05131B]/78 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[#E6D9B7]">
                          Loại lưu trú &amp; tiêu chuẩn
                        </h4>
                        <span className="text-[11px] text-[#7DA0AC]">
                          Không bắt buộc
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {ACC_OPTIONS.map((type) => {
                          const isSelected = formData.accType === type.id;
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => onChange({ accType: type.id })}
                              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[#2DD4BF]/70 bg-[#2DD4BF]/14 text-[#FFFDF5]"
                                  : "border-[#E6D9B7]/14 bg-white/[0.03] text-[#B4CED4] hover:border-[#E6D9B7]/35 hover:text-[#FFFDF5]"
                              }`}
                            >
                              <Icon
                                size={16}
                                className={
                                  isSelected
                                    ? "text-[#5EEAD4]"
                                    : "text-[#7DA0AC]"
                                }
                              />
                              {type.id}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {STAR_OPTIONS.map((star) => {
                          const isSelected = formData.stars === star.value;
                          return (
                            <button
                              key={star.value}
                              type="button"
                              onClick={() => onChange({ stars: star.value })}
                              className={`rounded-xl border px-3 py-2.5 text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[#E6D9B7]/75 bg-[#E6D9B7]/15 text-[#FFFDF5]"
                                  : "border-[#E6D9B7]/14 bg-white/[0.03] text-[#B4CED4] hover:border-[#E6D9B7]/35"
                              }`}
                            >
                              <span className="flex items-center justify-center gap-1 text-sm font-bold">
                                {star.value}
                                <Star
                                  size={13}
                                  className={
                                    isSelected
                                      ? "fill-[#E87B39] text-[#E87B39]"
                                      : "text-[#7DA0AC]"
                                  }
                                />
                              </span>
                              <span
                                className={`mt-0.5 block text-[10.5px] ${
                                  isSelected
                                    ? "text-[#E6D9B7]"
                                    : "text-[#7DA0AC]"
                                }`}
                              >
                                {star.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: GU TRẢI NGHIỆM */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <div>
                    <h3 className="text-lg font-bold text-[#FFFDF5]">
                      Gu trải nghiệm của bạn?
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#9AB6BF]">
                      Chọn một hoặc nhiều phong cách để Gô ưu tiên địa điểm phù
                      hợp. Bạn vẫn có thể bỏ qua bước này.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {PREF_OPTIONS.map((pref) => {
                      const isSelected = formData.prefs.includes(pref.id);
                      const Icon = pref.icon;
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              onChange({
                                prefs: formData.prefs.filter(
                                  (p) => p !== pref.id,
                                ),
                              });
                            } else {
                              onChange({ prefs: [...formData.prefs, pref.id] });
                            }
                          }}
                          className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#E87B39]/80 bg-[#E87B39]/14 shadow-[0_8px_22px_rgba(232,123,57,0.16)]"
                              : "border-[#E6D9B7]/16 bg-[#05131B]/75 hover:border-[#E6D9B7]/36"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                              isSelected
                                ? "border-[#E87B39]/55 bg-[#E87B39]/22 text-[#F0B47C]"
                                : "border-[#E6D9B7]/16 bg-white/[0.04] text-[#8FB0BA]"
                            }`}
                          >
                            <Icon size={17} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-[#FFFDF5]">
                              {pref.id}
                            </span>
                            <span className="mt-0.5 block text-[11.5px] leading-snug text-[#8FB0BA]">
                              {pref.sub}
                            </span>
                          </span>
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-[#E87B39] bg-[#E87B39] text-white"
                                : "border-white/18"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Blueprint Ready Summary Strip */}
                  <div className="rounded-2xl border border-[#2DD4BF]/25 bg-[#081F2A]/90 px-4 py-3 text-xs text-[#B4CED4]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold text-[#5EEAD4]">
                        <Sparkles size={13} />
                        Bản thảo sẵn sàng:
                      </span>
                      <span className="font-semibold text-[#FFFDF5]">
                        {formData.budget.toLocaleString("vi-VN")}đ ·{" "}
                        {formData.days} ngày · {formData.guestCount} người
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="relative flex items-center justify-between gap-3 border-t border-[#E6D9B7]/14 bg-[#05131B]/82 px-5 py-4 sm:px-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={isCalculating}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E6D9B7]/20 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-[#D6E6EA] transition-colors hover:border-[#E6D9B7]/40 hover:bg-white/[0.08] hover:text-[#FFFDF5] disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isCalculating}
                className="text-xs font-semibold text-[#8FB0BA] transition-colors hover:text-[#E6D9B7] cursor-pointer"
              >
                Xem tổng quan trước
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid() || isCalculating}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#E87B39] to-[#D46525] px-6 py-2.5 text-sm font-bold text-[#FFFDF5] shadow-[0_10px_28px_rgba(232,123,57,0.34)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
            >
              {isCalculating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                  >
                    <Sparkles size={16} className="text-[#FFFDF5]" />
                  </motion.div>
                  Đang kiến tạo...
                </>
              ) : (
                <>
                  {step === 2 ? "Tạo lịch trình" : "Tiếp tục"}
                  {step < 2 ? (
                    <ArrowRight size={16} />
                  ) : (
                    <Sparkles size={15} />
                  )}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
