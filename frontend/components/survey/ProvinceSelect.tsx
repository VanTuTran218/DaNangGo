"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Search, ChevronDown, Check, X, MapPin } from "lucide-react";
import { VIETNAM_PROVINCES, type ProvinceOption } from "@/constants/survey";

interface ProvinceSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ProvinceSelect({
  value,
  onChange,
  placeholder = "Tìm hoặc chọn Tỉnh / Thành phố bạn sinh sống...",
}: ProvinceSelectProps) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = VIETNAM_PROVINCES.find((p) => p.value === value);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lọc danh sách theo từ khóa tìm kiếm (bỏ dấu hoặc tìm chữ thường)
  const filteredProvinces = VIETNAM_PROVINCES.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q)
    );
  });

  const handleSelect = (option: ProvinceOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Box kích hoạt dropdown */}
      <div
        role="combobox"
        tabIndex={0}
        aria-label="Tỉnh/thành xuất phát"
        aria-controls={listboxId}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          } else if (e.key === "Escape") setIsOpen(false);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all duration-200 bg-white outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 ${
          isOpen
            ? "border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
            : "border-slate-200 hover:border-teal-400"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin
            className={`w-4 h-4 shrink-0 ${
              selectedOption ? "text-teal-600" : "text-slate-400"
            }`}
          />
          {selectedOption ? (
            <div className="truncate">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {selectedOption.label}
              </span>
              <span className="ml-2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {selectedOption.region}
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-slate-400 truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-teal-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="px-3 pb-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên tỉnh/thành hoặc quốc gia..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Danh sách tỉnh thành cuộn */}
          <div
            id={listboxId}
            role="listbox"
            className="max-h-60 overflow-y-auto px-1.5 py-1 text-xs sm:text-sm"
          >
            {filteredProvinces.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Không tìm thấy địa phương phù hợp.
              </div>
            ) : (
              filteredProvinces.map((province) => {
                const isSelected = province.value === value;

                return (
                  <button
                    key={province.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(province)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-teal-50 text-teal-900 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{province.label}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {province.region}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
