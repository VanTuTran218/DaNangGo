import { useLayoutEffect, type RefObject } from "react";
import { ArrowUp, LocateFixed, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatLocation } from "@/types/chat";
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
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          key={text}
          onClick={() => onSend(text)}
        >
          <Sparkles size={11} />
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
  showSuggestions = true,
  location,
  locationStatus,
  locating,
  onLocate,
  onRadius,
  onClearLocation,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: (text?: string) => void;
  loading: boolean;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  suggestions: string[];
  showSuggestions?: boolean;
  location?: ChatLocation;
  locationStatus?: string;
  locating?: boolean;
  onLocate: () => void;
  onRadius: (radius: 2 | 5 | 10) => void;
  onClearLocation: () => void;
}) {
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input instanceof HTMLTextAreaElement) {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
    }
  }, [value, inputRef]);

  return (
    <div className={styles.composerArea}>
      <div className={styles.composerWrap}>
        {/* Active GPS context bar (shown only when locating, active, or status present) */}
        {(location || locationStatus) && (
          <div className={styles.activeLocationBar}>
            {location && (
              <>
                <span className={styles.activeLocationTag}>
                  <LocateFixed size={12} />
                  Quanh vị trí bạn
                </span>
                <label className={styles.locationRadiusLabel}>
                  Bán kính
                  <select
                    aria-label="Bán kính tìm quanh đây"
                    value={location.radiusKm}
                    onChange={(e) =>
                      onRadius(Number(e.target.value) as 2 | 5 | 10)
                    }
                  >
                    {[2, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} km
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.locationClearBtn}
                  onClick={onClearLocation}
                >
                  Tắt
                </button>
              </>
            )}
            {locationStatus && (
              <small className={styles.locationStatusBadge} role="status">
                {locationStatus}
              </small>
            )}
          </div>
        )}

        {/* Follow-up suggestions only after conversation starts (no duplication on Empty State!) */}
        {showSuggestions && (
          <SuggestionChips
            suggestions={suggestions}
            onSend={onSend}
            loading={loading}
          />
        )}

        <form
          className={styles.composer}
          data-loading={loading ? "true" : "false"}
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <button
            type="button"
            className={styles.composerGpsBtn}
            data-active={Boolean(location)}
            disabled={locating || loading}
            onClick={onLocate}
            title={locating ? "Đang định vị GPS…" : "Tìm quanh vị trí tôi"}
            aria-label={locating ? "Đang định vị GPS" : "Tìm quanh vị trí tôi"}
          >
            <LocateFixed size={17} />
          </button>

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
            placeholder="Kể Gô nghe chuyến đi bạn muốn… (VD: 3 ngày 2 đêm cho 2 người, ngân sách 4tr)"
            aria-label="Nhắn cho Gô"
          />

          <motion.button
            type="submit"
            className={styles.composerSendBtn}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            disabled={!value.trim() || loading}
            aria-label="Gửi tin nhắn"
          >
            <ArrowUp size={20} />
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
    </div>
  );
}
