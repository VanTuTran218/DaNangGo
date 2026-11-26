"use client";

/**
 * useScrollReveal — Pure CSS scroll-reveal via IntersectionObserver
 *
 * Thêm class .is-revealed vào elements có class .reveal-fade-up,
 * .reveal-fade-left, .reveal-fade-right, hoặc .reveal-scale
 * khi chúng vào viewport.
 *
 * Usage:
 *   useScrollReveal(); // trong layout hoặc page component
 *
 *   <div className="reveal-fade-up reveal-delay-2">...</div>
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_CLASSES = [
  ".reveal-fade-up",
  ".reveal-fade-left",
  ".reveal-fade-right",
  ".reveal-scale",
].join(",");

export function useScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Respect user reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = Array.from(document.querySelectorAll(REVEAL_CLASSES));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            // Unobserve after reveal (once)
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "60px 0px -20px 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]); // Re-run on route change
}

export default useScrollReveal;
