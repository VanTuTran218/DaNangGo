"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, MapPin, Search, Star, TrendingUp, Utensils, Hotel, Landmark, Sparkles } from "lucide-react";
import { getPlaces, getTopPlaces, type PlaceListItem, type PlaceType } from "@/lib/api/places";
import HeartButton from "@/components/HeartButton";
import SiteFooter from "@/components/places/SiteFooter";
import { SpotlightCard, recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import { DURATION, EASING, SPRING } from "@/lib/motion-tokens";

// ─── ĐƯỜNG DẪN ẢNH NỀN HERO KHÁM PHÁ (DỄ DÀNG THAY ĐỔI TẠI ĐÂY) ─────────────
// Bạn có thể đổi đường dẫn ảnh hoặc thay thế file: frontend/public/images/kham-pha-hero.jpg
export const KHAM_PHA_HERO_IMAGE = "/images/kham-pha-hero.jpg";

// ─── Cấu hình bộ lọc theo loại địa điểm ──────────────────────────────────────
const DIRECTORY_MODES: { value: PlaceType | ""; label: string; icon: React.ReactNode }[] = [
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

// ─── Variants animation cho Card (TUYỆT ĐỐI KHÔNG DÙNG SCALE ĐỂ CHỮ KHÔNG BỊ MỜ) ───
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: (index % 6) * 0.08, // Stagger lệch nhau 80ms
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

// ─── Badge màu theo place_type ────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  RESTAURANT:    { label: "Nhà hàng",     className: "bg-orange-500/90 text-white border-orange-400/50" },
  ACCOMMODATION: { label: "Lưu trú",      className: "bg-sky-600/90 text-white border-sky-400/50" },
  ATTRACTION:    { label: "Điểm du lịch", className: "bg-teal-600/90 text-white border-teal-400/50" },
  CAFE:          { label: "Cà phê",       className: "bg-amber-600/90 text-white border-amber-400/50" },
};

// ─── Card địa điểm ───────────────────────────────────────────────────────────
function PlaceCard({ place, index }: { place: PlaceListItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reducedMotion = useReducedMotion();
  const badge = TYPE_BADGE[place.place_type] ?? { label: place.place_type, className: "bg-slate-800/80 text-white border-slate-600/50" };

  return (
    <motion.div
      ref={ref}
      layout="position"
      variants={cardVariants}
      initial="hidden"
      animate={isInView || reducedMotion ? "show" : "hidden"}
      custom={index}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm
                 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-950/8 hover:border-teal-300/80"
    >
      <SpotlightCard className="flex h-full flex-col">
        {/* Ảnh bìa */}
        <Link
          href={`/places/${place.place_id}`}
          onClick={() => recordSharedPlaceClick(place.place_id, place.cover_image ?? undefined)}
          aria-label={`Xem ${place.name}`}
          className="relative block aspect-[16/9] overflow-hidden bg-slate-100
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
        >
        {place.cover_image ? (
          <Image
            src={place.cover_image}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          /* Placeholder xanh ngọc sang trọng khi địa điểm chưa có ảnh */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#086F72] to-[#168589] p-4 text-center text-white select-none">
            <div className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm">
              <MapPin size={22} className="text-cyan-200" aria-hidden="true" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-100 line-clamp-1 max-w-[85%]">
              {place.name}
            </span>
            <span className="text-[11px] text-teal-100/80 font-medium">Đà Nẵng</span>
          </div>
        )}

        {/* Overlay gradient nhẹ khi hover */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge loại địa điểm */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-bold
                      uppercase tracking-wider shadow-sm backdrop-blur-md ${badge.className}`}
        >
          {badge.label}
        </span>

        {/* Nút yêu thích */}
        <span className="absolute right-3 top-3 z-10 transition-transform duration-200 hover:scale-110 active:scale-95">
          <HeartButton placeId={place.place_id} />
        </span>
      </Link>

      {/* Nội dung card với độ sắc nét cao */}
      <div className="flex flex-1 flex-col p-5">
        {/* Tiêu đề màu navy đậm #102C58, font 700 */}
        <h2 className="line-clamp-2 min-h-12 text-[16px] font-bold leading-6 text-[#102C58] transition-colors group-hover:text-[#00B8A9]">
          {place.name}
        </h2>

        {/* Địa chỉ màu #52657D dễ đọc, icon xanh ngọc #00B8A9 */}
        <p className="mt-1.5 flex min-h-9 items-start gap-1.5 text-[13.5px] leading-5 text-[#52657D]">
          <MapPin
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#00B8A9]"
          />
          <span className="line-clamp-2 font-medium">{place.address || "Chưa có địa chỉ cụ thể"}</span>
        </p>

        {/* Đánh giá & Nút CTA */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Star size={15} aria-hidden="true" className="fill-amber-400 text-amber-400 shrink-0" />
            <span className="font-bold text-[#102C58] text-[14px]">
              {Number(place.avg_rating).toFixed(1)}
            </span>
            <span className="text-[#52657D]/60 font-semibold">·</span>
            <span className="text-[#52657D] text-[13px] font-medium">
              {place.review_count} đánh giá
            </span>
          </div>

          <Link
            href={`/places/${place.place_id}`}
            onClick={() => recordSharedPlaceClick(place.place_id, place.cover_image ?? undefined)}
            className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5
                       text-sm font-semibold text-white shadow-sm transition-all duration-200
                       hover:bg-teal-700 hover:brightness-105 hover:shadow-md hover:shadow-teal-600/25 active:scale-[0.98]
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <span>Xem chi tiết &amp; đánh giá</span>
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
      </SpotlightCard>
    </motion.div>
  );
}

// ─── Component chính ──────────────────────────────────────────────────────────
export default function PlaceDirectory() {
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topType, setTopType] = useState<PlaceType | "">("");
  const reducedMotion = useReducedMotion();

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

  return (
    <div className="min-h-screen bg-[#F3FBFA] relative overflow-hidden flex flex-col justify-between">
      {/* ── Subtile background radial tints (màu xanh ngọc rất nhẹ tạo chiều sâu) ── */}
      <div className="pointer-events-none absolute top-96 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,184,169,0.045)_0%,transparent_70%)] -z-0" />
      <div className="pointer-events-none absolute top-2/3 left-10 w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(0,184,169,0.035)_0%,transparent_70%)] -z-0" />

      {/* ── 1. GIỮ NGUYÊN HERO SECTION ĐẦU TRANG (data-navbar-overlay để Navbar trong suốt) ── */}
      <section
        data-navbar-overlay="true"
        aria-label="Khám Phá Đà Nẵng"
        className="relative w-full h-[400px] sm:h-[450px] lg:h-[490px] overflow-hidden flex items-center justify-center select-none"
      >
        {/* C1. Hero Image Reveal: bắt đầu từ scale(1.05) -> chuyển mượt về scale(1) trong 1.5s */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={reducedMotion ? { scale: 1 } : { scale: 1.05 }}
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
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>

        {/* Lớp phủ gradient tối nhẹ & ánh sáng để chữ nổi bật */}
        <div className="absolute inset-0 z-1 bg-gradient-to-b from-black/65 via-black/45 to-[#0b233a]/80" />
        <div className="absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/15 via-transparent to-black/40" />

        {/* Nội dung Hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center flex flex-col items-center pt-16 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-cyan-200 text-xs sm:text-sm font-semibold mb-3.5 shadow-sm"
          >
            <Sparkles size={14} className="text-cyan-300" />
            <span>CẨM NANG ĐỊA ĐIỂM DU LỊCH ĐÀ NẴNG</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight"
          >
            Khám Phá <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-300">Đà Nẵng</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3.5 text-sm sm:text-base md:text-lg text-white/90 max-w-2xl leading-relaxed"
          >
            Từ những bãi biển cát trắng miên man đến những ngọn núi hùng vĩ, Đà Nẵng lưu giữ hàng trăm kỳ quan chờ bạn khám phá.
          </motion.p>
        </div>
      </section>

      {/* ── 2. NỘI DUNG CHÍNH: KHỐI SEARCH/FILTER NỔI + DANH SÁCH ── */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10 w-full mb-16">
        {/* Khối Search / Filter nổi (Floating Card) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="-mt-12 sm:-mt-16 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 p-5 sm:p-7 shadow-xl shadow-teal-950/10 mb-8"
        >
          {/* Hàng 1: Ô tìm kiếm địa điểm */}
          <div className="relative w-full">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 text-teal-600/70"
            />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên địa điểm, món ăn, địa chỉ..."
              aria-label="Tìm địa điểm"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-12 pr-10 text-sm font-medium text-slate-900 shadow-inner outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs font-bold"
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </div>

          {/* Hàng 2: Các nút chọn danh mục bộ lọc */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3.5 border-t border-slate-100" aria-label="Chọn danh sách địa điểm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-block">
              Danh mục:
            </span>
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
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative inline-flex items-center gap-2 rounded-xl border px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                    isActive
                      ? "border-teal-600 text-white"
                      : "border-slate-200/90 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-700"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="khampha-active-filter"
                      transition={SPRING.snappy}
                      className="absolute inset-0 rounded-xl bg-teal-600 shadow-md shadow-teal-600/25 -z-10"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {mode.icon}
                    <span>{mode.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Ghi chú Top ranking */}
          <AnimatePresence>
            {topType && (
              <motion.p
                key="top-notice"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3.5 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 pt-2 border-t border-slate-100"
              >
                <TrendingUp size={15} className="text-teal-500 shrink-0" />
                <span>Top 10 địa điểm có ít nhất 3 đánh giá đã duyệt. Xếp theo điểm giảm dần; cùng điểm ưu tiên nơi có nhiều đánh giá hơn.</span>
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── LOADING SKELETON ── */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex h-80 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="aspect-[16/9] w-full animate-pulse bg-slate-200" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded-lg bg-slate-200" />
                  <div className="mt-auto h-10 w-full animate-pulse rounded-xl bg-slate-200" />
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
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200"
          >
            {error}
          </motion.p>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && !error && filteredPlaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-gray-600 shadow-sm"
          >
            <Compass size={40} className="mx-auto text-teal-500/60 mb-3" />
            <p className="text-base font-semibold text-slate-800">
              {places.length === 0
                ? topType
                  ? "Chưa có địa điểm đủ điều kiện xếp hạng."
                  : "Chưa có địa điểm ACTIVE trong cơ sở dữ liệu."
                : "Không tìm thấy địa điểm phù hợp."}
            </p>
            {keyword && (
              <p className="text-xs text-slate-500 mt-1">
                Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
              </p>
            )}
          </motion.div>
        )}

        {/* ── GRID ĐỊA ĐIỂM (CÁC CARD CÓ STAGGER FADE-UP & HOVER SẮC NÉT) ── */}
        {!loading && !error && filteredPlaces.length > 0 && (
          <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaces.map((place, i) => (
              <PlaceCard key={place.place_id} place={place} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* ── 3. FOOTER Ở CUỐI TRANG (TÁI SỬ DỤNG COMPONENT CHUẨN CỦA WEBSITE) ── */}
      <SiteFooter />
    </div>
  );
}
