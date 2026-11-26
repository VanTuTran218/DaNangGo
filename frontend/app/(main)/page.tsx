"use client";
import Link from "next/link";
import HeartButton from "@/components/HeartButton";

/**
 * DanangGo — Trang chủ (route "/")
 * Phong cách: DANANGGO — Cinematic Coastal Expedition (White Desert Inspired)
 *
 * Bảo toàn 100% nội dung gốc, dữ liệu SQL Server, event handlers, routing và Navbar.
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Mail, Phone, MapPin, Compass } from "lucide-react";
import { getPlaces } from "@/lib/api/places";
import { formatPriceRange } from "@/lib/mappers/place.mapper";
import Reveal from "@/components/ui/Reveal";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import {
  Magnetic,
  recordSharedPlaceClick,
} from "@/components/ui/MotionPrimitives";
import {
  CinematicImageMask,
  HairlineExpand,
  LineReveal,
  ScrollImageExpansion,
  SectionMistBridge,
  MouseDepthParallax,
} from "@/components/ui/CinematicMotion";
import WeekendEventsSection from "@/components/home/WeekendEventsSection";
import HomeHero from "@/components/home/HomeHero";
import ImmersiveDiscoverySection, {
  useHorizontalGalleryContext,
} from "@/components/home/ImmersiveDiscoverySection";
import OryzoVectorBridge from "@/components/home/OryzoVectorBridge";
import EditorialJourneyStage from "@/components/home/EditorialJourneyStage";
import ThreeWorldsCategories from "@/components/home/ThreeWorldsCategories";
import CinematicJourneyItinerary from "@/components/home/CinematicJourneyItinerary";
import CinematicClosingBanner from "@/components/home/CinematicClosingBanner";
import CinematicSectionTransition from "@/components/home/CinematicSectionTransition";
import { useAuth } from "@/contexts/AuthContext";
import {
  getManagedItineraries,
  type ManagedItineraryListItem,
} from "@/lib/api/itineraries";
import SurveyInviteCard from "@/components/survey/SurveyInviteCard";
import SurveyQuickSheet from "@/components/survey/SurveyQuickSheet";

// ============================================================
// DATA
// ============================================================

function resolvePlaceFallbackImage(
  title?: string | null,
  category?: string | null
): string {
  const norm = `${title || ""} ${category || ""}`.toLowerCase();
  if (norm.includes("furama")) {
    return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=90&auto=format&fit=crop";
  }
  if (norm.includes("naman")) {
    return "https://images.unsplash.com/photo-1540541338537-1220059b8aed?w=1600&q=90&auto=format&fit=crop";
  }
  if (norm.includes("mỹ khê") || norm.includes("my khe") || norm.includes("bãi biển")) {
    return "/images/partner/danang-my-khe-aerial.jpg";
  }
  if (norm.includes("linh ứng") || norm.includes("linh ung")) {
    return "/images/cinematic/discovery/sontra-sanctuary-cutout.jpg";
  }
  if (norm.includes("sơn trà") || norm.includes("son tra")) {
    return "/images/cinematic/hero/hero-sontra-mist.jpg";
  }
  if (norm.includes("ngũ hành sơn") || norm.includes("ngu hanh son")) {
    return "/images/cinematic/hero/hero-sontra-mist.jpg";
  }
  if (norm.includes("cầu rồng") || norm.includes("cau rong") || norm.includes("sông hàn")) {
    return "/images/partner/danang-dragon-bridge-night.jpg";
  }
  if (norm.includes("bà nà") || norm.includes("ba na") || norm.includes("cầu vàng")) {
    return "/hero/cau-vang-ba-na-hd.jpg";
  }
  if (norm.includes("hội an") || norm.includes("hoi an")) {
    return "/hero/pho-co-hoi-an-hd.jpg";
  }
  if (
    norm.includes("resort") ||
    norm.includes("hotel") ||
    norm.includes("khách sạn") ||
    norm.includes("lưu trú")
  ) {
    return "/images/luu-tru-hero.jpg";
  }
  if (
    norm.includes("ẩm thực") ||
    norm.includes("nhà hàng") ||
    norm.includes("bánh") ||
    norm.includes("mì") ||
    norm.includes("hải sản")
  ) {
    return "/images/cinematic/editorial/editorial-coastal-terrace.jpg";
  }
  return "/images/cinematic/hero/hero-coastal-panorama.jpg";
}

function upgradeHiResImage(
  url?: string | null,
  title?: string | null,
  category?: string | null
): string {
  const fallback = resolvePlaceFallbackImage(title, category);
  if (!url || !url.trim() || url.includes("place-placeholder")) {
    return fallback;
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/")) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${apiBase}${trimmed}`;
  }
  if (trimmed.includes("images.unsplash.com")) {
    return trimmed
      .replace(/([?&])w=\d+/g, "$1w=1600")
      .replace(/([?&])q=\d+/g, "$1q=90");
  }
  return trimmed;
}

const POPULAR_CARDS = [
  {
    id: 1,
    title: "Bãi biển Mỹ Khê",
    category: "Bãi biển",
    location: "Đà Nẵng",
    rating: 4.9,
    reviews: 2341,
    price: "Miễn phí",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=90&auto=format&fit=crop",
    badge: "🔥 Hot",
    badgeColor: "bg-red-500",
  },
  {
    id: 2,
    title: "Bánh Xèo Tôm Nhảy Chị Bảo",
    category: "Ẩm thực",
    location: "Đà Nẵng",
    rating: 4.8,
    reviews: 1893,
    price: "40.000₫",
    img: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=1600&q=90&auto=format&fit=crop",
    badge: "🍜 Đặc sản",
    badgeColor: "bg-orange-500",
  },
  {
    id: 3,
    title: "Cầu Rồng Phun Lửa & Phun Nước",
    category: "Điểm tham quan",
    location: "Đà Nẵng",
    rating: 4.9,
    reviews: 3102,
    price: "Miễn phí",
    img: "https://images.unsplash.com/photo-1701396173275-835886dd72ce?w=1600&q=90&auto=format&fit=crop",
    badge: "🏆 Nổi bật",
    badgeColor: "bg-yellow-500",
  },
  {
    id: 4,
    title: "Bà Nà Hills & Cầu Vàng",
    category: "Điểm tham quan",
    location: "Đà Nẵng",
    rating: 4.8,
    reviews: 1204,
    price: "từ 750.000₫",
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop",
    badge: "⭐ Top 1",
    badgeColor: "bg-teal-600",
  },
];

const CATEGORIES = [
  {
    id: "luutru",
    href: "/luutru",
    label: "Lưu Trú Nghỉ Dưỡng",
    desc: "Từ resort 5 sao view biển đến homestay cozy giữa phố cổ — tất cả chờ bạn.",
    count: 124,
    icon: "🏨",
    stat: "124 lựa chọn",
    cta: "Xem 124+ khách sạn",
    highlights: ["Resort 5★ mặt biển", "Villa hồ bơi riêng", "Boutique Homestay"],
    img: "/images/categories/category-hospitality-aman.jpg",
    color: "from-blue-600/70",
  },
  {
    id: "amthuc",
    href: "/amthuc",
    label: "Thiên Đường Ẩm Thực",
    desc: "Mì Quảng, bánh tráng cuốn thịt heo, bún mắm nêm — đặc sản không thể bỏ qua.",
    count: 89,
    icon: "🍜",
    stat: "89 nhà hàng",
    cta: "Khám phá ẩm thực",
    highlights: ["Mì Quảng truyền thống", "Hải sản tươi sống", "Ẩm thực chợ đêm"],
    img: "/images/categories/category-culinary-miquang.jpg",
    color: "from-orange-600/70",
  },
  {
    id: "diemdden",
    href: "/diemdulich",
    label: "Điểm Du Lịch & Check-in",
    desc: "Cầu Vàng, Cầu Rồng, Sơn Trà — những biểu tượng không thể thiếu trong hành trình.",
    count: 67,
    icon: "🗺️",
    stat: "67 điểm đến",
    cta: "Xem điểm check-in",
    highlights: ["Cầu Vàng Bà Nà", "Bán đảo Sơn Trà", "Ngũ Hành Sơn"],
    img: "/images/categories/category-discovery-golden-bridge.jpg",
    color: "from-teal-600/70",
  },
];

const ITINERARY_PLANS = {
  "3N2D": {
    label: "Lịch trình 3N2Đ (Cổ điển)",
    days: [
      {
        day: "Ngày 01",
        theme: "🌅 Biển & Phố Cổ",
        items: [
          { time: "07:00", activity: "Cà phê sáng ven biển Mỹ Khê" },
          { time: "09:00", activity: "Tham quan Bảo tàng Điêu khắc Chăm" },
          { time: "11:00", activity: "Ăn trưa: Mì Quảng Bà Mua đặc sản" },
          { time: "14:00", activity: "Ngắm Cầu Rồng, cầu Tình Yêu" },
          { time: "19:00", activity: "Xem Cầu Rồng phun lửa (T7, CN)" },
        ],
        duration: "Cả ngày",
        spots: 5,
      },
      {
        day: "Ngày 02",
        theme: "🚡 Bà Nà Hills",
        items: [
          { time: "07:30", activity: "Khởi hành lên Bà Nà Hills" },
          { time: "09:00", activity: "Đi cáp treo dài nhất thế giới" },
          { time: "10:30", activity: "Check-in Cầu Vàng huyền thoại" },
          { time: "12:30", activity: "Buffet tại Fantasy Park" },
          { time: "15:00", activity: "Phố Pháp cổ kính lãng mạn" },
        ],
        duration: "Cả ngày",
        spots: 6,
      },
      {
        day: "Ngày 03",
        theme: "🏮 Hội An & Bay Về",
        items: [
          { time: "08:00", activity: "Drive đến Hội An (45 phút)" },
          { time: "09:30", activity: "Dạo phố cổ, ngắm đèn lồng" },
          { time: "12:00", activity: "Cơm gà Hội An nổi tiếng" },
          { time: "14:30", activity: "Mua quà lưu niệm làng nghề" },
          { time: "17:00", activity: "Trở về sân bay Đà Nẵng" },
        ],
        duration: "Cả ngày",
        spots: 5,
      },
    ],
  },
  "4N3D": {
    label: "Lịch trình 4N3Đ (Trọn vẹn)",
    days: [
      {
        day: "Ngày 01",
        theme: "🌅 Khám Phá Đà Nẵng",
        items: [
          { time: "07:00", activity: "Cà phê view biển Mỹ Khê" },
          { time: "09:00", activity: "Bán đảo Sơn Trà — Chùa Linh Ứng" },
          { time: "12:00", activity: "Trưa: Bún mắm nêm đặc sản" },
          { time: "15:00", activity: "Bãi biển Mỹ Khê thư giãn" },
          { time: "18:00", activity: "Chợ Hàn — mua sắm đặc sản" },
        ],
        duration: "Cả ngày",
        spots: 5,
      },
      {
        day: "Ngày 02",
        theme: "🚡 Bà Nà Hills",
        items: [
          { time: "07:30", activity: "Khởi hành lên Bà Nà Hills" },
          { time: "09:00", activity: "Cáp treo + Cầu Vàng" },
          { time: "12:30", activity: "Buffet Fantasy Park" },
          { time: "14:00", activity: "Khu vui chơi Wax Village" },
          { time: "17:00", activity: "Xuống núi, nghỉ ngơi" },
        ],
        duration: "Cả ngày",
        spots: 6,
      },
      {
        day: "Ngày 03",
        theme: "🏮 Hội An Phố Cổ",
        items: [
          { time: "08:00", activity: "Drive đến Hội An" },
          { time: "09:30", activity: "Phố đi bộ Nguyễn Hoàng" },
          { time: "11:00", activity: "Học làm đèn lồng" },
          { time: "12:30", activity: "Cơm gà Phố Hội" },
          { time: "19:00", activity: "Đêm thả đèn hoa đăng" },
        ],
        duration: "Cả ngày",
        spots: 7,
      },
    ],
  },
} as const;

type PlanKey = keyof typeof ITINERARY_PLANS;

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HomePage() {
  const { user } = useAuth();
  const [completedItinerary, setCompletedItinerary] =
    useState<ManagedItineraryListItem | null>(null);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [popularCards, setPopularCards] =
    useState<((typeof POPULAR_CARDS)[number] & { placeId?: number })[]>(
      POPULAR_CARDS
    );
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("3N2D");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeCategoryStory, setActiveCategoryStory] = useState(0);

  const popularGalleryRef = useRef<HTMLDivElement>(null);
  const storySectionRef = useRef<HTMLElement>(null);
  const storyHeadingRef = useRef<HTMLHeadingElement>(null);
  const storySpreadRef = useRef<HTMLDivElement>(null);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isStoryHeadingInView = useInView(storyHeadingRef, {
    once: true,
    margin: "40px 0px -30px 0px",
  });
  const isStorySpreadInView = useInView(storySpreadRef, {
    once: true,
    margin: "40px 0px -40px 0px",
    amount: 0.15,
  });

  const [isStoryOutlineSolid, setIsStoryOutlineSolid] = useState(false);
  const [isStorySerifShimmering, setIsStorySerifShimmering] = useState(false);

  useEffect(() => {
    if (prefersReduced) {
      setIsStoryOutlineSolid(true);
      return;
    }
    if (!isStoryHeadingInView) return;
    const solidTimer = setTimeout(() => setIsStoryOutlineSolid(true), 280);
    const shimmerStartTimer = setTimeout(
      () => setIsStorySerifShimmering(true),
      640
    );
    const shimmerEndTimer = setTimeout(
      () => setIsStorySerifShimmering(false),
      2300
    );
    return () => {
      clearTimeout(solidTimer);
      clearTimeout(shimmerStartTimer);
      clearTimeout(shimmerEndTimer);
    };
  }, [isStoryHeadingInView, prefersReduced]);

  // Multi-layer Parallax for Editorial Story Section
  const { scrollYProgress: storyScrollProgress } = useScroll({
    target: storySectionRef,
    offset: ["start end", "end start"],
  });
  const storyImageY = useTransform(
    storyScrollProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [26, -26]
  );
  const storyFrameY = useTransform(
    storyScrollProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [-14, 14]
  );

  // Lấy các địa điểm nổi bật từ SQL Server: GET /api/places?limit=4&sort=rating_desc
  useEffect(() => {
    let isMounted = true;
    async function fetchPopular() {
      try {
        const res = await getPlaces({ limit: 4, sort: "rating_desc" });
        if (res && res.items && res.items.length > 0 && isMounted) {
          const liveCards = res.items.slice(0, 4).map((p) => ({
            id: p.place_id,
            placeId: p.place_id,
            title: p.name,
            category:
              p.category_name ||
              (p.place_type === "RESTAURANT" ? "Ẩm thực" : "Điểm tham quan"),
            location: p.district_name
              ? `${p.district_name}, Đà Nẵng`
              : p.address || "Đà Nẵng",
            rating: p.avg_rating || 4.8,
            reviews: p.review_count || 120,
            price: formatPriceRange(p.price_min, p.price_max, p.ticket_price),
            img: upgradeHiResImage(
              p.cover_image,
              p.name,
              p.category_name || p.place_type
            ),
            badge: p.promo_label || "🔥 Nổi bật",
            badgeColor: "bg-teal-600",
          }));

          const liveIds = new Set(liveCards.map((c) => c.id));
          const merged = [
            ...liveCards,
            ...POPULAR_CARDS.filter((c) => !liveIds.has(c.id)),
          ].slice(0, 4);
          setPopularCards(merged);
        }
      } catch {
        // Fallback POPULAR_CARDS
      }
    }
    fetchPopular();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getManagedItineraries()
      .then((items) => {
        if (!isMounted) return;
        const found = items.find((item) => {
          if (item.status === "DRAFT") return false;
          const endDate = new Date(`${item.startDate}T00:00:00`);
          endDate.setDate(endDate.getDate() + item.dayCount - 1);
          return endDate.getTime() <= Date.now() - 24 * 60 * 60 * 1000;
        });
        if (found) setCompletedItinerary(found);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollGallery = (direction: "prev" | "next") => {
    const el = popularGalleryRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.72);
    el.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  };

  const currentPlan = ITINERARY_PLANS[selectedPlan];

  return (
    <div className="home-luxury-root dananggo-cinematic-content bg-[#F8F8F4]">
      {/* ============================================================
          CHƯƠNG THỊ GIÁC 01 — THE ARRIVAL (HERO SECTION)
          ============================================================ */}
      <HomeHero />

      {/* ============================================================
          CHƯƠNG THỊ GIÁC 02 & 03 — V7.0 IMMERSIVE COASTAL DISCOVERY STAGE
          (Lando Norris Inspired Dual-Subject Cutouts + Kinetic Typography +
          Signature Brush Wave + Expedition Milestones + Popular Places Showcase)
          ============================================================ */}
      <ImmersiveDiscoverySection
        stats={[
          { to: 500, suffix: "+", label: "Địa điểm", coord: "01" },
          { to: 1500, suffix: "+", label: "Đánh giá", coord: "02" },
          { to: 98, suffix: "%", label: "Hài lòng", coord: "03" },
          { to: 50, suffix: "+", label: "Lịch trình mẫu", coord: "04" },
        ]}
        onScrollGallery={scrollGallery}
        galleryRef={popularGalleryRef}
        totalCards={popularCards.length}
        surveyNode={
          completedItinerary ? (
            <SurveyInviteCard
              itineraryId={completedItinerary.id}
              itineraryTitle={completedItinerary.title}
              onOpenQuickSheet={() => setQuickSheetOpen(true)}
            />
          ) : undefined
        }
      >
        {popularCards.map((card, i) => (
          <div
            key={card.id}
            className="w-[84vw] sm:w-[46vw] lg:w-[33.5vw] lg:min-w-[400px] lg:max-w-[500px] shrink-0 snap-start h-auto"
          >
            <Reveal
              delay={prefersReduced ? 0 : i * 0.08}
              className="h-full"
            >
              <PopularCard card={card} index={i} />
            </Reveal>
          </div>
        ))}
      </ImmersiveDiscoverySection>

      {/* Scene B — Coastal Light & Vector Trajectory Transition (Popular Destinations -> Weekend Events) */}
      <OryzoVectorBridge
        variant="ivory-to-sand"
        label="SCENE B // COASTAL LIGHT TRAJECTORY · 16°03'N"
      />

      {/* ============================================================
          V10.0 THE GOLDEN COASTAL JOURNEY (SHARED MULTI-LAYER STAGE)
          Unites:
          1. CUỐI TUẦN NÀY Ở ĐÀ NẴNG (WeekendEventsSection)
          2. GOLDEN JOURNEY WAVE BRIDGE (OryzoVectorBridge)
          3. CÂU CHUYỆN & CẢM HỨNG DU LỊCH (Chapter 04 Editorial Spread)
          ============================================================ */}
      <EditorialJourneyStage>
        {/* 3B. SCENE C — WEEKEND EVENTS ("Cuối tuần này ở Đà Nẵng") */}
        <WeekendEventsSection />

        {/* Scene D — Seamless Golden Journey Wave & SVG Point-at-Length Sun Traveler */}
        <OryzoVectorBridge
          variant="sand-to-ivory"
          label="SCENE D // EDITORIAL CHRONICLE ORBIT · 108°12'E"
        />

        {/* ============================================================
            CHƯƠNG THỊ GIÁC 04 (SCENE E) — THE IMMERSION ("Câu chuyện & Cảm hứng Du lịch")
            Asymmetric 12-Col Editorial Spread + Kinetic Typography + Editorial Image Expansion
            ============================================================ */}
        <section
          ref={storySectionRef}
          id="cauchuyenvacamhung"
          className="pt-8 pb-10 lg:pt-12 lg:pb-14 relative overflow-hidden"
        >
          <div className="home-container relative z-10">
            {/* Editorial 12-column header with V10.0 4-Phase Kinetic Typography (Sections 13, 14, 15, 21) */}
            <div className="grid lg:grid-cols-12 gap-6 items-end mb-10 lg:mb-14">
              <div className="lg:col-span-8">
                <motion.div
                  initial={{ opacity: 0.92, y: prefersReduced ? 0 : 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-3 mb-5"
                >
                  <span
                    className="w-7 h-[1.5px] bg-[#CB712D] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#35474C]">
                    KHÁM PHÁ ĐÀ NẴNG SÂU HƠN
                  </span>
                </motion.div>

                <h2
                  ref={storyHeadingRef}
                  className="leading-[1.12] tracking-[-0.02em]"
                >
                  <span className="block font-extrabold uppercase text-[#12383D] text-[clamp(2rem,4.3vw,3.5rem)]">
                    CÂU CHUYỆN &amp;
                  </span>
                  <span className="block mt-1 text-[clamp(2rem,4.3vw,3.5rem)]">
                    <span className="font-extrabold uppercase text-[#12383D]">
                      CẢM HỨNG{" "}
                    </span>
                    <span
                      style={{ color: "#CB712D", WebkitTextFillColor: "#CB712D" }}
                      className="inline-block home-serif italic font-normal text-[#CB712D] text-[clamp(2.15rem,4.6vw,3.75rem)] leading-[1.24] tracking-[0.01em] pr-2"
                    >
                      Du lịch
                    </span>
                  </span>
                </h2>
              </div>

              <div className="lg:col-span-4 lg:text-right">
                <motion.div
                  initial={{ opacity: 0.92, y: prefersReduced ? 0 : 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block lg:block"
                >
                  <span className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.22em] text-[#4E5E63]">
                    GÓC NHÌN &middot; TRẢI NGHIỆM &middot; CẢM HỨNG
                  </span>
                  <div className="mt-3 h-[1px] w-full lg:w-64 lg:ml-auto bg-[#E5D7C3] overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0.35 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{
                        duration: 0.75,
                        delay: 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full w-full origin-left bg-[#C9AB78]"
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Unified Full-Bleed 12-column editorial spread (7 cols open coastal panorama / 5 cols seamless Deep Ocean narrative) */}
            <div
              ref={storySpreadRef}
              className="group relative luxury-border-sweep luxury-shimmer-frame rounded-[18px] bg-[#081C25] border border-[#E6D9B7]/35 hover:border-[#E6D9B7]/80 shadow-[0_24px_64px_rgba(12,34,42,0.22)] hover:shadow-[0_32px_80px_rgba(12,34,42,0.32)] overflow-hidden transition-all duration-500"
            >
              {/* Subtle Champagne top rim reflection */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
              />

              {/* Full-Bleed Aerial Coastline Background with Internal Camera Parallax & Hover Zoom */}
              <div className="absolute inset-0 z-0 overflow-hidden bg-[#081C25]">
                <motion.div
                  style={{ y: storyImageY }}
                  className="relative w-full h-[112%] -top-[6%] will-change-transform"
                >
                  <div className="relative w-full h-full group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
                    <Image
                      src="/images/cinematic/hero/hero-coastal-panorama.jpg"
                      alt="Toàn cảnh vịnh biển Đà Nẵng"
                      fill
                      quality={90}
                      className="object-cover object-left lg:object-[28%_50%]"
                      sizes="(max-width: 1024px) 100vw, 1280px"
                    />
                  </div>
                </motion.div>

                {/* Desktop Horizontal Deep-Ocean Editorial Scrim (preserves luminous coastline on left, melts smoothly into narrative panel on right) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none hidden lg:block absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(7,22,30,0.22) 0%, rgba(7,22,30,0.06) 32%, rgba(7,22,30,0.34) 47%, rgba(6,19,27,0.86) 59%, rgba(6,19,27,0.94) 76%, rgba(5,16,23,0.97) 100%)",
                  }}
                />
                {/* Mobile / Tablet Vertical Deep-Ocean Editorial Scrim */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none lg:hidden absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(7,22,30,0.36) 0%, rgba(7,22,30,0.08) 24%, rgba(6,19,27,0.78) 44%, rgba(6,19,27,0.95) 64%, rgba(5,16,23,0.98) 100%)",
                  }}
                />
                {/* Bottom grounding gradient so the bottom-left quote reads crisply over ocean waves */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(6,19,27,0.24) 0%, transparent 26%, transparent 62%, rgba(5,16,23,0.82) 100%)",
                  }}
                />
              </div>

              {/* Main Responsive 12-Col Grid over Full-Bleed Canvas */}
              <div className="relative z-20 grid lg:grid-cols-12 min-h-[480px] lg:min-h-[520px]">
                {/* Cột trái (7 cột): Khung thưởng lãm toàn cảnh vịnh Đà Nẵng + Badge nổi + Trích dẫn biên tập */}
                <div className="lg:col-span-7 min-h-[290px] sm:min-h-[340px] lg:min-h-full p-5 sm:p-7 lg:p-8 flex flex-col justify-between">
                  {/* 2 Badge pill kính mờ góc trên */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="inline-flex items-center gap-1.5 bg-[#081C25]/72 backdrop-blur-xs text-[#FFFDF5]/95 border border-[#E6D9B7]/30 text-[11px] font-semibold uppercase tracking-[0.12em] px-3.5 py-1.5 rounded-full shadow-[0_6px_18px_rgba(6,18,24,0.35)]">
                      <Compass className="w-3.5 h-3.5 text-[#E6D9B7] shrink-0" />
                      <span>TRẢI NGHIỆM</span>
                    </span>
                    <span className="inline-flex items-center bg-[#081C25]/72 backdrop-blur-xs border border-[#E6D9B7]/30 text-[#FFFDF5]/95 text-[11px] font-semibold uppercase tracking-[0.12em] px-3.5 py-1.5 rounded-full shadow-[0_6px_18px_rgba(6,18,24,0.35)]">
                      CÂU CHUYỆN ĐIỂM ĐẾN
                    </span>
                  </div>

                  {/* Trích dẫn biên tập góc dưới trái */}
                  <div className="max-w-lg pt-16 lg:pt-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-[1.5px] bg-[#E6D9B7]" aria-hidden="true" />
                      <span className="text-[10.5px] font-mono uppercase tracking-[0.22em] text-[#E6D9B7]">
                        DANANG COASTAL CHRONICLE
                      </span>
                    </div>
                    <p
                      style={{ textShadow: "0 2px 14px rgba(4,14,20,0.75)" }}
                      className="home-serif italic text-[#FFFDF5] text-lg sm:text-[21px] leading-[1.38]"
                    >
                      &ldquo;Khám phá một Đà Nẵng rất khác qua những lát cắt chân thực&rdquo;
                    </p>
                  </div>
                </div>

                {/* Cột phải (5 cột): Hồ sơ biên tập hòa mượt trên nền Deep Ocean */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-9 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    {/* Đội ngũ biên tập + Badge thời gian đọc + Đường kẻ Champagne */}
                    <div>
                      <div className="flex items-center justify-between gap-3 pb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-[10px] bg-[#FFF8E9]/10 border border-[#E6D9B7]/30 flex items-center justify-center text-[#E6D9B7] shrink-0 shadow-[0_4px_14px_rgba(4,14,20,0.3)]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="w-5 h-5 text-[#E6D9B7]"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[#FFFDF5] font-semibold text-sm leading-tight">
                              Đội ngũ DANANGGO
                            </p>
                            <p className="text-[#CBD9DA]/80 text-xs mt-0.5">
                              Biên tập du lịch &amp; Trải nghiệm
                            </p>
                          </div>
                        </div>

                        <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-[0.18em] text-[#E6D9B7] bg-[#FFF8E9]/10 border border-[#E6D9B7]/28 px-3 py-1 rounded-full shrink-0">
                          3 PHÚT ĐỌC
                        </span>
                      </div>

                      <div className="h-[1px] w-full bg-gradient-to-r from-[#E6D9B7]/40 via-[#E6D9B7]/18 to-transparent" />
                    </div>

                    {/* Tiêu đề bài viết Serif trắng ngọc trai nổi bật */}
                    <h3
                      onClick={() => setStoryModalOpen(true)}
                      style={{ textShadow: "0 2px 16px rgba(4,14,20,0.6)" }}
                      className="home-serif font-semibold text-[#FFFDF5] hover:text-[#F5E6C4] text-2xl sm:text-[27px] lg:text-[29px] leading-[1.28] transition-colors cursor-pointer"
                    >
                      Đà Nẵng — Thành phố đáng sống nhất Đông Nam Á 2025
                    </h3>

                    {/* Đoạn mô tả sáng rõ */}
                    <p className="text-sm sm:text-[14.5px] text-[#DCE8E8]/88 leading-[1.72]">
                      Vì sao Đà Nẵng tiếp tục được vinh danh là thành phố đáng sống
                      nhất khu vực? Hãy cùng DANANGGO khám phá những giá trị làm nên
                      sức hút bền vững của thành phố biển năng động, thân thiện và
                      đầy cảm hứng này.
                    </p>

                    {/* Lưới 2x2 điểm nhấn dạng thẻ kính mờ tinh tế */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {[
                        "Con người thân thiện",
                        "Nhịp sống hiện đại",
                        "Thiên nhiên ấn tượng",
                        "Trải nghiệm đa dạng",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2.5 rounded-[10px] bg-[#FFF8E9]/[0.07] hover:bg-[#FFF8E9]/[0.12] border border-[#E6D9B7]/22 hover:border-[#E6D9B7]/45 px-3.5 py-2.5 transition-colors"
                        >
                          <span
                            className="text-[#E87B39] font-bold text-sm select-none shrink-0"
                            aria-hidden="true"
                          >
                            /
                          </span>
                          <span className="text-xs sm:text-[13px] font-medium text-[#FFFDF5]/92">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hàng nút hành động */}
                  <div className="pt-4 border-t border-[#E6D9B7]/20 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStoryModalOpen(true)}
                      className="group/cta luxury-btn-sweep bg-[#FFF8E9] hover:bg-white active:scale-[0.97] text-[#102832] border border-[#E6D9B7]/75 font-semibold uppercase tracking-[0.12em] px-5 sm:px-6 py-3 rounded-full shadow-[0_10px_28px_rgba(4,14,20,0.42)] transition-all duration-250 text-[11px] sm:text-xs cursor-pointer inline-flex items-center gap-2.5"
                    >
                      <span>Đọc bài viết</span>
                      <span className="text-[#0F4C5C] transition-transform duration-250 group-hover/cta:translate-x-1">
                        →
                      </span>
                    </button>
                    <Link
                      href="/khampha"
                      className="group/link relative text-[11px] sm:text-xs font-semibold uppercase tracking-[0.1em] text-[#E6D9B7] hover:text-[#FFFDF5] pb-1 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Xem thêm câu chuyện khác</span>
                      <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#E6D9B7]/45 group-hover/link:bg-[#E87B39] transition-colors" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CINEMATIC IMAGE EXPANSION (SECTION 12): Editorial Window (64%) -> Full-Bleed Panorama (100%) ── */}
          <div className="mt-14 lg:mt-20">
            <ScrollImageExpansion
              coordinates="16°06'42&quot;N · 108°15'58&quot;E // SON TRA PENINSULA AERIAL EXPEDITION"
              caption="Khi ánh bình minh chạm đỉnh Bàn Cờ và tiếng sóng thì thầm Bãi Rạng"
              overlayContent={
                <div className="inline-flex items-center gap-3 bg-[#102832]/80 backdrop-blur-xs border border-white/20 px-3.5 py-1.5 rounded-[2px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39]" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#BCD3D1]">
                    DANANGGO COASTAL EXPEDITION · CHAPTER 04
                  </span>
                </div>
              }
            >
              <Image
                src="/images/cinematic/hero/hero-sontra-mist.jpg"
                alt="Bán đảo Sơn Trà Đà Nẵng trong sương sớm nhìn từ trên cao"
                fill
                quality={90}
                sizes="100vw"
                className="object-cover object-center"
              />
            </ScrollImageExpansion>
          </div>
        </section>
      </EditorialJourneyStage>

      {/* Seamless Coastal Silhouette Transition: Travel Stories (#FAF4EA) -> Three Worlds (#102832) */}
      <CinematicSectionTransition variant="editorial-to-ocean" />

      {/* ============================================================
          CHƯƠNG THỊ GIÁC 05 — THE EXPERIENCE ("Khám phá theo danh mục")
          THE THREE WORLDS OF DA NANG V12.0 — Interactive Expanding Gallery
          ============================================================ */}
      <ThreeWorldsCategories
        categories={CATEGORIES}
        activeIndex={activeCategoryStory}
        onActiveChange={setActiveCategoryStory}
      />

      {/* Seamless Sea-to-Shore Transition: Three Worlds (#102832) -> Travel Journal (#F8F3E9) */}
      <CinematicSectionTransition variant="ocean-to-sand" />

      {/* ============================================================
          CHƯƠNG THỊ GIÁC 06 — THE JOURNEY ("Lịch trình gợi ý & Cảm hứng khám phá")
          DANANGGO V14.2 — THE CINEMATIC JOURNEY OF DISCOVERY
          ============================================================ */}
      <CinematicJourneyItinerary
        plans={ITINERARY_PLANS}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
      />

      {/* ============================================================
          7. VIP BANNER — "Nhận Ưu Đãi Tới 25%"
          DANANGGO V15.0 — THE JOURNEY CONTINUES (Cinematic Closing Experience)
          ============================================================ */}
      <CinematicClosingBanner discountText="25%" />

      {/* ============================================================
          CHƯƠNG THỊ GIÁC 07 — THE CLOSING (COMPACT LUXURY BRAND FOOTER — PHẦN 16)
          Deep Navy (#102832), 4 aligned columns, fine-line icons, ~320–360px height
          ============================================================ */}
      <footer className="bg-[#102832] text-[#F8F8F4]/80 pt-11 pb-8 border-t border-white/10 relative overflow-hidden">
        <div className="home-container relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 items-start">
            {/* Cột 1: Thương hiệu & mô tả (4 cột) */}
            <div className="sm:col-span-2 lg:col-span-4 pr-0 lg:pr-6">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-3.5 group">
                <img
                  src="/images/branding/danang-logo.png"
                  alt="Biểu trưng Đà Nẵng"
                  width={42}
                  height={42}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 sm:w-[42px] sm:h-[42px] object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
                />
                <span className="cinematic-condensed font-bold text-xl uppercase tracking-wider">
                  <span className="text-[#F8F8F4]">Danang</span>
                  <span className="text-[#E87B39] ml-0.5">Go</span>
                </span>
              </Link>
              <p className="text-[13.5px] leading-relaxed text-[#F8F8F4]/70 mb-5 max-w-sm">
                Cẩm nang du lịch Đà Nẵng đầy đủ và cập nhật nhất — từ điểm đến,
                ẩm thực đến lịch trình tối ưu.
              </p>
              {/* Social icons nét mảnh tinh tế (Phần 16.5) */}
              <div className="flex items-center gap-3.5">
                {[
                  {
                    label: "Facebook",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Instagram",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    ),
                  },
                  {
                    label: "TikTok",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                      </svg>
                    ),
                  },
                  {
                    label: "YouTube",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                        <path d="m10 15 5-3-5-3z" />
                      </svg>
                    ),
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    title={s.label}
                    className="text-[#F8F8F4]/65 hover:text-[#E87B39] transition-colors p-1"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Cột 2: Khám phá (3 cột) */}
            <div className="lg:col-span-3">
              <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Khám phá</h4>
              <ul className="space-y-2">
                {[
                  { label: "Điểm du lịch", href: "/diemdulich" },
                  { label: "Ẩm thực", href: "/amthuc" },
                  { label: "Lưu trú", href: "/luutru" },
                  { label: "Sự kiện lễ hội", href: "/su-kien" },
                  { label: "Khám phá tổng hợp", href: "/khampha" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 3: Tiện ích (2 cột) */}
            <div className="lg:col-span-2">
              <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Tiện ích</h4>
              <ul className="space-y-2">
                {[
                  { label: "Tạo lịch trình", href: "/lich-trinh/tao-moi" },
                  { label: "Bản đồ thành phố", href: "/bando" },
                  { label: "Thời tiết", href: "/thoi-tiet" },
                  { label: "Đặt vé online", href: "#" },
                  { label: "Hỏi đáp", href: "/chat" },
                ].map((item) => (
                  <li key={item.label}>
                    {item.href === "#" ? (
                      <a
                        href="#"
                        className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-[13.5px] text-[#F8F8F4]/75 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 4: Liên hệ (3 cột) */}
            <div className="sm:col-span-2 lg:col-span-3">
              <h4 className="home-eyebrow text-[#BCD3D1] mb-3.5">Liên hệ</h4>
              <ul className="space-y-2.5 text-[#F8F8F4]/80 text-[13.5px]">
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                  <span>hello@dananggo.vn</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                  <span>0236 386 5xxx</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#5E9898] shrink-0 stroke-[1.6]" />
                  <span>Đà Nẵng, Việt Nam</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1.5">
                {["Về chúng tôi", "Tuyển dụng", "Báo chí"].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-xs text-[#F8F8F4]/65 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright — Một hàng gọn gàng trên desktop với đường divider mảnh (Phần 16.8) */}
          <div className="border-t border-white/10 pt-5 sm:pr-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#F8F8F4]/55">
            <p>© 2025 DanangGo. Made with ❤️ in Đà Nẵng, Việt Nam.</p>
            <div className="flex gap-5">
              {["Điều khoản sử dụng", "Chính sách bảo mật"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="hover:text-[#F8F8F4]/90 transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ============================================================
          SCROLL-TO-TOP — fade-in + slide khi scroll > 400px (GIỮ NGUYÊN)
          ============================================================ */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-6 z-30 w-10 h-10 bg-[#102832] hover:bg-[#216B70] text-[#F8F8F4] border border-white/15 rounded-[4px] shadow-md flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Lên đầu trang"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {completedItinerary && (
        <SurveyQuickSheet
          isOpen={quickSheetOpen}
          onClose={() => setQuickSheetOpen(false)}
          itineraryId={completedItinerary.id}
        />
      )}

      {/* ============================================================
          EDITORIAL STORY MODAL — Tạp chí cảm hứng du lịch Đà Nẵng
          ============================================================ */}
      <AnimatePresence>
        {storyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setStoryModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#102832]/85 backdrop-blur-xs"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Đà Nẵng — Thành phố đáng sống nhất Đông Nam Á"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-[4px] bg-[#F8F8F4] shadow-2xl border border-[#DEDAD2]"
            >
                {/* Ảnh bìa tạp chí */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#102832]">
                <Image
                  src="/images/cinematic/hero/hero-coastal-panorama.jpg"
                  alt="Đà Nẵng — Thành phố đáng sống nhất Đông Nam Á"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102832]/90 via-[#102832]/35 to-black/25" />
                <button
                  type="button"
                  onClick={() => setStoryModalOpen(false)}
                  aria-label="Đóng câu chuyện"
                  className="absolute top-4 right-4 w-9 h-9 rounded-[2px] bg-black/50 hover:bg-black/75 text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                >
                  ✕
                </button>
                <div className="absolute bottom-5 left-6 right-6 text-[#F8F8F4]">
                  <span className="inline-block bg-[#216B70] text-white text-[11px] font-medium uppercase tracking-wider px-3 py-1 rounded-[2px] mb-2.5">
                    DanangGo Editorial · Cẩm nang bản địa
                  </span>
                  <h3 className="home-serif text-xl sm:text-2xl font-medium leading-snug">
                    Đà Nẵng — Thành phố đáng sống nhất Đông Nam Á
                  </h3>
                </div>
              </div>

              {/* Nội dung bài viết */}
              <div className="p-6 sm:p-8 space-y-5 text-[#202B30] text-sm leading-relaxed">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DEDAD2]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[2px] bg-[#102832] flex items-center justify-center text-[#F8F8F4] home-serif font-semibold text-sm">
                      AN
                    </div>
                    <div>
                      <p className="text-[#202B30] font-semibold text-sm">
                        Anh Nguyên
                      </p>
                      <p className="text-[#4E5E63] text-xs">
                        Travel Editor · 3 phút đọc
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#216B70] bg-[#F1EFE7] border border-[#DEDAD2] px-3 py-1 rounded-[2px]">
                    📍 Đà Nẵng · Hội An · Sơn Trà
                  </span>
                </div>

                <p>
                  <strong>1. Bình minh từ Bãi Rạng đến Đỉnh Bàn Cờ:</strong> Khi
                  những tia nắng đầu tiên chạm mặt biển Mỹ Khê, Đà Nẵng thức
                  giấc với nhịp sống vừa khoáng đạt vừa bình yên. Bạn có thể bắt
                  đầu buổi sáng bằng một ly cà phê muối bên bờ biển, rồi phóng
                  tầm mắt từ Bán đảo Sơn Trà ngắm trọn vòng cung biển xanh ngọc
                  bích.
                </p>

                <p>
                  <strong>2. Thành phố của những cây cầu &amp; di sản:</strong>{" "}
                  Hiếm có điểm đến nào kết nối trọn vẹn giữa thiên nhiên kỳ vĩ
                  và di sản văn hóa như Đà Nẵng. Chỉ trong 30 phút di chuyển,
                  bạn có thể đi từ Cầu Vàng trên đỉnh Bà Nà Hills mây phủ đến
                  Ngũ Hành Sơn cổ kính hay xuôi về Phố cổ Hội An rực rỡ đèn
                  lồng.
                </p>

                <p>
                  <strong>3. Thiên đường ẩm thực miền Trung:</strong> Đừng rời
                  Đà Nẵng khi chưa thưởng thức một tô Mì Quảng đậm đà, bánh
                  tráng cuốn thịt heo Đại Lộc hay hải sản tươi rói ven biển Sơn
                  Trà. Mỗi món ăn đều mang trọn sự hào sảng và mến khách của
                  người dân miền Trung.
                </p>

                <div className="pt-4 border-t border-[#DEDAD2] flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href="/lich-trinh/tao-moi"
                    onClick={() => setStoryModalOpen(false)}
                    className="bg-[#102832] hover:bg-[#216B70] text-white font-semibold uppercase tracking-wider px-5 py-2.5 rounded-[4px] text-xs transition-colors"
                  >
                    ✨ Lên lịch trình khám phá ngay →
                  </Link>
                  <Link
                    href="/khampha"
                    onClick={() => setStoryModalOpen(false)}
                    className="home-editorial-link"
                  >
                    <span>Xem tất cả địa điểm nổi bật</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS (Editorial Luxury Cards — White Desert Aesthetic)
// ============================================================

/**
 * PopularCard — V8.1 ORYZO × White Desert 5-Stage Entrance Timeline:
 * Stage 1 & 2: Staggered Card Reveal
 * Stage 3: Image Mask Construction (scale 1.08 -> 1.00)
 * Stage 4: Sequenced Category -> Line-Masked Title -> Location -> Divider Draw -> Baseline Rating/Price
 * Stage 5: Signature Outline-to-Solid Number (01–04) & One-Shot Border Light Sweep on Reveal Completion
 */
function PopularCard({
  card,
  index,
}: {
  card: (typeof POPULAR_CARDS)[number] & { placeId?: number };
  index: number;
}) {
  const targetId = card.placeId ?? card.id;
  const cardRef = useRef<HTMLElement>(null);
  const isCardInView = useInView(cardRef, {
    once: true,
    margin: "40px 0px -30px 0px",
    amount: 0.15,
  });

  const galleryCtx = useHorizontalGalleryContext();
  const fallbackProgress = useMotionValue(0);
  const progressMotion = galleryCtx?.progressMotion ?? fallbackProgress;
  const totalCards = Math.max(1, galleryCtx?.totalCards ?? 4);
  const isPinnedHorizontal = Boolean(galleryCtx?.isPinnedHorizontal);
  const isActiveCenter = isPinnedHorizontal && galleryCtx?.activeIndex === index;

  // Normalized focal point of this card along the 0..1 horizontal scroll progress
  const cardFocalPoint =
    totalCards > 1 ? index / (totalCards - 1) : 0;

  // Section 10: Internal Camera Image Parallax linked to horizontal scroll progress
  // - As the card travels from the right edge toward center and exits left, the image shifts
  //   by +24px -> 0px -> -24px inside its frame while scaling from 1.07 -> 1.00 -> 1.04
  const internalParallaxX = useTransform(progressMotion, (p) => {
    if (!isPinnedHorizontal) return 0;
    const delta = p - cardFocalPoint;
    return Math.max(-28, Math.min(28, -delta * 44));
  });
  const internalParallaxScale = useTransform(progressMotion, (p) => {
    if (!isPinnedHorizontal) return 1.01;
    const dist = Math.min(1, Math.abs(p - cardFocalPoint) * 1.45);
    return 1.0 + dist * 0.065;
  });

  const fallbackSrc = resolvePlaceFallbackImage(card.title, card.category);
  const [imgSrc, setImgSrc] = useState<string>(() =>
    upgradeHiResImage(card.img, card.title, card.category)
  );
  const [imgOffset, setImgOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [numberSolid, setNumberSolid] = useState(false);
  const [revealSweeping, setRevealSweeping] = useState(false);

  useEffect(() => {
    setImgSrc(upgradeHiResImage(card.img, card.title, card.category));
  }, [card.img, card.title, card.category]);

  // Stage 5 & Section 13/14: Trigger Outline-to-Solid Number (01-04) & One-Shot Border Light Sweep when card enters view
  useEffect(() => {
    if (!isCardInView) return;
    const baseDelayMs = index * 110;
    const numTimer = setTimeout(() => {
      setNumberSolid(true);
    }, baseDelayMs + 420);
    const sweepStartTimer = setTimeout(() => {
      setRevealSweeping(true);
    }, baseDelayMs + 680);
    const sweepEndTimer = setTimeout(() => {
      setRevealSweeping(false);
    }, baseDelayMs + 2250);

    return () => {
      clearTimeout(numTimer);
      clearTimeout(sweepStartTimer);
      clearTimeout(sweepEndTimer);
    };
  }, [isCardInView, index]);

  // Also trigger a subtle one-shot border sweep when this card becomes the active center exhibition card
  useEffect(() => {
    if (!isActiveCenter) return;
    setNumberSolid(true);
    setRevealSweeping(true);
    const timer = setTimeout(() => setRevealSweeping(false), 1450);
    return () => clearTimeout(timer);
  }, [isActiveCenter]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (
      typeof window !== "undefined" &&
      (!window.matchMedia("(min-width: 1024px) and (hover: hover)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setImgOffset({ x: nx * -6, y: ny * -6 });
  };

  const handleImageMouseLeave = () => {
    setImgOffset({ x: 0, y: 0 });
  };

  const staggerDelay = index * 0.1;

  return (
    <article
      ref={cardRef}
      onMouseMove={handleImageMouseMove}
      onMouseLeave={handleImageMouseLeave}
      className={`group relative luxury-card-surface luxury-border-sweep luxury-shimmer-frame rounded-[14px] bg-[#091D26] overflow-hidden cursor-pointer h-[440px] sm:h-[470px] lg:h-[500px] xl:h-[520px] flex flex-col transition-all duration-500 ${
        revealSweeping ? "is-reveal-sweeping" : ""
      } ${
        isActiveCenter
          ? "border-[#E6D9B7]/75 shadow-[0_28px_68px_rgba(6,18,24,0.56)]"
          : "border-[#E6D9B7]/25 shadow-[0_20px_48px_rgba(6,18,24,0.42)]"
      }`}
    >
      {/* Subtle Champagne top rim reflection */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-20 bg-gradient-to-r from-transparent via-[#E6D9B7]/50 to-transparent"
      />

      {/* Favorite Heart Button (kept outside Link so heart clicks never trigger navigation) */}
      <div className="absolute top-4 right-4 z-30">
        <HeartButton placeId={card.placeId} />
      </div>

      {/* Full-Bleed Exhibition Card Link — preserves all Stage 3, 4 & 5 animations with zero white bottom block */}
      <Link
        href={`/places/${targetId}`}
        onClick={() => recordSharedPlaceClick(targetId, imgSrc)}
        className="relative w-full h-full flex flex-col justify-between block"
      >
        {/* Stage 3: Full-Bleed Exhibition Image Panel (mask reveal, internal camera parallax, mouse depth & hover zoom) */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#091D26]">
          <CinematicImageMask
            direction="vertical"
            duration={0.95}
            delay={staggerDelay}
            className="w-full h-full"
            innerClassName="relative w-full h-full"
          >
            {/* Separate wrapper for internal scroll-linked camera parallax (Section 10) */}
            <motion.div
              style={{
                x: internalParallaxX,
                scale: internalParallaxScale,
              }}
              className="relative w-[112%] -left-[6%] h-full will-change-transform"
            >
              {/* Separate wrapper for mouse micro-depth & hover zoom */}
              <div
                className="relative w-full h-full transition-transform duration-500 ease-out"
                style={{
                  transform: `translate3d(${imgOffset.x}px, ${imgOffset.y}px, 0)`,
                }}
              >
                <Image
                  src={imgSrc || fallbackSrc}
                  alt={card.title}
                  fill
                  unoptimized
                  onError={() => {
                    if (imgSrc !== fallbackSrc) {
                      setImgSrc(fallbackSrc);
                    }
                  }}
                  className="object-cover group-hover:scale-[1.055] transition-transform duration-800 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  sizes="(max-width: 640px) 85vw, (max-width: 1024px) 48vw, 35vw"
                />
              </div>
            </motion.div>
          </CinematicImageMask>

          {/* Velvety Deep-Ocean Multi-Stop Editorial Vignette — blends photograph seamlessly into typography */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(7,22,30,0.44) 0%, rgba(7,22,30,0.06) 28%, rgba(7,22,30,0.12) 48%, rgba(7,22,30,0.72) 70%, rgba(6,19,26,0.92) 86%, rgba(5,16,22,0.97) 100%)",
            }}
          />
          {/* Subtle inner radial vignette for luxury framing */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-55"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 50% 35%, transparent 48%, rgba(5,16,22,0.42) 100%)",
            }}
          />
        </div>

        {/* Top Editorial Badge */}
        <div className="relative z-20 pt-4 px-4 pr-14 flex items-center">
          <span
            title={card.badge}
            className="bg-[#081C25]/72 backdrop-blur-xs text-[#FFFDF5]/95 border border-[#E6D9B7]/30 group-hover:border-[#E6D9B7]/65 text-[11px] font-medium tracking-[0.02em] px-3.5 py-1.5 rounded-full max-w-full truncate transition-colors shadow-[0_4px_14px_rgba(4,14,20,0.35)]"
          >
            {card.badge}
          </span>
        </div>

        {/* Stage 4 & 5: Seamless Editorial Typography Overlay (no white slab) */}
        <div className="relative z-20 mt-auto p-5 sm:p-6 flex flex-col justify-end">
          {/* Category + ORYZO Signature Number (01–04 Outline -> Solid + Hairline Tick) */}
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={
                isCardInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
              }
              transition={{
                duration: 0.5,
                delay: staggerDelay + 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#E6D9B7]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#E87B39] shrink-0" />
              <span>{card.category}</span>
            </motion.span>

            <div
              aria-hidden="true"
              className="flex items-center gap-1.5 select-none shrink-0"
            >
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  isCardInView || isActiveCenter
                    ? { scaleX: 1, opacity: 0.85 }
                    : { scaleX: 0, opacity: 0 }
                }
                transition={{
                  duration: 0.55,
                  delay: staggerDelay + 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-4 h-[1px] bg-[#E6D9B7] origin-right"
              />
              <span
                className={`oryzo-card-number text-base tracking-[0.14em] leading-none ${
                  numberSolid || isActiveCenter ? "is-solid" : ""
                }`}
              >
                0{index + 1}
              </span>
            </div>
          </div>

          {/* Line-mask Title Reveal — full Vietnamese diacritics support & no clipping */}
          <div className="overflow-hidden pt-0.5 mb-2">
            <motion.h3
              initial={{ y: "34%", opacity: 0 }}
              animate={
                isCardInView ? { y: "0%", opacity: 1 } : { y: "34%", opacity: 0 }
              }
              transition={{
                duration: 0.62,
                delay: staggerDelay + 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                fontFamily: "var(--font-editorial-sans), var(--font-display), 'Be Vietnam Pro', sans-serif",
                textShadow: "0 2px 14px rgba(5,16,22,0.72)",
              }}
              className="text-xl sm:text-[22px] font-semibold tracking-[-0.01em] leading-[1.3] text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors duration-300 line-clamp-2"
            >
              {card.title}
            </motion.h3>
          </div>

          {/* Location reveal */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={
              isCardInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }
            }
            transition={{
              duration: 0.5,
              delay: staggerDelay + 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-1.5 text-[#D8E6E6]/85 text-xs sm:text-[13px] mb-3.5"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="text-[#C9B580] shrink-0"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{card.location}</span>
          </motion.div>

          {/* Animated Champagne Divider Draw + Rating & Price Baseline */}
          <div className="w-full h-[1px] bg-white/14 overflow-hidden mb-3.5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isCardInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{
                duration: 0.72,
                delay: staggerDelay + 0.26,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`h-full w-full origin-left transition-colors ${
                isActiveCenter
                  ? "bg-gradient-to-r from-[#C9B580] via-[#E6D9B7] to-transparent"
                  : "bg-[#E6D9B7]/45 group-hover:bg-[#E6D9B7]/85"
              }`}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={
              isCardInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }
            }
            transition={{
              duration: 0.52,
              delay: staggerDelay + 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-baseline justify-between gap-2"
          >
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#E87B39] text-xs sm:text-sm">★</span>
              <span className="text-xs sm:text-[13px] font-semibold text-[#FFFDF5]">
                {card.rating}
              </span>
              <span className="text-xs text-[#CBD9DA]/75">
                ({card.reviews.toLocaleString("en-US")})
              </span>
            </div>
            <span className="text-xs sm:text-[13.5px] font-semibold text-[#F2DFB4] group-hover:text-[#FFFDF5] transition-colors shrink-0">
              {card.price}
            </span>
          </motion.div>
        </div>
      </Link>
    </article>
  );
}

/**
 * CategoryCard — V6.0 Cinematic Image Panel (Phần 16)
 */
function CategoryCard({
  category,
  index,
  isFeatured,
}: {
  category: (typeof CATEGORIES)[0];
  index: number;
  isFeatured?: boolean;
}) {
  return (
    <Link href={category.href} className="block h-full">
      <div
        className={`group luxury-border-sweep luxury-shimmer-frame relative rounded-[6px] overflow-hidden cursor-pointer h-[420px] sm:h-[450px] border transition-all duration-400 bg-[#162E38] ${
          isFeatured
            ? "border-[#C9B580]/75 shadow-[0_20px_48px_rgba(8,20,26,0.35)]"
            : "border-white/15 hover:border-[#C9B580]/65"
        }`}
      >
        <CinematicImageMask
          direction="editorial-window"
          duration={1.15}
          delay={index * 0.1}
          className="w-full h-full"
          innerClassName="relative w-full h-full"
        >
          <Image
            src={category.img}
            alt={category.label}
            fill
            quality={90}
            className="object-cover group-hover:scale-[1.06] transition-transform duration-800 ease-[cubic-bezier(0.22,1,0.36,1)]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </CinematicImageMask>
        {/* Subtle dark editorial gradient concentrated at the bottom */}
        <div
          className="absolute inset-0 transition-opacity duration-400 group-hover:opacity-90"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,40,50,0.18) 0%, rgba(16,40,50,0.34) 45%, rgba(16,40,50,0.92) 100%)",
          }}
        />

        {/* Top header bar inside card */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-15">
          <div className="bg-[#102832]/80 backdrop-blur-xs border border-white/20 group-hover:border-[#E6D9B7]/50 rounded-[3px] px-3 py-1 text-xs font-medium text-[#F8F8F4] transition-colors">
            {category.icon} {category.stat}
          </div>
          <span
            aria-hidden="true"
            className="text-xs font-mono tracking-[0.2em] text-[#BCD3D1]/80 group-hover:text-[#E6D9B7] transition-colors"
          >
            0{index + 1} // 03
          </span>
        </div>

        {/* Content dưới */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-7 z-15">
          <h3 className="cinematic-condensed uppercase text-[#F8F8F4] text-2xl sm:text-3xl font-bold tracking-tight mb-2 group-hover:-translate-y-1 transition-transform duration-400">
            {category.label}
          </h3>
          <p className="text-[#F8F8F4]/82 text-xs sm:text-[13.5px] leading-relaxed mb-4">
            {category.desc}
          </p>

          {/* 3 tag đặc trưng của danh mục */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {category.highlights.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-normal text-[#F8F8F4]/90 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-[3px]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-3.5 border-t border-white/15 group-hover:border-[#C9B580]/45 flex items-center justify-between transition-colors">
            <span className="inline-flex items-center gap-2 text-[#F8F8F4] group-hover:text-[#E6D9B7] text-xs font-semibold tracking-wider uppercase transition-colors">
              <span>{category.cta}</span>
            </span>
            <span className="text-[#F8F8F4] group-hover:text-[#E6D9B7] transition-transform duration-300 group-hover:translate-x-1.5">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
