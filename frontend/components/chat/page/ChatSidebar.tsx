"use client";

import { useState, useEffect } from "react";
import type { ChatSessionSummary } from "@/types/chat";
import {
  Compass,
  History,
  Lightbulb,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import QuickStartList from "./QuickStartList";
import BotLogo from "../BotLogo";
import styles from "./ChatPage.module.css";

export default function ChatSidebar({
  sessions,
  sessionId,
  onOpenSession,
  historyError,
  prompts,
  onSelect,
  onReset,
  loading,
}: {
  sessions: ChatSessionSummary[];
  sessionId: number | null;
  onOpenSession: (id: number) => void;
  historyError: string;
  prompts: string[];
  onSelect: (text: string) => void;
  onReset: () => void;
  loading: boolean;
}) {
  const tips = [
    "Cho Gô biết số người & ngân sách để phân bổ khách sạn và bữa ăn sát nhất.",
    "Thử ghi rõ khẩu vị cay, thanh đạm hay thích hải sản bình dân ở Sơn Trà.",
    "Bạn có thể nhờ Gô thay đổi bất kỳ điểm đến nào trong lịch trình vừa tạo.",
    "Giá hiển thị được đối chiếu từ dữ liệu 1,200+ điểm đến thực tế tại Đà Nẵng.",
  ];

  const [tip, setTip] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        setTip((i) => (i + 1) % tips.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [paused, tips.length]);

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const isToday = (date: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
      new Date(date),
    ) === today;

  return (
    <div className={styles.sidebarInner}>
      {/* Brand & Assistant Workspace Header */}
      <div className={styles.sidebarBrand}>
        <div className={styles.brandMark}>
          <BotLogo size={32} animated={false} />
          <span className={styles.onlineBeacon} aria-hidden="true" />
        </div>
        <div className={styles.brandMeta}>
          <div className={styles.brandTitleRow}>
            <strong>Gô Companion</strong>
            <span className={styles.systemTag}>AI 2.5</span>
          </div>
          <span className={styles.brandStatus}>
            <span className={styles.livePulseDot} />
            Hệ sinh thái AI trực tuyến
          </span>
        </div>
      </div>

      {/* New Conversation CTA (Obsidian Glass Bevel Button) */}
      <button
        type="button"
        onClick={onReset}
        className={styles.newChat}
        disabled={loading}
        title="Bắt đầu cuộc trò chuyện mới (⌘K)"
      >
        <span className={styles.newChatContent}>
          <span className={styles.plusIconWrap}>
            <Plus size={15} strokeWidth={2.4} />
          </span>
          <span>Cuộc trò chuyện mới</span>
        </span>
        <kbd className={styles.shortcutKey} aria-hidden="true">⌘K</kbd>
      </button>

      {/* Smart Suggestions & Prompts */}
      <div className={styles.sectionLabel}>
        <Sparkles size={13} className={styles.sectionIcon} />
        <span>GỢI Ý THÔNG MINH</span>
      </div>

      <QuickStartList
        compact
        prompts={prompts}
        onSelect={onSelect}
        disabled={loading}
      />

      {/* Session History */}
      {sessions.length > 0 && (
        <nav
          className={styles.conversationHistory}
          aria-label="Lịch sử hội thoại"
        >
          <div className={styles.historyHeaderRow}>
            <div className={styles.sectionLabel}>
              <History size={13} className={styles.sectionIcon} />
              <span>LỊCH SỬ HỘI THOẠI</span>
            </div>
            <span className={styles.sessionCountBadge}>{sessions.length}</span>
          </div>

          <div className={styles.historyScrollZone}>
            {["Hôm nay", "Trước đó"].map((label, index) => {
              const rows = sessions.filter(
                (s) => isToday(s.updatedAt) === (index === 0),
              );
              return rows.length ? (
                <div key={label} className={styles.historyGroup}>
                  <h3 className={styles.historyGroupTitle}>{label}</h3>
                  <div className={styles.historyList}>
                    {rows.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className={styles.historyItem}
                        data-active={sessionId === s.id}
                        aria-current={sessionId === s.id ? "true" : undefined}
                        disabled={loading}
                        onClick={() => onOpenSession(s.id)}
                        title={s.title}
                      >
                        <MessageSquare size={13} className={styles.historyIcon} />
                        <span className={styles.historyTitleText}>{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })}
          </div>

          <div className={styles.storageNoticeCard}>
            <ShieldCheck size={14} className={styles.storageNoticeIcon} />
            <span>Bộ nhớ phiên an toàn · Tối đa 50 hội thoại</span>
          </div>
        </nav>
      )}

      {historyError && (
        <div className={styles.historyErrorBox} role="status">
          {historyError}
        </div>
      )}

      <div className={styles.sidebarSpacer} />

      {/* Telemetry Radar HUD Card (Replaces cartoon coastCard) */}
      <div className={styles.aiRadarCard}>
        <div className={styles.aiRadarHeader}>
          <div className={styles.aiRadarBadge}>
            <Radio size={12} className={styles.aiRadarPulseIcon} />
            <span>DANANG RADAR HUB</span>
          </div>
          <span className={styles.aiRadarLiveTag}>LIVE</span>
        </div>

        <div className={styles.aiRadarMetrics}>
          <div className={styles.aiRadarMetric}>
            <strong>1,200+</strong>
            <span>Điểm đến xác thực</span>
          </div>
          <div className={styles.aiRadarDivider} />
          <div className={styles.aiRadarMetric}>
            <strong>100%</strong>
            <span>Tọa độ GPS thực</span>
          </div>
        </div>

        <p className={styles.aiRadarNote}>
          Liên tục đồng bộ giờ mở cửa, bảng giá & lộ trình OSRM tối ưu.
        </p>

        <div className={styles.aiRadarWaves} aria-hidden="true">
          <svg viewBox="0 0 240 36" fill="none">
            <path
              d="M0 26C40 26 60 10 100 10C140 10 160 30 200 30C220 30 230 18 240 18"
              stroke="#2dd4bf"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <path
              d="M0 18C40 18 60 4 100 4C140 4 160 22 200 22C220 22 230 12 240 12"
              stroke="#06b6d4"
              strokeWidth="1.8"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Pro Tips Glass Capsule */}
      <div className={styles.tipCard}>
        <div className={styles.tipIconWrap}>
          <Lightbulb size={15} />
        </div>
        <div className={styles.tipBody}>
          <p className={styles.tipText}>{tips[tip]}</p>
          <div className={styles.tipControls}>
            <button
              type="button"
              className={styles.tipNavBtn}
              onClick={() => setTip((i) => (i + 1) % tips.length)}
              aria-label="Mẹo tiếp theo"
            >
              Mẹo khác →
            </button>
            <button
              type="button"
              className={styles.tipPauseBtn}
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              title={paused ? "Tiếp tục xoay vòng mẹo" : "Tạm dừng xoay vòng"}
            >
              {paused ? <Play size={11} /> : <Pause size={11} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
