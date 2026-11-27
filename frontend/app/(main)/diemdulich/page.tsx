"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPlaces } from "@/lib/api/places";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
} from "framer-motion";
import {
  Map,
  Palmtree,
  Mountain,
  Landmark,
  Camera,
  FerrisWheel,
  RefreshCw,
  ArrowUpDown,
  Loader2,
  ChevronDown,
  Search,
  X,
  SearchX,
  Star,
  MapPin,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  List,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import ParallaxBanner from "@/components/attractions/ParallaxBanner";
import StoryCard, { AttractionData } from "@/components/attractions/StoryCard";
import RadarMapPreview from "@/components/attractions/RadarMapPreview";
import AttractionsAmbientBackdrop from "@/components/attractions/AttractionsAmbientBackdrop";
import LandmarkExpeditionShowcase from "@/components/attractions/LandmarkExpeditionShowcase";
import LandmarkAtlasIndex from "@/components/attractions/LandmarkAtlasIndex";
import { EASING, SPRING } from "@/lib/motion-tokens";

const LOCAL_FALLBACK_IMG = "/images/intro/landscape/intro-coastal-panorama.jpg";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function matchesAttractionCategory(
  item: AttractionData,
  activeCategory: string
): boolean {
  if (activeCategory === "Tất cả") return true;
  const catNorm = removeVietnameseTones(item.category || "");
  const nameNorm = removeVietnameseTones(item.name || "");
  const combined = `${catNorm} ${nameNorm}`;
  const targetNorm = removeVietnameseTones(activeCategory);

  if (catNorm === targetNorm || catNorm.includes(targetNorm)) return true;

  if (activeCategory === "Biển & Đảo") {
    return (
      combined.includes("bien") ||
      combined.includes("dao") ||
      combined.includes("nam o")
    );
  }
  if (activeCategory === "Núi & Rừng") {
    return (
      combined.includes("nui") ||
      combined.includes("rung") ||
      combined.includes("son tra") ||
      combined.includes("ban dao") ||
      combined.includes("ba na")
    );
  }
  if (activeCategory === "Văn hoá & Lịch sử") {
    return (
      combined.includes("van hoa") ||
      combined.includes("lich su") ||
      combined.includes("chua") ||
      combined.includes("tam linh") ||
      combined.includes("bao tang") ||
      combined.includes("ngu hanh")
    );
  }
  if (activeCategory === "Chụp ảnh Check-in") {
    return (
      combined.includes("check-in") ||
      combined.includes("cau rong") ||
      combined.includes("tinh yeu") ||
      combined.includes("apec")
    );
  }
  if (activeCategory === "Giải trí") {
    return (
      combined.includes("giai tri") ||
      combined.includes("sun world") ||
      combined.includes("asia park") ||
      combined.includes("than tai")
    );
  }
  return false;
}

// DỮ LIỆU ĐIỂM ĐẾN MẪU ĐỒNG BỘ VỚI CSDL SQL SERVER
const RAW_ATTRACTIONS = [
  {
    id: 97,
    name: "Sun World Bà Nà Hills",
    category: "Giải trí",
    location: "Hòa Vang",
    rating: 4.8,
    visitors: 420000,
    img: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&q=85",
    shortDesc:
      "Thiên đường nghỉ dưỡng trên đỉnh núi Chúa ở độ cao 1.487m với Cầu Vàng...",
    longDesc:
      "Nằm ở độ cao 1.414m so với mực nước biển, Cầu Vàng là tuyệt tác kiến trúc vắt ngang bầu trời sương mù Bà Nà. Đứng tại đây, bạn có thể phóng tầm mắt bao quát toàn cảnh núi rừng chập chùng tuyệt đẹp.",
  },
  {
    id: 102,
    name: "Bãi Biển Mỹ Khê",
    category: "Biển & Đảo",
    location: "Sơn Trà",
    rating: 4.9,
    visitors: 245000,
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85",
    shortDesc:
      "Bãi biển cát trắng mịn dài 9km, làn nước trong xanh ấm áp quanh năm...",
    longDesc:
      "Được tạp chí Forbes vinh danh là một trong 6 bãi biển quyến rũ nhất hành tinh. Bãi biển Mỹ Khê thu hút du khách bởi bờ cát trắng mịn, sóng biển ôn hòa và các hoạt động thể thao trên nước sôi động.",
  },
  {
    id: 98,
    name: "Bán Đảo Sơn Trà & Chùa Linh Ứng",
    category: "Chùa / Tâm linh",
    location: "Sơn Trà",
    rating: 4.9,
    visitors: 280000,
    img: "/images/intro/landscape/intro-coastal-panorama.jpg",
    shortDesc:
      "Khu bảo tồn thiên nhiên đa dạng với tượng Phật Bà Quan Âm cao 67m...",
    longDesc:
      "Khu bảo tồn thiên nhiên rộng lớn bảo vệ hơn hàng ngàn hecta rừng nguyên sinh. Cung đường vòng quanh bán đảo mang đến khung cảnh ngoạn mục của biển Đông và cơ hội bắt gặp nữ hoàng linh trưởng - Voọc chà vá chân nâu.",
  },
  {
    id: 100,
    name: "Cầu Rồng & Cầu Tình Yêu Đà Nẵng",
    category: "Chụp ảnh Check-in",
    location: "Hải Châu",
    rating: 4.8,
    visitors: 350000,
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&q=85",
    shortDesc:
      "Cây cầu hình con rồng thời Lý vươn mình ra biển lớn, phun lửa và phun nước...",
    longDesc:
      "Biểu tượng của sự chuyển mình mạnh mẽ của Đà Nẵng. Mỗi tối thứ 7 và Chủ nhật lúc 21h00, Cầu Rồng sẽ trình diễn phun lửa và phun nước tạo nên cảnh tượng vô cùng hoành tráng thu hút hàng ngàn du khách.",
  },
  {
    id: 99,
    name: "Danh Thắng Ngũ Hành Sơn",
    category: "Văn hoá & Lịch sử",
    location: "Ngũ Hành Sơn",
    rating: 4.7,
    visitors: 185000,
    img: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=85",
    shortDesc:
      "Quần thể 5 ngọn núi đá vôi kỳ vĩ gắn liền với truyền thuyết ngũ hành...",
    longDesc:
      "Di tích lịch sử văn hóa cấp Quốc gia với 5 ngọn núi đá vôi: Kim, Mộc, Thủy, Hỏa, Thổ. Khám phá các hang động huyền bí như động Huyền Không, động Âm Phủ và các ngôi cổ tự linh thiêng hàng trăm năm tuổi.",
  },
  {
    id: 101,
    name: "Bảo Tàng Điêu Khắc Chăm Đà Nẵng",
    category: "Văn hoá & Lịch sử",
    location: "Hải Châu",
    rating: 4.7,
    visitors: 95000,
    img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&q=85",
    shortDesc:
      "Bộ sưu tập điêu khắc Chăm lớn nhất thế giới với hơn 2.000 hiện vật...",
    longDesc:
      "Bảo tàng duy nhất trên thế giới về nền văn hóa Chăm Pa. Lưu giữ hàng ngàn bức phù điêu, tượng đá sa thạch miêu tả các vị thần Ấn Độ giáo tinh xảo từ thế kỷ 7 đến thế kỷ 15.",
  },
];

const MORE_RAW_ATTRACTIONS = [
  {
    id: 107,
    name: "Công viên Châu Á (Asia Park)",
    category: "Giải trí",
    location: "Hải Châu",
    rating: 4.5,
    visitors: 200000,
    img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&q=85",
    shortDesc:
      "Khu vui chơi giải trí quy mô lớn với vòng đu quay khổng lồ Sun Wheel...",
    longDesc:
      "Nơi hội tụ tinh hoa văn hóa của 10 quốc gia châu Á. Tận hưởng cảm giác mạnh với hàng chục trò chơi đẳng cấp thế giới và chiêm ngưỡng toàn cảnh Đà Nẵng lung linh về đêm từ vòng quay Sun Wheel cao 115m.",
  },
  {
    id: 103,
    name: "Đỉnh Bà Nà Hills (Làng Pháp)",
    category: "Núi & Rừng",
    location: "Hòa Vang",
    rating: 4.8,
    visitors: 450000,
    img: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=85",
    shortDesc:
      "Cáp treo dài nhất thế giới đưa bạn lên Làng Pháp cổ kính...",
    longDesc:
      "Đường lên tiên cảnh với hệ thống cáp treo đạt 4 kỷ lục Guinness thế giới. Trải nghiệm 4 mùa trong 1 ngày, lạc bước trong Làng Pháp cổ kính và vườn hoa Le Jardin D’Amour lãng mạn.",
  },
  {
    id: 104,
    name: "Rạn Nam Ô",
    category: "Biển & Đảo",
    location: "Liên Chiểu",
    rating: 4.6,
    visitors: 65000,
    img: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=85",
    shortDesc: "Bãi đá hoang sơ phủ đầy rêu xanh mướt vào đầu xuân...",
    longDesc:
      "Nổi tiếng với những bãi đá phủ đầy rêu xanh tuyệt đẹp vào mùa xuân. Nước biển ở đây trong vắt, là điểm đến lý tưởng cho những ai thích vẻ đẹp hoang sơ, yên bình và những bức ảnh sống ảo cực chất.",
  },
  {
    id: 105,
    name: "Công viên APEC",
    category: "Chụp ảnh Check-in",
    location: "Hải Châu",
    rating: 4.5,
    visitors: 120000,
    img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&q=85",
    shortDesc:
      "Công viên kiến trúc độc đáo với mái vòm hình cánh diều uốn lượn...",
    longDesc:
      "Biểu tượng mới của Đà Nẵng bên bờ sông Hàn. Mái vòm thép uốn lượn hình cánh diều cùng hệ thống chiếu sáng đèn LED nghệ thuật về đêm tạo nên một không gian check-in vô cùng hiện đại và ảo diệu.",
  },
  {
    id: 106,
    name: "Suối khoáng nóng Thần Tài",
    category: "Giải trí",
    location: "Hòa Vang",
    rating: 4.6,
    visitors: 110000,
    img: "https://images.unsplash.com/photo-1520962880247-cfaf541c8724?w=1200&q=85",
    shortDesc:
      "Công viên suối khoáng nóng quy mô lớn giữa không gian rừng núi...",
    longDesc:
      "Nơi hoàn hảo để tái tạo năng lượng với dòng suối khoáng nóng tự nhiên. Trải nghiệm tắm bùn, tắm onsen Nhật Bản và khu vui chơi công viên nước sôi động giữa núi rừng mát mẻ.",
  },
];

function mapData(raw: typeof RAW_ATTRACTIONS): AttractionData[] {
  return raw.map((item) => {
    let tint: AttractionData["badgeTint"] = "blue";
    const cat = item.category || "";
    if (cat.includes("Núi") || cat.includes("Rừng")) tint = "green";
    else if (
      cat.includes("Văn hoá") ||
      cat.includes("Lịch sử") ||
      cat.includes("Tâm linh") ||
      cat.includes("Chùa")
    )
      tint = "amber";
    else if (cat.includes("Check-in") || cat.includes("Ảnh")) tint = "pink";
    else if (cat.includes("Giải trí")) tint = "purple";
    return { ...item, badgeTint: tint };
  });
}

const INITIAL_ATTRACTIONS = mapData(RAW_ATTRACTIONS);
const MORE_ATTRACTIONS = mapData(MORE_RAW_ATTRACTIONS);

const CATEGORIES = [
  { label: "Tất cả", value: "Tất cả", Icon: Map },
  { label: "Biển & Đảo", value: "Biển & Đảo", Icon: Palmtree },
  { label: "Núi & Rừng", value: "Núi & Rừng", Icon: Mountain },
  { label: "Văn hoá & Lịch sử", value: "Văn hoá & Lịch sử", Icon: Landmark },
  { label: "Chụp ảnh Check-in", value: "Chụp ảnh Check-in", Icon: Camera },
  { label: "Giải trí", value: "Giải trí", Icon: FerrisWheel },
];

const POPULAR_TAGS = [
  { label: "Bà Nà Hills", query: "bà nà" },
  { label: "Cầu Rồng", query: "cầu rồng" },
  { label: "Bãi biển Mỹ Khê", query: "mỹ khê" },
  { label: "Ngũ Hành Sơn", query: "ngũ hành sơn" },
  { label: "Bán đảo Sơn Trà", query: "sơn trà" },
  { label: "Bảo tàng Chăm", query: "chăm" },
];

type SortType = "default" | "rating" | "visitors";

function DiemDuLichContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") || "";
  const reducedMotion = Boolean(useReducedMotion());

  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [viewMode, setViewMode] = useState<"gallery" | "dossier">("gallery");
  const [items, setItems] = useState<AttractionData[]>(INITIAL_ATTRACTIONS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownFailedImgs, setDropdownFailedImgs] = useState<
    Record<number, boolean>
  >({});

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const consoleRafRef = useRef<number | null>(null);

  const handleConsoleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !consoleRef.current) return;
    const rect = consoleRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (consoleRafRef.current !== null)
      cancelAnimationFrame(consoleRafRef.current);
    consoleRafRef.current = requestAnimationFrame(() => {
      const el = consoleRef.current;
      if (!el) return;
      el.style.setProperty("--dx", `${x.toFixed(1)}px`);
      el.style.setProperty("--dy", `${y.toFixed(1)}px`);
      el.style.setProperty("--d-spot", "1");
      consoleRafRef.current = null;
    });
  };

  const handleConsoleLeave = () => {
    if (consoleRafRef.current !== null) {
      cancelAnimationFrame(consoleRafRef.current);
      consoleRafRef.current = null;
    }
    consoleRef.current?.style.setProperty("--d-spot", "0");
  };

  useEffect(() => {
    return () => {
      if (consoleRafRef.current !== null)
        cancelAnimationFrame(consoleRafRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchQuery(urlQ);
  }, [urlQ]);

  // Gọi API Backend thật: GET /api/places?type=ATTRACTION
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveAttractions() {
      try {
        const res = await getPlaces({ type: "ATTRACTION", limit: 50 });
        if (res && res.items && res.items.length > 0 && isMounted) {
          const liveAttractions: AttractionData[] = res.items.map((item) => {
            let tint: AttractionData["badgeTint"] = "blue";
            const cat = item.category_name || "";
            if (cat.includes("Núi") || cat.includes("Rừng")) tint = "green";
            else if (
              cat.includes("Văn hoá") ||
              cat.includes("Văn hóa") ||
              cat.includes("Lịch sử") ||
              cat.includes("Tâm linh") ||
              cat.includes("Chùa")
            )
              tint = "amber";
            else if (cat.includes("Check-in") || cat.includes("Ảnh"))
              tint = "pink";
            else if (cat.includes("Giải trí")) tint = "purple";
            else if (cat.includes("Biển")) tint = "blue";

            // Guard against known broken Unsplash ID if stored in DB
            const rawImg = item.cover_image || "";
            const safeImg =
              !rawImg || rawImg.includes("photo-1570789210967-2cac24afeb00")
                ? LOCAL_FALLBACK_IMG
                : rawImg;

            return {
              id: item.place_id,
              placeId: item.place_id,
              name: item.name,
              category: item.category_name || "Văn hoá & Lịch sử",
              location: item.district_name
                ? `${item.district_name}`
                : item.address || "Đà Nẵng",
              rating: Number((item.avg_rating || 4.8).toFixed(1)),
              visitors: (item.view_count || 100) * 150,
              img: safeImg,
              shortDesc: item.description
                ? item.description.slice(0, 95) + "..."
                : "Điểm du lịch nổi tiếng tại Đà Nẵng...",
              longDesc:
                item.description ||
                "Khám phá nét đẹp thiên nhiên và văn hoá đặc sắc của thành phố biển Đà Nẵng.",
              badgeTint: tint,
            };
          });

          setItems(liveAttractions);
          setHasMore(false);
        }
      } catch (err) {
        console.warn(
          "API /api/places chưa kết nối hoặc offline, dùng dữ liệu mẫu chuẩn:",
          err
        );
      }
    }
    fetchLiveAttractions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setIsDropdownOpen(true);
    }
    const trimmed = val.trim();
    const url = trimmed
      ? `/diemdulich?q=${encodeURIComponent(trimmed)}`
      : "/diemdulich";
    router.replace(url, { scroll: false });
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    setSearchQuery(tagQuery);
    setIsDropdownOpen(false);
    setActiveCategory("Tất cả");
    const url = `/diemdulich?q=${encodeURIComponent(tagQuery)}`;
    router.replace(url, { scroll: false });
  };

  const handleClearFilters = () => {
    setActiveCategory("Tất cả");
    setSearchQuery("");
    setSortBy("default");
    setIsDropdownOpen(false);
    router.replace("/diemdulich", { scroll: false });
  };

  const handleLike = (id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setItems((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = MORE_ATTRACTIONS.filter(
          (m) => !existingIds.has(m.id)
        );
        return [...prev, ...newItems];
      });
      setHasMore(false);
      setIsLoadingMore(false);
    }, 550);
  };

  const matchingSuggestions = useMemo(() => {
    const qTrim = searchQuery.trim();
    if (!qTrim) return [];
    const qNorm = removeVietnameseTones(qTrim);

    return items
      .filter((item) => {
        const haystack = removeVietnameseTones(
          `${item.name} ${item.location} ${item.category} ${item.shortDesc}`
        );
        return haystack.includes(qNorm);
      })
      .slice(0, 5);
  }, [items, searchQuery]);

  const filteredItems = useMemo(() => {
    const qTrim = searchQuery.trim();
    const qNorm = removeVietnameseTones(qTrim);

    let result = items.filter((item) => {
      if (!matchesAttractionCategory(item, activeCategory)) {
        return false;
      }
      if (qTrim) {
        const haystack = removeVietnameseTones(
          `${item.name} ${item.location} ${item.category} ${item.shortDesc}`
        );
        if (!haystack.includes(qNorm)) return false;
      }
      return true;
    });

    if (sortBy === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "visitors") {
      result = [...result].sort((a, b) => b.visitors - a.visitors);
    }

    return result;
  }, [items, activeCategory, searchQuery, sortBy]);

  const toggleSort = () => {
    if (sortBy === "default") setSortBy("rating");
    else if (sortBy === "rating") setSortBy("visitors");
    else setSortBy("default");
  };

  const sortLabel = {
    default: "Mặc định",
    rating: "Đánh giá cao",
    visitors: "Lượt quan tâm",
  }[sortBy];

  const hasActiveFilters = Boolean(
    searchQuery.trim() || activeCategory !== "Tất cả" || sortBy !== "default"
  );

  const showSpotlight = !searchQuery.trim() && filteredItems.length >= 2;

  return (
    <div
      ref={pageContainerRef}
      className="dananggo-cinematic-content relative min-h-screen bg-[#06151C] text-[#FFFDF5] flex flex-col overflow-x-clip"
    >
      {/* Nocturnal Expedition Backdrop */}
      <AttractionsAmbientBackdrop
        activeCategory={activeCategory}
        containerRef={pageContainerRef}
      />

      {/* 1. CINEMATIC PARALLAX EXPEDITION HERO */}
      <ParallaxBanner />

      {/* 2. FROSTED SMOKED GLASS EXPEDITION CONSOLE */}
      <div className="relative z-30 home-container -mt-16 sm:-mt-20 mb-12 w-full">
        <motion.div
          ref={consoleRef}
          onMouseMove={handleConsoleMove}
          onMouseLeave={handleConsoleLeave}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.16, ease: EASING.standard }}
          className="diemdulich-console-glass relative rounded-[22px] bg-gradient-to-br from-[#0F2C38]/40 via-[#081D27]/30 to-[#06161F]/44 backdrop-blur-2xl backdrop-saturate-150 border border-[#E6D9B7]/28 p-5 sm:p-6 lg:p-7 shadow-[0_24px_64px_rgba(2,10,15,0.45),inset_0_1px_0_rgba(255,253,245,0.18),inset_0_-1px_0_rgba(230,217,183,0.08)] flex flex-col gap-5"
        >
          {/* Clipped Specular, Sheen & Architectural Corner Ticks */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFFDF5]/45 to-transparent" />
            <div className="absolute inset-x-10 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#E6D9B7]/22 to-transparent" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,253,245,0.07) 0%, rgba(255,253,245,0.015) 38%, rgba(6,21,28,0.14) 100%)",
              }}
            />
            <div className="diemdulich-console-spotlight absolute inset-0" />
            <span className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-[#E6D9B7]/45 rounded-tl-[3px]" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-[#E6D9B7]/45 rounded-tr-[3px]" />
            <span className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-[#E6D9B7]/45 rounded-bl-[3px]" />
            <span className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-[#E6D9B7]/45 rounded-br-[3px]" />
          </div>

          {/* HÀNG 1: THANH TÌM KIẾM TRUNG TÂM + DROPDOWN + GỢI Ý HOT */}
          <div ref={searchBoxRef} className="relative z-20 w-full">
            <div
              className={`relative flex items-center rounded-full border backdrop-blur-md transition-all duration-300 ${
                isSearchFocused
                  ? "border-[#E6D9B7]/72 bg-[#06151C]/60 shadow-[0_0_0_3px_rgba(230,217,183,0.10)]"
                  : "border-[#E6D9B7]/24 bg-[#06151C]/36 hover:border-[#E6D9B7]/44"
              }`}
            >
              <span
                aria-hidden="true"
                className={`ml-2.5 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                  isSearchFocused
                    ? "bg-[#E87B39]/20 border-[#E87B39]/60 text-[#F3D299]"
                    : "bg-[#FFF8E9]/[0.07] border-[#E6D9B7]/24 text-[#E6D9B7]"
                }`}
              >
                <Search size={16} />
              </span>

              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.trim()) setIsDropdownOpen(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nhập tên điểm đến (ví dụ: Bà Nà, Cầu Rồng, Bãi biển Mỹ Khê, Sơn Trà)..."
                aria-label="Tìm kiếm điểm du lịch Đà Nẵng"
                className="w-full bg-transparent py-3.5 pl-3.5 pr-12 text-sm sm:text-[15px] font-medium text-[#FFFDF5] placeholder:text-[#BFD1D3]/62 outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="mr-2.5 inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/18 border border-[#E6D9B7]/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#FFFDF5] transition cursor-pointer shrink-0"
                  title="Xóa từ khóa"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <span>Xóa</span>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* DARK SMOKED GLASS DROPDOWN GỢI Ý TỨC THÌ */}
            <AnimatePresence>
              {isDropdownOpen && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.985 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 right-0 mt-2.5 rounded-[18px] bg-[#071821]/96 backdrop-blur-xl shadow-[0_28px_70px_rgba(2,10,15,0.68)] border border-[#E6D9B7]/30 overflow-hidden z-50 p-3 divide-y divide-[#E6D9B7]/14"
                >
                  {matchingSuggestions.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E6D9B7]/80 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#E87B39]" />
                          Kết quả khớp tức thì ({matchingSuggestions.length})
                        </span>
                        <span className="text-[#CBD9DA]/60 hidden sm:inline">
                          Nhấn &ldquo;Xem chi tiết&rdquo; để mở
                        </span>
                      </div>
                      <div className="space-y-1 pt-2">
                        {matchingSuggestions.map((item) => {
                          const thumbSrc =
                            dropdownFailedImgs[item.id] || !item.img
                              ? LOCAL_FALLBACK_IMG
                              : item.img;
                          return (
                            <Link
                              key={item.id}
                              href={`/places/${item.id}`}
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3.5 p-2.5 rounded-[12px] hover:bg-white/[0.06] transition-colors group"
                            >
                              <div className="relative w-14 h-14 rounded-[10px] overflow-hidden shrink-0 border border-[#E6D9B7]/22 bg-[#051219]">
                                <Image
                                  src={thumbSrc}
                                  alt={item.name}
                                  fill
                                  unoptimized={thumbSrc.startsWith("http")}
                                  onError={() =>
                                    setDropdownFailedImgs((m) => ({
                                      ...m,
                                      [item.id]: true,
                                    }))
                                  }
                                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  sizes="56px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-[#FFFDF5] group-hover:text-[#F5E6C4] text-sm truncate transition-colors">
                                    {item.name}
                                  </h4>
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/[0.08] text-[#E6D9B7] rounded-full shrink-0 border border-[#E6D9B7]/25">
                                    {item.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-[#CBD9DA]/75">
                                  <span className="flex items-center gap-1">
                                    <MapPin
                                      size={12}
                                      className="text-[#C9B580]"
                                    />{" "}
                                    {item.location}
                                  </span>
                                  <span className="flex items-center gap-1 text-[#F6B27B] font-semibold">
                                    <Star
                                      size={11.5}
                                      className="fill-[#E87B39] text-[#E87B39]"
                                    />{" "}
                                    {item.rating}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 hidden sm:flex items-center gap-1.5 bg-[#FFF8E9] group-hover:bg-white text-[#102832] text-xs font-semibold px-3.5 py-2 rounded-full transition-colors">
                                <span>Xem chi tiết</span>
                                <ArrowRight
                                  size={13}
                                  className="text-[#CB712D] group-hover:translate-x-0.5 transition-transform"
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-sm text-[#CBD9DA]/80">
                      Không tìm thấy điểm đến nào khớp với từ khóa &ldquo;
                      <strong className="text-[#FFFDF5]">{searchQuery}</strong>
                      &rdquo;.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CHIPS GỢI Ý HOT */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pt-0.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E6D9B7]/70 shrink-0 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#E87B39]" /> Gợi ý hot:
              </span>
              {POPULAR_TAGS.map((tag) => {
                const isTagActive =
                  removeVietnameseTones(searchQuery) ===
                  removeVietnameseTones(tag.query);
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleSelectQuickTag(tag.query)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 border cursor-pointer ${
                      isTagActive
                        ? "bg-[#FFF8E9] text-[#102832] border-[#FFF8E9] shadow-sm"
                        : "bg-[#FFF8E9]/[0.07] hover:bg-[#FFF8E9]/[0.15] text-[#DCE8E8] hover:text-[#FFFDF5] border-[#E6D9B7]/20 hover:border-[#E6D9B7]/50"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HÀNG 2: DANH MỤC LỌC + VIEW SWITCHER + SẮP XẾP + XÓA LỌC */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 justify-between pt-4 border-t border-[#E6D9B7]/14">
            <LayoutGroup id="diemdulich-cat">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveCategory(cat.value)}
                      className={`relative px-3.5 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold transition-colors duration-200 shrink-0 cursor-pointer ${
                        isActive
                          ? "text-[#102832]"
                          : "text-[#D4E3E4] hover:text-[#FFFDF5] hover:bg-white/[0.06]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeCategoryDiemDuLich"
                          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FFFDF5] to-[#F3E7CE] shadow-[0_6px_16px_rgba(3,12,17,0.38)] pointer-events-none"
                          transition={SPRING.snappy}
                        />
                      )}
                      <cat.Icon
                        size={13.5}
                        className={`relative z-10 ${
                          isActive ? "text-[#CB712D]" : "text-[#E6D9B7]/85"
                        }`}
                      />
                      <span className="relative z-10">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            {/* Right Controls: View Mode + Sort + Clear */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <div
                className="inline-flex items-center gap-1 p-1 rounded-full bg-[#051218]/36 backdrop-blur-md border border-[#E6D9B7]/20"
                role="group"
                aria-label="Chế độ hiển thị điểm du lịch"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("gallery")}
                  aria-pressed={viewMode === "gallery"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    viewMode === "gallery"
                      ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                      : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                  }`}
                >
                  <LayoutGrid size={12.5} className="text-[#E6D9B7]" />
                  <span>Bộ ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("dossier")}
                  aria-pressed={viewMode === "dossier"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                    viewMode === "dossier"
                      ? "bg-[#FFF8E9]/16 text-[#FFFDF5] border border-[#E6D9B7]/42"
                      : "text-[#CBD9DA]/72 hover:text-[#FFFDF5] border border-transparent"
                  }`}
                >
                  <List size={12.5} className="text-[#E6D9B7]" />
                  <span>Hồ sơ</span>
                </button>
              </div>

              <button
                type="button"
                onClick={toggleSort}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E2ECEC] hover:text-[#FFFDF5] transition-colors bg-[#051218]/44 hover:bg-white/[0.08] px-3.5 py-2 rounded-full border border-[#E6D9B7]/22 cursor-pointer"
                title="Nhấn để đổi kiểu sắp xếp"
              >
                <ArrowUpDown size={13} className="text-[#E87B39]" />
                <span>
                  Sắp xếp:{" "}
                  <strong className="font-semibold text-[#E6D9B7]">
                    {sortLabel}
                  </strong>
                </span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 hover:text-white bg-red-500/20 hover:bg-red-500/35 border border-red-400/40 transition-colors px-3.5 py-2 rounded-full shrink-0 cursor-pointer"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RefreshCw size={12.5} />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. NỘI DUNG ĐIỂM DU LỊCH */}
      <main className="relative z-10 home-container pb-16 w-full flex-1">
        {/* TIER 1: SIGNATURE LANDMARK EXPEDITION SHOWCASE */}
        {showSpotlight && <LandmarkExpeditionShowcase items={filteredItems} />}

        {/* TIER 2 HEADER */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-7 border-b border-[#E6D9B7]/16">
          <div>
            <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-1.5">
              <span className="w-6 h-[1px] bg-[#E87B39]" />
              <span>
                CHƯƠNG 02 //{" "}
                {viewMode === "gallery"
                  ? "BỘ ẢNH CÂU CHUYỆN KỲ QUAN"
                  : "HỒ SƠ ĐỊA DANH TINH GỌN"}
              </span>
            </div>
            <h2 className="home-serif text-2xl sm:text-3xl font-semibold text-[#FFFDF5] leading-tight">
              {viewMode === "gallery" ? (
                <>
                  Danh thắng &amp;{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    tọa độ check-in Đà Nẵng
                  </span>
                </>
              ) : (
                <>
                  Mục lục địa danh{" "}
                  <span className="italic font-normal text-[#E6D9B7]">
                    biển · núi · di sản
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs sm:text-sm text-[#CBD9DA]/82">
              Hiển thị{" "}
              <strong className="font-mono font-bold text-[#FFFDF5]">
                {filteredItems.length}
              </strong>{" "}
              điểm đến
              {searchQuery && (
                <span>
                  {" "}
                  cho &ldquo;
                  <strong className="text-[#F6B27B]">{searchQuery}</strong>
                  &rdquo;
                </span>
              )}
              {activeCategory !== "Tất cả" && (
                <span>
                  {" "}
                  trong mục &ldquo;
                  <strong className="text-[#E6D9B7]">{activeCategory}</strong>
                  &rdquo;
                </span>
              )}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="text-xs text-[#F6B27B] hover:text-[#FFFDF5] font-semibold underline underline-offset-4 cursor-pointer"
              >
                Hiển thị tất cả
              </button>
            )}
          </div>
        </div>

        {/* LANDMARKS COLLECTION */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#081C25]/82 backdrop-blur-md rounded-[22px] border border-[#E6D9B7]/22 p-8 max-w-lg mx-auto">
            <SearchX className="w-12 h-12 text-[#E6D9B7]/60 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="home-serif text-xl font-semibold text-[#FFFDF5]">
              Không tìm thấy điểm đến phù hợp
            </h3>
            <p className="text-[#CBD9DA]/76 text-sm mt-2 leading-relaxed">
              Không có địa điểm nào khớp với tiêu chí lọc hiện tại
              {searchQuery ? ` cho "${searchQuery}"` : ""}. Hãy thử từ khóa khác
              hoặc xóa bộ lọc nhé!
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-6 px-6 py-2.5 bg-[#FFF8E9] hover:bg-white text-[#102832] rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition cursor-pointer"
            >
              Xem lại tất cả điểm đến
            </button>
          </div>
        ) : viewMode === "dossier" ? (
          <LandmarkAtlasIndex items={filteredItems} />
        ) : (
          <div className="event-ticket-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: reducedMotion ? 0 : Math.min(index * 0.05, 0.25),
                  ease: EASING.standard,
                }}
                className="h-full"
              >
                <StoryCard
                  data={item}
                  liked={likedIds.has(item.id)}
                  onLike={() => handleLike(item.id)}
                  index={index}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Nút Xem thêm (Dark Glass Pill) */}
        {hasMore &&
          filteredItems.length > 0 &&
          !searchQuery &&
          activeCategory === "Tất cả" && (
            <div className="flex justify-center mt-12">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#081C25]/85 hover:bg-[#FFF8E9] border border-[#E6D9B7]/35 hover:border-[#FFF8E9] text-[#FFFDF5] hover:text-[#102832] font-semibold uppercase tracking-[0.14em] text-xs px-8 py-3.5 shadow-[0_14px_34px_rgba(2,10,15,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Đang tải thêm...</span>
                  </>
                ) : (
                  <>
                    <span>Xem thêm các điểm đến khác</span>
                    <ChevronDown
                      size={15}
                      className="group-hover:translate-y-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          )}

        {/* 4. NOCTURNAL SONAR RADAR MAP PREVIEW */}
        <section className="mt-16 pb-6">
          <RadarMapPreview />
        </section>
      </main>

      {/* 5. FOOTER */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

export default function DiemDuLichPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06151C] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E87B39]" />
            <p className="text-sm font-medium text-[#E6D9B7]">
              Đang tải hành trình kỳ quan Đà Nẵng...
            </p>
          </div>
        </div>
      }
    >
      <DiemDuLichContent />
    </Suspense>
  );
}
