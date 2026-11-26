"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { DURATION, EASING, SPRING } from "@/lib/motion-tokens";

// ── 1. GLOBAL SCROLL PROGRESS BAR (Ẩn trên trang Bản đồ / Chat / Chi tiết đã có thanh riêng) ──
export function GlobalScrollProgress() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 30,
    restDelta: 0.001,
  });

  // Không hiển thị trên trang Bản đồ, Chat toàn màn hình, hoặc trang Chi tiết (đã có ScrollProgressBar riêng)
  if (
    reducedMotion ||
    !pathname ||
    pathname.startsWith("/bando") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/places/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/partner")
  ) {
    return null;
  }

  const isHomePage = pathname === "/";

  return (
    <motion.div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left pointer-events-none ${
        isHomePage
          ? "bg-[#E87B39]"
          : "bg-[#216B70]"
      }`}
      style={{ scaleX }}
    />
  );
}

// ── 2. SMOOTH PAGE TRANSITION WRAPPER ────────────────────────────────────────
// Route depth helper: shallow routes (1 level) slide up, deep routes fade
function getRouteDepth(pathname: string) {
  return pathname.split("/").filter(Boolean).length;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const depth = getRouteDepth(pathname);

  if (reducedMotion) {
    return <>{children}</>;
  }

  // Cinematic page transition: fade-in only (no exit fade to prevent white flash).
  // Using mode="sync" so old and new page momentarily coexist, eliminating body bg flash.
  const variants = {
    initial: depth > 1
      ? { opacity: 0, y: 10, scale: 0.996 }
      : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, scale: 1 },
    // No exit — old page is replaced instantly; only new page animates in.
    // This eliminates the white-flash gap between pages.
  };

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{
          duration: DURATION.normal,
          ease: EASING.entrance,
        }}
        style={{ minHeight: "1px" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ── 2b. PAGE LOAD BAR (Teal gradient chạy khi route thay đổi) ───────────────
export function PageLoadBar() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (reducedMotion) return;
    setKey((k) => k + 1);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(timer);
  }, [pathname, reducedMotion]);

  if (!visible || reducedMotion) return null;

  return (
    <div
      key={key}
      aria-hidden="true"
      className="page-transition-bar"
      style={{ zIndex: 9999 }}
    />
  );
}

// ── 3. SMOOTH PAGE TRANSITION WRAPPER ────────────────────────────────────────
interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // Mặc định 3px (nằm trong khoảng 2–4px theo chuẩn)
}

export function Magnetic({
  children,
  className = "inline-flex",
  strength = 3,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !canHover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = ((e.clientX - centerX) / (rect.width / 2)) * strength;
    const deltaY = ((e.clientY - centerY) / (rect.height / 2)) * strength;
    setOffset({
      x: Math.max(-strength, Math.min(strength, deltaX)),
      y: Math.max(-strength, Math.min(strength, deltaY)),
    });
  };

  const handleMouseLeave = () => {
    if (offset.x !== 0 || offset.y !== 0) {
      setOffset({ x: 0, y: 0 });
    }
  };

  if (reducedMotion || !canHover) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={SPRING.magnetic}
    >
      {children}
    </motion.div>
  );
}

// ── 4. INTERACTIVE SPOTLIGHT CARD WRAPPER (Ánh sáng xanh ngọc nhẹ theo chuột) ─
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !canHover || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={`relative ${className}`}
    >
      {canHover && !reducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: pos.active ? 1 : 0,
            background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(0, 184, 169, 0.08), transparent 75%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

// ── 5. SHARED ELEMENT TRANSITION MEMORY (Kết nối Card Thumbnail -> PlaceHero) ─
const SHARED_TRANSITION_KEY = "dananggo_shared_place_transition";

export interface SharedPlaceSnapshot {
  placeId: number;
  imageUrl: string;
  timestamp: number;
}

export function recordSharedPlaceClick(placeId?: number, imageUrl?: string) {
  if (typeof window === "undefined" || !placeId || !imageUrl) return;
  try {
    const payload: SharedPlaceSnapshot = {
      placeId,
      imageUrl,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(SHARED_TRANSITION_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
}

export function consumeSharedPlaceClick(placeId: number): SharedPlaceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SHARED_TRANSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SharedPlaceSnapshot;
    // Chỉ hợp lệ nếu đúng placeId và click trong vòng 5 giây gần nhất
    if (
      parsed &&
      Number(parsed.placeId) === Number(placeId) &&
      Date.now() - parsed.timestamp < 5000
    ) {
      window.sessionStorage.removeItem(SHARED_TRANSITION_KEY);
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}
