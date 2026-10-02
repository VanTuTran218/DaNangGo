"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin } from "lucide-react";

export default function MapMiniPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-20px" });

  return (
    <div ref={containerRef} className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      {/* Decorative background map pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
        backgroundSize: `20px 20px`
      }} />

      {/* SVG Path Route */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
        <motion.path
          d="M 50,150 C 100,100 150,180 200,120 S 300,50 350,80"
          fill="transparent"
          stroke="#f97316"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="400"
          initial={{ strokeDashoffset: 400 }}
          animate={isInView ? { strokeDashoffset: 0 } : { strokeDashoffset: 400 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Points */}
        <motion.circle cx="50" cy="150" r="6" fill="#f97316" 
          initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : { scale: 0 }} transition={{ delay: 0.2 }} />
        <motion.circle cx="200" cy="120" r="6" fill="#f97316"
          initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : { scale: 0 }} transition={{ delay: 1 }} />
        <motion.circle cx="350" cy="80" r="6" fill="#f97316"
          initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : { scale: 0 }} transition={{ delay: 1.8 }} />
      </svg>

      <div className="absolute top-2 left-2 bg-white/80 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md flex items-center shadow-sm">
        <MapPin className="w-3 h-3 text-orange-500 mr-1" /> Route Preview
      </div>
    </div>
  );
}
