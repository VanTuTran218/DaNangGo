"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, RefreshCw, Calendar, MapPin, UtensilsCrossed, Navigation } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AiTypewriterText from "@/components/itinerary/AiTypewriterText";
import BudgetDonutChart from "@/components/itinerary/BudgetDonutChart";
import ItineraryTimeline, { TimelineItem } from "@/components/itinerary/ItineraryTimeline";
import MapMiniPreview from "@/components/itinerary/MapMiniPreview";
import RecommendationBlock, { RecommendationItem } from "@/components/itinerary/RecommendationBlock";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import AiWizardModal, { ItineraryForm } from "@/components/itinerary/AiWizardModal";

const STEPS = ["Ngân sách", "Lưu trú", "Gu trải nghiệm"];

const RAW_ITEMS: TimelineItem[] = [
  { id: "1", time: "08:00", title: "Ăn sáng Bún chả cá Bà Phiến", description: "Thưởng thức bún chả cá chuẩn vị Đà Nẵng", type: "food", location: "63 Lê Hồng Phong", imageUrl: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=400" },
  { id: "2", time: "09:30", title: "Tham quan Chùa Linh Ứng", description: "Viếng thăm ngôi chùa linh thiêng với tượng Phật Bà Quan Âm cao nhất Việt Nam.", type: "attraction", location: "Bán đảo Sơn Trà", imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=400" },
  { id: "3", time: "12:00", title: "Ăn trưa Hải sản", description: "Hải sản tươi sống bên bờ biển", type: "food", location: "Biển Mỹ Khê" },
  { id: "4", time: "15:00", title: "Tắm biển & Thể thao", description: "Các hoạt động giải trí trên biển", type: "attraction", location: "Biển Mỹ Khê", imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400" },
  { id: "5", time: "19:00", title: "Cầu Rồng phun lửa", description: "Xem biểu diễn lúc 21:00 cuối tuần", type: "attraction", location: "Cầu Rồng" },
  { id: "6", time: "08:30", title: "Khám phá Bà Nà Hills", description: "Làng Pháp, Cầu Vàng", type: "attraction", location: "Hòa Vang", imageUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=400" },
  { id: "7", time: "18:00", title: "Dạo chợ đêm Helio", description: "Ẩm thực đường phố đa dạng", type: "food", location: "Chợ đêm Helio" },
  { id: "8", time: "09:00", title: "Mua sắm Chợ Hàn", description: "Đặc sản làm quà", type: "attraction", location: "119 Trần Phú" }
];

const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  { id: "r1", title: "Mì Quảng Bà Mua", category: "Ẩm thực", price: 45000, imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=200" },
  { id: "r2", title: "Vé Bảo tàng Chăm", category: "Tham quan", price: 60000, imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=200" }
];

export default function CreateItineraryPage() {
  const [wizardOpen, setWizardOpen] = useState(true);
  const [wizardStep, setWizardStep] = useState(0);
  
  const [formData, setFormData] = useState<ItineraryForm>({
    budget: 4500000,
    days: 3,
    accType: "Khách sạn",
    stars: 4,
    prefs: ["Ẩm thực địa phương"]
  });

  const [activeTab, setActiveTab] = useState("Ngày 1");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [budgetOffset, setBudgetOffset] = useState(0);
  
  // Flag to know if user has completed wizard at least once
  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
  // Key to force re-render AiTypewriterText only when completion triggers
  const [aiKey, setAiKey] = useState(0);

  const handleWizardComplete = () => {
    setWizardOpen(false);
    setHasCompletedWizard(true);
    setAiKey(prev => prev + 1); // Trigger re-render of typewriter
    setBudgetOffset(0);
    setActiveTab("Ngày 1"); // reset to day 1
  };

  // Generate dynamic itinerary data based on days
  const getDynamicItinerary = () => {
    const data: Record<string, TimelineItem[]> = {};
    for (let i = 1; i <= formData.days; i++) {
      // Pick pseudo-random items from RAW_ITEMS for each day
      data[`Ngày ${i}`] = RAW_ITEMS.slice((i - 1) * 2, (i * 2) + (i % 2 === 0 ? 1 : 0));
      if (data[`Ngày ${i}`].length === 0) data[`Ngày ${i}`] = [RAW_ITEMS[0]]; // fallback
    }
    return data;
  };
  
  const dynamicItinerary = getDynamicItinerary();
  const dayTabs = Object.keys(dynamicItinerary);

  const baseTotal = formData.budget;
  const currentTotal = baseTotal + budgetOffset;

  const donutData = [
    { label: "Lưu trú", value: currentTotal * 0.4, color: "#a855f7" },
    { label: "Ăn uống", value: currentTotal * 0.3, color: "#f97316" },
    { label: "Di chuyển", value: currentTotal * 0.15, color: "#3b82f6" },
    { label: "Tham quan", value: currentTotal * 0.15, color: "#10b981" }
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setBudgetOffset(prev => prev - 200000); // Simulate savings
      setAiKey(prev => prev + 1); // Re-run typewriter
    }, 1000);
  };

  const handleAddRecommendation = (item: RecommendationItem) => {
    setBudgetOffset(prev => prev + item.price);
  };

  const openWizardAt = (index: number) => {
    setWizardStep(index);
    setWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <AiWizardModal 
        isOpen={wizardOpen}
        initialStep={wizardStep}
        formData={formData}
        onChange={(data) => setFormData({ ...formData, ...data })}
        onComplete={handleWizardComplete}
        onClose={() => hasCompletedWizard && setWizardOpen(false)} // Cannot close if not completed once
      />

      {hasCompletedWizard && (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 mt-16">
          
          {/* Journey Steps — editorial card style */}
          <div className="mb-10">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[11px] font-bold tracking-widest text-orange-400 uppercase">Hành trình của bạn</span>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-100 to-transparent" />
              <button
                onClick={() => openWizardAt(0)}
                className="text-[11px] font-semibold text-gray-400 hover:text-teal-600 transition-colors flex items-center gap-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Thiết kế lại
              </button>
            </div>

            {/* Cards row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  i: 0, label: "Ngân sách", emoji: "💰",
                  value: `${(formData.budget / 1000000).toFixed(1)} triệu`,
                  sub: `${formData.days} ngày ${formData.days - 1} đêm`,
                  gradient: "from-amber-50 to-orange-50",
                  border: "border-orange-100",
                  dot: "bg-orange-400",
                  accent: "text-orange-600",
                },
                {
                  i: 1, label: "Lưu trú", emoji: "🏨",
                  value: formData.accType,
                  sub: `${formData.stars} sao`,
                  gradient: "from-sky-50 to-blue-50",
                  border: "border-blue-100",
                  dot: "bg-blue-400",
                  accent: "text-blue-600",
                },
                {
                  i: 2, label: "Gu trải nghiệm", emoji: "✨",
                  value: formData.prefs[0] ?? "Chưa chọn",
                  sub: formData.prefs.length > 1 ? `+${formData.prefs.length - 1} sở thích` : "Sở thích",
                  gradient: "from-violet-50 to-purple-50",
                  border: "border-purple-100",
                  dot: "bg-purple-400",
                  accent: "text-purple-600",
                },
              ].map(({ i, label, emoji, value, sub, gradient, border, dot, accent }) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4, ease: "easeOut" }}
                  onClick={() => openWizardAt(i)}
                  className={`relative group text-left bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}
                >
                  {/* Decorative circle bg */}
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/60 pointer-events-none" />

                  {/* Top row: emoji + edit hint */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl leading-none">{emoji}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-400 flex items-center gap-0.5 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Sửa
                    </span>
                  </div>

                  {/* Label */}
                  <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase mb-1">{label}</p>

                  {/* Primary value */}
                  <p className={`font-bold text-sm leading-snug ${accent} line-clamp-1`}>{value}</p>

                  {/* Sub value */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-[11px] text-gray-500">{sub}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* AI Concierge Block */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative mb-8 rounded-2xl overflow-hidden"
          >
            {/* Layered warm gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f2942] via-[#1a3f5c] to-[#0f3a52]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.12),transparent_60%)]" />

            {/* Decorative quote mark */}
            <div className="absolute top-4 right-6 text-white/[0.04] text-[120px] font-serif leading-none select-none pointer-events-none">❝</div>

            {/* Content */}
            <div className="relative z-10 p-6 flex gap-5 items-start">
              {/* Pulsing AI orb */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="relative w-11 h-11">
                  <motion.div
                    animate={isOptimizing
                      ? { scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }
                      : { scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: isOptimizing ? 0.8 : 2.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-orange-400/40"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-orange-300/80 uppercase">AI Concierge</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] text-white/40">DanangGo Intelligence</span>
                </div>
                <AiTypewriterText
                  key={aiKey}
                  text={isOptimizing
                    ? "Đang phân tích lại các lựa chọn tốt nhất cho hành trình của bạn..."
                    : `Dựa trên ngân sách ${formData.budget.toLocaleString('vi-VN')}đ, ưu tiên ${formData.accType} ${formData.stars} sao và sở thích ${formData.prefs.join(', ')}, tôi đã thiết kế lịch trình ${formData.days} ngày tối ưu cho bạn.`}
                  className="text-white/85 text-sm leading-relaxed"
                />
              </div>

              {/* Badge */}
              <div className="hidden md:flex flex-shrink-0 items-center gap-1.5 bg-white/8 border border-white/10 backdrop-blur-sm text-[11px] font-semibold px-3 py-1.5 rounded-xl text-white/60 mt-0.5 whitespace-nowrap">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-teal-400"
                />
                Giá thực tế đã khóa
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto hide-scrollbar">
                {dayTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-6 py-2.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                ))}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ItineraryTimeline items={dynamicItinerary[activeTab] || []} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 text-orange-500 mr-2" />
                  Có thể bạn muốn bổ sung cho {activeTab}
                </h3>
                <RecommendationBlock items={MOCK_RECOMMENDATIONS} onAdd={handleAddRecommendation} />
              </div>

            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-6">
              
              {/* Map Mini Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Bản đồ tuyến {activeTab}</h3>
                <MapMiniPreview key={activeTab} /> {/* Re-render map to redraw path on tab change */}
              </div>

              {/* Budget Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Cơ cấu ngân sách</h3>
                  <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                    Tổng: {currentTotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>
                
                <div className="mb-6">
                  <BudgetDonutChart data={donutData} total={currentTotal} />
                </div>

                {/* Stats Counters */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={formData.days} /></div>
                      <div className="text-xs text-gray-500">Ngày</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={Object.values(dynamicItinerary).flat().length} /></div>
                      <div className="text-xs text-gray-500">Địa điểm</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={formData.days * 2} /></div>
                      <div className="text-xs text-gray-500">Bữa ăn</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={42} />km</div>
                      <div className="text-xs text-gray-500">Tuyến đường</div>
                    </div>
                  </div>
                </div>

                {/* Optimize Button */}
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-70 disabled:cursor-not-allowed border border-orange-100"
                >
                  <motion.div animate={isOptimizing ? { rotate: 360 } : { rotate: 0 }} transition={{ repeat: isOptimizing ? Infinity : 0, duration: 1, ease: "linear" }}>
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  {isOptimizing ? "Đang tính toán..." : "Tối ưu lại AI"}
                </button>
                
              </div>
            </div>
          </div>
        </main>
      )}

      {hasCompletedWizard && <Footer />}
    </div>
  );
}
