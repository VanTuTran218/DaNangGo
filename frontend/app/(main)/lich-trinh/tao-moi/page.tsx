"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Calendar,
  MapPin,
  UtensilsCrossed,
  Navigation,
  Compass,
  Wallet,
  ArrowRight,
  SlidersHorizontal,
  BookmarkCheck,
  ShieldCheck,
  Pencil,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AiTypewriterText from "@/components/itinerary/AiTypewriterText";
import BudgetDonutChart from "@/components/itinerary/BudgetDonutChart";
import ItineraryTimeline, {
  type TimelineItem,
} from "@/components/itinerary/ItineraryTimeline";
import MapMiniPreview from "@/components/itinerary/MapMiniPreview";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import AiWizardModal, {
  type ItineraryForm,
} from "@/components/itinerary/AiWizardModal";
import {
  getSavedItineraryPreferences,
  previewItinerary,
  saveItinerary,
} from "@/lib/api/itineraries";
import type {
  FoodSuggestion,
  GeneratedItinerary,
  ItineraryFoodSelection,
  MealSlot,
} from "@/types/itinerary";

const MEAL_OPTIONS = [
  { key: "breakfast", mealPeriod: "BREAKFAST", label: "Buổi sáng", time: "08:00" },
  { key: "lunch", mealPeriod: "LUNCH", label: "Buổi trưa", time: "12:00" },
  {
    key: "snack",
    mealPeriod: "SNACK",
    label: "Buổi chiều · Ăn nhẹ",
    time: "15:30",
  },
  { key: "dinner", mealPeriod: "DINNER", label: "Buổi tối", time: "18:30" },
] as const satisfies ReadonlyArray<{
  key: "breakfast" | "lunch" | "snack" | "dinner";
  mealPeriod: MealSlot;
  label: string;
  time: string;
}>;

type MealKey = (typeof MEAL_OPTIONS)[number]["key"];
type FoodSelectionState = Record<number, Partial<Record<MealKey, number | null>>>;

interface TripBlueprintPreset {
  code: string;
  title: string;
  tagline: string;
  budgetLabel: string;
  meta: string;
  accent: string;
  patch: Partial<ItineraryForm>;
}

const TRIP_BLUEPRINTS: TripBlueprintPreset[] = [
  {
    code: "BP-01",
    title: "Cuối tuần ven biển",
    tagline: "Nhẹ nhàng, biển Mỹ Khê & hải sản tối ven sông Hàn",
    budgetLabel: "3.0 Tr",
    meta: "2 ngày · 2 người · Khách sạn 4★",
    accent: "from-[#2DD4BF]/20 to-transparent border-[#2DD4BF]/28",
    patch: {
      budget: 3000000,
      days: 2,
      guestCount: 2,
      needs: ["accommodation", "food", "attractions"],
      accType: "Khách sạn",
      stars: 4,
      prefs: ["Biển & Nghỉ dưỡng", "Ẩm thực địa phương"],
    },
  },
  {
    code: "BP-02",
    title: "Khám phá trọn vẹn",
    tagline: "Cân bằng danh thắng biểu tượng, di sản & đặc sản bản địa",
    budgetLabel: "5.0 Tr",
    meta: "3 ngày · 2 người · Khách sạn 4★",
    accent: "from-[#E87B39]/22 to-transparent border-[#E87B39]/32",
    patch: {
      budget: 5000000,
      days: 3,
      guestCount: 2,
      needs: ["accommodation", "food", "attractions"],
      accType: "Khách sạn",
      stars: 4,
      prefs: ["Ẩm thực địa phương", "Di sản & Văn hoá", "Check-in sống ảo"],
    },
  },
  {
    code: "BP-03",
    title: "Nghỉ dưỡng nhóm bạn",
    tagline: "Resort cao cấp, lịch trình thư thả & trải nghiệm chọn lọc",
    budgetLabel: "8.0 Tr",
    meta: "3 ngày · 4 người · Resort 5★",
    accent: "from-[#E6D9B7]/20 to-transparent border-[#E6D9B7]/30",
    patch: {
      budget: 8000000,
      days: 3,
      guestCount: 4,
      needs: ["accommodation", "food", "attractions"],
      accType: "Resort",
      stars: 5,
      prefs: ["Biển & Nghỉ dưỡng", "Check-in sống ảo"],
    },
  },
];

function calculateSelectedFoodCost(
  suggestions: GeneratedItinerary["suggestions"],
  selections: FoodSelectionState,
  guestCount: number,
): number {
  return suggestions.reduce(
    (total, day) =>
      total +
      MEAL_OPTIONS.reduce((dayTotal, meal) => {
        const placeId = selections[day.day]?.[meal.key];
        const place = day[meal.key].find(
          (suggestion) => suggestion.catalogPlaceId === placeId,
        );
        return dayTotal + (place?.price ?? 0) * guestCount;
      }, 0),
    0,
  );
}

export default function CreateItineraryPage() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(true);
  const [wizardStep, setWizardStep] = useState(0);

  const [formData, setFormData] = useState<ItineraryForm>({
    budget: 4500000,
    days: 3,
    guestCount: 1,
    startDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10),
    needs: ["accommodation", "food", "attractions"],
    accType: "Khách sạn",
    stars: 4,
    prefs: ["Ẩm thực địa phương"],
  });

  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [foodSelections, setFoodSelections] = useState<FoodSelectionState>({});
  const [activeTab, setActiveTab] = useState("Ngày 1");
  const [budgetNotice, setBudgetNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
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
    const generated = await previewItinerary(formData);
    const initialSelections = generated.days.reduce<FoodSelectionState>(
      (selections, { day }) => {
        selections[day] = {};
        return selections;
      },
      {},
    );
    setItinerary(generated);
    setFoodSelections(initialSelections);
    setIsSaved(false);
    setSaveError("");
    setWizardOpen(false);
    setHasCompletedWizard(true);
    setAiKey((prev) => prev + 1);
    setBudgetNotice("");
    setActiveTab("Ngày 1");
  };

  const handleSelectFood = (
    day: number,
    mealKey: MealKey,
    food: FoodSuggestion | null,
  ) => {
    const nextSelections = {
      ...foodSelections,
      [day]: { ...foodSelections[day], [mealKey]: food?.catalogPlaceId ?? null },
    };
    setFoodSelections(nextSelections);
    setIsSaved(false);

    const selectedCost = calculateSelectedFoodCost(
      itinerary?.suggestions ?? [],
      nextSelections,
      formData.guestCount,
    );
    const defaultFoodCost = (itinerary?.days ?? [])
      .flatMap(({ items }) => items)
      .filter((item) => item.type === "food")
      .reduce((total, item) => total + item.estimatedCost, 0);
    const nextTotal =
      (itinerary?.summary.estimatedTotal ?? 0) - defaultFoodCost + selectedCost;
    setBudgetNotice(
      nextTotal > (itinerary?.summary.budget ?? 0)
        ? `Lựa chọn hiện vượt ngân sách khoảng ${(nextTotal - (itinerary?.summary.budget ?? 0)).toLocaleString("vi-VN")}đ.`
        : food
          ? `Đã chọn ${food.name} cho ${MEAL_OPTIONS.find(({ key }) => key === mealKey)?.label.toLowerCase()}.`
          : "Đã bỏ chọn địa điểm ăn uống cho buổi này.",
    );
  };

  const handleCreateItinerary = async () => {
    if (!itinerary || isSaving || isSaved) return;
    setIsSaving(true);
    setSaveError("");
    try {
      const selections: ItineraryFoodSelection[] = Object.entries(
        foodSelections,
      ).flatMap(([day, daySelections]) =>
        MEAL_OPTIONS.flatMap(({ key, mealPeriod }) => {
          const catalogPlaceId = daySelections[key];
          return typeof catalogPlaceId === "number"
            ? [{ day: Number(day), mealPeriod, catalogPlaceId }]
            : [];
        }),
      );
      const saved = await saveItinerary(formData, selections);
      if (saved.itineraryId === undefined) {
        throw new Error("Không nhận được mã lịch trình đã lưu.");
      }
      setItinerary(saved);
      setIsSaved(true);
      router.push(`/lich-trinh/${saved.itineraryId}`);
    } catch (error) {
      console.error("Không thể lưu lịch trình đã chọn:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Không thể lưu lịch trình lúc này.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const dynamicItinerary: Record<string, TimelineItem[]> = Object.fromEntries(
    (itinerary?.days ?? []).map(({ day, items }) => {
      const daySuggestions = itinerary?.suggestions.find(
        (suggestion) => suggestion.day === day,
      );
      const selectedFoods: TimelineItem[] = formData.needs.includes("food")
        ? MEAL_OPTIONS.map((meal) => {
            const selectedId = foodSelections[day]?.[meal.key];
            const food = daySuggestions?.[meal.key].find(
              (suggestion) => suggestion.catalogPlaceId === selectedId,
            );
            const options = daySuggestions?.[meal.key] ?? [];
            return {
              id: `d${day}-${meal.key}`,
              time: meal.time,
              title: food
                ? `${meal.label}: ${food.name}`
                : `${meal.label}: Chưa chọn địa điểm`,
              description: food
                ? `${food.description} Chi phí tham khảo ${food.price.toLocaleString("vi-VN")}đ/người.`
                : "Chọn một trong các địa điểm gợi ý để thêm vào lịch trình.",
              type: "food" as const,
              ...(food
                ? {
                    location: food.address,
                    imageUrl: food.imageUrl,
                    estimatedCost: food.price * formData.guestCount,
                  }
                : {}),
              foodOptions: options,
              selectedFoodId: food?.catalogPlaceId,
              onFoodSelect: (selection: FoodSuggestion | null) =>
                handleSelectFood(day, meal.key, selection),
              foodSelectionDisabled: isSaving,
            };
          })
        : [];
      return [
        `Ngày ${day}`,
        [
          ...items.filter((item) => item.type !== "food"),
          ...selectedFoods,
        ].sort((left, right) => left.time.localeCompare(right.time)),
      ] as const;
    }),
  );

  const dayTabs = Object.keys(dynamicItinerary);
  const selectedFoodCost = calculateSelectedFoodCost(
    itinerary?.suggestions ?? [],
    foodSelections,
    formData.guestCount,
  );
  const defaultFoodCost = (itinerary?.days ?? [])
    .flatMap(({ items }) => items)
    .filter((item) => item.type === "food")
    .reduce((total, item) => total + item.estimatedCost, 0);
  const currentTotal =
    (itinerary?.summary.estimatedTotal ?? 0) -
    defaultFoodCost +
    selectedFoodCost;
  const costs = itinerary?.summary.costs;

  const donutData = [
    { label: "Lưu trú", value: costs?.accommodation ?? 0, color: "#C084FC" },
    { label: "Ăn uống", value: selectedFoodCost, color: "#E87B39" },
    { label: "Di chuyển", value: costs?.transport ?? 0, color: "#60A5FA" },
    { label: "Tham quan", value: costs?.attractions ?? 0, color: "#2DD4BF" },
    { label: "Dự phòng", value: costs?.contingency ?? 0, color: "#E6D9B7" },
  ];

  const openWizardAt = (index: number) => {
    setWizardStep(index);
    setWizardOpen(true);
  };

  const applyBlueprintAndOpen = (preset: TripBlueprintPreset) => {
    setFormData((current) => ({ ...current, ...preset.patch }));
    setWizardStep(0);
    setWizardOpen(true);
  };

  const selectedMealCount = Object.values(foodSelections).reduce(
    (total, daySelections) =>
      total +
      Object.values(daySelections).filter(
        (placeId) => typeof placeId === "number",
      ).length,
    0,
  );

  const attractionCount = Object.values(dynamicItinerary)
    .flat()
    .filter((item) => item.type === "attraction").length;

  return (
    <div
      data-navbar-overlay="true"
      className="relative flex min-h-screen flex-col overflow-x-clip bg-[#041017] text-[#FFFDF5]"
    >
      {/* Ambient Nocturnal Deep Ocean Cosmos Backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-36 right-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.12)_0%,transparent_68%)]" />
        <div className="absolute bottom-[-18%] left-[-8%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(232,123,57,0.1)_0%,transparent_68%)]" />
        <div className="absolute top-[36%] left-[42%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(230,217,183,0.05)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(230,217,183,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,217,183,0.8) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <Navbar />

      <AiWizardModal
        isOpen={wizardOpen}
        initialStep={wizardStep}
        formData={formData}
        onChange={(data) => setFormData({ ...formData, ...data })}
        onComplete={handleWizardComplete}
        onClose={() => setWizardOpen(false)}
      />

      {/* CLOSED-WIZARD STUDIO LANDING STATE */}
      {!hasCompletedWizard && !wizardOpen && (
        <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pt-28 pb-16 sm:px-6">
          {/* Editorial Hero Card */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[28px] border border-[#E6D9B7]/24 bg-[#071821]/88 p-7 sm:p-11 shadow-[0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-2xl"
          >
            {/* Subtle top radial accent & Leica corners */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_top_center,rgba(232,123,57,0.14),transparent_70%)]" />
            <div className="pointer-events-none absolute top-4 left-4 h-3.5 w-3.5 border-t border-l border-[#E6D9B7]/40 rounded-tl-[4px]" />
            <div className="pointer-events-none absolute top-4 right-4 h-3.5 w-3.5 border-t border-r border-[#E6D9B7]/40 rounded-tr-[4px]" />

            <div className="relative mx-auto max-w-2xl text-center">
              <div className="mb-5 inline-flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/26 bg-[#E6D9B7]/10 px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]">
                  <Sparkles className="h-3 w-3 text-[#E87B39]" />
                  Journey Architect // Đà Nẵng
                </span>
                <span className="rounded-full border border-[#2DD4BF]/24 bg-[#2DD4BF]/8 px-3 py-1 font-mono text-[10.5px] text-[#5EEAD4]">
                  16.0544° N · 108.2022° E
                </span>
              </div>

              <h1 className="cinematic-condensed text-4xl font-bold uppercase tracking-tight text-[#FFFDF5] sm:text-5xl lg:text-[54px] leading-[1.04]">
                Kiến tạo lịch trình{" "}
                <span className="text-[#E6D9B7]">theo ngân sách</span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#B4CED4] sm:text-[15px]">
                Gợi ý điểm tham quan, lưu trú và ẩm thực Đà Nẵng theo đúng ngân
                sách &amp; sở thích của bạn. Bạn toàn quyền chỉnh sửa hoặc tự
                chọn từng bữa ăn.
              </p>

              {/* Primary Action Row */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openWizardAt(0)}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#E87B39] to-[#D46525] px-7 py-3.5 text-sm font-bold text-[#FFFDF5] shadow-[0_14px_34px_rgba(232,123,57,0.36)] transition-all hover:-translate-y-0.5 hover:brightness-110 cursor-pointer"
                >
                  <Compass className="h-4 w-4" />
                  Tạo lịch trình tham khảo
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href="/lich-trinh"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#E6D9B7]/24 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-[#E6D9B7] transition-colors hover:border-[#2DD4BF]/45 hover:bg-[#2DD4BF]/10 hover:text-[#FFFDF5]"
                >
                  <BookmarkCheck className="h-4 w-4 text-[#2DD4BF]" />
                  Xem lịch trình đã lưu
                </Link>
              </div>
            </div>

            {/* 3 Quick-Start Blueprints */}
            <div className="relative mt-10 border-t border-[#E6D9B7]/14 pt-7">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]/80">
                  Khởi tạo nhanh từ mẫu gợi ý
                </span>
                <span className="hidden text-xs text-[#7DA0AC] sm:inline">
                  Chọn 1 mẫu để điền sẵn thông số vào trình thiết kế
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                {TRIP_BLUEPRINTS.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => applyBlueprintAndOpen(preset)}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${preset.accent} bg-[#05141D]/85 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.35)] cursor-pointer`}
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[#9AB6BF]">
                        {preset.code}
                      </span>
                      <span className="rounded-full border border-[#E6D9B7]/25 bg-[#041017]/80 px-2.5 py-0.5 text-xs font-bold text-[#E6D9B7]">
                        {preset.budgetLabel}
                      </span>
                    </div>
                    <h2 className="text-[15px] font-bold text-[#FFFDF5] transition-colors group-hover:text-[#E6D9B7]">
                      {preset.title}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#9AB6BF]">
                      {preset.tagline}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-[11px] font-medium text-[#7DA0AC]">
                      <span>{preset.meta}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#E87B39] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Transparent Reference Notice Footer */}
            <div className="relative mt-6 flex flex-col gap-3 rounded-2xl border border-[#E6D9B7]/14 bg-[#05131B]/75 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5 text-left">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <p className="text-xs leading-relaxed text-[#9AB6BF]">
                  <b className="font-semibold text-[#FFFDF5]">
                    Lịch trình chỉ để tham khảo:
                  </b>{" "}
                  Bạn có thể bỏ qua, chỉnh sửa hoặc tự chọn hoạt động; không có
                  đặt chỗ hay giao dịch nào được thực hiện.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[11px] font-medium text-[#7DA0AC]">
                <span className="inline-flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3 text-[#E6D9B7]" />
                  Tùy biến tự do
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3 w-3 text-[#2DD4BF]" />
                  Lưu nháp nhanh
                </span>
              </div>
            </div>
          </motion.section>
        </main>
      )}

      {/* GENERATED ITINERARY PREVIEW DASHBOARD */}
      {hasCompletedWizard && (
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pt-24 pb-16 sm:px-6">
          {/* Top Journey Parameters Bar */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#E6D9B7]">
                <Compass className="h-3.5 w-3.5 text-[#E87B39]" />
                Hành trình của bạn
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#E6D9B7]/30 to-transparent" />
              <div className="flex items-center gap-2">
                <Link
                  href="/lich-trinh"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/18 bg-white/[0.04] px-3 py-1.5 text-[11.5px] font-semibold text-[#B4CED4] transition-colors hover:border-[#2DD4BF]/40 hover:text-[#FFFDF5]"
                >
                  <BookmarkCheck className="h-3.5 w-3.5 text-[#2DD4BF]" />
                  Lịch đã lưu
                </Link>
                <button
                  type="button"
                  onClick={() => openWizardAt(0)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/24 bg-[#071821]/90 px-3.5 py-1.5 text-[11.5px] font-semibold text-[#E6D9B7] transition-colors hover:border-[#E87B39]/60 hover:bg-[#E87B39]/14 hover:text-[#FFFDF5] cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  Thiết kế lại
                </button>
              </div>
            </div>

            {/* 3 Parameter Cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {[
                {
                  i: 0,
                  label: "Ngân sách",
                  icon: Wallet,
                  value: `${formData.budget.toLocaleString("vi-VN")}đ`,
                  sub: `${formData.days} ngày · ${formData.guestCount} người · ${formData.startDate}`,
                  iconCls:
                    "border-[#E87B39]/40 bg-[#E87B39]/14 text-[#F0B47C]",
                  dotCls: "bg-[#E87B39]",
                  valueCls: "text-[#F0B47C]",
                },
                {
                  i: 1,
                  label: "Nhu cầu",
                  icon: Compass,
                  value: formData.needs
                    .map(
                      (need) =>
                        ({
                          accommodation: "Lưu trú",
                          food: "Ăn uống",
                          attractions: "Tham quan",
                        })[need],
                    )
                    .join(", "),
                  sub: formData.accType
                    ? `${formData.accType} · ${formData.stars} sao`
                    : "Các hạng mục đã chọn",
                  iconCls:
                    "border-[#2DD4BF]/40 bg-[#2DD4BF]/14 text-[#5EEAD4]",
                  dotCls: "bg-[#2DD4BF]",
                  valueCls: "text-[#5EEAD4]",
                },
                {
                  i: 2,
                  label: "Gu trải nghiệm",
                  icon: Sparkles,
                  value: formData.prefs[0] ?? "Linh hoạt",
                  sub:
                    formData.prefs.length > 1
                      ? `+${formData.prefs.length - 1} sở thích ưu tiên`
                      : formData.prefs.length === 0
                        ? "Không giới hạn sở thích"
                        : "Ưu tiên chính",
                  iconCls:
                    "border-[#E6D9B7]/40 bg-[#E6D9B7]/14 text-[#E6D9B7]",
                  dotCls: "bg-[#E6D9B7]",
                  valueCls: "text-[#E6D9B7]",
                },
              ].map(({ i, label, icon: Icon, value, sub, iconCls, dotCls, valueCls }) => (
                <motion.button
                  key={label}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  onClick={() => openWizardAt(i)}
                  className="group relative overflow-hidden rounded-2xl border border-[#E6D9B7]/18 bg-[#071821]/88 p-4 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E6D9B7]/38 hover:shadow-[0_14px_34px_rgba(0,0,0,0.36)] cursor-pointer"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconCls}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#9AB6BF] opacity-80 transition-opacity group-hover:opacity-100 group-hover:text-[#FFFDF5]">
                      <Pencil className="h-2.5 w-2.5" />
                      Sửa
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8FB0BA]">
                    {label}
                  </p>
                  <p className={`mt-1 line-clamp-1 text-base font-bold ${valueCls}`}>
                    {value}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
                    <span className="truncate text-xs text-[#9AB6BF]">{sub}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Executive AI Brief Banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="relative mb-8 overflow-hidden rounded-2xl border border-[#E6D9B7]/24 bg-gradient-to-r from-[#081F2C]/95 via-[#0B2736]/92 to-[#071C28]/95 shadow-[0_18px_46px_rgba(0,0,0,0.38)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,123,57,0.16),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(45,212,191,0.12),transparent_60%)]" />

            <div className="relative z-10 flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
              <div className="mt-0.5 shrink-0">
                <div className="relative h-11 w-11">
                  <motion.div
                    animate={{ scale: [1, 1.24, 1], opacity: [0.3, 0.55, 0.3] }}
                    transition={{ duration: 2.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-[#E87B39]/40"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#E87B39] to-[#C85A1D] shadow-[0_8px_22px_rgba(232,123,57,0.38)]">
                    <Sparkles className="h-5 w-5 text-[#FFFDF5]" />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#E6D9B7]">
                    Lập lịch theo ngân sách
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#E6D9B7]/35" />
                  <span className="text-[11px] text-[#9AB6BF]">
                    Ước tính cho {formData.guestCount} người
                  </span>
                </div>
                <AiTypewriterText
                  key={aiKey}
                  text={`Lịch trình ${formData.days} ngày cho ${formData.guestCount} người, bắt đầu ${formData.startDate}, là gợi ý theo ngân sách tổng ${formData.budget.toLocaleString("vi-VN")}đ${formData.prefs.length ? ` và sở thích ${formData.prefs.join(", ")}` : ""}. Bạn có thể tùy ý thay đổi; chi phí chỉ mang tính tham khảo.`}
                  className="text-sm leading-relaxed text-[#E4F0F2]"
                  highlightClassName="text-[#F0B47C] font-bold"
                />
              </div>

              <div className="mt-0.5 hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#2DD4BF]/28 bg-[#2DD4BF]/10 px-3 py-1.5 text-[11px] font-semibold text-[#5EEAD4] md:flex">
                <motion.span
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]"
                />
                Giá tham khảo
              </div>
            </div>
          </motion.div>

          {/* Main 2+1 Grid */}
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
            {/* Left Timeline Column */}
            <div className="space-y-6 lg:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="cinematic-condensed text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#FFFDF5]">
                    Lịch trình tham khảo
                  </h2>
                  <p className="mt-1 text-sm text-[#9AB6BF]">
                    Địa điểm tham quan được gợi ý sẵn. Chọn quán ăn ngay trong
                    từng khung giờ ăn của lịch trình.
                  </p>
                </div>
              </div>

              {/* Day Tabs */}
              <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-[#E6D9B7]/16 bg-[#071821]/88 p-1.5 backdrop-blur-xl">
                {dayTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                        isActive
                          ? "text-[#FFFDF5]"
                          : "text-[#8FB0BA] hover:text-[#E6D9B7]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E87B39] to-[#D46525] shadow-[0_6px_18px_rgba(232,123,57,0.32)]"
                          transition={{ type: "spring", duration: 0.45 }}
                        />
                      )}
                      <span className="relative z-10">{tab}</span>
                    </button>
                  );
                })}
              </div>

              {/* Timeline Glass Frame */}
              <div className="overflow-hidden rounded-3xl border border-[#E6D9B7]/18 bg-[#071821]/82 p-4 sm:p-6 shadow-[0_18px_46px_rgba(0,0,0,0.32)] backdrop-blur-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ItineraryTimeline
                      theme="dark"
                      items={dynamicItinerary[activeTab] || []}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {budgetNotice && (
                <p
                  role="status"
                  className="rounded-xl border border-[#E87B39]/35 bg-[#E87B39]/12 px-4 py-3 text-sm font-medium text-[#F0B47C]"
                >
                  {budgetNotice}
                </p>
              )}
            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6">
              {/* Map Mini Preview */}
              <div className="rounded-2xl border border-[#E6D9B7]/18 bg-[#071821]/88 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <h3 className="mb-3.5 text-base font-bold text-[#FFFDF5]">
                  Địa điểm {activeTab}
                </h3>
                <MapMiniPreview
                  key={activeTab}
                  theme="dark"
                  locations={(dynamicItinerary[activeTab] ?? []).flatMap(
                    (item) => (item.location ? [item.location] : []),
                  )}
                />
              </div>

              {/* Sticky Budget Breakdown */}
              <div className="sticky top-24 rounded-2xl border border-[#E6D9B7]/22 bg-[#071821]/92 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-[#FFFDF5]">
                    Cơ cấu ngân sách
                  </h3>
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
                      currentTotal > (itinerary?.summary.budget ?? 0)
                        ? "border-[#E87B39]/45 bg-[#E87B39]/15 text-[#F0B47C]"
                        : "border-[#2DD4BF]/40 bg-[#2DD4BF]/14 text-[#5EEAD4]"
                    }`}
                  >
                    {currentTotal.toLocaleString("vi-VN")}đ
                  </div>
                </div>

                <p className="mb-5 text-xs leading-relaxed text-[#9AB6BF]">
                  Ngân sách bạn nhập:{" "}
                  <b className="text-[#FFFDF5]">
                    {formData.budget.toLocaleString("vi-VN")}đ
                  </b>
                  .
                  {currentTotal > formData.budget
                    ? ` Dự toán vượt khoảng ${(currentTotal - formData.budget).toLocaleString("vi-VN")}đ.`
                    : ` Còn khoảng ${(formData.budget - currentTotal).toLocaleString("vi-VN")}đ theo dự toán.`}{" "}
                  Bạn có thể bỏ qua cảnh báo và tự điều chỉnh.
                </p>

                <div className="mb-6">
                  <BudgetDonutChart
                    theme="dark"
                    data={donutData}
                    total={currentTotal}
                  />
                </div>

                {/* 2x2 Metrics Grid */}
                <div className="mb-5 grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#05141C]/85 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#60A5FA]/15 text-[#93C5FD]">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex text-base font-bold text-[#FFFDF5]">
                        <AnimatedCounter to={formData.days} />
                      </div>
                      <div className="text-[11px] text-[#8FB0BA]">Ngày</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#05141C]/85 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2DD4BF]/15 text-[#5EEAD4]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex text-base font-bold text-[#FFFDF5]">
                        <AnimatedCounter to={attractionCount} />
                      </div>
                      <div className="text-[11px] text-[#8FB0BA]">Địa điểm</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#05141C]/85 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E87B39]/15 text-[#F0B47C]">
                      <UtensilsCrossed className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex text-base font-bold text-[#FFFDF5]">
                        <AnimatedCounter to={selectedMealCount} />
                      </div>
                      <div className="text-[11px] text-[#8FB0BA]">Bữa ăn</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#05141C]/85 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C084FC]/15 text-[#D8B4FE]">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex text-sm font-bold text-[#FFFDF5] tabular-nums">
                        <AnimatedCounter to={costs?.transport ?? 0} />
                      </div>
                      <div className="truncate text-[10.5px] text-[#8FB0BA]">
                        Đi lại dự kiến (đ)
                      </div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-1.5 border-t border-[#E6D9B7]/12 pt-4 text-[11.5px] leading-relaxed text-[#8FB0BA]">
                  {itinerary?.notices.map((notice) => (
                    <li key={notice}>• {notice}</li>
                  ))}
                  <li>
                    • Quán ăn đã chọn sẽ được lưu cùng lịch trình khi bạn bấm
                    “Tạo lịch”.
                  </li>
                  <li>
                    • Giá tham khảo nhân theo {formData.guestCount} người; đi
                    lại dự trù khoảng 80.000đ/người/ngày.
                  </li>
                </ul>

                {saveError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/12 px-3.5 py-2.5 text-xs text-rose-200"
                  >
                    {saveError}
                  </p>
                )}

                {isSaved && (
                  <p
                    role="status"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-[#2DD4BF]/35 bg-[#2DD4BF]/12 p-3 text-xs text-[#5EEAD4]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Lịch trình đã được lưu thành công.</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCreateItinerary}
                  disabled={isSaving || isSaved}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E87B39] to-[#D46525] px-4 py-3.5 text-sm font-bold text-[#FFFDF5] shadow-[0_12px_30px_rgba(232,123,57,0.34)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {isSaving
                    ? "Đang lưu lịch..."
                    : isSaved
                      ? "Đã tạo lịch"
                      : "Tạo lịch"}
                  {!isSaving && !isSaved && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {!wizardOpen && <Footer />}
    </div>
  );
}
