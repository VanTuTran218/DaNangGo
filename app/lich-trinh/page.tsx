"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Cloud, 
  Search, 
  Briefcase, 
  Plane, 
  MapPin, 
  CreditCard, 
  Award,
  Plus
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimatedCounter from "@/components/AnimatedCounter";
import ItineraryCard, { Itinerary } from "@/components/itinerary/ItineraryCard";

const MOCK_ITINERARIES: Itinerary[] = [
  {
    id: "1",
    title: "Chuyến đi Đà Nẵng mùa hè",
    destination: "Đà Nẵng, Việt Nam",
    date: "15/07/2024 - 20/07/2024",
    duration: "5 ngày 4 đêm",
    participants: 4,
    status: "Sắp diễn ra",
    images: [
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80",
      "https://images.unsplash.com/photo-1579737923485-98319f3bc281?w=400&q=80",
    ],
  },
  {
    id: "2",
    title: "Nghỉ dưỡng Hội An",
    destination: "Hội An, Quảng Nam",
    date: "12/05/2023 - 14/05/2023",
    duration: "3 ngày 2 đêm",
    participants: 2,
    status: "Đã hoàn thành",
    images: [
      "https://images.unsplash.com/photo-1549429712-4d8db194aeb5?w=800&q=80",
      "https://images.unsplash.com/photo-1563261274-12ee499d6fb3?w=400&q=80",
      "https://images.unsplash.com/photo-1590483868019-3c35f29c0724?w=400&q=80",
    ],
  },
  {
    id: "3",
    title: "Chinh phục Sơn Trà",
    destination: "Bán đảo Sơn Trà",
    date: "Chưa xác định",
    duration: "1 ngày",
    participants: 6,
    status: "Bản nháp",
    images: [
      "https://images.unsplash.com/photo-1581457813200-d8339c636f45?w=800&q=80",
      "https://images.unsplash.com/photo-1616781498114-1e0bc600216f?w=400&q=80",
      "https://images.unsplash.com/photo-1611056586022-777265be7d4e?w=400&q=80",
    ],
  },
];

const TABS = ["Tất cả", "Sắp diễn ra", "Đã hoàn thành", "Bản nháp"] as const;
type TabType = typeof TABS[number];

export default function ItineraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [itineraries, setItineraries] = useState<Itinerary[]>(MOCK_ITINERARIES);

  const filteredItineraries = useMemo(() => {
    return itineraries.filter((item) => {
      const matchTab = activeTab === "Tất cả" || item.status === activeTab;
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.destination.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [itineraries, activeTab, searchQuery]);

  const handleDelete = (id: string) => {
    setItineraries((prev) => prev.filter((item) => item.id !== id));
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header Section */}
        <div className="mb-10">
          <motion.div 
            custom={0} initial="hidden" animate="visible" variants={headerVariants}
            className="flex items-center text-sm text-gray-500 mb-4"
          >
            <Link href="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-gray-900 font-medium">Lịch trình của tôi</span>
          </motion.div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <motion.div custom={1} initial="hidden" animate="visible" variants={headerVariants}>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Lịch trình của tôi</h1>
                <div className="flex items-center justify-center px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                  <AnimatedCounter to={itineraries.length} /> <span className="ml-1">kế hoạch</span>
                </div>
              </div>
              <p className="text-gray-500 max-w-xl">Quản lý các chuyến đi của bạn, từ việc lên ý tưởng đến lúc thực hiện.</p>
            </motion.div>

            <motion.div custom={2} initial="hidden" animate="visible" variants={headerVariants} className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <Cloud className="h-4 w-4 text-emerald-500" />
                Đồng bộ đám mây
              </div>
              <Link href="/lich-trinh/tao-moi" className="hidden sm:flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-sm shadow-orange-500/30">
                <Plus size={16} />
                Tạo lịch trình mới
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={headerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Sắp khởi hành", value: 1, icon: Plane, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Điểm check-in", value: 12, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Kinh phí (Tr)", value: 8.5, icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50", decimals: 1 },
            { label: "Đã trải nghiệm", value: 1, icon: Award, color: "text-purple-500", bg: "bg-purple-50" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter to={stat.value} decimals={stat.decimals || 0} />
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters & Search */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={headerVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-colors ${
                  activeTab === tab ? "text-emerald-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-emerald-50 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm lịch trình..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm"
            />
          </div>
        </motion.div>

        {/* Content */}
        {filteredItineraries.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItineraries.map((itinerary, index) => (
                <ItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  onDelete={handleDelete}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 border-dashed"
          >
            <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-emerald-50">
              <motion.div
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Briefcase className="h-10 w-10 text-emerald-500" />
              </motion.div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy lịch trình</h3>
            <p className="text-gray-500 mb-8 max-w-sm">
              Bạn chưa có lịch trình nào trong mục này. Hãy bắt đầu lên kế hoạch cho chuyến đi tiếp theo của bạn!
            </p>
            
            <Link href="/lich-trinh/tao-moi" className="relative overflow-hidden bg-emerald-600 text-white font-medium px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm inline-flex">
              <Plus className="h-5 w-5" />
              Tạo lịch trình đầu tiên
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            </Link>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
