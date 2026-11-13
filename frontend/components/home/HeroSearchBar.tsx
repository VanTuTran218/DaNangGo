"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wallet, Search, ChevronDown } from "lucide-react";
import BudgetRecommendation from "@/components/home/BudgetRecommendation";

export default function HeroSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [appliedBudget, setAppliedBudget] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle standard search form submit
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (appliedBudget && appliedBudget > 0) {
      params.set("maxPrice", appliedBudget.toString());
    }

    const queryString = params.toString();
    router.push(`/tim-kiem${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="relative w-full max-w-2xl lg:max-w-3xl mx-auto" ref={containerRef}>
      {/* ── Khối tìm kiếm ngang Glassmorphism chuẩn ── */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-[#0d2238]/65 backdrop-blur-xl border border-white/20 hover:border-white/30 rounded-2xl sm:rounded-[26px] p-2 sm:p-2.5 shadow-2xl shadow-black/35 transition-all duration-300"
      >
        {/* ── Khu vực 1: Địa điểm (Bên trái) ── */}
        <div className="flex-1 flex items-center gap-3 px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl hover:bg-white/5 transition-colors cursor-text group">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center shrink-0 text-cyan-300 group-hover:scale-105 transition-transform duration-200">
            <MapPin className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-white/60 tracking-wider uppercase leading-none mb-1">
              Địa điểm
            </span>
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bạn muốn đi đâu?"
              className="w-full bg-transparent text-white font-medium text-sm sm:text-[15px] placeholder-white/80 focus:placeholder-white/50 outline-none leading-tight"
            />
          </div>
        </div>

        {/* ── Đường phân cách dọc mảnh ── */}
        <div className="hidden sm:block w-[1px] h-9 bg-white/20 self-center mx-1 shrink-0" />
        <div className="sm:hidden h-[1px] w-full bg-white/10 my-1" />

        {/* ── Khu vực 2: Ngân sách (Ở giữa - Click mở popup Gợi ý theo ngân sách ở giữa màn hình) ── */}
        <div
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          className="flex-1 flex items-center gap-3 px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group select-none relative outline-none focus:bg-white/10"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center shrink-0 text-amber-300 group-hover:scale-105 transition-transform duration-200">
            <Wallet className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-white/60 tracking-wider uppercase leading-none mb-1">
              Ngân sách
            </span>
            <div className="flex items-center justify-between text-white font-medium text-sm sm:text-[15px] leading-tight">
              <span className="truncate pr-1">
                {appliedBudget
                  ? `${new Intl.NumberFormat("vi-VN").format(appliedBudget)} đ`
                  : "Mọi mức giá"}
              </span>
              <ChevronDown className="w-4 h-4 text-white/65 shrink-0 transition-transform duration-200 group-hover:text-white" />
            </div>
          </div>
        </div>

        {/* ── Khu vực 3: Nút tìm kiếm màu cam #FF7300 (Bên phải) ── */}
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="w-full sm:w-13 sm:h-13 md:w-14 md:h-14 h-12 rounded-xl sm:rounded-2xl bg-[#FF7300] hover:bg-[#ff851a] active:scale-[0.97] hover:scale-[1.03] flex items-center justify-center text-white shadow-lg shadow-[#FF7300]/30 transition-all duration-200 shrink-0 mt-2 sm:mt-0 sm:ml-1"
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>
      </form>

      {/* ── Popup Khám phá theo ngân sách (Màu xanh ngọc, ở giữa viewport) ── */}
      <BudgetRecommendation
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        hideTrigger={true}
        onApplyBudget={(val) => setAppliedBudget(val)}
      />
    </div>
  );
}
