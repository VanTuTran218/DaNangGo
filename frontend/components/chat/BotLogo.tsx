"use client";

import { motion } from "framer-motion";

interface BotLogoProps {
  size?: number;
  /** Mắt chớp + ăng-ten phát sáng */
  animated?: boolean;
  className?: string;
}

/**
 * Logo linh vật "Gô" – DanangGo AI Bot.
 * Robot đầu tròn tông teal, mắt cười, má hồng, ăng-ten đỉnh ngọn lửa cam
 * (gợi hình Cầu Rồng phun lửa – biểu tượng Đà Nẵng) và sóng biển dưới cằm.
 */
export default function BotLogo({ size = 40, animated = true, className = "" }: BotLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="DanangGo AI Bot"
    >
      <defs>
        <linearGradient id="dng-bot-head" x1="10" y1="12" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="dng-bot-flame" x1="32" y1="2" x2="32" y2="13" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde047" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>

      {/* Ăng-ten + ngọn lửa */}
      <line x1="32" y1="10" x2="32" y2="15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
      <motion.path
        d="M32 2c2.6 3 3.6 5 3.6 6.8A3.6 3.6 0 0 1 32 12.4a3.6 3.6 0 0 1-3.6-3.6C28.4 7 29.4 5 32 2Z"
        fill="url(#dng-bot-flame)"
        style={{ originX: "32px", originY: "12px" }}
        animate={animated ? { scale: [1, 1.15, 1], opacity: [1, 0.85, 1] } : undefined}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tai */}
      <rect x="4" y="28" width="6" height="12" rx="3" fill="#0f766e" />
      <rect x="54" y="28" width="6" height="12" rx="3" fill="#0f766e" />

      {/* Đầu */}
      <rect x="8" y="14" width="48" height="42" rx="18" fill="url(#dng-bot-head)" />

      {/* Mặt kính */}
      <rect x="14" y="22" width="36" height="24" rx="12" fill="#f0fdfa" />

      {/* Mắt */}
      <motion.g
        style={{ originY: "33px" }}
        animate={animated ? { scaleY: [1, 1, 0.1, 1, 1] } : undefined}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      >
        <ellipse cx="24.5" cy="33" rx="3.2" ry="4" fill="#134e4a" />
        <ellipse cx="39.5" cy="33" rx="3.2" ry="4" fill="#134e4a" />
        <circle cx="25.6" cy="31.6" r="1.1" fill="#fff" />
        <circle cx="40.6" cy="31.6" r="1.1" fill="#fff" />
      </motion.g>

      {/* Má hồng */}
      <ellipse cx="19" cy="40" rx="2.6" ry="1.6" fill="#fb923c" opacity="0.55" />
      <ellipse cx="45" cy="40" rx="2.6" ry="1.6" fill="#fb923c" opacity="0.55" />

      {/* Miệng cười */}
      <path d="M28 40.5c2.2 2.2 5.8 2.2 8 0" stroke="#134e4a" strokeWidth="2" strokeLinecap="round" />

      {/* Sóng biển dưới cằm */}
      <path
        d="M18 51.5c2.3-2 4.7-2 7 0s4.7 2 7 0 4.7-2 7 0 4.7 2 7 0"
        stroke="#99f6e4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
