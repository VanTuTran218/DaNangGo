"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, Compass, MapPin, Search, Star, TrendingUp, Utensils, Hotel, Landmark } from "lucide-react";
import { getPlaces, getTopPlaces, type PlaceListItem, type PlaceType } from "@/lib/api/places";
import HeartButton from "@/components/HeartButton";

// ─── Cấu hình bộ lọc theo loại địa điểm ──────────────────────────────────────
const DIRECTORY_MODES: { value: PlaceType | ""; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "",
    label: "Tất cả địa điểm",
    icon: <Compass size={15} />,
    color: "teal",
  },
  {
    value: "RESTAURANT",
    label: "Top nhà hàng",
    icon: <Utensils size={15} />,
    color: "orange",
  },
  {
    value: "ACCOMMODATION",
    label: "Top lưu trú",
    icon: <Hotel size={15} />,
    color: "sky",
  },
  {
    value: "ATTRACTION",
    label: "Top điểm du lịch",
    icon: <Landmark size={15} />,
    color: "violet",
  },
];

// ─── Variants animation ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: "easeOut" as const },
  },
};

// ─── Badge màu theo place_type ────────────────────────────────────────────────
const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  RESTAURANT:    { label: "Nhà hàng",     className: "bg-orange-100 text-orange-700 border-orange-200" },
  ACCOMMODATION: { label: "Lưu trú",      className: "bg-sky-100 text-sky-700 border-sky-200" },
  ATTRACTION:    { label: "Điểm du lịch", className: "bg-violet-100 text-violet-700 border-violet-200" },
  CAFE:          { label: "Cà phê",       className: "bg-amber-100 text-amber-700 border-amber-200" },
};

// ─── Card địa điểm (có animation inView) ─────────────────────────────────────
function PlaceCard({ place, index }: { place: PlaceListItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  const badge = TYPE_BADGE[place.place_type] ?? { label: place.place_type, className: "bg-gray-100 text-gray-600 border-gray-200" };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      custom={index}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm
                 transition-shadow duration-300 hover:shadow-xl hover:shadow-teal-900/10"
    >
      {/* Ảnh bìa */}
      <Link
        href={`/places/${place.place_id}`}
        aria-label={`Xem ${place.name}`}
        className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-100 via-cyan-50 to-sky-100
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
      >
        {place.cover_image ? (
          <Image
            src={place.cover_image}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-teal-800/70">
            <MapPin size={30} aria-hidden="true" />
            <span className="text-xs font-semibold">Địa điểm Đà Nẵng</span>
          </span>
        )}

        {/* Overlay gradient khi hover */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge loại địa điểm */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-bold
                      uppercase tracking-wider shadow-sm backdrop-blur-sm ${badge.className}`}
        >
          {badge.label}
        </span>

        {/* Nút yêu thích */}
        <span className="absolute right-3 top-3 z-10">
          <HeartButton placeId={place.place_id} />
        </span>
      </Link>

      {/* Nội dung card */}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-2 min-h-14 text-base font-bold leading-6 text-[#0f2942] transition-colors group-hover:text-teal-700">
          {place.name}
        </h2>

        <p className="mt-1 flex min-h-10 items-start gap-1.5 text-sm leading-5 text-slate-500">
          <MapPin
            size={14}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-teal-500"
          />
          <span className="line-clamp-2">{place.address || "Chưa có địa chỉ"}</span>
        </p>

        <div className="mt-auto">
          <div className="mt-4 flex items-center gap-1.5 text-sm">
            <Star size={14} aria-hidden="true" className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{Number(place.avg_rating).toFixed(1)}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{place.review_count} đánh giá</span>
          </div>

          <Link
            href={`/places/${place.place_id}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3
                       text-sm font-semibold text-white shadow-sm transition-all duration-200
                       hover:bg-teal-700 hover:shadow-md hover:shadow-teal-600/20
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Xem chi tiết &amp; đánh giá
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
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
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28">

      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8 flex flex-col gap-6 rounded-3xl border border-teal-100
                   bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-sm
                   sm:flex-row sm:items-end sm:justify-between sm:p-8"
      >
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-700"
          >
            <Compass size={13} aria-hidden="true" />
            Khám phá Đà Nẵng
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45 }}
            className="mt-2 text-3xl font-bold tracking-tight text-[#0f2942] sm:text-4xl"
          >
            Tìm địa điểm, đọc đánh giá
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            Chọn nơi bạn muốn đến và xem trải nghiệm từ cộng đồng.
          </motion.p>
        </div>

        {/* Ô tìm kiếm */}
        <motion.label
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative block w-full sm:max-w-sm"
        >
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm địa điểm..."
            aria-label="Tìm địa điểm"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm
                       outline-none transition-all placeholder:text-slate-400
                       focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          />
        </motion.label>
      </motion.div>

      {/* ── BỘ LỌC LOẠI ĐỊA ĐIỂM ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="mb-6 flex flex-wrap gap-2"
        aria-label="Chọn danh sách địa điểm"
      >
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
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold
                         transition-all duration-200 ${
                           isActive
                             ? "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20"
                             : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-700"
                         }`}
            >
              {mode.icon}
              {mode.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Ghi chú Top ranking */}
      <AnimatePresence>
        {topType && (
          <motion.p
            key="top-notice"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-600"
          >
            <TrendingUp size={15} className="text-teal-500" />
            Top 10 địa điểm có ít nhất 3 đánh giá đã duyệt. Xếp theo điểm giảm dần; cùng điểm ưu tiên nơi có nhiều đánh giá hơn.
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── LOADING SKELETON ────────────────────────────────────────────────── */}
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

      {/* ── LỖI ────────────────────────────────────────────────────────────── */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </motion.p>
      )}

      {/* ── EMPTY STATE ─────────────────────────────────────────────────────── */}
      {!loading && !error && filteredPlaces.length === 0 && (
        <motion.p
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm"
        >
          {places.length === 0
            ? topType
              ? "Chưa có địa điểm đủ điều kiện xếp hạng."
              : "Chưa có địa điểm ACTIVE trong cơ sở dữ liệu."
            : "Không tìm thấy địa điểm phù hợp."}
        </motion.p>
      )}

      {/* ── GRID ĐỊA ĐIỂM ───────────────────────────────────────────────────── */}
      {!loading && !error && filteredPlaces.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPlaces.map((place, i) => (
            <PlaceCard key={place.place_id} place={place} index={i} />
          ))}
        </motion.div>
      )}
    </main>
  );
}
