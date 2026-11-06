import { useLayoutEffect, type RefObject } from "react";
import { ArrowUp, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./ChatPage.module.css";

export function SuggestionChips({
  suggestions,
  onSend,
  loading,
}: {
  suggestions: string[];
  onSend: (text: string) => void;
  loading: boolean;
}) {
  if (!suggestions.length || loading) return null;
  return (
    <div className={styles.suggestions} aria-label="Gợi ý tiếp theo">
      {suggestions.map((text) => (
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          key={text}
          onClick={() => onSend(text)}
        >
          <Sparkles size={12} />
          <span>{text}</span>
        </motion.button>
      ))}
    </div>
  );
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  loading,
  inputRef,
  suggestions,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: (text?: string) => void;
  loading: boolean;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  suggestions: string[];
}) {
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input instanceof HTMLTextAreaElement) {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 136)}px`;
    }
  }, [value, inputRef]);
  return (
    <div className={styles.composerArea}>
      <SuggestionChips
        suggestions={suggestions}
        onSend={onSend}
        loading={loading}
      />
      <form
        className={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <MessageCircle size={19} className={styles.composerIcon} />
        <textarea
          ref={inputRef as RefObject<HTMLTextAreaElement | null>}
          value={value}
          maxLength={500}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Kể Gô nghe chuyến đi bạn muốn…"
          aria-label="Nhắn cho Gô"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={!value.trim() || loading}
          aria-label="Gửi tin nhắn"
        >
          <ArrowUp size={22} />
        </motion.button>
      </form>
      <div className={styles.composerFooter}>
        <p>
          <span className={styles.safetyDot} />
          Gô có thể sai sót · Hãy kiểm tra lại giờ mở cửa trước khi đến
        </p>
        <span className={styles.charCounter} aria-label={`${value.length} trên 500 ký tự`}>
          {value.length}/500
        </span>
      </div>
    </div>
  );
}
