"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, Check, Hotel, Home, Tent, Palmtree, UtensilsCrossed, Mountain, Camera } from "lucide-react";
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

const PREF_OPTIONS = [
  { id: "Ẩm thực địa phương", icon: UtensilsCrossed },
  { id: "Biển & Nghỉ dưỡng", icon: Palmtree },
  { id: "Di sản & Văn hoá", icon: Home },
  { id: "Phiêu lưu mạo hiểm", icon: Mountain },
  { id: "Check-in sống ảo", icon: Camera },
];

export default function AiWizardModal({ isOpen, initialStep, formData, onChange, onComplete, onClose }: Props) {
  const [step, setStep] = useState(initialStep);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset step to initial when opened (if it was triggered from header)
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setIsCalculating(false);
      setErrorMessage("");
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step < 2) setStep(step + 1);
    else {
      setIsCalculating(true);
      setErrorMessage("");
      try {
        await onComplete();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Không thể tạo lịch trình.");
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const isStepValid = () => {
    if (step === 0) {
      return formData.budget > 0
        && Number.isInteger(formData.days) && formData.days >= 1 && formData.days <= 3
        && Number.isInteger(formData.guestCount) && formData.guestCount > 0
        && /^\d{4}-\d{2}-\d{2}$/.test(formData.startDate);
    }
    if (step === 1) return formData.needs.length > 0;
    if (step === 2) return true;
    return false;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                <Sparkles size={16} />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Thiết kế lịch trình theo ngân sách</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Progress */}
          <div className="px-8 pt-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-10 rounded-full" />
              <motion.div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-500 -z-10 rounded-full transition-all duration-300" 
                style={{ width: `${(step / 2) * 100}%` }}
              />
              
              {[0, 1, 2].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm ${i <= step ? "bg-teal-500 text-white" : "bg-white border-2 border-gray-200 text-gray-400"}`}>
                  {i < step ? <Check size={16} /> : (i + 1)}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500">
              <span className={step >= 0 ? "text-teal-600" : ""}>Ngân sách</span>
              <span className={step >= 1 ? "text-teal-600" : ""}>Nhu cầu</span>
              <span className={step >= 2 ? "text-teal-600" : ""}>Sở thích</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 flex-1 overflow-y-auto overflow-x-hidden relative min-h-[300px]">
            {errorMessage && (
              <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
            <AnimatePresence mode="wait">
              
              {/* STEP 1: NGÂN SÁCH & THỜI GIAN */}
              {step === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <AiItineraryInput onApply={onChange} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ngân sách dự kiến của bạn?</h3>
                    <p className="text-gray-500 text-sm mb-4">Ngân sách tổng cho toàn bộ đoàn.</p>
                    
                    <div className="relative">
                      <input 
                        type="number" 
                        value={formData.budget || ""}
                        onChange={(e) => onChange({ budget: Number(e.target.value) })}
                        className="w-full border-2 border-gray-200 focus:border-teal-500 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 outline-none transition-colors"
                        placeholder="VD: 4500000"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">VNĐ</span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      {[1500000, 3000000, 5000000, 8000000].map(val => (
                        <button key={val} onClick={() => onChange({ budget: val })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition-colors">
                          {(val / 1000000).toFixed(1)} Tr
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Số ngày</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(days => (
                        <button 
                          key={days} 
                          onClick={() => onChange({ days })}
                          className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.days === days ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                        >
                          {days} ngày
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-sm font-bold text-gray-900 mb-2">Số người</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={formData.guestCount}
                        onChange={(event) => onChange({ guestCount: Number(event.target.value) })}
                        className="w-full border-2 border-gray-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-sm font-bold text-gray-900 mb-2">Ngày bắt đầu</span>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(event) => onChange({ startDate: event.target.value })}
                        className="w-full border-2 border-gray-200 focus:border-teal-500 rounded-xl px-4 py-3 outline-none"
                      />
                    </label>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: NHU CẦU VÀ LƯU TRÚ */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn cần gợi ý những hạng mục nào?</h3>
                  <p className="text-gray-500 text-sm mb-4">Chọn ít nhất một nhu cầu. Đây chỉ là các phần muốn đưa vào lịch tham khảo.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "accommodation" as const, label: "Lưu trú", icon: Hotel },
                      { id: "food" as const, label: "Ăn uống", icon: UtensilsCrossed },
                      { id: "attractions" as const, label: "Tham quan", icon: Mountain },
                    ].map(type => (
                      <button 
                        key={type.id} 
                        onClick={() => onChange({
                          needs: formData.needs.includes(type.id)
                            ? formData.needs.filter((need) => need !== type.id)
                            : [...formData.needs, type.id],
                        })}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.needs.includes(type.id) ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        <type.icon size={24} className={formData.needs.includes(type.id) ? "text-teal-500" : "text-gray-400"} />
                        <span className="font-bold">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  {formData.needs.includes("accommodation") && (
                    <div className="pt-2">
                      <h4 className="font-bold text-gray-900 mb-3">Loại lưu trú và tiêu chuẩn (không bắt buộc)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "Khách sạn", icon: Hotel },
                          { id: "Resort", icon: Palmtree },
                          { id: "Homestay", icon: Home },
                          { id: "Cắm trại", icon: Tent },
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => onChange({ accType: type.id })}
                            className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold transition-all ${formData.accType === type.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600"}`}
                          >
                            <type.icon size={18} />{type.id}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {[3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => onChange({ stars: star })}
                          className={`flex-1 py-2 rounded-xl border-2 font-bold flex items-center justify-center gap-1 transition-all ${formData.stars === star ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600"}`}
                        >
                          {star} <Sparkles size={14} className={formData.stars === star ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: GU TRẢI NGHIỆM */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Gu trải nghiệm của bạn?</h3>
                  <p className="text-gray-500 text-sm mb-6">Chọn nếu muốn ưu tiên sở thích; bạn có thể bỏ qua bước này.</p>
                  
                  <div className="flex flex-wrap gap-3">
                    {PREF_OPTIONS.map(pref => {
                      const isSelected = formData.prefs.includes(pref.id);
                      return (
                        <button 
                          key={pref.id}
                          onClick={() => {
                            if (isSelected) onChange({ prefs: formData.prefs.filter(p => p !== pref.id) });
                            else onChange({ prefs: [...formData.prefs, pref.id] });
                          }}
                          className={`px-4 py-3 rounded-xl border-2 flex items-center gap-2 transition-all font-semibold ${isSelected ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                        >
                          <pref.icon size={18} className={isSelected ? "text-orange-500" : "text-gray-400"} />
                          {pref.id}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-2">
                <ArrowLeft size={18} /> Quay lại
              </button>
            ) : <div />}
            
            <button 
              onClick={handleNext}
              disabled={!isStepValid() || isCalculating}
              className="px-8 py-3 rounded-xl font-bold text-white bg-[#0f2942] hover:bg-[#1a3f5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#0f2942]/20 relative overflow-hidden"
            >
              {isCalculating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles size={18} className="text-orange-400" />
                  </motion.div>
                  Đang tính toán...
                </>
              ) : (
                <>
                  {step === 2 ? "Tạo lịch trình" : "Tiếp tục"}
                  {step < 2 && <ArrowRight size={18} />}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
