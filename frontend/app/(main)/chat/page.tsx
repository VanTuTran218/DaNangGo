"use client";

import ChatBox from "@/components/chat/ChatBox";
import AiOracleBackdrop from "@/components/chat/page/AiOracleBackdrop";
import styles from "@/components/chat/page/ChatPage.module.css";

export default function ChatPage() {
  return (
    <div className={styles.page} data-navbar-overlay="true">
      <AiOracleBackdrop />
      <ChatBox variant="page" />
    </div>
  );
}
