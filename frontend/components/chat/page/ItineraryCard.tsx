import Link from "next/link";
import {
  BedDouble,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  Info,
  MapPin,
  Moon,
  Navigation,
  Sun,
  Sunrise,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ChatPlaceCard, ChatTravelPlan } from "@/types/chat";
import styles from "./ChatPage.module.css";
import { MenuItems } from "../ResponseDetails";
import StayFacts from "./StayFacts";
import TripPreferencesSummary from "../TripPreferencesSummary";

export const formatMoney = (value: number | null) =>
  value === null ? "Chưa đủ dữ liệu" : `${value.toLocaleString("vi-VN")}đ`;
export const formatDate = (value: string | null) =>
  value
    ? new Date(value + "T00:00:00").toLocaleDateString("vi-VN")
    : "Chưa chốt ngày";
export const dayAnchor = (messageId: string, day: number) =>
  `chat-plan-${messageId}-day-${day}`;

const typeLabels = {
  ACCOMMODATION: "Lưu trú",
  RESTAURANT: "Ẩm thực",
  ATTRACTION: "Tham quan",
};
export function PlanPlace({ place }: { place: ChatPlaceCard }) {
  const Icon =
    place.placeType === "ACCOMMODATION"
      ? BedDouble
      : place.placeType === "RESTAURANT"
        ? Utensils
        : Camera;
  return (
    <div className={styles.planPlace}>
      <Link
        href={`/places/${place.placeId}`}
        className={styles.planImage}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Icon size={23} />
        {place.imageUrl && (
          <img
            src={place.imageUrl}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
      </Link>
      <div className={styles.planPlaceCopy}>
        <span className={styles.placeType} data-type={place.placeType}>
          {typeLabels[place.placeType]}
        </span>
        <Link href={`/places/${place.placeId}`} className={styles.placeName}>
          {place.name}
        </Link>
        <p>
          <MapPin size={11} />
          {place.address || place.districtName || "Chưa cập nhật địa chỉ"}
        </p>
        <div className={styles.placeBottom}>
          <strong>
            {place.priceText ||
              (place.stayFacts
                ? "Giá theo ngày: cần xác nhận"
                : "Chưa cập nhật giá")}
          </strong>
          <Link href={`/bando?search=${encodeURIComponent(place.name)}`}>
            <Navigation size={11} />
            Chỉ đường
          </Link>
        </div>
        <MenuItems place={place} />
        <StayFacts place={place} />
      </div>
    </div>
  );
}

export function BudgetBar({
  plan,
  compact = false,
}: {
  plan: ChatTravelPlan;
  compact?: boolean;
}) {
  const { costs, budget } = plan;
  const segments = [
    { label: "Lưu trú", value: costs.accommodation, tone: "teal" },
    { label: "Tham quan", value: costs.tickets, tone: "sky" },
    ...(!compact
      ? [
          {
            label: "Ăn uống dự kiến",
            value: costs.foodAllowance,
            tone: "orange",
          },
        ]
      : []),
    ...(!compact && costs.transportAllowance != null
      ? [
          {
            label: "Di chuyển dự kiến",
            value: costs.transportAllowance,
            tone: "sky",
          },
        ]
      : []),
    ...(!compact && costs.contingencyAllowance != null
      ? [
          {
            label: "Dự phòng dự kiến",
            value: costs.contingencyAllowance,
            tone: "orange",
          },
        ]
      : []),
  ].filter(
    (item): item is { label: string; value: number; tone: string } =>
      item.value !== null && item.value > 0,
  );
  const total = segments.reduce((sum, item) => sum + item.value, 0),
    scale = Math.max(budget ?? 0, total, 1);
  return (
    <div className={styles.budgetBlock}>
      {!compact && (
        <h4>
          <Wallet size={16} />
          Dự trù để bạn cân đối
        </h4>
      )}
      {budget !== null && budget > 0 && segments.length > 0 && (
        <div
          className={styles.budgetTrack}
          role="img"
          aria-label={segments
            .map((item) => `${item.label}: ${formatMoney(item.value)}`)
            .join(", ")}
        >
          {segments.map((item) => (
            <span
              key={item.label}
              data-tone={item.tone}
              style={{ width: `${(item.value / scale) * 100}%` }}
            />
          ))}
        </div>
      )}
      {!compact && (
        <div className={styles.budgetLegend}>
          {segments.map((item) => (
            <span key={item.label}>
              <i data-tone={item.tone} />
              {item.label}
              <b>{formatMoney(item.value)}</b>
            </span>
          ))}
        </div>
      )}
      {!compact && (
        <>
          <dl className={styles.budgetNumbers}>
            <div>
              <dt>Lưu trú</dt>
              <dd>{formatMoney(costs.accommodation)}</dd>
            </div>
            <div>
              <dt>Vé tham quan đã chọn</dt>
              <dd>{formatMoney(costs.tickets)}</dd>
            </div>
            <div>
              <dt>Cộng các khoản đã có giá</dt>
              <dd>{formatMoney(costs.knownSubtotal)}</dd>
            </div>
            {costs.remaining !== null && (
              <div>
                <dt>{costs.projectedSubtotal != null ? "Còn sau các khoản dự kiến" : costs.contingencyAllowance != null ? "Còn sau khoản đã biết và dự phòng" : "Còn sau các khoản đã biết"}</dt>
                <dd>{formatMoney(costs.remaining)}</dd>
              </div>
            )}
          </dl>
          <p>{costs.roomNote}</p>
          {costs.foodAllowance !== null && (
            <p>
              Ăn uống: khoản dành riêng dự kiến{" "}
              {formatMoney(costs.foodAllowance)}, chưa phải chi phí bữa ăn thực
              tế.
            </p>
          )}
          <p className={styles.budgetDisclaimer}>
            <Info size={13} />
            Chưa phải tổng chi phí chuyến đi hoặc xác nhận đặt dịch vụ.
          </p>
        </>
      )}
    </div>
  );
}

export function DayTabs({
  plan,
  messageId,
  activeDay,
  onSelect,
}: {
  plan: ChatTravelPlan;
  messageId: string;
  activeDay: number;
  onSelect: (day: number) => void;
}) {
  return (
    <div
      className={styles.dayTabs}
      role="tablist"
      aria-label="Chọn ngày trong lịch trình"
    >
      {plan.days.map((day, index) => (
        <button
          key={day.day}
          id={`${dayAnchor(messageId, day.day)}-tab`}
          type="button"
          role="tab"
          aria-selected={activeDay === day.day}
          aria-controls={dayAnchor(messageId, day.day)}
          tabIndex={activeDay === day.day ? 0 : -1}
          onClick={() => onSelect(day.day)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight")
              next = (index + 1) % plan.days.length;
            else if (event.key === "ArrowLeft")
              next = (index - 1 + plan.days.length) % plan.days.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = plan.days.length - 1;
            else return;
            event.preventDefault();
            onSelect(plan.days[next]!.day);
            document
              .getElementById(
                `${dayAnchor(messageId, plan.days[next]!.day)}-tab`,
              )
              ?.focus();
          }}
        >
          {activeDay === day.day && (
            <motion.span
              layoutId={`day-tab-${messageId}`}
              className={styles.dayTabIndicator}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          <span>Ngày {day.day}</span>
        </button>
      ))}
    </div>
  );
}

export function Timeline({ day }: { day: ChatTravelPlan["days"][number] }) {
  return (
    <div className={styles.timeline}>
      {day.periods.map((period) => {
        const Icon =
          period.label === "Sáng"
            ? Sunrise
            : period.label === "Trưa"
              ? Sun
              : period.label === "Chiều"
                ? CloudSun
                : Moon;
        return (
          <section
            className={styles.period}
            key={period.label}
            aria-label={`Ngày ${day.day} - ${period.label}`}
          >
            <span className={styles.periodIcon} data-period={period.label}>
              <Icon size={16} />
            </span>
            <div className={styles.periodHeading}>
              <h5>{period.label}</h5>
              <span>{period.time}</span>
            </div>
            <div className={styles.periodItems}>
              {period.items.map((item, index) => (
                <div key={`${item.title}-${index}`} className={styles.activity}>
                  <h6>{item.title}</h6>
                  <p>{item.detail}</p>
                  {item.place && <PlanPlace place={item.place} />}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function ItineraryCard({
  plan,
  messageId,
  selectedDay,
  onSelectDay,
}: {
  plan: ChatTravelPlan;
  messageId: string;
  selectedDay?: number;
  onSelectDay: (day: number) => void;
}) {
  const activeDay = plan.days.some((day) => day.day === selectedDay)
    ? selectedDay!
    : (plan.days[0]?.day ?? 1);
  return (
    <section
      className={styles.itinerary}
      aria-label="Lịch trình du lịch đề xuất"
    >
      <div className={styles.itineraryHero}>
        <span className={styles.planKicker}>
          <Check size={12} />
          LỊCH TRÌNH GỢI Ý
        </span>
        <h3>{plan.title}</h3>
        <div className={styles.planBadges}>
          <span>
            <Users size={12} />
            {plan.guestCount
              ? `${plan.guestCount} khách`
              : "Chưa chốt số khách"}
          </span>
          <span>
            <CalendarDays size={12} />
            {formatDate(plan.startDate)}
          </span>
          {plan.budget !== null && (
            <span>
              <Wallet size={12} />
              {formatMoney(plan.budget)}
            </span>
          )}
        </div>
      </div>
      {plan.assumptions.length > 0 && (
        <div className={styles.planAssumptions}>
          <Info size={15} />
          <ul>
            {plan.assumptions.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
      )}
      <TripPreferencesSummary plan={plan} />
      <DayTabs
        plan={plan}
        messageId={messageId}
        activeDay={activeDay}
        onSelect={onSelectDay}
      />
      {plan.days.map((day) => (
        <div
          key={day.day}
          id={dayAnchor(messageId, day.day)}
          role="tabpanel"
          aria-labelledby={`${dayAnchor(messageId, day.day)}-tab`}
          hidden={day.day !== activeDay}
          tabIndex={0}
          className={styles.dayPanel}
        >
          <div className={styles.dayOverview}>
            <span>
              <CalendarDays size={14} />
              {day.date ? formatDate(day.date) : `Ngày ${day.day}`}
            </span>
            <span>
              <MapPin size={13} />
              {day.area}
            </span>
          </div>
          <Timeline day={day} />
        </div>
      ))}
      {plan.groups.length > 0 && (
        <details className={styles.moreSuggestions}>
          <summary>
            Thêm lựa chọn cho chuyến đi
            <ChevronRight size={15} />
          </summary>
          <div>
            {plan.groups.map((group) => (
              <section key={group.title}>
                <h4>{group.title}</h4>
                {group.places.map((place) => (
                  <PlanPlace key={place.placeId} place={place} />
                ))}
              </section>
            ))}
          </div>
        </details>
      )}
      <BudgetBar plan={plan} />
      {plan.notes.length > 0 && (
        <details className={styles.planNotes}>
          <summary>
            <Info size={14} />
            Gô nhắc bạn
            <ChevronRight size={14} />
          </summary>
          <ul>
            {plan.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
