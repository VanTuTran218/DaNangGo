"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Compass,
  MapPin,
  Search,
  Star,
  TrendingUp,
  Utensils,
  Hotel,
  Landmark,
  Sparkles,
  Coffee,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  getPlaces,
  getTopPlaces,
  type PlaceListItem,
  type PlaceType,
} from "@/lib/api/places";
import HeartButton from "@/components/HeartButton";
import SiteFooter from "@/components/places/SiteFooter";
import ExploreAmbientBackdrop from "@/components/places/ExploreAmbientBackdrop";
import MysteryConstellationAtlas from "@/components/places/MysteryConstellationAtlas";
import MysteryVeilCards from "@/components/places/MysteryVeilCards";
import EditorialIndexList from "@/components/places/EditorialIndexList";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import { DURATION, EASING, SPRING } from "@/lib/motion-tokens";

// ─── ĐƯỜNG DẪN ẢNH NỀN HERO KHÁM PHÁ (TOÀN CẢNH BỜ BIỂN MỸ KHÊ ĐÀ NẴNG TỪ TRÊN CAO) ───
export const KHAM_PHA_HERO_IMAGE =
  "/images/cinematic/hero/hero-coastal-panorama.jpg";

// ─── Cấu hình bộ lọc theo loại địa điểm ──────────────────────────────────────
const DIRECTORY_MODES: {
  value: PlaceType | "";
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "",
    label: "Tất cả địa điểm",
    icon: <Compass size={15} />,
  },
  {
    value: "RESTAURANT",
    label: "Top nhà hàng",
    icon: <Utensils size={15} />,
  },
  {
    value: "ACCOMMODATION",
    label: "Top lưu trú",
    icon: <Hotel size={15} />,
  },
  {
    value: "ATTRACTION",
    label: "Top điểm du lịch",
    icon: <Landmark size={15} />,
  },
];

// ─── Badge theo place_type (Deep Ocean Luxury Tone) ───────────────────────────
const TYPE_BADGE: Record<
  string,
  { label: string; icon: React.ReactNode; dotColor: string }
> = {
  RESTAURANT: {
    label: "Nhà hàng",
    icon: <Utensils size={11} className="text-[#E6D9B7]" />,
    dotColor: "bg-[#E87B39]",
  },
  ACCOMMODATION: {
    label: "Lưu trú",
    icon: <Hotel size={11} className="text-[#E6D9B7]" />,
    dotColor: "bg-[#C9B580]",
  },
  ATTRACTION: {
    label: "Điểm du lịch",
    icon: <Landmark size={11} className="text-[#E6D9B7]" />,
    dotColor: "bg-[#69A5A3]",
  },
  CAFE: {
    label: "Cà phê",
    icon: <Coffee size={11} className="text-[#E6D9B7]" />,
    dotColor: "bg-[#EAB47D]",
  },
};

function resolveImageSrc(raw?: string | null): string | null {
  if (!raw || !raw.trim() || raw.includes("place-placeholder")) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("/uploads/")) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${apiBase}${trimmed}`;
  }
  return trimmed;
}

// Tính nhịp bất đối xứng Editorial Bento (7+5 rồi 4+4+4, tự cân hàng cuối để không bao giờ trống lẻ)
function getEditorialBentoSpan(index: number, total: number): {
  colSpanClass: string;
  heightClass: string;
  isWideFeature: boolean;
} {
  if (total === 1) {
    return {
      colSpanClass: "sm:col-span-2 lg:col-span-12",
      heightClass: "h-[430px] sm:h-[470px]",
      isWideFeature: true,
    };
  }
  if (total === 2) {
    return {
      colSpanClass: "sm:col-span-1 lg:col-span-6",
      heightClass: "h-[430px] sm:h-[460px]",
      isWideFeature: false,
    };
  }
  if (total === 3) {
    return {
      colSpanClass: "sm:col-span-1 lg:col-span-4",
      heightClass: "h-[425px] sm:h-[445px]",
      isWideFeature: false,
    };
  }

  const groupStart = Math.floor(index / 5) * 5;
  const remainingInGroup = total - groupStart;
  const pos = index % 5;

  // Nếu nhóm cuối chỉ còn 1 thẻ lẻ -> dàn rộng điện ảnh 12 cột
  if (remainingInGroup === 1) {
    return {
      colSpanClass: "sm:col-span-2 lg:col-span-12",
      heightClass: "h-[420px] sm:h-[450px]",
      isWideFeature: true,
    };
  }
  // Nếu nhóm cuối còn 2 thẻ -> 7 + 5 bất đối xứng
  if (remainingInGroup === 2) {
    return pos === 0
      ? {
          colSpanClass: "sm:col-span-2 lg:col-span-7",
          heightClass: "h-[435px] sm:h-[465px]",
          isWideFeature: true,
        }
      : {
          colSpanClass: "sm:col-span-2 lg:col-span-5",
          heightClass: "h-[435px] sm:h-[465px]",
          isWideFeature: false,
        };
  }
  // Nếu nhóm cuối còn 3 thẻ -> bộ 3 cân đối 4+4+4
  if (remainingInGroup === 3) {
    return {
      colSpanClass: "sm:col-span-1 lg:col-span-4",
      heightClass: "h-[420px] sm:h-[440px]",
      isWideFeature: false,
    };
  }
  // Nếu nhóm cuối còn 4 thẻ -> hàng 1 (7+5), hàng 2 (6+6)
  if (remainingInGroup === 4) {
    if (pos === 0) {
      return {
        colSpanClass: "sm:col-span-2 lg:col-span-7",
        heightClass: "h-[435px] sm:h-[465px]",
        isWideFeature: true,
      };
    }
    if (pos === 1) {
      return {
        colSpanClass: "sm:col-span-2 lg:col-span-5",
        heightClass: "h-[435px] sm:h-[465px]",
        isWideFeature: false,
      };
    }
    return {
      colSpanClass: "sm:col-span-1 lg:col-span-6",
      heightClass: "h-[425px] sm:h-[450px]",
      isWideFeature: false,
    };
  }

  // Nhóm đủ 5 thẻ: hàng trên 7 + 5 (đảo chiều xen kẽ mỗi chu kỳ 10 thẻ), hàng dưới 4 + 4 + 4
  const reverseWide = Math.floor(index / 5) % 2 === 1;
  if (pos === 0) {
    return {
      colSpanClass: reverseWide ? "sm:col-span-2 lg:col-span-5" : "sm:col-span-2 lg:col-span-7",
      heightClass: "h-[435px] sm:h-[465px]",
      isWideFeature: !reverseWide,
    };
  }
  if (pos === 1) {
    return {
      colSpanClass: reverseWide ? "sm:col-span-2 lg:col-span-7" : "sm:col-span-2 lg:col-span-5",
      heightClass: "h-[435px] sm:h-[465px]",
      isWideFeature: reverseWide,
    };
  }
  return {
    colSpanClass: "sm:col-span-1 lg:col-span-4",
    heightClass: "h-[420px] sm:h-[440px]",
    isWideFeature: false,
  };
}

// ─── Card địa điểm (Luminous Atelier Lens: 3D Micro-Tilt, Spotlight, Corner Viewfinder & 2.5D Depth) ──
function PlaceCard({
  place,
  index,
  isTopMode,
  heightClass = "h-[430px] sm:h-[455px]",
  isWideFeature = false,
}: {
  place: PlaceListItem;
  index: number;
  isTopMode: boolean;
  heightClass?: string;
  isWideFeature?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const cardElRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const canHoverRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    canHoverRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      canHoverRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (reducedMotion || !canHoverRef.current || !cardElRef.current) return;
    rectRef.current = cardElRef.current.getBoundingClientRect();
    cardElRef.current.classList.add("is-tilting");
    cardElRef.current.style.setProperty("--spot-opacity", "1");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || !canHoverRef.current || !cardElRef.current) return;
    const rect = rectRef.current ?? cardElRef.current.getBoundingClientRect();
    rectRef.current = rect;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardElRef.current;
      if (!el) return;
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const nx = Math.max(-0.5, Math.min(0.5, localX / rect.width - 0.5));
      const ny = Math.max(-0.5, Math.min(0.5, localY / rect.height - 0.5));

      // Subtle luxury 3D tilt (±3.4deg X, ±4.4deg Y) + opposite 2.5D image parallax (±7px)
      const rx = (-ny * 6.8).toFixed(2);
      const ry = (nx * 8.8).toFixed(2);
      const px = (-nx * 14).toFixed(1);
      const py = (-ny * 10).toFixed(1);

      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--px", `${px}px`);
      el.style.setProperty("--py", `${py}px`);
      el.style.setProperty("--mx", `${localX.toFixed(1)}px`);
      el.style.setProperty("--my", `${localY.toFixed(1)}px`);
      rafRef.current = null;
    });
  };

  const handleMouseDown = () => {
    const el = cardElRef.current;
    if (!el) return;
    el.style.setProperty("--spot-opacity", "0");
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rectRef.current = null;
    const el = cardElRef.current;
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
    el.style.setProperty("--spot-opacity", "0");
  };

  const badge = TYPE_BADGE[place.place_type] ?? {
    label: place.place_type,
    icon: <Compass size={11} className="text-[#E6D9B7]" />,
    dotColor: "bg-[#E87B39]",
  };

  const resolvedSrc = resolveImageSrc(place.cover_image);
  const showImage = Boolean(resolvedSrc) && !imgFailed;
  const orderLabel = String(index + 1).padStart(2, "0");

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.56,
        delay: reducedMotion ? 0 : Math.min(index, 8) * 0.055,
        ease: EASING.entrance,
      }}
      className="h-full"
    >
      <article
        ref={cardElRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        className={`group explore-card-item relative luxury-card-surface luxury-border-sweep luxury-shimmer-frame rounded-[16px] bg-[#091D26] overflow-hidden ${heightClass} flex flex-col cursor-pointer select-none`}
      >
        {/* Subtle Champagne top rim reflection */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-20 bg-gradient-to-r from-transparent via-[#E6D9B7]/50 to-transparent"
        />

        {/* Cursor-Following Champagne Specular Spotlight (pure GPU radial light) */}
        <div
          aria-hidden="true"
          className="explore-card-spotlight pointer-events-none absolute inset-0 z-15 rounded-[inherit]"
        />

        {/* Editorial Corner Viewfinder Brackets (unfold subtly on hover) */}
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#E6D9B7]/80 rounded-tl-[4px] z-25"
        />
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r border-[#E6D9B7]/80 rounded-tr-[4px] z-25"
        />
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b border-l border-[#E6D9B7]/80 rounded-bl-[4px] z-25"
        />
        <span
          aria-hidden="true"
          className="explore-corner-bracket pointer-events-none absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b border-r border-[#E6D9B7]/80 rounded-br-[4px] z-25"
        />

        {/* Favorite Heart Button — kept outside Link so clicks never trigger navigation */}
        <div className="absolute top-4 right-4 z-30 transition-transform duration-200 hover:scale-105 active:scale-95">
          <HeartButton placeId={place.place_id} />
        </div>

        <Link
          href={`/places/${place.place_id}`}
          onClick={() =>
            recordSharedPlaceClick(place.place_id, resolvedSrc ?? undefined)
          }
          aria-label={`Xem chi tiết ${place.name}`}
          className="relative flex flex-col justify-between w-full h-full outline-none focus-visible:ring-1 focus-visible:ring-[#C9B580]/70 focus-visible:ring-inset"
        >
          {/* Full-Bleed Image Layer with 2.5D Counter-Parallax Depth */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#091D26]">
            {showImage && resolvedSrc ? (
              <div className="explore-card-media relative w-full h-full">
                <Image
                  src={resolvedSrc}
                  alt={place.name}
                  fill
                  unoptimized={resolvedSrc.startsWith("http")}
                  onError={() => setImgFailed(true)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="explore-card-media absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 65% at 50% 34%, rgba(33,107,112,0.52) 0%, rgba(16,40,50,0.92) 60%, #081A22 100%)",
                }}
              >
                <div className="w-14 h-14 rounded-full bg-[#FFF8E9]/8 border border-[#E6D9B7]/30 flex items-center justify-center mb-3">
                  <Compass size={24} className="text-[#E6D9B7]" aria-hidden="true" />
                </div>
                <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/75">
                  DANANGGO CURATED
                </span>
              </div>
            )}

            {/* Velvety Deep-Ocean Multi-Stop Editorial Vignette */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(7,22,30,0.46) 0%, rgba(7,22,30,0.06) 28%, rgba(7,22,30,0.14) 46%, rgba(7,22,30,0.74) 68%, rgba(6,19,26,0.93) 85%, rgba(5,16,22,0.98) 100%)",
              }}
            />
          </div>

          {/* Top Bar: Type Pill Badge & Top Rank Badge */}
          <div className="relative z-20 pt-4 px-4 pr-16 flex flex-wrap items-center gap-2 transition-transform duration-400 ease-out group-hover:translate-y-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#081C25]/72 backdrop-blur-xs border border-[#E6D9B7]/30 group-hover:border-[#E6D9B7]/70 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#FFFDF5]/95 shadow-[0_4px_14px_rgba(4,14,20,0.32)] transition-colors">
              {badge.icon}
              <span>{badge.label}</span>
            </span>

            {isTopMode && index < 3 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#CB712D]/92 backdrop-blur-xs border border-[#F6C89F]/40 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#FFFDF5] shadow-[0_4px_12px_rgba(203,113,45,0.35)]">
                <TrendingUp size={11} />
                <span>Top #{index + 1}</span>
              </span>
            )}
          </div>

          {/* Bottom Editorial Content Overlay (subtle upward elevation on hover) */}
          <div className="relative z-20 mt-auto p-5 sm:p-6 flex flex-col justify-end transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
            {/* Category Indicator & ORYZO Number (Hollow Outline -> Solid Pearl on hover) */}
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]">
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} shrink-0`} />
                <span>{badge.label}</span>
              </span>

              <div
                aria-hidden="true"
                className="flex items-center gap-1.5 select-none shrink-0"
              >
                <span className="w-4 h-[1px] bg-[#E6D9B7]/65 transition-all duration-400 ease-out group-hover:w-7 group-hover:bg-[#E87B39]" />
                <span className="oryzo-card-number text-[15px] tracking-[0.14em] leading-none">
                  {orderLabel}
                </span>
              </div>
            </div>

            {/* Place Title */}
            <h2
              style={{
                fontFamily: isWideFeature
                  ? "var(--font-editorial-serif), 'Playfair Display', Georgia, serif"
                  : "var(--font-editorial-sans), var(--font-display), 'Be Vietnam Pro', sans-serif",
                textShadow: "0 2px 14px rgba(5,16,22,0.72)",
              }}
              className={`line-clamp-2 font-semibold tracking-[-0.01em] text-[#FFFDF5] transition-colors duration-300 group-hover:text-[#F5E6C4] mb-2 ${
                isWideFeature
                  ? "text-2xl sm:text-[26px] leading-[1.24]"
                  : "text-[19px] sm:text-[20px] leading-[1.32]"
              }`}
            >
              {place.name}
            </h2>

            {/* Address */}
            <p className="flex items-start gap-1.5 text-xs sm:text-[13px] leading-5 text-[#D5E4E4]/85 mb-4 min-h-9">
              <MapPin
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[#C9B580]"
              />
              <span className="line-clamp-2">
                {place.address || "Đà Nẵng, Việt Nam"}
              </span>
            </p>

            {/* Kinetic Champagne -> Sunset Coral Divider Sweep on Hover */}
            <div className="relative w-full h-[1px] bg-[#E6D9B7]/22 overflow-hidden mb-3.5">
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-550 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-[#E87B39] via-[#E6D9B7] to-transparent"
              />
            </div>

            {/* Baseline: Rating + Double-Arrow Kinetic CTA */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Star
                  size={13.5}
                  aria-hidden="true"
                  className="fill-[#E87B39] text-[#E87B39] shrink-0"
                />
                <span className="font-semibold text-[#FFFDF5] text-[13px]">
                  {Number(place.avg_rating).toFixed(1)}
                </span>
                <span className="text-[#CBD9DA]/55 text-xs">·</span>
                <span className="text-[#CBD9DA]/80 text-xs">
                  {place.review_count} đánh giá
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F2DFB4] group-hover:text-[#FFFDF5] transition-colors shrink-0">
                <span>Chi tiết</span>
                <span className="relative inline-flex w-4 h-4 items-center justify-center overflow-hidden">
                  <ArrowRight
                    size={13.5}
                    aria-hidden="true"
                    className="explore-arrow-out absolute"
                  />
                  <ArrowRight
                    size={13.5}
                    aria-hidden="true"
                    className="explore-arrow-in absolute text-[#E87B39]"
                  />
                </span>
              </span>
            </div>
          </div>
        </Link>
      </article>
    </motion.div>
  );
}

// ─── Component chính ──────────────────────────────────────────────────────────
export default function PlaceDirectory() {
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<"editorial" | "index">("editorial");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topType, setTopType] = useState<PlaceType | "">("");
  const reducedMotion = useReducedMotion();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const conciergeRef = useRef<HTMLDivElement>(null);
  const conciergeRafRef = useRef<number | null>(null);

  const handleConciergeMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !conciergeRef.current) return;
    const rect = conciergeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (conciergeRafRef.current !== null) cancelAnimationFrame(conciergeRafRef.current);
    conciergeRafRef.current = requestAnimationFrame(() => {
      const el = conciergeRef.current;
      if (!el) return;
      el.style.setProperty("--cx", `${x.toFixed(1)}px`);
      el.style.setProperty("--cy", `${y.toFixed(1)}px`);
      el.style.setProperty("--c-spot", "1");
      conciergeRafRef.current = null;
    });
  };

  const handleConciergeLeave = () => {
    if (conciergeRafRef.current !== null) {
      cancelAnimationFrame(conciergeRafRef.current);
      conciergeRafRef.current = null;
    }
    conciergeRef.current?.style.setProperty("--c-spot", "0");
  };

  useEffect(() => {
    return () => {
      if (conciergeRafRef.current !== null) cancelAnimationFrame(conciergeRafRef.current);
    };
  }, []);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroParallaxY = useTransform(
    heroScrollProgress,
    [0, 1],
    reducedMotion ? ["0px", "0px"] : ["0px", "26px"]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPlaces([]);
    const request = topType
      ? getTopPlaces(topType)
      : getPlaces({ limit: 50 }).then((res) => res.items);
    request
      .then((items) => {
        if (!cancelled) setPlaces(items.filter((p) => p.status === "ACTIVE"));
      })
      .catch((loadError: unknown) => {
        if (!cancelled)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải danh sách địa điểm."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topType]);

  const filteredPlaces = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase("vi");
    if (!normalized) return places;
    return places.filter((place) =>
      `${place.name} ${place.address ?? ""} ${place.place_type}`
        .toLocaleLowerCase("vi")
        .includes(normalized)
    );
  }, [keyword, places]);

  const activeModeLabel =
    DIRECTORY_MODES.find((m) => m.value === topType)?.label ?? "Tất cả địa điểm";

  return (
    <div
      ref={pageContainerRef}
      className="min-h-screen dananggo-cinematic-content relative overflow-x-clip flex flex-col justify-between text-[#FFFDF5]"
      style={{
        background:
          "linear-gradient(180deg, #06151C 0%, #081C25 46%, #051219 100%)",
      }}
    >
      {/* ── HIỆU ỨNG BACKGROUND ĐA TẦNG (Aman × White Desert × ORYZO, 60fps GPU-only) ── */}
      <ExploreAmbientBackdrop
        activeType={topType}
        containerRef={pageContainerRef}
      />

      {/* ── 1. HERO SECTION ĐẦU TRANG (White Desert × Aman Cinematic Panorama) ── */}
      <section
        ref={heroRef}
        data-navbar-overlay="true"
        aria-label="Khám Phá Đà Nẵng"
        className="relative z-10 w-full h-[460px] sm:h-[510px] lg:h-[560px] overflow-hidden flex items-end select-none bg-[#081C25]"
      >
        {/* Hero Image with Slow Opening Pull-Back & Gentle Scroll Parallax */}
        <motion.div
          className="absolute -inset-y-4 inset-x-0 z-0 will-change-transform"
          style={{ y: heroParallaxY }}
          initial={reducedMotion ? { scale: 1 } : { scale: 1.07 }}
          animate={{ scale: 1 }}
          transition={{
            duration: DURATION.cinematic,
            ease: EASING.entrance,
          }}
        >
          <Image
            src={KHAM_PHA_HERO_IMAGE}
            alt="Cảnh đẹp thành phố biển Đà Nẵng"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-[50%_42%]"
          />
        </motion.div>

        {/* Subtle ORYZO Topographic Contour Lines Overlay */}
        <img
          src="/images/intro/atmosphere/intro-coastal-contours.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-1 w-full h-full object-cover opacity-50"
        />

        {/* Animated Breathing Golden Mist & Sunrise Crown inside Hero */}
        <div
          aria-hidden="true"
          className="explore-hero-mist pointer-events-none absolute -inset-x-[6%] inset-y-0 z-1"
          style={{
            background:
              "radial-gradient(ellipse 62% 52% at 74% 24%, rgba(234,180,125,0.34) 0%, rgba(201,171,120,0.14) 46%, transparent 76%), radial-gradient(ellipse 52% 48% at 22% 72%, rgba(105,165,163,0.22) 0%, transparent 72%)",
          }}
        />

        {/* Deep Ocean Multi-Stop Scrim for Navbar & Monumental Typography Contrast */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-2"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,28,37,0.68) 0%, rgba(10,32,41,0.26) 40%, rgba(8,26,35,0.48) 72%, rgba(6,21,28,0.80) 90%, #06151C 100%)",
          }}
        />

        {/* Nội dung Hero */}
        <div className="relative z-10 home-container w-full pb-24 sm:pb-28 pt-28">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08, ease: EASING.standard }}
                className="inline-flex items-center gap-3 mb-4"
              >
                <span className="w-8 h-[1.5px] bg-[#E87B39]" aria-hidden="true" />
                <Sparkles size={13} className="text-[#E6D9B7]" />
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#E6D9B7]">
                  CẨM NANG ĐỊA ĐIỂM DU LỊCH ĐÀ NẴNG
                </span>
              </motion.div>

              <motion.h1
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.68, delay: 0.16, ease: EASING.entrance }}
                style={{ textShadow: "0 8px 28px rgba(4,14,20,0.55)" }}
                className="cinematic-condensed uppercase font-bold text-[#FFFDF5] text-[clamp(2.85rem,6.5vw,5.75rem)] leading-[0.98] tracking-[-0.02em]"
              >
                Khám Phá{" "}
                <span className="home-serif italic font-normal text-[#E6D9B7] normal-case pr-2">
                  Đà Nẵng
                </span>
              </motion.h1>

              <motion.p
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.24, ease: EASING.entrance }}
                className="mt-4 text-sm sm:text-base text-[#E2ECEC]/88 max-w-2xl leading-relaxed border-l-2 border-[#C9B580] pl-4"
              >
                Từ những bãi biển cát trắng miên man đến những ngọn núi hùng vĩ,
                Đà Nẵng lưu giữ hàng trăm kỳ quan chờ bạn khám phá.
              </motion.p>
            </div>

            {/* Coordinate & Live Curated Counter */}
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: EASING.standard }}
              className="hidden lg:flex flex-col items-end text-right shrink-0 pb-1"
            >
              <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]/85">
                16°04&apos;N &middot; 108°13&apos;E
              </span>
              <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-[#FFF8E9]/10 backdrop-blur-xs border border-[#E6D9B7]/30 px-3.5 py-1.5 text-xs font-medium text-[#FFFDF5]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
                <span>
                  {loading
                    ? "Đang tải điểm đến..."
                    : `${places.length} điểm đến chọn lọc`}
                </span>
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. NỘI DUNG CHÍNH: ATELIER COASTAL CONCIERGE CONSOLE + FULL-BLEED GALLERY ── */}
      <section className="home-container relative z-10 w-full mb-24">
        {/* Khối Search / Filter (Frosted Smoked Glass Concierge Console) */}
        <motion.div
          ref={conciergeRef}
          onMouseMove={handleConciergeMove}
          onMouseLeave={handleConciergeLeave}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: EASING.standard }}
          className="explore-concierge-console relative -mt-16 sm:-mt-20 rounded-[22px] bg-gradient-to-br from-[#0F2C38]/38 via-[#081D27]/28 to-[#06161F]/42 backdrop-blur-2xl backdrop-saturate-150 border border-[#E6D9B7]/28 p-5 sm:p-6 lg:p-7 shadow-[0_24px_64px_rgba(2,10,15,0.42),inset_0_1px_0_rgba(255,253,245,0.18),inset_0_-1px_0_rgba(230,217,183,0.08)] mb-12 overflow-hidden"
        >
          {/* Top & bottom subtle Champagne glass rim reflections */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFFDF5]/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/25 to-transparent"
          />

          {/* Subtle frosted crystal top-left frost wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,253,245,0.075) 0%, rgba(255,253,245,0.015) 38%, rgba(6,21,28,0.14) 100%)",
            }}
          />

          {/* Subtle coastal contour texture inside console */}
          <img
            src="/images/intro/atmosphere/intro-coastal-contours.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.07]"
          />

          {/* Dynamic Category Mood Glow inside Console */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{
              background:
                topType === "RESTAURANT"
                  ? "radial-gradient(ellipse 52% 95% at 88% 20%, rgba(232,123,57,0.16) 0%, transparent 72%)"
                  : topType === "ACCOMMODATION"
                    ? "radial-gradient(ellipse 52% 95% at 88% 20%, rgba(201,181,128,0.18) 0%, transparent 72%)"
                    : topType === "ATTRACTION"
                      ? "radial-gradient(ellipse 52% 95% at 88% 20%, rgba(105,165,163,0.20) 0%, transparent 72%)"
                      : "radial-gradient(ellipse 52% 95% at 88% 20%, rgba(201,181,128,0.15) 0%, rgba(33,107,112,0.10) 48%, transparent 74%)",
            }}
          />

          {/* Whisper-soft cursor sheen */}
          <div
            aria-hidden="true"
            className="explore-concierge-spotlight pointer-events-none absolute inset-0 rounded-[inherit]"
          />

          {/* 4 Delicate Architectural Corner Ticks echoing the card viewfinder motif */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#E6D9B7]/45 rounded-tl-[3px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#E6D9B7]/45 rounded-tr-[3px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#E6D9B7]/45 rounded-bl-[3px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#E6D9B7]/45 rounded-br-[3px]"
          />

          {/* Hàng 1: Sculpted Command Search Bar với Medallion Icon & Gợi ý nhanh */}
          <div className="relative z-10">
            <div
              className={`relative flex items-center rounded-full border backdrop-blur-md transition-all duration-300 ${
                isSearchFocused
                  ? "border-[#E6D9B7]/70 bg-[#06151C]/55 shadow-[0_0_0_3px_rgba(230,217,183,0.10),inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-[#E6D9B7]/24 bg-[#06151C]/34 hover:border-[#E6D9B7]/42 shadow-[inset_0_1px_2px_rgba(0,0,0,0.22)]"
              }`}
            >
              {/* Circular Champagne Search Medallion */}
              <span
                aria-hidden="true"
                className={`ml-2.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                  isSearchFocused
                    ? "bg-[#E87B39]/18 border-[#E87B39]/60 text-[#F3D299]"
                    : "bg-[#FFF8E9]/[0.07] border-[#E6D9B7]/25 text-[#E6D9B7]"
                }`}
              >
                <Search size={16} />
              </span>

              <input
                value={keyword}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên địa điểm, món ăn, địa chỉ..."
                aria-label="Tìm địa điểm"
                className="w-full bg-transparent py-3.5 pl-3.5 pr-4 text-sm sm:text-[15px] font-medium text-[#FFFDF5] outline-none placeholder:text-[#BFD1D3]/60"
              />

              {/* Quick Discovery Suggestion Chips (desktop, shown when input empty) or Clear Button */}
              <div className="pr-2.5 flex items-center gap-1.5 shrink-0">
                <AnimatePresence mode="wait">
                  {keyword ? (
                    <motion.button
                      key="clear-search"
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.16 }}
                      onClick={() => setKeyword("")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/18 border border-[#E6D9B7]/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#FFFDF5] transition-colors cursor-pointer"
                      aria-label="Xóa từ khóa"
                    >
                      <span>Xóa</span>
                      <X size={13} />
                    </motion.button>
                  ) : (
                    <motion.div
                      key="quick-chips"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="hidden lg:flex items-center gap-1.5"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7]/55 mr-1">
                        Gợi ý:
                      </span>
                      {["Mỹ Khê", "Sơn Trà", "Resort", "Hải sản"].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setKeyword(chip)}
                          className="rounded-full bg-[#FFF8E9]/[0.06] hover:bg-[#FFF8E9]/[0.15] border border-[#E6D9B7]/20 hover:border-[#E6D9B7]/55 px-3 py-1 text-[11px] font-medium text-[#DCE8E8] hover:text-[#FFFDF5] transition-all duration-200 cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Hàng 2: Sunken Segmented Category Dock + Live Counter Pill */}
          <div
            className="relative z-10 mt-4 pt-4 border-t border-[#E6D9B7]/14 flex flex-wrap items-center justify-between gap-3.5"
            aria-label="Chọn danh sách địa điểm"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]/78 mr-1 hidden sm:inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
                <span>Danh mục</span>
              </span>

              {/* Sunken Machined Frosted Glass Track */}
              <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)]">
                {DIRECTORY_MODES.map((mode) => {
                  const isActive = topType === mode.value;
                  return (
                    <motion.button
                      key={mode.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setTopType(mode.value);
                        setKeyword("");
                      }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-[13px] font-semibold transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? "text-[#102832]"
                          : "text-[#D4E3E4] hover:text-[#FFFDF5] hover:bg-white/[0.06]"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="khampha-active-filter"
                          transition={SPRING.snappy}
                          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FFFDF5] to-[#F3E7CE] shadow-[0_6px_18px_rgba(4,14,20,0.38)]"
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-2">
                        <span className={isActive ? "text-[#CB712D]" : "text-[#E6D9B7]/85"}>
                          {mode.icon}
                        </span>
                        <span>{mode.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: View Mode Toggle (Tạp chí ⇄ Mục lục) + Live Result Pill */}
            <div className="flex flex-wrap items-center gap-2.5 ml-auto">
              <div
                className="inline-flex items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20"
                role="group"
                aria-label="Chế độ hiển thị"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("editorial")}
                  aria-pressed={viewMode === "editorial"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    viewMode === "editorial"
                      ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/40"
                      : "text-[#CBD9DA]/70 hover:text-[#FFFDF5] border border-transparent"
                  }`}
                >
                  <LayoutGrid size={12.5} className="text-[#E6D9B7]" />
                  <span>Tạp chí</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("index")}
                  aria-pressed={viewMode === "index"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    viewMode === "index"
                      ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/40"
                      : "text-[#CBD9DA]/70 hover:text-[#FFFDF5] border border-transparent"
                  }`}
                >
                  <List size={12.5} className="text-[#E6D9B7]" />
                  <span>Mục lục</span>
                </button>
              </div>

              {!loading && !error && (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#051218]/34 backdrop-blur-md border border-[#E6D9B7]/22 px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
                  <motion.span
                    key={filteredPlaces.length}
                    initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs font-mono font-bold text-[#FFFDF5]"
                  >
                    {filteredPlaces.length}
                  </motion.span>
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/80">
                    điểm đến
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ghi chú Top ranking dạng dải kính hổ phách tinh tế */}
          <AnimatePresence>
            {topType && (
              <motion.div
                key="top-notice"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25, ease: EASING.standard }}
                className="relative z-10 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 rounded-[12px] bg-[#E87B39]/[0.10] border border-[#E6D9B7]/22 border-l-2 border-l-[#E87B39] px-4 py-2.5 text-xs sm:text-[13px] text-[#F4E6C8]">
                  <TrendingUp size={15} className="text-[#E87B39] shrink-0" />
                  <span>
                    Top 10 địa điểm có ít nhất 3 đánh giá đã duyệt. Xếp theo điểm
                    giảm dần; cùng điểm ưu tiên nơi có nhiều đánh giá hơn.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── TẦNG 1 & TẦNG 2: HẢI ĐỒ TINH TÚ & VÉN MÀN SƯƠNG (hiển thị khi không lọc từ khóa hẹp) ── */}
        {!loading && !error && !keyword.trim() && filteredPlaces.length >= 2 && (
          <>
            <MysteryConstellationAtlas
              places={filteredPlaces}
              resolveImageSrc={resolveImageSrc}
            />
            <MysteryVeilCards
              places={filteredPlaces}
              resolveImageSrc={resolveImageSrc}
            />
          </>
        )}

        {/* ── TẦNG 3: BỘ SƯU TẬP BẤT ĐỐI XỨNG HOẶC MỤC LỤC AWWWARDS ── */}
        {!loading && !error && filteredPlaces.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
                  <span className="w-6 h-[1px] bg-[#E87B39]" />
                  <span>
                    {keyword.trim()
                      ? `KẾT QUẢ TÌM KIẾM // ${activeModeLabel}`
                      : `CHƯƠNG 03 // BỘ SƯU TẬP BIÊN TẬP · ${activeModeLabel}`}
                  </span>
                </div>
                <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5]">
                  {viewMode === "editorial" ? (
                    <>
                      Triển lãm{" "}
                      <span className="italic font-normal text-[#E6D9B7]">
                        toàn bộ điểm đến
                      </span>
                    </>
                  ) : (
                    <>
                      Mục lục{" "}
                      <span className="italic font-normal text-[#E6D9B7]">
                        tọa độ tinh gọn
                      </span>
                    </>
                  )}
                </h2>
              </div>

              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/75">
                {keyword.trim()
                  ? `Tìm thấy ${filteredPlaces.length} kết quả cho "${keyword.trim()}"`
                  : `Hiển thị ${filteredPlaces.length} điểm đến nổi bật`}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="w-full h-[1px] bg-gradient-to-r from-[#E6D9B7]/45 via-[#E6D9B7]/18 to-transparent"
            />
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-12"
          >
            {[7, 5, 4, 4, 4].map((span, i) => (
              <div
                key={i}
                className={`flex h-[425px] flex-col justify-between overflow-hidden rounded-[16px] border border-[#E6D9B7]/18 bg-[#091E28] p-6 ${
                  span === 7
                    ? "sm:col-span-2 lg:col-span-7"
                    : span === 5
                      ? "sm:col-span-2 lg:col-span-5"
                      : "sm:col-span-1 lg:col-span-4"
                }`}
              >
                <div className="flex justify-between">
                  <div className="h-7 w-24 rounded-full bg-white/8" />
                  <div className="h-9 w-9 rounded-full bg-white/8" />
                </div>
                <div className="space-y-3">
                  <div className="h-3.5 w-24 rounded-full bg-[#E6D9B7]/15" />
                  <div className="h-6 w-4/5 rounded-[6px] bg-white/10" />
                  <div className="h-4 w-3/4 rounded-[6px] bg-white/8" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── LỖI ── */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="rounded-[14px] bg-rose-950/70 p-5 text-sm text-rose-200 border border-rose-500/35"
          >
            {error}
          </motion.p>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && !error && filteredPlaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[18px] border border-[#E6D9B7]/25 bg-[#081C25]/90 p-12 text-center text-[#CBD9DA]"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#FFF8E9]/10 border border-[#E6D9B7]/30 flex items-center justify-center text-[#E6D9B7]">
              <Compass size={26} />
            </div>
            <p className="home-serif text-xl font-semibold text-[#FFFDF5]">
              {places.length === 0
                ? topType
                  ? "Chưa có địa điểm đủ điều kiện xếp hạng."
                  : "Chưa có địa điểm ACTIVE trong cơ sở dữ liệu."
                : "Không tìm thấy địa điểm phù hợp."}
            </p>
            {keyword && (
              <>
                <p className="text-xs sm:text-sm text-[#CBD9DA]/80 mt-2">
                  Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
                </p>
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#102832] transition-colors cursor-pointer"
                >
                  Xóa từ khóa tìm kiếm
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* ── CHẾ ĐỘ 1: TRIỂN LÃM TẠP CHÍ BẤT ĐỐI XỨNG (EDITORIAL BENTO) ── */}
        {!loading && !error && filteredPlaces.length > 0 && viewMode === "editorial" && (
          <div className="explore-card-grid grid items-stretch gap-6 sm:gap-7 sm:grid-cols-2 lg:grid-cols-12">
            {filteredPlaces.map((place, i) => {
              const layout = getEditorialBentoSpan(i, filteredPlaces.length);
              return (
                <div
                  key={`${topType || "ALL"}-${place.place_id}`}
                  className={layout.colSpanClass}
                >
                  <PlaceCard
                    place={place}
                    index={i}
                    isTopMode={Boolean(topType)}
                    heightClass={layout.heightClass}
                    isWideFeature={layout.isWideFeature}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ── CHẾ ĐỘ 2: MỤC LỤC NGHỆ THUẬT AWWWARDS (HOVER-PREVIEW INDEX) ── */}
        {!loading && !error && filteredPlaces.length > 0 && viewMode === "index" && (
          <EditorialIndexList
            places={filteredPlaces}
            resolveImageSrc={resolveImageSrc}
          />
        )}
      </section>

      {/* ── 3. FOOTER Ở CUỐI TRANG ── */}
      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  );
}
