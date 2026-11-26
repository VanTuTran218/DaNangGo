import { Compass, Menu, PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import ProfileMemory from "../ProfileMemory";
import BotLogo from "../BotLogo";
import styles from "./ChatPage.module.css";

export default function ChatHeader({
  loading,
  status,
  hasPlan = false,
  onReset,
  onOpenSidebar,
  onOpenSummary,
  onTogglePanel,
  panelVisible,
}: {
  loading: boolean;
  status: string;
  hasPlan?: boolean;
  onReset: () => void;
  onOpenSidebar: () => void;
  onOpenSummary: () => void;
  onTogglePanel: () => void;
  panelVisible: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <header className={styles.chatHeader}>
      <button
        type="button"
        onClick={onOpenSidebar}
        className={`${styles.headerButton} ${styles.compactOnly}`}
        aria-label="Mở lối tắt trò chuyện"
      >
        <Menu size={18} />
      </button>
      <div className={styles.headerAvatar}>
        <BotLogo size={38} animated={!reduce} />
        <span className={styles.onlineBadge} />
      </div>
      <div className={styles.headerTitle}>
        <h1>
          Gô <span>AI CONCIERGE</span>
        </h1>
        <p>
          {loading ? (
            status
          ) : (
            <>
              <i />
              Trực tuyến 24/7 · Dữ liệu Đà Nẵng
            </>
          )}
        </p>
      </div>
      <div className={styles.headerActions}>
        <ProfileMemory theme="dark" />
        <button
          type="button"
          className={styles.headerButton}
          onClick={onReset}
          aria-label="Cuộc trò chuyện mới"
          title="Cuộc trò chuyện mới (⌘K)"
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          className={`${styles.planTogglePill} ${styles.desktopOnly}`}
          data-active={panelVisible}
          onClick={onTogglePanel}
          aria-label={
            panelVisible ? "Thu gọn hành trình của bạn" : "Mở hành trình của bạn"
          }
          aria-expanded={panelVisible}
        >
          <Compass size={14} />
          <span>{hasPlan ? "Lịch trình" : "Hành trình"}</span>
          {panelVisible ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>
        <button
          type="button"
          className={`${styles.headerButton} ${styles.compactOnly}`}
          onClick={onOpenSummary}
          aria-label="Mở hành trình của bạn"
        >
          <PanelRightOpen size={17} />
        </button>
      </div>
    </header>
  );
}
