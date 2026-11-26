/**
 * DanangGo — Motion Design System 5.0
 *
 * Hệ thống token chuyển động thống nhất toàn website theo chuẩn
 * Next-Gen Immersive Travel Experience (Apple / Airbnb / Luxury Travel).
 */

import type { Transition, Variants } from "framer-motion";

// ── 1. DURATION TOKENS (seconds for Framer Motion, ms for CSS) ──────────────
// Aligned with Motion Level 01 (Micro), 02 (Component), 03 (Editorial), 04 (Cinematic)
export const DURATION = {
  instant: 0.12,   // 120ms — Micro-feedback (button press, toggle)
  fast: 0.22,      // 220ms — Level 01 Micro (hover highlight, tooltip, chip select)
  normal: 0.34,    // 340ms — Level 01/02 (Modal, dropdown, page transition)
  medium: 0.55,    // 550ms — Level 02 Component (card, panel, image hover)
  slow: 0.95,      // 950ms — Level 03 Editorial (typography, section reveal)
  editorial: 1.2,  // 1200ms — Level 03 Editorial (clip-path image mask reveal)
  cinematic: 1.85, // 1850ms — Level 04 Cinematic (Hero camera opening, image expansion)
} as const;

export const DURATION_MS = {
  instant: 120,
  fast: 220,
  normal: 340,
  medium: 550,
  slow: 950,
  editorial: 1200,
  cinematic: 1850,
} as const;

// ── 2. EASING CURVES ────────────────────────────────────────────────────────
export const EASING = {
  /** Чуẩn tương tác hiện đại, mượt mà tự nhiên — cubic-bezier(0.22, 1, 0.36, 1) */
  standard: [0.22, 1, 0.36, 1] as const,
  /** Чуẩn xuất hiện điện ảnh, thư thái (power3.out / Luxury Travel Entrance) */
  entrance: [0.16, 1, 0.3, 1] as const,
  /** Чуẩn chuyển cảnh đối xứng (cubic-bezier(0.65, 0, 0.35, 1)) */
  editorialInOut: [0.65, 0, 0.35, 1] as const,
  /** Чуẩn power4.out cho Hero Monumental Reveal */
  power4Out: [0.19, 1, 0.22, 1] as const,
  /** Чуẩn đóng / thoát nhanh gọn */
  exit: [0.4, 0, 1, 1] as const,
} as const;

// ── 3. SPRING CONFIGURATIONS ────────────────────────────────────────────────
export const SPRING = {
  /** Phản hồi nút bấm, icon, tab indicator */
  snappy: {
    type: "spring",
    stiffness: 420,
    damping: 30,
    mass: 0.8,
  } satisfies Transition,
  /** Chuyển động card, layout reflow */
  gentle: {
    type: "spring",
    stiffness: 260,
    damping: 28,
    mass: 1,
  } satisfies Transition,
  /** Tương tác từ tính (Magnetic CTA) */
  magnetic: {
    type: "spring",
    stiffness: 190,
    damping: 16,
    mass: 0.4,
  } satisfies Transition,
} as const;

// ── 4. REUSABLE VARIANTS ────────────────────────────────────────────────────

/** Hero Background Reveal: scale(1.05) -> scale(1) trong 1.5s */
export const heroImageRevealVariants: Variants = {
  hidden: { scale: 1.05 },
  visible: {
    scale: 1,
    transition: {
      duration: DURATION.cinematic,
      ease: EASING.entrance,
    },
  },
};

/** Scroll Reveal tiêu chuẩn cho Section (fade-up 20px, 500ms) */
export const scrollRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.medium,
      ease: EASING.standard,
    },
  },
};

/** Stagger Container (giới hạn tổng thời gian stagger cho danh sách dài) */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.075,
      delayChildren: 0.04,
    },
  },
};

/** Item trong Stagger Grid (không scale chữ để giữ độ sắc nét 100%) */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.medium,
      delay: Math.min(index % 6, 5) * 0.075, // Giới hạn tối đa 375ms mỗi hàng
      ease: EASING.standard,
    },
  }),
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: DURATION.fast,
      ease: EASING.exit,
    },
  },
};

/** Modal / Popup chuẩn: opacity 0->1 + scale 0.97->1 trong 260ms */
export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.standard,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: {
      duration: DURATION.fast,
      ease: EASING.exit,
    },
  },
};

/** Dropdown chuẩn: fade-down 6px trong 200ms */
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: EASING.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: {
      duration: DURATION.fast,
      ease: EASING.exit,
    },
  },
};
