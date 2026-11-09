import type { ReactNode } from "react";
import styles from "./ChatPage.module.css";

export default function ChatShell({
  sidebar,
  summary,
  panelVisible,
  children,
}: {
  sidebar: ReactNode;
  summary: ReactNode;
  panelVisible: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.shell}
      data-summary={panelVisible ? "open" : "closed"}
    >
      <aside
        className={styles.leftSidebar}
        aria-label="Lối tắt trò chuyện"
        data-lenis-prevent
      >
        {sidebar}
      </aside>
      <div className={styles.chatColumn}>{children}</div>
      {panelVisible && (
        <aside
          className={styles.rightSidebar}
          aria-label="Tóm tắt chuyến đi"
          data-lenis-prevent
        >
          {summary}
        </aside>
      )}
    </div>
  );
}
