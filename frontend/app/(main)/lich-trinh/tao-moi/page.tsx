"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Calendar, MapPin, UtensilsCrossed, Navigation } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AiTypewriterText from "@/components/itinerary/AiTypewriterText";
import BudgetDonutChart from "@/components/itinerary/BudgetDonutChart";
import ItineraryTimeline from "@/components/itinerary/ItineraryTimeline";
import MapMiniPreview from "@/components/itinerary/MapMiniPreview";
import RecommendationBlock, { RecommendationItem } from "@/components/itinerary/RecommendationBlock";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import AiWizardModal, { ItineraryForm } from "@/components/itinerary/AiWizardModal";
import { generateItinerary, getSavedItineraryPreferences } from "@/lib/api/itineraries";
import type { GeneratedItinerary, GeneratedItineraryItem } from "@/types/itinerary";

export default function CreateItineraryPage() {
  const [wizardOpen, setWizardOpen] = useState(true);
  const [wizardStep, setWizardStep] = useState(0);
  
  const [formData, setFormData] = useState<ItineraryForm>({
    budget: 4500000,
    days: 3,
    guestCount: 1,
    startDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
    needs: ["accommodation", "food", "attractions"],
    accType: "Khách sạn",
    stars: 4,
    prefs: ["Ẩm thực địa phương"]
  });

  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Array<{
    item: RecommendationItem;
    day: number;
  }>>([]);
  const [activeTab, setActiveTab] = useState("Ngày 1");
  const [budgetNotice, setBudgetNotice] = useState("");
  
  // Flag to know if user has completed wizard at least once
  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
  // Key to force re-render AiTypewriterText only when completion triggers
  const [aiKey, setAiKey] = useState(0);

  useEffect(() => {
    let active = true;
    getSavedItineraryPreferences()
      .then((preferences) => {
        if (active && preferences.length > 0) {
          setFormData((current) => ({ ...current, prefs: preferences }));
        }
      })
      .catch((error: unknown) => {
        console.error("Không thể tải sở thích đã lưu:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleWizardComplete = async () => {
    const generated = await generateItinerary(formData);
    setItinerary(generated);
    setSelectedRecommendations([]);
    setWizardOpen(false);
    setHasCompletedWizard(true);
    setAiKey(prev => prev + 1); // Trigger re-render of typewriter
    setBudgetNotice("");
    setActiveTab("Ngày 1"); // reset to day 1
  };

  const dynamicItinerary: Record<string, GeneratedItineraryItem[]> = Object.fromEntries(
    (itinerary?.days ?? []).map(({ day, items }) => [
      `Ngày ${day}`,
      [
        ...items,
        ...selectedRecommendations
          .filter((selection) => selection.day === day)
          .map(({ item }) => ({
            id: `recommendation-${item.id}`,
            time: "20:30",
            title: `Gợi ý thêm: ${item.title}`,
            description: "Đã thêm vào bản xem trước; bạn có thể bỏ gợi ý này bất cứ lúc nào.",
            type: item.category === "Ẩm thực" ? "food" as const : "attraction" as const,
            estimatedCost: item.price * formData.guestCount,
          })),
      ].sort((left, right) => left.time.localeCompare(right.time)),
    ]),
  );
  const dayTabs = Object.keys(dynamicItinerary);
  const addedCost = selectedRecommendations.reduce((total, selection) => total + selection.item.price * formData.guestCount, 0);
  const currentTotal = (itinerary?.summary.estimatedTotal ?? 0) + addedCost;
  const costs = itinerary?.summary.costs;
  const addedFoodCost = selectedRecommendations
    .filter(({ item }) => item.category === "Ẩm thực")
    .reduce((total, { item }) => total + item.price * formData.guestCount, 0);
  const addedAttractionCost = selectedRecommendations
    .filter(({ item }) => item.category !== "Ẩm thực")
    .reduce((total, { item }) => total + item.price * formData.guestCount, 0);

  const donutData = [
    { label: "Lưu trú", value: costs?.accommodation ?? 0, color: "#a855f7" },
    { label: "Ăn uống", value: (costs?.food ?? 0) + addedFoodCost, color: "#f97316" },
    { label: "Di chuyển", value: costs?.transport ?? 0, color: "#3b82f6" },
    { label: "Tham quan", value: (costs?.attractions ?? 0) + addedAttractionCost, color: "#10b981" },
    { label: "Dự phòng", value: costs?.contingency ?? 0, color: "#94a3b8" },
  ];

  const handleToggleRecommendation = (item: RecommendationItem) => {
    if (!itinerary) return;

    const isSelected = selectedRecommendations.some((selection) => selection.item.id === item.id);
    const nextSelections = isSelected
      ? selectedRecommendations.filter((selection) => selection.item.id !== item.id)
      : [...selectedRecommendations, { item, day: Number(activeTab.replace("Ngày ", "")) }];
    setSelectedRecommendations(nextSelections);

    const nextTotal = (itinerary.summary.estimatedTotal ?? 0)
      + nextSelections.reduce((total, selection) => total + selection.item.price * formData.guestCount, 0);
    setBudgetNotice(nextTotal > itinerary.summary.budget
      ? `Bản xem trước đang vượt ngân sách khoảng ${(nextTotal - itinerary.summary.budget).toLocaleString('vi-VN')}đ. Bạn vẫn có thể giữ hoặc bỏ gợi ý tùy ý; không có dịch vụ nào được đặt.`
      : isSelected
        ? "Đã bỏ gợi ý khỏi bản xem trước."
        : "Đã thêm gợi ý vào bản xem trước; chưa có dịch vụ nào được đặt.");
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
        onClose={() => setWizardOpen(false)}
      />

      {!hasCompletedWizard && !wizardOpen && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16 mt-16 text-center">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12">
            <Sparkles className="w-10 h-10 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Lịch trình chỉ để tham khảo</h1>
            <p className="text-gray-600 mb-6">
              Tạo gợi ý theo ngân sách và sở thích. Bạn có thể bỏ qua, sửa hoặc tự chọn hoạt động; không có đặt chỗ hay giao dịch nào được thực hiện.
            </p>
            <button
              onClick={() => openWizardAt(0)}
              className="px-6 py-3 rounded-xl font-bold text-white bg-[#0f2942] hover:bg-[#1a3f5c] transition-colors"
            >
              Tạo lịch trình tham khảo
            </button>
          </div>
        </main>
      )}

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
                  sub: `${formData.days} ngày · ${formData.guestCount} người · ${formData.startDate}`,
                  gradient: "from-amber-50 to-orange-50",
                  border: "border-orange-100",
                  dot: "bg-orange-400",
                  accent: "text-orange-600",
                },
                {
                  i: 1, label: "Nhu cầu", emoji: "🧭",
                  value: formData.needs.map((need) => ({
                    accommodation: "Lưu trú",
                    food: "Ăn uống",
                    attractions: "Tham quan",
                  }[need])).join(", "),
                  sub: formData.accType ? `${formData.accType} · ${formData.stars} sao` : "Các hạng mục đã chọn",
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
                    <span className="text-[11px] text-gray-500">
                      {i === 2 && formData.prefs.length === 0 ? "Không ưu tiên sở thích" : sub}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Budget-based itinerary summary */}
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
              {/* Animated planning indicator */}
              <div className="flex-shrink-0 mt-0.5">
                <div className="relative w-11 h-11">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
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
                  <span className="text-[10px] font-bold tracking-widest text-orange-300/80 uppercase">Lập lịch theo ngân sách</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] text-white/40">Ước tính cho {formData.guestCount} người</span>
                </div>
                <AiTypewriterText
                  key={aiKey}
                  text={`Lịch trình ${formData.days} ngày cho ${formData.guestCount} người, bắt đầu ${formData.startDate}, là gợi ý theo ngân sách tổng ${formData.budget.toLocaleString('vi-VN')}đ${formData.prefs.length ? ` và sở thích ${formData.prefs.join(', ')}` : ''}. Bạn có thể tùy ý thay đổi; chi phí chỉ mang tính tham khảo.`}
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
                Giá tham khảo
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
                  Gợi ý tham khảo cho {activeTab}
                </h3>
                <p className="mb-3 text-sm text-gray-500">
                  Có thể thêm vào bản xem trước hoặc bỏ qua. Đây không phải đặt bàn, đặt phòng hay mua vé.
                </p>
                {budgetNotice && <p role="status" className="mb-3 text-sm text-amber-700">{budgetNotice}</p>}
                <RecommendationBlock
                  items={itinerary?.recommendations ?? []}
                  selectedIds={selectedRecommendations.map(({ item }) => item.id)}
                  guestCount={formData.guestCount}
                  onToggle={handleToggleRecommendation}
                />
              </div>

            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-6">
              
              {/* Map Mini Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Địa điểm {activeTab}</h3>
                <MapMiniPreview
                  key={activeTab}
                  locations={(dynamicItinerary[activeTab] ?? []).flatMap((item) => item.location ? [item.location] : [])}
                />
              </div>

              {/* Budget Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Cơ cấu ngân sách</h3>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${
                    currentTotal > (itinerary?.summary.budget ?? 0)
                      ? "text-amber-700 bg-amber-50"
                      : "text-teal-600 bg-teal-50"
                  }`}>
                    Tổng: {currentTotal.toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <p className="text-sm mb-4 text-gray-600">
                  Ngân sách bạn nhập: {formData.budget.toLocaleString('vi-VN')}đ.
                  {currentTotal > formData.budget
                    ? ` Dự toán vượt khoảng ${(currentTotal - formData.budget).toLocaleString('vi-VN')}đ.`
                    : ` Còn khoảng ${(formData.budget - currentTotal).toLocaleString('vi-VN')}đ theo dự toán.`}
                  {" "}Bạn có thể bỏ qua cảnh báo và tự điều chỉnh.
                </p>
                
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
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={Object.values(dynamicItinerary).flat().filter(item => item.type === "attraction").length} /></div>
                      <div className="text-xs text-gray-500">Địa điểm</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={formData.days * 3} /></div>
                      <div className="text-xs text-gray-500">Bữa ăn</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 flex"><AnimatedCounter to={costs?.transport ?? 0} /></div>
                      <div className="text-xs text-gray-500">Đi lại dự kiến (đ)</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-gray-500">
                  {itinerary?.notices.map((notice) => <li key={notice}>{notice}</li>)}
                  <li>Thêm/bỏ gợi ý chỉ thay đổi bản xem trước trên trang; không tạo đặt chỗ hay thanh toán.</li>
                  <li>Giá tham khảo được nhân theo {formData.guestCount} người; đi lại đang dự trù khoảng 80.000đ/người/ngày, chưa dùng dữ liệu tuyến đường thực tế.</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  Giá vé, dịch vụ và di chuyển có thể thay đổi.
                </p>
                
              </div>
            </div>
          </div>
        </main>
      )}

      {hasCompletedWizard && <Footer />}
    </div>
  );
}
