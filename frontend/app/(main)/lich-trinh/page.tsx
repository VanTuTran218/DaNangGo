"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Cloud, Search, Briefcase, Plane, MapPin, CreditCard, Award, Plus } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import ItineraryCard, { type Itinerary } from "@/components/itinerary/ItineraryCard";
import { deleteManagedItinerary, getManagedItineraries, type ManagedItineraryListItem } from "@/lib/api/itineraries";
import SurveyInviteCard from "@/components/survey/SurveyInviteCard";
import SurveyQuickSheet from "@/components/survey/SurveyQuickSheet";

const TABS = ["Tất cả", "Sắp diễn ra", "Đã hoàn thành", "Bản nháp"] as const;
type TabType = typeof TABS[number];

function getItineraryStatus(itinerary: ManagedItineraryListItem): Itinerary["status"] {
  if (itinerary.status === "DRAFT") return "Bản nháp";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(`${itinerary.startDate}T00:00:00`);
  endDate.setDate(endDate.getDate() + itinerary.dayCount - 1);
  return endDate < today ? "Đã hoàn thành" : "Sắp diễn ra";
}

function toCard(itinerary: ManagedItineraryListItem): Itinerary {
  const startDate = new Date(`${itinerary.startDate}T00:00:00`);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + itinerary.dayCount - 1);
  const dateText = new Intl.DateTimeFormat("vi-VN").formatRange(startDate, endDate);
  const fallbackImage = "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80";

  return {
    id: String(itinerary.id),
    title: itinerary.title,
    destination: "Đà Nẵng, Việt Nam",
    date: dateText,
    duration: `${itinerary.dayCount} ngày${itinerary.dayCount > 1 ? ` ${itinerary.dayCount - 1} đêm` : ""}`,
    participants: itinerary.guestCount,
    status: getItineraryStatus(itinerary),
    images: [itinerary.imageUrl || fallbackImage, fallbackImage, fallbackImage],
    budget: itinerary.estimatedTotal,
    itemCount: itinerary.itemCount,
  };
}

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [rawItineraries, setRawItineraries] = useState<ManagedItineraryListItem[]>([]);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getManagedItineraries()
      .then((saved) => {
        if (active) {
          setRawItineraries(saved);
          setItineraries(saved.map(toCard));
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Không thể tải lịch trình.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredItineraries = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("vi");
    return itineraries.filter((item) => {
      const matchTab = activeTab === "Tất cả" || item.status === activeTab;
      const matchSearch = item.title.toLocaleLowerCase("vi").includes(query)
        || item.destination.toLocaleLowerCase("vi").includes(query);
      return matchTab && matchSearch;
    });
  }, [itineraries, activeTab, searchQuery]);

  const completedItinerary = useMemo(() => {
    return rawItineraries.find((item) => {
      if (item.status === "DRAFT") return false;
      const endDate = new Date(`${item.startDate}T00:00:00`);
      endDate.setDate(endDate.getDate() + item.dayCount - 1);
      return endDate.getTime() <= Date.now() - 24 * 60 * 60 * 1000;
    });
  }, [rawItineraries]);

  const handleDelete = async (id: string) => {
    try {
      await deleteManagedItinerary(id);
      setItineraries((previous) => previous.filter((item) => item.id !== id));
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa lịch trình.");
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 },
    }),
  };
  const stats = [
    { label: "Sắp khởi hành", value: itineraries.filter((item) => item.status === "Sắp diễn ra").length, icon: Plane, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Hoạt động đã lên", value: itineraries.reduce((total, item) => total + (item.itemCount ?? 0), 0), icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Dự toán (triệu)", value: itineraries.reduce((total, item) => total + (item.budget ?? 0), 0) / 1_000_000, icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50", decimals: 1 },
    { label: "Đã hoàn thành", value: itineraries.filter((item) => item.status === "Đã hoàn thành").length, icon: Award, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-10">
          <motion.div custom={0} initial="hidden" animate="visible" variants={headerVariants} className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-gray-900 font-medium">Lịch trình của tôi</span>
          </motion.div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <motion.div custom={1} initial="hidden" animate="visible" variants={headerVariants}>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 h2-section">Lịch trình của tôi</h1>
                <div className="flex items-center justify-center px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full stat-number">
                  <AnimatedCounter to={itineraries.length} /> <span className="ml-1 text-sm font-sans">kế hoạch</span>
                </div>
              </div>
              <p className="text-gray-500 max-w-xl">Xem, chỉnh sửa và quản lý lịch trình đã tạo.</p>
            </motion.div>

            <motion.div custom={2} initial="hidden" animate="visible" variants={headerVariants} className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <Cloud className="h-4 w-4 text-emerald-500" /> Đã lưu trên tài khoản
              </div>
              <Link href="/lich-trinh/tao-moi" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-sm">
                <Plus size={16} /> Tạo lịch trình mới
              </Link>
            </motion.div>
          </div>
        </div>

        {completedItinerary && (
          <div className="mb-8">
            <SurveyInviteCard
              itineraryId={completedItinerary.id}
              itineraryTitle={completedItinerary.title}
              onOpenQuickSheet={() => setQuickSheetOpen(true)}
            />
          </div>
        )}

        <motion.div custom={3} initial="hidden" animate="visible" variants={headerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 stat-number">
                  <AnimatedCounter to={stat.value} decimals={stat.decimals || 0} />
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={headerVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-colors ${activeTab === tab ? "text-emerald-700 bg-emerald-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500" />
            <input type="search" placeholder="Tìm kiếm lịch trình..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm" />
          </div>
        </motion.div>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {isLoading ? (
          <div className="py-20 text-center text-gray-500">Đang tải lịch trình...</div>
        ) : filteredItineraries.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItineraries.map((itinerary, index) => (
                <ItineraryCard key={itinerary.id} itinerary={itinerary} onDelete={handleDelete} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-emerald-50"><Briefcase className="h-10 w-10 text-emerald-500" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 h3-card">{itineraries.length === 0 ? "Chưa có lịch trình nào" : "Không tìm thấy lịch trình"}</h3>
            <p className="text-gray-500 mb-8 max-w-sm body-text">
              {itineraries.length === 0 ? "Tạo lịch trình đầu tiên; lịch được lưu sẽ xuất hiện tại đây." : "Thử thay đổi từ khóa hoặc bộ lọc."}
            </p>
            {itineraries.length === 0 && <Link href="/lich-trinh/tao-moi" className="bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-emerald-700"><Plus className="h-5 w-5" /> Tạo lịch trình đầu tiên</Link>}
          </motion.div>
        )}
      </main>

      {completedItinerary && (
        <SurveyQuickSheet
          isOpen={quickSheetOpen}
          onClose={() => setQuickSheetOpen(false)}
          itineraryId={completedItinerary.id}
        />
      )}

      <Footer />
    </div>
  );
}
