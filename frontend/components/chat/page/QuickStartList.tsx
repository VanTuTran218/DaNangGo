import {
  ArrowUpRight,
  BedDouble,
  Camera,
  Compass,
  Fish,
  Utensils,
} from "lucide-react";
import styles from "./ChatPage.module.css";

/** Labels are presentation only; the exact existing chip text is passed through. */
const appearances = [
  {
    match: "thanh đạm",
    title: "Khẩu vị thanh đạm",
    subtitle: "Quán có món được gắn nhãn thanh đạm",
    icon: Utensils,
    tone: "teal",
  },
  {
    match: "món cay",
    title: "Bạn thích ăn cay?",
    subtitle: "Tìm món theo khẩu vị trong dữ liệu",
    icon: Utensils,
    tone: "orange",
  },
  {
    match: "lịch",
    title: "Lên lịch trình",
    subtitle: "Sắp xếp một chuyến đi vừa ý",
    icon: Compass,
    tone: "teal",
  },
  {
    match: "Mì",
    title: "Ăn gì ở Đà Nẵng?",
    subtitle: "Khám phá hương vị địa phương",
    icon: Utensils,
    tone: "orange",
  },
  {
    match: "Khách",
    title: "Tìm một chỗ nghỉ",
    subtitle: "Chọn nơi lưu trú cho chuyến đi",
    icon: BedDouble,
    tone: "sky",
  },
  {
    match: "tham quan",
    title: "Đi đâu, check-in gì?",
    subtitle: "Gợi ý những điểm đến để khám phá",
    icon: Camera,
    tone: "teal",
  },
  {
    match: "Hải",
    title: "Hải sản hợp túi tiền",
    subtitle: "Tìm theo khu vực và ngân sách",
    icon: Fish,
    tone: "orange",
  },
];

export default function QuickStartList({
  prompts,
  onSelect,
  disabled = false,
  compact = false,
}: {
  prompts: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const ordered = [...prompts].sort(
    (a, b) => Number(b.includes("lịch")) - Number(a.includes("lịch")),
  );
  return (
    <div className={compact ? styles.shortcutList : styles.quickGrid}>
      {ordered.map((prompt) => {
        const look = appearances.find((item) => prompt.includes(item.match));
        const Icon = look?.icon ?? Compass;
        return (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            className={compact ? styles.shortcut : styles.quickCard}
          >
            <span className={styles.topicIcon} data-tone={look?.tone ?? "teal"}>
              <Icon size={compact ? 18 : 21} strokeWidth={1.7} />
            </span>
            <span className={styles.quickCopy}>
              <strong>{look?.title ?? prompt}</strong>
              {!compact && (
                <span>
                  {look?.subtitle ?? "Bắt đầu cuộc trò chuyện với Gô"}
                </span>
              )}
            </span>
            <ArrowUpRight size={15} className={styles.quickArrow} />
          </button>
        );
      })}
    </div>
  );
}
