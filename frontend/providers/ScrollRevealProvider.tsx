"use client";

/**
 * ScrollRevealProvider — Kích hoạt CSS scroll-reveal toàn trang
 * Dùng IntersectionObserver để thêm class .is-revealed vào các phần tử có
 * .reveal-fade-up / .reveal-fade-left / .reveal-fade-right / .reveal-scale
 *
 * Mounted một lần trong root layout. Re-observe khi route change.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTORS = ".reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-scale, .divider-animate";

export default function ScrollRevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Show all immediately
      document.querySelectorAll(SELECTORS).forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const els = Array.from(document.querySelectorAll(SELECTORS));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.04, rootMargin: "60px 0px -20px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
