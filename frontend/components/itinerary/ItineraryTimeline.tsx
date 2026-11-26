"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { MapPin, Clock, Utensils, Camera, Sparkles, Check } from "lucide-react";
import Image from "next/image";
import type { FoodSuggestion } from "@/types/itinerary";

export interface TimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "attraction" | "food" | "hotel" | "transport" | "entertainment";
  imageUrl?: string;
  location?: string;
  estimatedCost?: number;
  foodOptions?: FoodSuggestion[];
  selectedFoodId?: number;
  onFoodSelect?: (food: FoodSuggestion | null) => void;
  foodSelectionDisabled?: boolean;
}

interface ItineraryTimelineProps {
  items: TimelineItem[];
  theme?: "light" | "dark";
}

const lightTypeConfig = {
  attraction: { icon: Camera, color: "text-blue-500", bg: "bg-blue-100", border: "border-white" },
  food: { icon: Utensils, color: "text-orange-500", bg: "bg-orange-100", border: "border-white" },
  hotel: { icon: MapPin, color: "text-purple-500", bg: "bg-purple-100", border: "border-white" },
  transport: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100", border: "border-white" },
  entertainment: { icon: Sparkles, color: "text-teal-500", bg: "bg-teal-100", border: "border-white" },
};

const darkTypeConfig = {
  attraction: {
    icon: Camera,
    color: "text-[#5EEAD4]",
    bg: "bg-[#09242E]",
    border: "border-[#2DD4BF]/50",
  },
  food: {
    icon: Utensils,
    color: "text-[#F0B47C]",
    bg: "bg-[#261810]",
    border: "border-[#E87B39]/55",
  },
  hotel: {
    icon: MapPin,
    color: "text-[#D8B4FE]",
    bg: "bg-[#1C142B]",
    border: "border-[#C084FC]/50",
  },
  transport: {
    icon: Clock,
    color: "text-[#93C5FD]",
    bg: "bg-[#0D1E30]",
    border: "border-[#60A5FA]/45",
  },
  entertainment: {
    icon: Sparkles,
    color: "text-[#E6D9B7]",
    bg: "bg-[#241E12]",
    border: "border-[#E6D9B7]/50",
  },
};

const TimelineNode = ({
  item,
  index,
  theme,
}: {
  item: TimelineItem;
  index: number;
  theme: "light" | "dark";
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  const { scrollYProgress } = useScroll({
    target: nodeRef,
    offset: ["start end", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [-16, 16]);
  const isDark = theme === "dark";
  const Config = (isDark ? darkTypeConfig : lightTypeConfig)[item.type];
  const Icon = Config.icon;

  return (
    <div ref={nodeRef} className="relative flex gap-4 sm:gap-5 mb-8 last:mb-0">
      {/* Node Dot */}
      <motion.div
        className="relative z-10 flex flex-col items-center shrink-0"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 22,
          delay: Math.min(index * 0.08, 0.4),
        }}
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm ${Config.bg} ${Config.border}`}
        >
          <Icon className={`h-4.5 w-4.5 ${Config.color}`} />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="min-w-0 flex-1 pb-2"
        initial={{ opacity: 0, x: 16 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.08 + 0.05, 0.45) }}
      >
        <div
          className={
            isDark
              ? "overflow-hidden rounded-2xl border border-[#E6D9B7]/16 bg-[#081C26]/92 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
              : "overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          }
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <span
                className={
                  isDark
                    ? "mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#E6D9B7]/22 bg-[#E6D9B7]/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#E6D9B7]"
                    : "mb-2 inline-block rounded-md bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-500"
                }
              >
                <Clock className="h-3 w-3 opacity-80" />
                {item.time}
              </span>
              <h3
                className={
                  isDark
                    ? "text-base sm:text-[17px] font-bold text-[#FFFDF5] leading-snug"
                    : "text-lg font-bold text-gray-900"
                }
              >
                {item.title}
              </h3>
            </div>

            {item.estimatedCost !== undefined && (
              <span
                className={
                  isDark
                    ? "rounded-full border border-[#2DD4BF]/28 bg-[#2DD4BF]/12 px-3 py-1 text-xs font-bold text-[#5EEAD4] whitespace-nowrap"
                    : "text-sm font-semibold text-teal-700"
                }
              >
                {isDark
                  ? `${item.estimatedCost.toLocaleString("vi-VN")}đ`
                  : `Ước tính cho đoàn: ${item.estimatedCost.toLocaleString("vi-VN")}đ`}
              </span>
            )}
          </div>

          <p
            className={
              isDark
                ? "mb-3.5 text-[13.5px] leading-relaxed text-[#B4CED4]"
                : "mb-4 text-sm leading-relaxed text-gray-600"
            }
          >
            {item.description}
          </p>

          {item.location && (
            <div
              className={
                isDark
                  ? "mb-3.5 flex items-center gap-1.5 text-xs text-[#8FB0BA]"
                  : "mb-4 flex items-center text-sm text-gray-500"
              }
            >
              <MapPin
                className={`h-3.5 w-3.5 shrink-0 ${
                  isDark ? "text-[#E87B39]" : "text-gray-400"
                }`}
              />
              <span>{item.location}</span>
            </div>
          )}

          {item.imageUrl && (
            <div
              className={`relative mt-3.5 h-44 sm:h-48 overflow-hidden rounded-xl ${
                isDark ? "border border-[#E6D9B7]/14" : ""
              }`}
            >
              <motion.div
                style={{ y: parallaxY }}
                className="absolute inset-0 scale-110"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
              {isDark && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05141C]/55 via-transparent to-transparent" />
              )}
            </div>
          )}

          {item.type === "food" && item.foodOptions && item.onFoodSelect && (
            <div
              className={`mt-4 pt-4 ${
                isDark
                  ? "border-t border-[#E6D9B7]/14"
                  : "border-t border-gray-100"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p
                  className={
                    isDark
                      ? "text-xs font-semibold uppercase tracking-[0.14em] text-[#E6D9B7]"
                      : "text-sm font-semibold text-gray-700"
                  }
                >
                  Chọn quán cho buổi này
                </p>
                {item.selectedFoodId !== undefined && (
                  <button
                    type="button"
                    disabled={item.foodSelectionDisabled}
                    onClick={() => item.onFoodSelect?.(null)}
                    className={
                      isDark
                        ? "text-xs font-semibold text-[#9EBAC2] transition-colors hover:text-[#F0B47C] disabled:cursor-not-allowed cursor-pointer"
                        : "text-xs font-semibold text-gray-500 hover:text-orange-600 disabled:cursor-not-allowed"
                    }
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>

              {item.foodOptions.length === 0 ? (
                <p
                  className={
                    isDark
                      ? "rounded-xl border border-white/[0.06] bg-[#05131B]/80 p-3.5 text-xs text-[#8FB0BA]"
                      : "rounded-xl bg-gray-50 p-4 text-sm text-gray-500"
                  }
                >
                  Chưa có địa điểm phù hợp cho buổi này trong danh mục.
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {item.foodOptions.map((food) => {
                    const isSelected = food.catalogPlaceId === item.selectedFoodId;
                    return (
                      <button
                        key={food.catalogPlaceId}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={item.foodSelectionDisabled}
                        onClick={() => item.onFoodSelect?.(food)}
                        className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                          isDark
                            ? isSelected
                              ? "border-[#E87B39]/80 bg-[#E87B39]/14 ring-1 ring-[#E87B39]/35"
                              : "border-[#E6D9B7]/14 bg-[#05141C]/80 hover:border-[#E6D9B7]/35 hover:bg-[#0A222F]/85"
                            : isSelected
                              ? "border-orange-500 bg-orange-50 ring-1 ring-orange-300"
                              : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <img
                          src={food.imageUrl}
                          alt=""
                          className={`h-13 w-13 shrink-0 rounded-lg object-cover ${
                            isDark ? "border border-[#E6D9B7]/15" : ""
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[13px] font-semibold ${
                              isDark ? "text-[#FFFDF5]" : "text-gray-900"
                            }`}
                          >
                            {food.name}
                          </span>
                          <span
                            className={`mt-0.5 block text-xs ${
                              isDark ? "text-[#E6D9B7]/85" : "text-gray-500"
                            }`}
                          >
                            {food.price.toLocaleString("vi-VN")}đ/người
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? "border-[#E87B39] bg-[#E87B39] text-white"
                              : isDark
                                ? "border-[#E6D9B7]/25 bg-white/[0.04]"
                                : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function ItineraryTimeline({
  items,
  theme = "light",
}: ItineraryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });
  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className="relative py-2 sm:py-4">
      {/* Vertical Rail */}
      <div
        className={`absolute left-[19px] top-6 bottom-6 w-0.5 overflow-hidden ${
          isDark ? "bg-[#E6D9B7]/12" : "bg-gray-100"
        }`}
      >
        <motion.div
          className={`absolute top-0 left-0 w-full origin-top ${
            isDark
              ? "bg-gradient-to-b from-[#E87B39] via-[#E6D9B7]/70 to-[#2DD4BF]"
              : "bg-orange-500"
          }`}
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ height: "100%" }}
        />
      </div>

      <div className="relative">
        {items.map((item, index) => (
          <TimelineNode key={item.id} item={item} index={index} theme={theme} />
        ))}
      </div>
    </div>
  );
}
