import { Menu, PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import BotLogo from "../BotLogo";
import styles from "./ChatPage.module.css";

export default function ChatHeader({
  loading,
  status,
  onReset,
  onOpenSidebar,
  onOpenSummary,
  onTogglePanel,
  panelVisible,
}: {
  loading: boolean;
  status: string;
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
        <Menu size={19} />
      </button>
      <div className={styles.headerAvatar}>
        <BotLogo size={42} animated={!reduce} />
        <span />
      </div>
      <div className={styles.headerTitle}>
        <h1>
          Gô <span>AI BOT</span>
        </h1>
        <p>
          {loading ? (
            status
          ) : (
            <>
              <i />
              Trợ lý du lịch Đà Nẵng · Trực tuyến
            </>
          )}
        </p>
      </div>
      <div className={styles.headerActions}>
        <button
          type="button"
          className={styles.headerButton}
          onClick={onReset}
          aria-label="Cuộc trò chuyện mới"
          title="Cuộc trò chuyện mới"
        >
          <RotateCcw size={17} />
        </button>
        <button
          type="button"
          className={`${styles.headerButton} ${styles.desktopOnly}`}
          onClick={onTogglePanel}
          aria-label={
            panelVisible ? "Thu gọn chuyến đi của bạn" : "Mở chuyến đi của bạn"
          }
          aria-expanded={panelVisible}
        >
          {panelVisible ? (
            <PanelRightClose size={18} />
          ) : (
            <PanelRightOpen size={18} />
          )}
        </button>
        <button
          type="button"
          className={`${styles.headerButton} ${styles.compactOnly}`}
          onClick={onOpenSummary}
          aria-label="Mở chuyến đi của bạn"
        >
          <PanelRightOpen size={18} />
        </button>
      </div>
    </header>
  );
}
