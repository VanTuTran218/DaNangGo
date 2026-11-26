"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

interface DataItem {
  label: string;
  value: number;
  color: string;
}

interface BudgetDonutChartProps {
  data: DataItem[];
  total: number;
  theme?: "light" | "dark";
}

export default function BudgetDonutChart({
  data,
  total,
  theme = "light",
}: BudgetDonutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isDark = theme === "dark";
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 1;

  let currentOffset = 0;
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? item.value / safeTotal : 0;
    const strokeDasharray = `${circumference * percentage} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += circumference * percentage;

    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeSegment =
    hoveredIndex !== null ? segments[hoveredIndex] ?? null : null;

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
          {/* Base track ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={isDark ? "rgba(230,217,183,0.12)" : "rgba(148,163,184,0.18)"}
            strokeWidth={16}
          />
          {segments.map((segment) => {
            if (segment.percentage <= 0) return null;
            const isHovered = hoveredIndex === segment.index;
            const isDimmed = hoveredIndex !== null && !isHovered;
            return (
              <motion.circle
                key={segment.label}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={isHovered ? 20 : 16}
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={
                  isInView
                    ? { strokeDasharray: segment.strokeDasharray }
                    : { strokeDasharray: `0 ${circumference}` }
                }
                transition={{
                  duration: 1.1,
                  ease: "easeInOut",
                  delay: segment.index * 0.12,
                }}
                onMouseEnter={() => setHoveredIndex(segment.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="origin-center cursor-pointer transition-all duration-300 ease-in-out"
                style={{
                  transformOrigin: "80px 80px",
                  transform: isHovered ? "scale(1.04)" : "scale(1)",
                  opacity: isDimmed ? 0.45 : 1,
                }}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          {activeSegment ? (
            <>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  isDark ? "text-[#E6D9B7]" : "text-gray-500"
                }`}
              >
                {activeSegment.label}
              </span>
              <span
                className={`mt-0.5 text-lg font-bold ${
                  isDark ? "text-[#FFFDF5]" : "text-gray-900"
                }`}
              >
                {Math.round(activeSegment.percentage * 100)}%
              </span>
            </>
          ) : (
            <>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  isDark ? "text-[#9EBAC2]" : "text-gray-500"
                }`}
              >
                Tổng dự toán
              </span>
              <div
                className={`mt-0.5 flex items-center text-xl font-bold ${
                  isDark ? "text-[#FFFDF5]" : "text-gray-900"
                }`}
              >
                <AnimatedCounter to={Math.round(total / 1000)} />K
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive Category Legend */}
      <div className="space-y-1.5">
        {segments.map((segment) => {
          const isHovered = hoveredIndex === segment.index;
          return (
            <div
              key={segment.label}
              onMouseEnter={() => setHoveredIndex(segment.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-default ${
                isDark
                  ? isHovered
                    ? "bg-white/[0.08] text-[#FFFDF5]"
                    : "text-[#B4CED4] hover:bg-white/[0.04]"
                  : isHovered
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate font-medium">{segment.label}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span
                  className={`font-semibold tabular-nums ${
                    isDark ? "text-[#FFFDF5]" : "text-gray-900"
                  }`}
                >
                  {segment.value.toLocaleString("vi-VN")}đ
                </span>
                <span
                  className={`w-8 text-right text-[10.5px] tabular-nums ${
                    isDark ? "text-[#7DA0AC]" : "text-gray-400"
                  }`}
                >
                  {Math.round(segment.percentage * 100)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
