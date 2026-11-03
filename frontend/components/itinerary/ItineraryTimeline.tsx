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
}

const typeConfig = {
  attraction: { icon: Camera, color: "text-blue-500", bg: "bg-blue-100" },
  food: { icon: Utensils, color: "text-orange-500", bg: "bg-orange-100" },
  hotel: { icon: MapPin, color: "text-purple-500", bg: "bg-purple-100" },
  transport: { icon: Clock, color: "text-gray-500", bg: "bg-gray-100" },
  entertainment: { icon: Sparkles, color: "text-teal-500", bg: "bg-teal-100" },
};

const TimelineNode = ({ item, index }: { item: TimelineItem; index: number }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  const { scrollYProgress } = useScroll({
    target: nodeRef,
    offset: ["start end", "end start"]
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  const Config = typeConfig[item.type];
  const Icon = Config.icon;

  return (
    <div ref={nodeRef} className="relative flex gap-6 mb-12 last:mb-0">
      {/* Dot */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.15 }}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${Config.bg} shadow-sm border-2 border-white`}>
          <Icon className={`w-5 h-5 ${Config.color}`} />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex-1 pb-4"
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ duration: 0.5, delay: index * 0.15 + 0.1 }}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md inline-block mb-2">
                {item.time}
              </span>
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">{item.description}</p>

          {item.estimatedCost !== undefined && (
            <p className="text-sm font-semibold text-teal-700 mb-3">
              Ước tính cho đoàn: {item.estimatedCost.toLocaleString("vi-VN")}đ
            </p>
          )}
          
          {item.location && (
            <div className="flex items-center text-gray-500 text-sm mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{item.location}</span>
            </div>
          )}

          {item.imageUrl && (
            <div className="relative h-48 rounded-lg overflow-hidden mt-4">
              <motion.div style={{ y: parallaxY }} className="absolute inset-0 scale-110">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          )}

          {item.type === "food" && item.foodOptions && item.onFoodSelect && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-700">Chọn quán cho buổi này</p>
                {item.selectedFoodId !== undefined && (
                  <button
                    type="button"
                    disabled={item.foodSelectionDisabled}
                    onClick={() => item.onFoodSelect?.(null)}
                    className="text-xs font-semibold text-gray-500 hover:text-orange-600 disabled:cursor-not-allowed"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
              {item.foodOptions.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  Chưa có địa điểm phù hợp cho buổi này trong danh mục.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.foodOptions.map((food) => {
                    const isSelected = food.catalogPlaceId === item.selectedFoodId;
                    return (
                      <button
                        key={food.catalogPlaceId}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={item.foodSelectionDisabled}
                        onClick={() => item.onFoodSelect?.(food)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 ring-1 ring-orange-300"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <img
                          src={food.imageUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-gray-900">{food.name}</span>
                          <span className="mt-1 block text-xs text-gray-500">{food.price.toLocaleString("vi-VN")}đ/người</span>
                        </span>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300"
                        }`}>
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

export default function ItineraryTimeline({ items }: ItineraryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  return (
    <div ref={containerRef} className="relative py-8">
      {/* Vertical Line */}
      <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-100 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full bg-orange-500 origin-top"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{ height: "100%" }}
        />
      </div>

      <div className="relative">
        {items.map((item, index) => (
          <TimelineNode key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
