"use client";

/**
 * HeroSlideContext — chia sẻ trạng thái slide hero cho Navbar
 * Dùng để đồng bộ màu tint navbar với ảnh hero đang active.
 *
 * heroSlides: alpha giảm xuống 0.28-0.32 để ảnh hero "xuyên" qua navbar rõ hơn.
 *   Slide 1 (Mỹ Khê - biển xanh):  rgba(10, 40, 60, 0.30)
 *   Slide 2 (Cầu Vàng - vàng/núi): rgba(30, 58, 74, 0.30)
 *   Slide 3 (Cầu Rồng - đêm tối):  rgba(5,  20, 40, 0.28)
 */

import { createContext, useContext, useState, ReactNode } from "react";

export interface HeroSlide {
  /** Màu tint rgba cho navbar — alpha thấp để glass xuyên thấu */
  navColor: string;
  label: string;
}

export const heroSlides: HeroSlide[] = [
  {
    label: "Bãi biển Mỹ Khê",
    navColor: "rgba(10, 40, 60, 0.30)",
  },
  {
    label: "Cầu Vàng Bà Nà Hills",
    navColor: "rgba(30, 58, 74, 0.30)",
  },
  {
    label: "Cầu Rồng Đà Nẵng",
    navColor: "rgba(5, 20, 40, 0.28)",
  },
];

interface HeroSlideContextValue {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  navColor: string;
}

const HeroSlideContext = createContext<HeroSlideContextValue>({
  activeIndex: 0,
  setActiveIndex: () => {},
  navColor: heroSlides[0].navColor,
});

export function HeroSlideProvider({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const navColor = heroSlides[activeIndex]?.navColor ?? heroSlides[0].navColor;

  return (
    <HeroSlideContext.Provider value={{ activeIndex, setActiveIndex, navColor }}>
      {children}
    </HeroSlideContext.Provider>
  );
}

export function useHeroSlide() {
  return useContext(HeroSlideContext);
}
