"use client";

import {
  ArrowUpRight,
  Compass,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import styles from "./ChatPage.module.css";

const QUICK_TRIP_CHIPS = [
  {
    icon: "🗓️",
    label: "3N2Đ Tiêu Chuẩn",
    desc: "Cân đối tham quan & nghỉ ngơi",
    prompt: "✨ Lên lịch 3 ngày ở Đà Nẵng",
  },
  {
    icon: "🏖️",
    label: "Biển & Nghỉ Dưỡng",
    desc: "Khách sạn view biển Mỹ Khê",
    prompt: "🏖️ Khách sạn gần biển Mỹ Khê",
  },
  {
    icon: "🦞",
    label: "Food Tour Hải Sản",
    desc: "Quán ngon Sơn Trà < 300k",
    prompt: "🦞 Hải sản Sơn Trà dưới 300k",
  },
  {
    icon: "🌉",
    label: "Check-in Sống Ảo",
    desc: "Điểm đẹp miễn phí vé",
    prompt: "🌉 Điểm tham quan miễn phí",
  },
];

export default function TripInvitation({
  onStart,
  disabled = false,
  onSelectPrompt,
}: {
  onStart?: () => void;
  disabled?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}) {
  const handleChipClick = (prompt: string) => {
    if (disabled) return;
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    } else if (onStart) {
      onStart();
    }
  };

  return (
    <div className={styles.invitationContainer}>
      {/* $100k Architectural Blueprint Canvas */}
      <div className={styles.blueprintCard}>
        {/* Top Telemetry & Coordinate Strip */}
        <div className={styles.blueprintHeader}>
          <div className={styles.blueprintLocation}>
            <MapPin size={12} className={styles.blueprintPin} />
            <span className={styles.coordText}>16°04&apos;N · 108°13&apos;E</span>
            <span className={styles.cityPill}>ĐÀ NẴNG</span>
          </div>
          <span className={styles.blueprintStatusBadge}>
            <span className={styles.livePulseDot} />
            AI CANVAS V2.5
          </span>
        </div>

        {/* Master Vector Architectural Map */}
        <div className={styles.blueprintCanvas} aria-hidden="true">
          <svg viewBox="0 0 320 150" fill="none" className={styles.blueprintSvg}>
            <defs>
              {/* Subtle Tech Coordinates Grid */}
              <pattern id="lux-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(45, 212, 191, 0.08)" strokeWidth="0.5" />
              </pattern>

              {/* Glowing Route Trail Gradient */}
              <linearGradient id="neonRoute" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#14b8a6" />
                <stop offset="70%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>

              {/* Waypoint Glow Filter */}
              <filter id="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid Underlay */}
            <rect width="100%" height="100%" fill="url(#lux-grid)" />

            {/* Stylized Coastal Curve & Mountain Ridge (Bà Nà to Sơn Trà) */}
            <path
              d="M-10 130 C45 115, 80 85, 130 95 C180 105, 220 75, 330 70"
              stroke="rgba(45, 212, 191, 0.22)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <path
              d="M-10 145 C60 135, 110 110, 160 120 C220 130, 270 95, 330 90"
              stroke="rgba(6, 182, 212, 0.15)"
              strokeWidth="1.5"
            />

            {/* Iconic Architectural Dragon Bridge Arch */}
            <path
              d="M25 115 Q80 35 145 102 T275 88"
              stroke="url(#neonRoute)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={styles.blueprintFlowLine}
            />

            {/* Waypoint 1: Bà Nà Hills */}
            <g transform="translate(38, 106)" filter="url(#glowFilter)">
              <circle r="8" fill="rgba(13, 148, 136, 0.25)" className={styles.nodePulse} />
              <circle r="4" fill="#14b8a6" />
              <circle r="1.8" fill="#ffffff" />
              <text x="0" y="18" fill="rgba(203, 213, 225, 0.85)" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="0.4">
                BÀ NÀ
              </text>
            </g>

            {/* Waypoint 2: Sông Hàn & Cầu Rồng */}
            <g transform="translate(142, 78)" filter="url(#glowFilter)">
              <circle r="10" fill="rgba(245, 158, 11, 0.25)" className={styles.nodePulse} />
              <circle r="4.5" fill="#f59e0b" />
              <circle r="2" fill="#ffffff" />
              <text x="0" y="18" fill="rgba(254, 240, 138, 0.95)" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="0.4">
                CẦU RỒNG
              </text>
            </g>

            {/* Waypoint 3: Biển Mỹ Khê & Bán Đảo */}
            <g transform="translate(255, 88)" filter="url(#glowFilter)">
              <circle r="8" fill="rgba(6, 182, 212, 0.25)" className={styles.nodePulse} />
              <circle r="4" fill="#06b6d4" />
              <circle r="1.8" fill="#ffffff" />
              <text x="0" y="18" fill="rgba(203, 213, 225, 0.85)" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="0.4">
                MỸ KHÊ
              </text>
            </g>
          </svg>

          {/* Floating HUD Micro-Badges */}
          <div className={styles.blueprintFloatingBadge} style={{ top: "12px", left: "12px" }}>
            <Compass size={11} className={styles.badgeIconTeal} />
            <span>Tối ưu tuyến đường OSRM</span>
          </div>
          <div className={styles.blueprintFloatingBadge} style={{ top: "12px", right: "12px" }}>
            <Zap size={11} className={styles.badgeIconAmber} />
            <span>Thời gian thực</span>
          </div>
        </div>

        {/* Blueprint Caption */}
        <div className={styles.blueprintCaption}>
          <div className={styles.captionTagRow}>
            <span className={styles.blueprintSubtitle}>AI TRAVEL BLUEPRINT</span>
            <span className={styles.verifiedTag}>XÁC THỰC 2026</span>
          </div>
          <h3 className={styles.blueprintTitle}>
            Hành trình cá nhân hóa
            <br />
            <strong>được kiến tạo theo ý bạn</strong>
          </h3>
          <p className={styles.blueprintDesc}>
            Gô tự động kết nối địa điểm, tối ưu thứ tự di chuyển và ước tính ngân sách cho từng ngày.
          </p>
        </div>
      </div>

      {/* Interactive Quick Parameter Chips (Hết bị động!) */}
      <div className={styles.interactiveChipsSection}>
        <div className={styles.interactiveChipsHeader}>
          <Sparkles size={13} className={styles.interactiveIcon} />
          <span>GỢI Ý LẬP KẾ HOẠCH TỨC THÌ</span>
        </div>

        <div className={styles.interactiveChipsGrid}>
          {QUICK_TRIP_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={styles.interactiveChip}
              disabled={disabled}
              onClick={() => handleChipClick(chip.prompt)}
              title={chip.prompt}
            >
              <div className={styles.chipTopRow}>
                <span className={styles.chipEmoji}>{chip.icon}</span>
                <span className={styles.chipText}>{chip.label}</span>
                <ArrowUpRight size={13} className={styles.chipArrow} />
              </div>
              <span className={styles.chipDesc}>{chip.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Precision 3-Step AI Workflow Pipeline */}
      <div className={styles.aiWorkflowSection}>
        <div className={styles.aiWorkflowTrack} aria-hidden="true" />

        <div className={styles.workflowStep}>
          <div className={styles.stepBadge}>01</div>
          <div className={styles.stepInfo}>
            <div className={styles.stepTitleRow}>
              <strong>Nêu mong muốn của bạn</strong>
              <span className={styles.stepPill}>Đầu vào</span>
            </div>
            <p>Số ngày, số khách, khẩu vị và khoảng ngân sách dự kiến.</p>
          </div>
        </div>

        <div className={styles.workflowStep}>
          <div className={styles.stepBadge}>02</div>
          <div className={styles.stepInfo}>
            <div className={styles.stepTitleRow}>
              <strong>AI tổng hợp & khớp dữ liệu</strong>
              <span className={styles.stepPillTeal}>1,200+ điểm</span>
            </div>
            <p>Tự động lọc giờ mở cửa, tính khoảng cách & cân đối cung đường.</p>
          </div>
        </div>

        <div className={styles.workflowStep}>
          <div className={styles.stepBadge} data-check="true">03</div>
          <div className={styles.stepInfo}>
            <div className={styles.stepTitleRow}>
              <strong>Xuất lịch trình & tinh chỉnh</strong>
              <span className={styles.stepPillAmber}>Linh hoạt</span>
            </div>
            <p>Dễ dàng đổi món, đổi điểm đến hay dời giờ ngay trong hội thoại.</p>
          </div>
        </div>
      </div>

      {/* Primary Planning Trigger ($100k Glow Sweep Button) */}
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
              <Sparkles size={16} />
            </span>
            <span className={styles.ctaMainText}>Phác thảo chuyến đi ngay</span>
            <ArrowUpRight size={17} className={styles.ctaArrow} />
          </span>
        </button>
      )}

      {/* Trust & Provenance Bar */}
      <div className={styles.provenanceBar}>
        <ShieldCheck size={14} className={styles.provenanceIcon} />
        <span>Dữ liệu thực tế 2026 · Tối ưu tuyến đường · Hoàn toàn miễn phí</span>
      </div>
    </div>
  );
}
