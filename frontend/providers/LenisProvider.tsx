"use client";

/**
 * LenisProvider — Smooth scroll via Lenis library
 * - Pauses rAF loop when tab is hidden
 * - Properly cancels rAF on cleanup
 * - Exposes lenis instance via context for programmatic scroll
 * - Resets scroll position smoothly on route change
 */
import { useEffect, useRef, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Prevent over-scroll at top/bottom for clean page transitions
      overscroll: false,
    });

    lenisRef.current = lenis;

    let rafId: number | null = null;

    function raf(time: number) {
      if (document.hidden) {
        rafId = null;
        return;
      }
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    const startLoop = () => {
      if (rafId === null && !document.hidden) {
        rafId = requestAnimationFrame(raf);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startLoop();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopLoop();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top on route change (smooth, instant if lenis not ready)
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      // Stop any in-progress scroll, then jump to top
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.start();
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
