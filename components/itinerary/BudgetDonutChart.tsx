"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedCounter from "../AnimatedCounter";

interface DataItem {
  label: string;
  value: number;
  color: string;
}

interface BudgetDonutChartProps {
  data: DataItem[];
  total: number;
}

export default function BudgetDonutChart({ data, total }: BudgetDonutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const strokeDasharray = `${circumference * percentage} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += circumference * percentage;
    
    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      index
    };
  });

  return (
    <div ref={containerRef} className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        {segments.map((segment) => {
          const isHovered = hoveredIndex === segment.index;
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
              transition={{ duration: 1.5, ease: "easeInOut", delay: segment.index * 0.2 }}
              onMouseEnter={() => setHoveredIndex(segment.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="transition-all duration-300 ease-in-out cursor-pointer origin-center"
              style={{
                transformOrigin: "80px 80px",
                transform: isHovered ? "scale(1.05)" : "scale(1)"
              }}
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm text-gray-500">Tổng</span>
        <div className="text-xl font-bold text-gray-900 flex items-center">
          <AnimatedCounter to={Math.round(total / 1000)} />K
        </div>
      </div>
    </div>
  );
}
