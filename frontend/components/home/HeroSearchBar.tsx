"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wallet, Search, ChevronDown, X } from "lucide-react";
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
    <div className="relative w-full max-w-[660px]" ref={containerRef}>
      {/* ── Cinematic Frosted Smoked-Glass Search Capsule ── */}
      <form
        onSubmit={handleSearchSubmit}
        className="luxury-border-sweep relative flex flex-col sm:flex-row items-stretch sm:items-center sm:min-h-[66px] bg-[#071821]/78 hover:bg-[#071821]/86 focus-within:bg-[#071821]/92 backdrop-blur-2xl border border-[#E6D9B7]/28 hover:border-[#E6D9B7]/52 focus-within:border-[#E6D9B7]/78 rounded-2xl px-2.5 py-2 sm:px-3 sm:py-1.5 shadow-[0_24px_60px_rgba(2,10,15,0.52),inset_0_1px_0_rgba(255,253,245,0.1)] transition-all duration-300"
      >
        {/* ── Khu vực 1: Địa điểm ── */}
        <label className="flex-1 flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-[#E6D9B7]/[0.06] focus-within:bg-[#E6D9B7]/[0.08] transition-colors cursor-text group">
          <span className="w-8 h-8 rounded-lg bg-[#0C2532]/85 border border-[#E6D9B7]/16 flex items-center justify-center shrink-0 text-[#CBD9DA] group-focus-within:text-[#E87B39] group-focus-within:border-[#E87B39]/40 transition-colors">
            <MapPin className="w-[15px] h-[15px] stroke-[1.8]" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-[#E6D9B7]/75 tracking-[0.16em] uppercase leading-none mb-1">
              Địa điểm
            </span>
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bạn muốn đi đâu?"
              className="w-full bg-transparent text-[#FFFDF5] font-medium text-[14px] sm:text-[15px] placeholder-[#CBD9DA]/50 focus:placeholder-[#CBD9DA]/35 outline-none leading-tight"
            />
          </div>
        </label>

        {/* ── Đường phân cách dọc mảnh Champagne ── */}
        <div className="hidden sm:block w-[1px] h-9 bg-[#E6D9B7]/18 self-center mx-1.5 shrink-0" />
        <div className="sm:hidden h-[1px] w-full bg-[#E6D9B7]/15 my-1.5" />

        {/* ── Khu vực 2: Ngân sách (Mở popup Khám phá theo ngân sách) ── */}
        <div
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          aria-expanded={isModalOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          className="flex-1 flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-[#E6D9B7]/[0.07] focus-visible:ring-2 focus-visible:ring-[#E6D9B7]/60 transition-colors cursor-pointer group select-none relative outline-none"
        >
          <span
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
              appliedBudget
                ? "bg-[#E87B39]/18 border-[#E87B39]/45 text-[#E87B39]"
                : "bg-[#0C2532]/85 border-[#E6D9B7]/16 text-[#CBD9DA] group-hover:text-[#E6D9B7] group-hover:border-[#E6D9B7]/38"
            }`}
          >
            <Wallet className="w-[15px] h-[15px] stroke-[1.8]" />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-[#E6D9B7]/75 tracking-[0.16em] uppercase leading-none mb-1">
              Ngân sách
            </span>
            <div className="flex items-center justify-between gap-1.5 text-[#FFFDF5] font-medium text-[14px] sm:text-[15px] leading-tight">
              <span className={`truncate ${appliedBudget ? "text-[#E6D9B7] font-semibold" : ""}`}>
                {appliedBudget
                  ? `${new Intl.NumberFormat("vi-VN").format(appliedBudget)} đ`
                  : "Mọi mức giá"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {appliedBudget && (
                  <button
                    type="button"
                    aria-label="Xóa mức ngân sách"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAppliedBudget(null);
                    }}
                    className="w-5 h-5 rounded-full bg-[#0C2532] border border-[#E6D9B7]/25 flex items-center justify-center text-[#CBD9DA] hover:text-[#FFFDF5] hover:border-[#E6D9B7]/60 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#E6D9B7]/70 transition-transform duration-200 group-hover:text-[#FFFDF5] ${
                    isModalOpen ? "rotate-180 text-[#E6D9B7]" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Khu vực 3: Nút tìm kiếm Expedition Sunset ── */}
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="luxury-btn-sweep w-full sm:w-[48px] sm:h-[48px] h-11 rounded-xl bg-gradient-to-br from-[#E87B39] to-[#D16322] hover:brightness-108 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E87B39] flex items-center justify-center text-[#FFFDF5] border border-[#FFFDF5]/20 shadow-[0_10px_24px_rgba(232,123,57,0.4),inset_0_1px_0_rgba(255,253,245,0.28)] transition-all duration-200 shrink-0 mt-2 sm:mt-0 sm:ml-2 cursor-pointer"
        >
          <Search className="w-[18px] h-[18px] stroke-[2.2] relative z-10" />
        </button>
      </form>

      {/* ── Popup Khám phá theo ngân sách ── */}
      <BudgetRecommendation
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        hideTrigger={true}
        initialBudget={appliedBudget ?? undefined}
        onApplyBudget={(val) => setAppliedBudget(val)}
      />
    </div>
  );
}
