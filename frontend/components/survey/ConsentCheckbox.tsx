"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export default function ConsentCheckbox({
  checked,
  onChange,
  error,
}: ConsentCheckboxProps) {
  return (
    <div className="space-y-2">
      <label
        className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none outline-hidden focus-visible:ring-2 focus-visible:ring-teal-500 ${
          checked
            ? "bg-teal-50/50 border-teal-400 ring-1 ring-teal-500/20"
            : error
              ? "bg-rose-50/30 border-rose-300"
              : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/40"
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label="Tôi đồng ý cho DaNangGo dùng dữ liệu ẩn danh để thống kê"
        />
        {/* Custom checkbox box */}
        <div
          className={`w-5 h-5 rounded-lg shrink-0 flex items-center justify-center transition-all duration-200 mt-0.5 ${
            checked
              ? "bg-teal-600 text-white shadow-xs"
              : "border-2 border-slate-300 bg-white"
          }`}
        >
          {checked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>
          )}
        </div>

        {/* Content & Description */}
        <div className="text-xs sm:text-sm text-slate-700 leading-snug">
          <span className="font-bold text-slate-900">
            Tôi đồng ý cho DaNangGo dùng dữ liệu ẩn danh để thống kê
          </span>
          <span className="text-rose-500 font-extrabold ml-1">*</span>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Mọi phản hồi đều được tổng hợp ẩn danh, bảo vệ quyền riêng tư và chỉ
            dùng phục vụ công tác nâng cao chất lượng dịch vụ du lịch Đà Nẵng.
            Xem{" "}
            <Link
              href="/chinh-sach"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="text-teal-600 font-bold underline hover:text-teal-700"
            >
              Chính sách bảo mật
            </Link>
            .
          </p>
        </div>

        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 ml-auto hidden sm:block opacity-60" />
      </label>

      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-600 px-1">
          {error}
        </p>
      )}
    </div>
  );
}
