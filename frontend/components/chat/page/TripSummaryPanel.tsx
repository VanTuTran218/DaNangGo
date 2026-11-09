"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  MapPin,
  Plane,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { ChatTravelPlan } from "@/types/chat";
import { formatDate, formatMoney } from "./ItineraryCard";
import styles from "./ChatPage.module.css";
import TripInvitation from "./TripInvitation";

export default function TripSummaryPanel({
  plan,
  onJumpDay,
  onStartPlanning,
  loading = false,
  onSelectPrompt,
}: {
  plan?: ChatTravelPlan;
  onJumpDay: (day: number) => void;
  onStartPlanning?: () => void;
  loading?: boolean;
  onSelectPrompt?: (text: string) => void;
}) {
  const percentage =
    plan &&
    plan.budget !== null &&
    plan.budget > 0 &&
    plan.costs.knownSubtotal !== null
      ? Math.max(
          0,
          Math.min(100, (plan.costs.knownSubtotal / plan.budget) * 100),
        )
      : null;

  return (
    <div className={styles.summaryInner}>
      {/* Header bar */}
      <div className={styles.summaryHeading}>
        <div className={styles.summaryTitleGroup}>
          <span className={styles.summaryIconWrap}>
            <Compass size={17} />
          </span>
          <div>
            <h2>Hành trình của bạn</h2>
            <span className={styles.headerSubtitleMini}>Kế hoạch du lịch Đà Nẵng</span>
          </div>
        </div>
        {plan && (
          <span className={styles.planStatusPill}>
            <span className={styles.livePulseDot} />
            Đã sẵn sàng
          </span>
        )}
      </div>

      {plan ? (
        <div className={styles.activePlanContainer}>
          {/* Executive Travel Dossier / Boarding Pass Header */}
          <div className={styles.tripCover}>
            <div className={styles.tripCoverHeader}>
              <div className={styles.tripCoverLocation}>
                <MapPin size={12} />
                <span>ĐÀ NẴNG · VIỆT NAM</span>
              </div>
              <span className={styles.tripCoverAirportBadge}>DAD</span>
            </div>

            <h3 className={styles.tripCoverTitle}>
              {plan.dayCount} ngày khám phá trọn vẹn
            </h3>

            <div className={styles.tripCoverMetaRow}>
              <div className={styles.tripCoverDateWrap}>
                <CalendarDays size={13} className={styles.dateIcon} />
                <span>Khởi hành: <strong>{formatDate(plan.startDate)}</strong></span>
              </div>
            </div>

            <div className={styles.tripCoverWave} aria-hidden="true">
              <svg viewBox="0 0 280 50" fill="none">
                <path
                  d="M0 30 Q70 5 140 25 T280 15"
                  stroke="rgba(45, 212, 191, 0.45)"
                  strokeWidth="2"
                />
                <path
                  d="M0 40 Q70 15 140 35 T280 25"
                  stroke="rgba(6, 182, 212, 0.25)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className={styles.tripStats}>
            <div className={styles.tripStatCard}>
              <div className={styles.statIconWrap}>
                <Users size={16} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Số khách</span>
                <strong>
                  {plan.guestCount ? `${plan.guestCount} người` : "Chưa chốt"}
                </strong>
              </div>
            </div>

            <div className={styles.tripStatCard}>
              <div className={styles.statIconWrap}>
                <CalendarDays size={16} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Thời lượng</span>
                <strong>{plan.dayCount} ngày</strong>
              </div>
            </div>
          </div>

          {/* Precision Budget Utilization Meter */}
          <div className={styles.summaryBudget}>
            <div className={styles.budgetHeaderRow}>
              <span className={styles.budgetLabel}>
                <Wallet size={15} className={styles.budgetIcon} />
                Dự toán ngân sách
              </span>
              <strong className={styles.budgetTotal}>
                {plan.budget !== null
                  ? formatMoney(plan.budget)
                  : "Chưa chốt ngân sách"}
              </strong>
            </div>

            {percentage !== null && (
              <div className={styles.budgetProgressSection}>
                <div className={styles.progressLabelRow}>
                  <span>Tỷ lệ các khoản có giá</span>
                  <strong className={styles.progressPercentText}>{Math.round(percentage)}%</strong>
                </div>

                <div
                  className={styles.summaryProgress}
                  role="progressbar"
                  aria-label="Tỷ lệ ngân sách của các khoản đã có giá"
                  aria-valuenow={Math.round(percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className={styles.progressBarFill}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className={styles.budgetBreakdown}>
                  <div className={styles.budgetRow}>
                    <span>Các khoản đã có giá:</span>
                    <b>{formatMoney(plan.costs.knownSubtotal)}</b>
                  </div>
                  <span className={styles.smallMuted}>
                    Chưa tính các khoản chưa niêm yết, không phải số tiền đã chi.
                  </span>
                </div>
              </div>
            )}

            {plan.costs.projectedSubtotal != null && (
              <div className={styles.projectedCostBox}>
                <span>Tổng sau dự trù:</span>
                <b>{formatMoney(plan.costs.projectedSubtotal)}</b>
              </div>
            )}
          </div>

          {/* Day-by-Day Timeline Navigator */}
          <div className={styles.timelineHeaderRow}>
            <div className={styles.sectionLabel}>
              <span>LỊCH TRÌNH TỪNG NGÀY</span>
            </div>
            <span className={styles.dayCountBadge}>{plan.days.length} ngày</span>
          </div>

          <div className={styles.dayJumpList}>
            {plan.days.map((day) => (
              <button
                type="button"
                key={day.day}
                onClick={() => onJumpDay(day.day)}
                className={styles.dayJumpButton}
                aria-label={`Xem ngày ${day.day} trong lịch trình: ${day.area}`}
              >
                <span className={styles.dayNumber}>
                  D{String(day.day).padStart(2, "0")}
                </span>
                <span className={styles.dayDetails}>
                  <strong>Ngày {day.day}</strong>
                  <small>{day.area}</small>
                </span>
                <ChevronRight size={15} className={styles.dayJumpArrow} />
              </button>
            ))}
          </div>

          {/* AI Interactive Adjustment Footnote */}
          <div className={styles.summaryFootnote}>
            <Sparkles size={16} className={styles.footnoteSparkle} />
            <p>
              Muốn đổi quán ăn, đổi khách sạn hay chỉnh giờ? Nhắn trực tiếp cho Gô để AI tinh chỉnh lịch trình nhé!
            </p>
          </div>
        </div>
      ) : (
        <TripInvitation
          onStart={onStartPlanning}
          disabled={loading}
          onSelectPrompt={onSelectPrompt}
        />
      )}
    </div>
  );
}
