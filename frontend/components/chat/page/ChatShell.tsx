"use client";

import { useRef, type ReactNode } from "react";
import styles from "./ChatPage.module.css";

export default function ChatShell({
  sidebar,
  summary,
  panelVisible,
  loading = false,
  children,
}: {
  sidebar: ReactNode;
  summary: ReactNode;
  panelVisible: boolean;
  loading?: boolean;
  children: ReactNode;
}) {
  const shellRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    shellRef.current.style.setProperty("--mx", `${x.toFixed(1)}%`);
    shellRef.current.style.setProperty("--my", `${y.toFixed(1)}%`);
    shellRef.current.style.setProperty("--m-spot", "1");
  };

  const handlePointerLeave = () => {
    shellRef.current?.style.setProperty("--m-spot", "0");
  };

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-summary={panelVisible ? "open" : "closed"}
      data-thinking={loading ? "true" : "false"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* Subtle whisper-soft ambient cursor sheen & corner viewfinder hairlines */}
      <span className={styles.shellSpotlight} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerTL}`} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerTR}`} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerBL}`} aria-hidden="true" />
      <span className={`${styles.cornerBracket} ${styles.cornerBR}`} aria-hidden="true" />

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
