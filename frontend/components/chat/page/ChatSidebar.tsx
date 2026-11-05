import { useState, useEffect } from "react";
import type { ChatSessionSummary } from "@/types/chat";
import { Lightbulb, Plus, Sparkles, Waves } from "lucide-react";
import QuickStartList from "./QuickStartList";
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
    "Cho Gô biết ngân sách, số ngày và số khách để tư vấn sát chuyến đi hơn.",
    "Thử ghi rõ khẩu vị cay, ngọt hoặc thanh đạm khi tìm quán ăn.",
    "Bạn có thể nhờ Gô đổi khách sạn trong lịch trình vừa tạo.",
    "Giá hiển thị là tham khảo. Hãy xác nhận với cơ sở trước khi đặt dịch vụ.",
  ];
  const [tip, setTip] = useState(0),
    [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        setTip((i) => (i + 1) % 4);
    }, 12000);
    return () => clearInterval(timer);
  }, [paused]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const isToday = (date: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
      new Date(date),
    ) === today;
  return (
    <div className={styles.sidebarInner}>
      <div className={styles.sidebarBrand}>
        <span className={styles.brandMark}>
          <Waves size={21} />
        </span>
        <div>
          <strong>Gô đồng hành</strong>
          <span>Mỗi chuyến đi, một câu chuyện</span>
        </div>
      </div>
      <button type="button" onClick={onReset} className={styles.newChat}>
        <Plus size={18} />
        Cuộc trò chuyện mới
      </button>
      <div className={styles.sectionLabel}>
        <Sparkles size={13} /> BẮT ĐẦU NHANH
      </div>
      <QuickStartList
        compact
        prompts={prompts}
        onSelect={onSelect}
        disabled={loading}
      />
      {sessions.length > 0 && (
        <nav
          className={styles.conversationHistory}
          aria-label="Lịch sử hội thoại"
        >
          {["Hôm nay", "Trước đó"].map((label, index) => {
            const rows = sessions.filter(
              (s) => isToday(s.updatedAt) === (index === 0),
            );
            return rows.length ? (
              <div key={label}>
                <h3>{label}</h3>
                {rows.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    aria-current={sessionId === s.id ? "true" : undefined}
                    disabled={loading}
                    onClick={() => onOpenSession(s.id)}
                    title={s.title}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            ) : null;
          })}
          <small>
            Khách: lưu tạm 1 giờ hoặc đến khi máy chủ khởi động lại. Đăng nhập:
            lưu theo tài khoản. Hiển thị tối đa 50 hội thoại.
          </small>
        </nav>
      )}
      {historyError && <p role="status">{historyError}</p>}
      <div className={styles.sidebarSpacer} />
      <div className={styles.coastCard} aria-hidden="true">
        <span className={styles.coastSun} />
        <svg viewBox="0 0 240 100" fill="none">
          <path
            d="M-10 55Q50 5 120 45T250 30V110H-10Z"
            fill="currentColor"
            opacity=".13"
          />
          <path
            d="M-10 75Q60 25 125 65T250 50V110H-10Z"
            fill="currentColor"
            opacity=".18"
          />
          <path
            d="M-10 95Q60 45 125 85T250 70V110H-10Z"
            fill="currentColor"
            opacity=".25"
          />
        </svg>
        <p>
          Đà Nẵng đang chờ.
          <br />
          <strong>Đi cùng Gô nhé!</strong>
        </p>
      </div>
      <div className={styles.tip}>
        <Lightbulb size={17} />
        <p>
          {tips[tip]}
          <button
            type="button"
            onClick={() => setTip((i) => (i + 1) % tips.length)}
            aria-label="Mẹo tiếp theo"
          >
            Mẹo khác →
          </button>
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
          >
            {paused ? "Tiếp tục" : "Dừng đổi mẹo"}
          </button>
        </p>
      </div>
    </div>
  );
}
