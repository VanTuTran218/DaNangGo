"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  BedDouble,
  Camera,
  Compass,
  Fish,
  Utensils,
  Sparkles,
} from "lucide-react";
import styles from "./ChatPage.module.css";

export interface QuickPromptAppearance {
  match: string;
  category: "all" | "itinerary" | "food" | "stay";
  categoryLabel: string;
  title: string;
  subtitle: string;
  icon: typeof Compass;
  tone: "teal" | "amber" | "sky";
}

/** Labels are presentation only; the exact existing chip text is passed through. */
const appearances: QuickPromptAppearance[] = [
  {
    match: "lịch",
    category: "itinerary",
    categoryLabel: "Lịch trình",
    title: "Lên lịch trình chuyến đi",
    subtitle: "Sắp xếp theo ngày, buổi & tối ưu tuyến",
    icon: Compass,
    tone: "teal",
  },
  {
    match: "tham quan",
    category: "itinerary",
    categoryLabel: "Khám phá",
    title: "Đi đâu, check-in gì?",
    subtitle: "Danh thắng và điểm chụp hình đẹp",
    icon: Camera,
    tone: "teal",
  },
  {
    match: "Mì",
    category: "food",
    categoryLabel: "Ẩm thực",
    title: "Ăn gì ở Đà Nẵng?",
    subtitle: "Mì Quảng, bánh xèo & đặc sản phố cổ",
    icon: Utensils,
    tone: "amber",
  },
  {
    match: "Hải",
    category: "food",
    categoryLabel: "Ẩm thực",
    title: "Hải sản hợp túi tiền",
    subtitle: "Tìm theo khu vực Sơn Trà & Mỹ Khê",
    icon: Fish,
    tone: "amber",
  },
  {
    match: "thanh đạm",
    category: "food",
    categoryLabel: "Ẩm thực",
    title: "Khẩu vị thanh đạm",
    subtitle: "Món luộc, canh cá & chay dưỡng sinh",
    icon: Utensils,
    tone: "teal",
  },
  {
    match: "món cay",
    category: "food",
    categoryLabel: "Ẩm thực",
    title: "Bạn thích ăn cay?",
    subtitle: "Bún bò cay nồng & ốc hút đậm vị",
    icon: Utensils,
    tone: "amber",
  },
  {
    match: "Khách",
    category: "stay",
    categoryLabel: "Lưu trú",
    title: "Tìm khách sạn, villa",
    subtitle: "Gần biển, trung tâm hoặc view sông Hàn",
    icon: BedDouble,
    tone: "sky",
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "itinerary", label: "Lịch trình" },
  { key: "food", label: "Ẩm thực" },
  { key: "stay", label: "Lưu trú" },
] as const;

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
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const ordered = [...prompts].sort(
    (a, b) => Number(b.includes("lịch")) - Number(a.includes("lịch")),
  );

  const filtered =
    compact && activeCategory !== "all"
      ? ordered.filter((prompt) => {
          const item = appearances.find((app) => prompt.includes(app.match));
          return item?.category === activeCategory;
        })
      : ordered;

  return (
    <div className={compact ? styles.compactPromptWrapper : styles.quickGridWrapper}>
      {compact && (
        <div className={styles.categoryFilterBar} role="tablist" aria-label="Phân loại gợi ý">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.key}
              className={styles.categoryTab}
              data-active={activeCategory === cat.key}
              onClick={() => setActiveCategory(cat.key)}
              disabled={disabled}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className={compact ? styles.shortcutList : styles.quickGrid}>
        {filtered.map((prompt) => {
          const look = appearances.find((item) => prompt.includes(item.match));
          const Icon = look?.icon ?? Compass;
          const tone = look?.tone ?? "teal";

          return (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(prompt)}
              className={compact ? styles.shortcut : styles.quickCard}
              data-tone={tone}
            >
              <div className={styles.topicIcon} data-tone={tone}>
                <Icon size={compact ? 17 : 20} strokeWidth={1.8} />
              </div>

              <div className={styles.quickCopy}>
                <div className={styles.quickTitleRow}>
                  <strong>{look?.title ?? prompt}</strong>
                  {compact && look?.categoryLabel && (
                    <span className={styles.microCategoryBadge} data-tone={tone}>
                      {look.categoryLabel}
                    </span>
                  )}
                </div>
                <span>
                  {look?.subtitle ?? "Hỏi Gô để nhận gợi ý tức thì"}
                </span>
              </div>

              <span className={styles.quickArrowWrap} aria-hidden="true">
                <ArrowUpRight size={compact ? 13 : 15} className={styles.quickArrow} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
