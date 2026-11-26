"use client";

/**
 * MysteryConstellationAtlas — Tier 1 ("Hải Đồ Tinh Tú Đà Nẵng & La Bàn Giải Mã")
 *
 * Inspired by ORYZO AI × Active Theory × Black Tomato:
 * - Plots up to 9 real places from the active list onto a nocturnal Da Nang coastal astrolabe chart.
 * - Moving the cursor across the chart casts a moonlight lantern (`--lx`, `--ly`, 0 React re-renders).
 * - Hovering or clicking any glowing star locks the Astrolabe Crosshair onto that coordinate and
 *   updates the live Destination Decoder card on the right.
 * - "Xoay La Bàn Bí Ẩn" triggers a tactile 1.05s coordinate-decoding ritual that spins the astrolabe
 *   and reveals a surprise hidden destination from the active list.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Sparkles,
  MapPin,
  Star,
  ArrowRight,
  Shuffle,
  Hotel,
  Utensils,
  Landmark,
  Coffee,
} from "lucide-react";
import type { PlaceListItem } from "@/lib/api/places";
import HeartButton from "@/components/HeartButton";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import { EASING } from "@/lib/motion-tokens";

interface MysteryConstellationAtlasProps {
  places: PlaceListItem[];
  resolveImageSrc: (raw?: string | null) => string | null;
}

// Hand-composed coastal constellation coordinates (percent x, y) forming an artistic Da Nang bay arc
const CONSTELLATION_SLOTS: {
  x: number;
  y: number;
  lat: string;
  lon: string;
  sector: string;
}[] = [
  { x: 18, y: 34, lat: "16°06'N", lon: "108°15'E", sector: "Bán Đảo Sơn Trà" },
  { x: 34, y: 22, lat: "16°07'N", lon: "108°16'E", sector: "Mũi Nghê" },
  { x: 52, y: 30, lat: "16°05'N", lon: "108°14'E", sector: "Vịnh Mỹ Khê" },
  { x: 70, y: 20, lat: "16°04'N", lon: "108°15'E", sector: "Biển Phạm Văn Đồng" },
  { x: 83, y: 38, lat: "16°03'N", lon: "108°14'E", sector: "Bờ Đông Sông Hàn" },
  { x: 64, y: 54, lat: "16°03'N", lon: "108°13'E", sector: "Trung Tâm Hải Châu" },
  { x: 42, y: 60, lat: "16°02'N", lon: "108°14'E", sector: "Biển An Thượng" },
  { x: 24, y: 72, lat: "16°00'N", lon: "108°15'E", sector: "Ngũ Hành Sơn" },
  { x: 76, y: 74, lat: "15°59'N", lon: "108°16'E", sector: "Non Nước" },
];

function getTypeLabel(type: string) {
  switch (type) {
    case "ACCOMMODATION":
      return { label: "Lưu trú", icon: <Hotel size={11} /> };
    case "RESTAURANT":
      return { label: "Nhà hàng", icon: <Utensils size={11} /> };
    case "ATTRACTION":
      return { label: "Điểm du lịch", icon: <Landmark size={11} /> };
    case "CAFE":
      return { label: "Cà phê", icon: <Coffee size={11} /> };
    default:
      return { label: type, icon: <Compass size={11} /> };
  }
}

export default function MysteryConstellationAtlas({
  places,
  resolveImageSrc,
}: MysteryConstellationAtlasProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const spinDoneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pick up to 9 varied places for the constellation (prioritize entries with images)
  const nodes = useMemo(() => {
    if (places.length === 0) return [];
    const withImg = places.filter((p) => Boolean(resolveImageSrc(p.cover_image)));
    const pool = withImg.length >= 4 ? withImg : places;
    const picked: PlaceListItem[] = [];
    const seenNames = new Set<string>();

    for (const p of pool) {
      const key = p.name.trim().toLowerCase();
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      picked.push(p);
      if (picked.length >= CONSTELLATION_SLOTS.length) break;
    }

    return picked.map((place, idx) => ({
      place,
      slot: CONSTELLATION_SLOTS[idx],
      code: String(idx + 1).padStart(2, "0"),
    }));
  }, [places, resolveImageSrc]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isDecoding, setIsDecoding] = useState(false);
  const [imgFailedMap, setImgFailedMap] = useState<Record<number, boolean>>({});

  // Reset active index cleanly if filter changes
  useEffect(() => {
    setActiveIdx(0);
    setIsDecoding(false);
    if (spinDoneRef.current) {
      clearTimeout(spinDoneRef.current);
      spinDoneRef.current = null;
    }
  }, [nodes.length, places[0]?.place_id]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (spinDoneRef.current) clearTimeout(spinDoneRef.current);
    };
  }, []);

  if (nodes.length < 2) return null;

  const safeIdx = activeIdx < nodes.length ? activeIdx : 0;
  const current = nodes[safeIdx];
  const currentImg = resolveImageSrc(current.place.cover_image);
  const showCurrentImg = Boolean(currentImg) && !imgFailedMap[current.place.place_id];
  const currentType = getTypeLabel(current.place.place_type);

  const handleCanvasMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = canvasRef.current;
      if (!el) return;
      el.style.setProperty("--lx", `${x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${y.toFixed(1)}px`);
      el.style.setProperty("--l-op", "1");
      rafRef.current = null;
    });
  };

  const handleCanvasLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    canvasRef.current?.style.setProperty("--l-op", "0");
  };

  // Mystery Discovery Ritual: Decelerating brass-compass sweep locking onto a surprise coordinate
  const handleMysteryDecode = () => {
    if (isDecoding || nodes.length < 2) return;
    const offset = 1 + Math.floor(Math.random() * (nodes.length - 1));
    const targetIdx = (safeIdx + offset) % nodes.length;

    if (reducedMotion) {
      setActiveIdx(targetIdx);
      return;
    }

    if (spinDoneRef.current) {
      clearTimeout(spinDoneRef.current);
      spinDoneRef.current = null;
    }

    setIsDecoding(true);

    // Build an exact deterministic path of steps that decelerates naturally and lands cleanly on targetIdx
    const totalSteps = nodes.length + offset;
    let step = 0;

    const tick = () => {
      step += 1;
      const nextIdx = (safeIdx + step) % nodes.length;
      setActiveIdx(nextIdx);

      if (step >= totalSteps) {
        spinDoneRef.current = null;
        setActiveIdx(targetIdx);
        setIsDecoding(false);
        return;
      }

      const progress = step / totalSteps;
      const delayMs = Math.round(58 + progress * progress * 125);
      spinDoneRef.current = setTimeout(tick, delayMs);
    };

    spinDoneRef.current = setTimeout(tick, 60);
  };

  // Build SVG constellation polyline connecting all plotted coordinates
  const constellationPath = nodes
    .map((n, i) => `${i === 0 ? "M" : "L"} ${n.slot.x * 10} ${n.slot.y * 5.2}`)
    .join(" ");

  return (
    <section
      aria-label="Hải đồ tinh tú Đà Nẵng"
      className="mb-16 lg:mb-20"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2.5 text-[10.5px] font-mono uppercase tracking-[0.24em] text-[#E6D9B7] mb-2">
            <span className="w-6 h-[1px] bg-[#E87B39]" />
            <span>CHƯƠNG 01 // HẢI ĐỒ TINH TÚ ĐÀ NẴNG</span>
          </div>
          <h2 className="home-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#FFFDF5] leading-tight">
            Chạm vào tọa độ,{" "}
            <span className="italic font-normal text-[#E6D9B7]">
              giải mã một góc Đà Nẵng
            </span>
          </h2>
        </div>

        {/* Mystery Compass Ritual Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleMysteryDecode}
          disabled={isDecoding}
          className="group luxury-btn-sweep inline-flex items-center gap-2.5 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] border border-[#E6D9B7]/75 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_12px_30px_rgba(3,12,17,0.45)] transition-all cursor-pointer disabled:opacity-80"
        >
          <Shuffle
            size={14}
            className={`text-[#CB712D] ${isDecoding ? "animate-spin" : "transition-transform duration-300 group-hover:rotate-180"}`}
          />
          <span>{isDecoding ? "Đang dò tọa độ..." : "Xoay la bàn bí ẩn"}</span>
        </motion.button>
      </div>

      {/* Main 12-Col Celestial Sanctuary Card */}
      <div className="relative rounded-[22px] bg-[#071821]/92 border border-[#E6D9B7]/26 shadow-[0_30px_80px_rgba(2,10,15,0.52)] overflow-hidden grid lg:grid-cols-12">
        {/* Top Champagne rim highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-30 bg-gradient-to-r from-transparent via-[#E6D9B7]/55 to-transparent"
        />

        {/* LEFT 7 COLS: INTERACTIVE CELESTIAL CONSTELLATION MAP */}
        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMove}
          onMouseLeave={handleCanvasLeave}
          className="mystery-atlas-canvas relative lg:col-span-7 min-h-[370px] sm:min-h-[430px] lg:min-h-[470px] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E6D9B7]/16 select-none"
          style={{
            background:
              "radial-gradient(ellipse 85% 75% at 45% 48%, rgba(20,66,77,0.42) 0%, rgba(7,24,33,0.96) 72%, #051219 100%)",
          }}
        >
          {/* Moonlight Lantern following pointer */}
          <div
            aria-hidden="true"
            className="mystery-atlas-lantern pointer-events-none absolute inset-0 z-1"
          />

          {/* Fine Nautical Latitude / Longitude Grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(230,217,183,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,217,183,0.45) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* Topographic Coastal Contours */}
          <img
            src="/images/intro/atmosphere/intro-coastal-contours.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-30"
          />

          {/* Rotating Celestial Astrolabe Compass Centerpiece */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50"
          >
            <div
              className={`w-[320px] h-[320px] sm:w-[390px] sm:h-[390px] rounded-full border border-[#E6D9B7]/18 flex items-center justify-center ${
                isDecoding ? "astrolabe-ring-fast" : "astrolabe-ring-cw"
              }`}
            >
              <div className="w-[82%] h-[82%] rounded-full border border-dashed border-[#69A5A3]/30 astrolabe-ring-ccw flex items-center justify-center">
                <div className="w-[62%] h-[62%] rounded-full border border-[#E6D9B7]/15" />
              </div>
            </div>
          </div>

          {/* SVG Constellation Connection Threads */}
          <svg
            viewBox="0 0 1000 520"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
          >
            <defs>
              <linearGradient id="constellationLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#69A5A3" stopOpacity="0.28" />
                <stop offset="50%" stopColor="#E6D9B7" stopOpacity="0.52" />
                <stop offset="100%" stopColor="#E87B39" stopOpacity="0.34" />
              </linearGradient>
            </defs>
            <path
              d={constellationPath}
              fill="none"
              stroke="url(#constellationLineGrad)"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />
          </svg>

          {/* Animated Astrolabe Target Crosshair Locking onto Active Star */}
          <motion.div
            aria-hidden="true"
            animate={{
              left: `${current.slot.x}%`,
              top: `${current.slot.y}%`,
            }}
            transition={{ type: "spring", stiffness: 210, damping: 26, mass: 0.7 }}
            className="pointer-events-none absolute z-15 -translate-x-1/2 -translate-y-1/2 w-14 h-14"
          >
            <span className="absolute inset-0 rounded-full border border-[#E6D9B7]/65" />
            <span className="absolute -inset-2 rounded-full border border-dashed border-[#E87B39]/50 astrolabe-ring-cw" />
            <span className="absolute top-1/2 -left-3 w-2.5 h-[1px] bg-[#E6D9B7]/75" />
            <span className="absolute top-1/2 -right-3 w-2.5 h-[1px] bg-[#E6D9B7]/75" />
            <span className="absolute left-1/2 -top-3 h-2.5 w-[1px] bg-[#E6D9B7]/75" />
            <span className="absolute left-1/2 -bottom-3 h-2.5 w-[1px] bg-[#E6D9B7]/75" />
          </motion.div>

          {/* Interactive Star Nodes (Real Places) */}
          {nodes.map((node, idx) => {
            const isSelected = idx === safeIdx;
            return (
              <button
                key={node.place.place_id}
                type="button"
                onMouseEnter={() => {
                  if (!isDecoding) setActiveIdx(idx);
                }}
                onFocus={() => {
                  if (!isDecoding) setActiveIdx(idx);
                }}
                onClick={() => {
                  if (!isDecoding) setActiveIdx(idx);
                }}
                style={{
                  left: `${node.slot.x}%`,
                  top: `${node.slot.y}%`,
                }}
                aria-label={`Tọa độ ${node.code}: ${node.place.name}`}
                aria-pressed={isSelected}
                className="group/star absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2.5 cursor-pointer outline-none"
              >
                <span className="relative flex items-center justify-center">
                  {/* Soft breathing pulse halo */}
                  <span
                    className={`constellation-star-halo absolute w-7 h-7 rounded-full ${
                      isSelected ? "bg-[#E87B39]/40" : "bg-[#E6D9B7]/25"
                    }`}
                  />
                  {/* Star core */}
                  <span
                    className={`relative rounded-full transition-all duration-300 ${
                      isSelected
                        ? "w-3.5 h-3.5 bg-[#FFFDF5] ring-2 ring-[#E87B39] shadow-[0_0_16px_rgba(232,123,57,0.85)]"
                        : "w-2.5 h-2.5 bg-[#E6D9B7] group-hover/star:scale-125 group-hover/star:bg-[#FFFDF5]"
                    }`}
                  />
                </span>

                {/* Coordinate tag floating below star */}
                <span
                  className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-mono tracking-[0.12em] transition-all duration-250 ${
                    isSelected
                      ? "bg-[#081C25]/92 border border-[#E6D9B7]/55 text-[#FFFDF5] shadow-md"
                      : "bg-[#081C25]/65 border border-[#E6D9B7]/18 text-[#CBD9DA]/80 group-hover/star:text-[#FFFDF5] group-hover/star:border-[#E6D9B7]/45"
                  }`}
                >
                  {node.code} · {node.place.name.slice(0, 16)}
                  {node.place.name.length > 16 ? "…" : ""}
                </span>
              </button>
            );
          })}

          {/* Corner Nautical HUD Metadata */}
          <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]/75">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#051219]/70 border border-[#E6D9B7]/22 px-3 py-1">
              <Compass size={12} className="text-[#E87B39]" />
              <span>ATLAS ĐÀ NẴNG · {nodes.length} TỌA ĐỘ SÁNG</span>
            </span>
            <span className="hidden sm:inline-block rounded-full bg-[#051219]/70 border border-[#E6D9B7]/22 px-3 py-1">
              {current.slot.lat} · {current.slot.lon}
            </span>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-[#CBD9DA]/70">
            <span>DI CHUỘT HOẶC CHẠM ĐỂ KHÓA TỌA ĐỘ</span>
            <span className="text-[#E6D9B7]">{current.slot.sector}</span>
          </div>
        </div>

        {/* RIGHT 5 COLS: LIVE COORDINATE DECODER PANEL */}
        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between bg-gradient-to-b from-[#091E28]/95 to-[#06151C]/98">
          <motion.div
            key={current.place.place_id}
            initial={reducedMotion || isDecoding ? false : { opacity: 0.45, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: EASING.standard }}
            className="flex flex-col h-full justify-between space-y-5"
          >
              <div>
                {/* Coordinate Header */}
                <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E6D9B7]/16">
                  <span className="inline-flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                    <Sparkles size={12} className="text-[#E87B39]" />
                    <span>TỌA ĐỘ #{current.code} · {current.slot.lat}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-[#E6D9B7]/25 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#E6D9B7]">
                    {currentType.icon}
                    <span>{currentType.label}</span>
                  </span>
                </div>

                {/* Live Destination Framed Preview */}
                <div className="relative rounded-[14px] overflow-hidden aspect-[16/10] bg-[#0B222C] border border-[#E6D9B7]/24 mb-4 group/preview">
                  {showCurrentImg && currentImg ? (
                    <Image
                      src={currentImg}
                      alt={current.place.name}
                      fill
                      unoptimized={currentImg.startsWith("http")}
                      onError={() =>
                        setImgFailedMap((m) => ({
                          ...m,
                          [current.place.place_id]: true,
                        }))
                      }
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover transition-transform duration-700 ease-out group-hover/preview:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center text-center p-4"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 40%, rgba(33,107,112,0.5) 0%, #071922 80%)",
                      }}
                    >
                      <Compass size={26} className="text-[#E6D9B7] mb-2" />
                      <span className="text-[10px] font-mono tracking-[0.2em] text-[#E6D9B7]/75">
                        COORDINATE LOCKED
                      </span>
                    </div>
                  )}

                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                      isDecoding
                        ? "bg-[#06151C]/45 opacity-100"
                        : "bg-gradient-to-t from-[#06151C]/80 via-transparent to-transparent opacity-100"
                    }`}
                  />

                  {isDecoding && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#06151C]/85 border border-[#E6D9B7]/45 px-3.5 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]">
                        <Compass size={12} className="text-[#E87B39] animate-spin" />
                        <span>Đang khóa #{current.code}</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 z-20">
                    <HeartButton placeId={current.place.place_id} />
                  </div>

                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#06151C]/80 backdrop-blur-xs border border-[#E6D9B7]/30 px-3 py-1 text-xs font-semibold text-[#FFFDF5]">
                    <Star size={12} className="fill-[#E87B39] text-[#E87B39]" />
                    <span>{Number(current.place.avg_rating).toFixed(1)}</span>
                    <span className="text-[#CBD9DA]/70 font-normal">
                      ({current.place.review_count})
                    </span>
                  </div>
                </div>

                {/* Place Name & Address */}
                <h3 className="home-serif text-xl sm:text-2xl font-semibold text-[#FFFDF5] leading-snug mb-2">
                  {current.place.name}
                </h3>
                <p className="flex items-start gap-2 text-xs sm:text-[13px] text-[#CBD9DA]/82 leading-relaxed">
                  <MapPin size={14} className="text-[#C9B580] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {current.place.address || "Đà Nẵng, Việt Nam"}
                  </span>
                </p>
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-[#E6D9B7]/16 flex items-center justify-between gap-3">
                <span className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-[#CBD9DA]/70">
                  {current.slot.sector}
                </span>

                <Link
                  href={`/places/${current.place.place_id}`}
                  onClick={() =>
                    recordSharedPlaceClick(
                      current.place.place_id,
                      currentImg ?? undefined
                    )
                  }
                  className="group/open inline-flex items-center gap-2 rounded-full bg-[#FFF8E9] hover:bg-white text-[#102832] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors shrink-0"
                >
                  <span>Mở khóa tọa độ</span>
                  <ArrowRight
                    size={14}
                    className="text-[#0F4C5C] transition-transform duration-250 group-hover/open:translate-x-1"
                  />
                </Link>
              </div>
            </motion.div>
        </div>
      </div>
    </section>
  );
}
