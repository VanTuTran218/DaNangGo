"use client";

import {
  ArrowUpRight,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import styles from "./ChatPage.module.css";

export default function TripInvitation({
  onStart,
  disabled = false,
}: {
  onStart?: () => void;
  disabled?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}) {
  return (
    <div className={styles.invitationContainer}>
      {/* Holographic Architectural Blueprint Canvas */}
      <div className={styles.blueprintCard}>
        <div className={styles.blueprintHeader}>
          <div className={styles.blueprintLocation}>
            <MapPin size={12} className={styles.blueprintPin} />
            <span className={styles.coordText}>16°04&apos;N · 108°13&apos;E</span>
            <span className={styles.cityPill}>ĐÀ NẴNG</span>
          </div>
          <span className={styles.blueprintStatusBadge}>
            <span className={styles.livePulseDot} />
            AI CANVAS
          </span>
        </div>

        <div className={styles.blueprintCanvas} aria-hidden="true">
          <svg viewBox="0 0 320 150" fill="none" className={styles.blueprintSvg}>
            <defs>
              <pattern id="lux-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(45, 212, 191, 0.08)" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="neonRoute" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#14b8a6" />
                <stop offset="70%" stopColor="#e6d9b7" />
                <stop offset="100%" stopColor="#e87b39" />
              </linearGradient>
              <filter id="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="100%" height="100%" fill="url(#lux-grid)" />
            <path
              d="M-10 130 C45 115, 80 85, 130 95 C180 105, 220 75, 330 70"
              stroke="rgba(45, 212, 191, 0.22)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <path
              d="M25 115 Q80 35 145 102 T275 88"
              stroke="url(#neonRoute)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={styles.blueprintFlowLine}
            />

            <g transform="translate(38, 106)" filter="url(#glowFilter)">
              <circle r="8" fill="rgba(13, 148, 136, 0.25)" className={styles.nodePulse} />
              <circle r="4" fill="#14b8a6" />
              <circle r="1.8" fill="#ffffff" />
              <text x="0" y="18" fill="rgba(203, 213, 225, 0.85)" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="0.4">
                BÀ NÀ
              </text>
            </g>

            <g transform="translate(142, 78)" filter="url(#glowFilter)">
              <circle r="10" fill="rgba(232, 123, 57, 0.28)" className={styles.nodePulse} />
              <circle r="4.5" fill="#e87b39" />
              <circle r="2" fill="#ffffff" />
              <text x="0" y="18" fill="rgba(230, 217, 183, 0.95)" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="0.4">
                CẦU RỒNG
              </text>
            </g>

            <g transform="translate(255, 88)" filter="url(#glowFilter)">
              <circle r="8" fill="rgba(45, 212, 191, 0.25)" className={styles.nodePulse} />
              <circle r="4" fill="#2dd4bf" />
              <circle r="1.8" fill="#ffffff" />
              <text x="0" y="18" fill="rgba(203, 213, 225, 0.85)" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="0.4">
                MỸ KHÊ
              </text>
            </g>
          </svg>

          <div className={styles.blueprintFloatingBadge} style={{ top: "10px", left: "10px" }}>
            <Compass size={11} className={styles.badgeIconTeal} />
            <span>Tối ưu OSRM</span>
          </div>
          <div className={styles.blueprintFloatingBadge} style={{ top: "10px", right: "10px" }}>
            <Zap size={11} className={styles.badgeIconAmber} />
            <span>Thời gian thực</span>
          </div>
        </div>

        <div className={styles.blueprintCaption}>
          <div className={styles.captionTagRow}>
            <span className={styles.blueprintSubtitle}>AI TRAVEL BLUEPRINT</span>
            <span className={styles.verifiedTag}>XÁC THỰC 2026</span>
          </div>
          <h3 className={styles.blueprintTitle}>
            Lịch trình cá nhân hóa <strong>theo từng buổi</strong>
          </h3>
          <p className={styles.blueprintDesc}>
            Khi bạn yêu cầu lập lịch trình, Gô sẽ tự động tóm tắt số ngày, ngân sách và điều hướng từng ngày ngay tại đây.
          </p>
        </div>
      </div>

      {/* Primary Planning CTA */}
      {onStart && (
        <button
          className={styles.primaryPlanningCta}
          type="button"
          onClick={onStart}
          disabled={disabled}
        >
          <span className={styles.ctaGlowSweep} aria-hidden="true" />
          <span className={styles.ctaContent}>
            <span className={styles.ctaIconSpark}>
              <Sparkles size={15} />
            </span>
            <span className={styles.ctaMainText}>Phác thảo lịch trình ngay</span>
            <ArrowUpRight size={16} className={styles.ctaArrow} />
          </span>
        </button>
      )}

      <div className={styles.provenanceBar}>
        <ShieldCheck size={14} className={styles.provenanceIcon} />
        <span>Dữ liệu 1,200+ địa điểm thực tế · Hoàn toàn miễn phí</span>
      </div>
    </div>
  );
}
