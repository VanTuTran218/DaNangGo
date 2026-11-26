"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import BotLogo from "../BotLogo";
import QuickStartList from "./QuickStartList";
import styles from "./ChatPage.module.css";

export default function EmptyState({
  prompts,
  onSelect,
  loading,
}: {
  welcome?: ReactNode;
  prompts: string[];
  onSelect: (text: string) => void;
  loading: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={styles.emptyState}>
      {/* Orbital Celestial Astrolabe framing Gô Dragon Mascot */}
      <div className={styles.emptyMascot}>
        <span className={styles.mascotAura} aria-hidden="true" />
        <svg
          viewBox="0 0 180 180"
          className={styles.oracleAstrolabe}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="astrolabeGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#E6D9B7" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#E87B39" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <g className={reduce ? "" : "astrolabe-ring-cw"} style={{ transformOrigin: "90px 90px" }}>
            <circle
              cx="90"
              cy="90"
              r="82"
              fill="none"
              stroke="rgba(230,217,183,0.22)"
              strokeWidth="1"
              strokeDasharray="3 7"
            />
            <circle cx="90" cy="8" r="2.6" fill="#E6D9B7" />
            <circle cx="172" cy="90" r="2.2" fill="#2DD4BF" />
          </g>
          <g className={reduce ? "" : "astrolabe-ring-ccw"} style={{ transformOrigin: "90px 90px" }}>
            <circle
              cx="90"
              cy="90"
              r="65"
              fill="none"
              stroke="url(#astrolabeGold)"
              strokeWidth="1.25"
              strokeDasharray="48 22 18 32"
              strokeLinecap="round"
            />
            <circle cx="25" cy="90" r="2.4" fill="#E87B39" />
          </g>
        </svg>

        <motion.div
          className={styles.mascotCore}
          animate={reduce ? undefined : { y: [0, -4, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <BotLogo size={76} animated={!reduce} />
        </motion.div>

        <span className={styles.sparkle} aria-hidden="true">
          <Sparkles size={14} />
        </span>
      </div>

      <div className={styles.eyebrow}>
        <Sparkles size={11} />
        <span>GÔ AI CONCIERGE · ĐÀ NẴNG</span>
      </div>

      <h2>
        Một lời nhắn,{" "}
        <span className="home-serif italic font-normal">
          mở ra cả chuyến đi.
        </span>
      </h2>

      <p className={styles.welcomeSubtitle}>
        Gợi ý điểm đến, quán ngon, lưu trú và thiết kế lịch trình theo từng buổi ngay trong hội thoại.
      </p>

      <QuickStartList
        prompts={prompts}
        onSelect={onSelect}
        disabled={loading}
        maxItems={4}
      />
    </div>
  );
}
