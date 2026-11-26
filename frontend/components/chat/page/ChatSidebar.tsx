"use client";

import type { ChatSessionSummary } from "@/types/chat";
import {
  Compass,
  History,
  MessageSquare,
  Plus,
  Radio,
  Sparkles,
  Utensils,
  BedDouble,
  Camera,
} from "lucide-react";
import BotLogo from "../BotLogo";
import styles from "./ChatPage.module.css";

const SLIM_SHORTCUTS = [
  { match: "lịch", label: "Lên lịch trình 3N2Đ", icon: Compass },
  { match: "Mì", label: "Ăn gì ở Đà Nẵng?", icon: Utensils },
  { match: "Khách", label: "Tìm khách sạn gần biển", icon: BedDouble },
  { match: "tham quan", label: "Điểm check-in nổi bật", icon: Camera },
];

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
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());

  const isToday = (date: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
      new Date(date),
    ) === today;

  return (
    <div className={styles.sidebarInner}>
      {/* Brand Header */}
      <div className={styles.sidebarBrand}>
        <div className={styles.brandMark}>
          <BotLogo size={30} animated={false} />
          <span className={styles.onlineBeacon} aria-hidden="true" />
        </div>
        <div className={styles.brandMeta}>
          <div className={styles.brandTitleRow}>
            <strong>Gô Concierge</strong>
            <span className={styles.systemTag}>AI 2.5</span>
          </div>
          <span className={styles.brandStatus}>
            <span className={styles.livePulseDot} />
            Trợ lý du lịch Đà Nẵng
          </span>
        </div>
      </div>

      {/* Primary New Chat CTA */}
      <button
        type="button"
        onClick={onReset}
        className={styles.newChat}
        disabled={loading}
        title="Bắt đầu cuộc trò chuyện mới (⌘K)"
      >
        <span className={styles.newChatContent}>
          <span className={styles.plusIconWrap}>
            <Plus size={14} strokeWidth={2.4} />
          </span>
          <span>Trò chuyện mới</span>
        </span>
        <kbd className={styles.shortcutKey} aria-hidden="true">⌘K</kbd>
      </button>

      {/* Primary Focus: Session History */}
      <nav className={styles.conversationHistory} aria-label="Lịch sử hội thoại">
        <div className={styles.historyHeaderRow}>
          <div className={styles.sectionLabel}>
            <History size={12} className={styles.sectionIcon} />
            <span>HỘI THOẠI GẦN ĐÂY</span>
          </div>
          {sessions.length > 0 && (
            <span className={styles.sessionCountBadge}>{sessions.length}</span>
          )}
        </div>

        {sessions.length > 0 ? (
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
        ) : (
          <p className={styles.emptyHistoryNote}>
            Các cuộc trò chuyện sẽ tự động lưu tại đây.
          </p>
        )}
      </nav>

      {historyError && (
        <div className={styles.historyErrorBox} role="status">
          {historyError}
        </div>
      )}

      {/* Slim 1-line Quick Topics */}
      <div className={styles.slimShortcutsBlock}>
        <div className={styles.sectionLabel}>
          <Sparkles size={12} className={styles.sectionIcon} />
          <span>LỐI TẮT</span>
        </div>
        <div className={styles.slimShortcutsList}>
          {SLIM_SHORTCUTS.map((item) => {
            const matchedPrompt =
              prompts.find((p) => p.includes(item.match)) ?? item.label;
            const Icon = item.icon;
            return (
              <button
                key={item.match}
                type="button"
                disabled={loading}
                onClick={() => onSelect(matchedPrompt)}
                className={styles.slimShortcutBtn}
              >
                <Icon size={14} className={styles.slimShortcutIcon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.sidebarSpacer} />

      {/* Minimal Live Status Footer */}
      <div className={styles.sidebarFooterPill}>
        <Radio size={12} className={styles.aiRadarPulseIcon} />
        <span>1,200+ điểm đến · GPS &amp; OSRM</span>
      </div>
    </div>
  );
}
