"use client";

import ChatBox from "@/components/chat/ChatBox";
import styles from "@/components/chat/page/ChatPage.module.css";

export default function ChatPage() {
  return (
    <div className={styles.page}>
      <svg
        className={styles.backgroundWave}
        viewBox="0 0 660 180"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M-20 80Q120 0 260 75T680 50M-20 115Q120 35 260 110T680 85M-20 150Q120 70 260 145T680 120"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <ChatBox variant="page" />
    </div>
  );
}
