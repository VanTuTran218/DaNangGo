import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import BotLogo from "../BotLogo";
import QuickStartList from "./QuickStartList";
import styles from "./ChatPage.module.css";

export default function EmptyState({
  welcome,
  prompts,
  onSelect,
  loading,
}: {
  welcome: ReactNode;
  prompts: string[];
  onSelect: (text: string) => void;
  loading: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyMascot}>
        <span />
        <span className={styles.mascotAura} />
        <BotLogo size={92} animated={!reduce} />
        <span className={styles.sparkle}>
          <Sparkles size={18} />
        </span>
      </div>
      <div className={styles.eyebrow}>
        <Sparkles size={11} />
        <span>BẠN ĐỒNG HÀNH Ở ĐÀ NẴNG</span>
      </div>
      <h2>
        Một lời nhắn,
        <br />
        <span>mở ra cả chuyến đi.</span>
      </h2>
      <div className={styles.welcomeCopy}>{welcome}</div>
      <QuickStartList
        prompts={prompts}
        onSelect={onSelect}
        disabled={loading}
      />
      <p className={styles.emptyHint}>
        Chọn một gợi ý để bắt đầu, hoặc kể Gô nghe chuyến đi bạn muốn.
      </p>
    </div>
  );
}
