import {
  CalendarDays,
  ChevronRight,
  Map,
  MapPin,
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
}: {
  plan?: ChatTravelPlan;
  onJumpDay: (day: number) => void;
  onStartPlanning?: () => void;
  loading?: boolean;
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
      <div className={styles.summaryHeading}>
        <span>
          <Map size={16} />
        </span>
        <h2>Chuyến đi của bạn</h2>
      </div>
      <p className={styles.summarySubtitle}>
        {plan
          ? "Những điều quan trọng, gói gọn ở đây."
          : "Cảm hứng hôm nay, hành trình ngày mai."}
      </p>
      {plan ? (
        <>
          <div className={styles.tripCover}>
            <span className={styles.tripCoverIcon}>
              <MapPin size={25} />
            </span>
            <p>ĐÀ NẴNG</p>
            <h3>{plan.dayCount} ngày khám phá</h3>
            <span>{formatDate(plan.startDate)}</span>
            <svg viewBox="0 0 280 80" fill="none" aria-hidden="true">
              <path
                d="M-10 45Q55 0 130 40T290 25M-10 65Q55 20 130 60T290 45"
                stroke="currentColor"
                strokeWidth="15"
                opacity=".1"
              />
            </svg>
          </div>
          <div className={styles.tripStats}>
            <div>
              <Users size={16} />
              <span>
                Số khách
                <strong>
                  {plan.guestCount ? `${plan.guestCount} người` : "Chưa chốt"}
                </strong>
              </span>
            </div>
            <div>
              <CalendarDays size={16} />
              <span>
                Thời gian<strong>{plan.dayCount} ngày</strong>
              </span>
            </div>
          </div>
          <div className={styles.summaryBudget}>
            <span>
              <Wallet size={15} />
              Ngân sách chuyến đi
            </span>
            <strong>
              {plan.budget !== null
                ? formatMoney(plan.budget)
                : "Chưa chốt ngân sách"}
            </strong>
            {percentage !== null && (
              <>
                <div
                  className={styles.summaryProgress}
                  role="progressbar"
                  aria-label="Tỷ lệ ngân sách của các khoản đã có giá"
                  aria-valuenow={Math.round(percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
                <p>
                  Các khoản đã có giá:{" "}
                  <b>{formatMoney(plan.costs.knownSubtotal)}</b>
                </p>
                <p className={styles.smallMuted}>
                  Chưa bao gồm mọi chi phí, chưa phải số tiền đã chi.
                </p>
              </>
            )}
          </div>
          {plan.costs.projectedSubtotal != null && (
            <p className={styles.smallMuted}>
              Tổng sau dự trù:{" "}
              <b>{formatMoney(plan.costs.projectedSubtotal)}</b>. Khoản chưa có
              giá chưa được tính.
            </p>
          )}
          <div className={styles.sectionLabel}>LỊCH TRÌNH TỪNG NGÀY</div>
          <div className={styles.dayJumpList}>
            {plan.days.map((day) => (
              <button
                type="button"
                key={day.day}
                onClick={() => onJumpDay(day.day)}
                aria-label={`Xem ngày ${day.day} trong lịch trình`}
              >
                <span className={styles.dayNumber}>
                  {String(day.day).padStart(2, "0")}
                </span>
                <span>
                  <b>Ngày {day.day}</b>
                  <small>{day.area}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <div className={styles.summaryFootnote}>
            <Sparkles size={16} />
            <p>
              Muốn đổi một điểm đến? Nhắn tiếp cho Gô ngay trong cuộc trò
              chuyện.
            </p>
          </div>
        </>
      ) : (
        <>
          <TripInvitation onStart={onStartPlanning} disabled={loading} />
        </>
      )}
    </div>
  );
}
