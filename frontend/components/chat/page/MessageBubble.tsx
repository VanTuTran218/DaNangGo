import { Feedback, PlanActions } from "./MessageActions";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Copy,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import type { ChatMessage, ChatPlaceCard } from "@/types/chat";
import BotLogo from "../BotLogo";
import ItineraryCard from "./ItineraryCard";
import ResponseDetails, { MenuItems } from "../ResponseDetails";
import ComparisonTable from "../ComparisonTable";
import StayFacts from "./StayFacts";
import styles from "./ChatPage.module.css";

function copyContent(message: ChatMessage) {
  const plan = message.travelPlan;
  return [
    message.content,
    ...(message.comparison
      ? message.comparison.rows.map((row) => `${row.label}: ${row.values.join(" · ")}`)
      : []),
    ...(message.recommendationGroups ?? []).flatMap(group => [group.title, ...group.places.map(place => `${place.name} · ${place.priceText ?? "Chưa cập nhật giá"}\n${(place.menuItems ?? []).map(item => item.name).join(", ")}`), group.notice]),
    ...(message.questions ?? []).filter(question => !message.content.includes(question)),
    ...(message.places ?? []).map(
      (place) =>
        `${place.name} · ${place.priceText ?? "Chưa cập nhật giá"} · ${place.address ?? ""}`,
    ),
    ...(plan
      ? [
          plan.title,
          ...plan.days.flatMap((day) => [
            `Ngày ${day.day}${day.date ? ` · ${day.date}` : ""}`,
            ...day.periods.flatMap((period) => [
              `${period.label} · ${period.time}`,
              ...period.items.map(
                (item) =>
                  `${item.title}: ${item.place?.name ?? ""} ${item.detail}${item.place?.priceText ? ` · ${item.place.priceText}` : ""}`,
              ),
            ]),
          ]),
          ...plan.notes,
        ]
      : []),
  ].join("\n\n");
}
function CopyMessage({ message }: { message: ChatMessage }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle"),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <span className={styles.copyControl}>
      <button
        type="button"
        aria-label="Sao chép nội dung tin nhắn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copyContent(message));
            setState("copied");
          } catch {
            setState("failed");
          }
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setState("idle"), 2200);
        }}
      >
        {state === "copied" ? <Check size={13} /> : <Copy size={13} />}
        <span>{state === "copied" ? "Đã sao chép" : "Sao chép"}</span>
      </button>
      <span role="status">
        {state === "failed" ? "Chưa thể sao chép. Bạn thử lại nhé." : ""}
      </span>
    </span>
  );
}
function RecommendationCard({
  place,
  onGoToPlace,
}: {
  place: ChatPlaceCard;
  onGoToPlace: (place: ChatPlaceCard) => void;
}) {
  const label =
    place.placeType === "ACCOMMODATION"
      ? "Lưu trú"
      : place.placeType === "RESTAURANT"
        ? "Ẩm thực"
        : "Tham quan";
  return (
    <article className={styles.recommendationCard}>
      <button
        type="button"
        onClick={() => onGoToPlace(place)}
        className={styles.recommendationMain}
      >
        <span className={styles.recommendationImage}>
          <MapPin size={22} />
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
        </span>
        <span className={styles.recommendationCopy}>
          <div className={styles.recommendationHeaderRow}>
            <span className={styles.placeType} data-type={place.placeType}>
              {label}
            </span>
            <span className={styles.recommendationMeta}>
              <Star size={11} />
              {place.reviewCount > 0 ? place.rating : "Chưa có đánh giá"}
              <i /> {place.districtName || "Đà Nẵng"}
            </span>
          </div>
          <strong>{place.name}</strong>
          <div className={styles.recommendationBottomRow}>
            <b className={styles.recommendationPrice}>{place.priceText || (place.stayFacts ? "Giá theo ngày: cần xác nhận" : "Chưa cập nhật giá")}</b>
            {place.distanceKm != null && (
              <span className={styles.recommendationDistance}>
                Cách {place.distanceOriginName ?? "bạn"} {place.distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
        </span>
        <span className={styles.recommendationArrow}>
          <ArrowUpRight size={16} />
        </span>
      </button>
      {place.reason && (
        <p className={styles.recommendationReason}>{place.reason}</p>
      )}
      <MenuItems place={place} />
      <StayFacts place={place} />
      <div className={styles.recommendationFooter}>
        <Link
          className={styles.recommendationRoute}
          href={`/bando?search=${encodeURIComponent(place.name)}`}
        >
          <Navigation size={12} />
          <span>Chỉ đường trên bản đồ</span>
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </article>
  );
}

export default function MessageBubble({
  message,
  sessionId,
  onUpdate,
  onAdjust,
  children,
  onGoToPlace,
  selectedDay,
  onSelectDay,
}: {
  message: ChatMessage;
  sessionId: number | null;
  onUpdate: (message: ChatMessage) => void;
  onAdjust: (text: string) => void;
  children: ReactNode;
  onGoToPlace: (place: ChatPlaceCard) => void;
  selectedDay?: number;
  onSelectDay: (day: number) => void;
}) {
  const isUser = message.sender === "USER";
  return (
    <div className={styles.messageRow} data-sender={message.sender}>
      {!isUser && (
        <div className={styles.messageAvatar}>
          <BotLogo size={32} animated={false} />
        </div>
      )}
      <div className={styles.messageColumn}>
        {!isUser && (
          <div className={styles.messageAuthor}>
            <strong>Gô</strong>
            <span className={styles.aiBadge}>AI CONCIERGE · ĐÀ NẴNG</span>
          </div>
        )}
        <div className={styles.bubble}>{children}</div>
        {message.travelPlan && (
          <ItineraryCard
            plan={message.travelPlan}
            messageId={message.id}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
          />
        )}
        {message.comparison && <ComparisonTable comparison={message.comparison} />}
        {message.travelPlan &&
          sessionId &&
          !message.id.startsWith("legacy_") && (
            <PlanActions
              message={message}
              sessionId={sessionId}
              onUpdate={onUpdate}
              onAdjust={onAdjust}
            />
          )}
        {!!message.places?.length && (
          <div className={styles.recommendations}>
            {message.places.map((place) => (
              <RecommendationCard
                key={place.placeId}
                place={place}
                onGoToPlace={onGoToPlace}
              />
            ))}
          </div>
        )}
        {!isUser && <ResponseDetails message={message} />}
        {message.actionLink && !(message.travelPlan && sessionId) && (
          <Link href={message.actionLink.url} className={styles.messageAction}>
            {message.actionLink.text}
            <ArrowUpRight size={14} />
          </Link>
        )}
        <div className={styles.messageFooter}>
          {!isUser && <CopyMessage message={message} />}
          {!isUser &&
            sessionId &&
            !/^(welcome|err|legacy_)/.test(message.id) && (
              <Feedback
                message={message}
                sessionId={sessionId}
                onUpdate={onUpdate}
              />
            )}
          <time dateTime={message.createdAt}>
            {new Date(message.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({
  status,
  candidates,
}: {
  status: string;
  candidates: ChatPlaceCard[];
}) {
  return (
    <div className={styles.typingRow} role="status">
      <div className={styles.messageAvatar}>
        <BotLogo size={32} animated={false} />
      </div>
      <div className={styles.typingContent}>
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
        <p className={styles.typingStatus}>{status}</p>
        {candidates.length > 0 && (
          <div className={styles.liveCandidates}>
            {candidates.map((place) => (
              <Link key={place.placeId} href={`/places/${place.placeId}`} className={styles.candidateCard}>
                <MapPin size={13} />
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.priceText || "Chưa cập nhật giá"}</small>
                </span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
