"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MapPin, Star, Sparkles } from "lucide-react";
import { similarPlaces } from "@/lib/api/ai";
import { useAiAction } from "@/hooks/useAiAction";
import { recordSharedPlaceClick } from "@/components/ui/MotionPrimitives";
import type { ChatPlaceCard } from "@/types/chat";

function resolveSimilarImage(src?: string | null): string | null {
  if (!src || !src.trim() || src.includes("place-placeholder")) return null;
  const trimmed = src.trim();
  if (trimmed.startsWith("/uploads/")) {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${trimmed}`;
  }
  return trimmed;
}

function SimilarPlaceCard({
  place,
  index,
}: {
  place: ChatPlaceCard & { method: string; reason: string };
  index: number;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveSimilarImage(place.imageUrl);
  const showImage = Boolean(resolved) && !failed;

  return (
    <Link
      href={`/places/${place.placeId}`}
      onClick={() => recordSharedPlaceClick(place.placeId, resolved ?? undefined)}
      className="group relative luxury-card-surface luxury-border-sweep luxury-shimmer-frame w-[275px] sm:w-[290px] h-[330px] shrink-0 rounded-[14px] bg-[#091D26] overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle top Champagne rim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] z-20 bg-gradient-to-r from-transparent via-[#E6D9B7]/45 to-transparent"
      />

      {/* Full-bleed image or bespoke coastal dark placeholder */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#091D26]">
        {showImage && resolved ? (
          <img
            src={resolved}
            onError={() => setFailed(true)}
            alt={place.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 65% at 50% 34%, rgba(33,107,112,0.52) 0%, rgba(16,40,50,0.92) 60%, #081A22 100%)",
            }}
          >
            <div className="w-12 h-12 rounded-full bg-[#FFF8E9]/8 border border-[#E6D9B7]/30 flex items-center justify-center mb-2">
              <Compass size={20} className="text-[#E6D9B7]" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E6D9B7]/70">
              DANANGGO
            </span>
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,22,30,0.38) 0%, rgba(7,22,30,0.08) 30%, rgba(7,22,30,0.75) 62%, rgba(5,16,22,0.97) 100%)",
          }}
        />
      </div>

      {/* Top row: Index + Rating */}
      <div className="relative z-20 p-3.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#081C25]/74 backdrop-blur-xs border border-[#E6D9B7]/30 px-2.5 py-1 text-[10px] font-mono tracking-[0.16em] text-[#E6D9B7]">
          0{index + 1}
        </span>

        {place.reviewCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#081C25]/74 backdrop-blur-xs border border-[#E6D9B7]/30 px-2.5 py-1 text-[11px] font-semibold text-[#FFFDF5]">
            <Star size={11} className="fill-[#E87B39] text-[#E87B39]" />
            <span>{place.rating}</span>
          </span>
        )}
      </div>

      {/* Bottom info */}
      <div className="relative z-20 mt-auto p-4 flex flex-col justify-end">
        <h4
          style={{ textShadow: "0 2px 10px rgba(4,14,20,0.75)" }}
          className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-[#FFFDF5] group-hover:text-[#F5E6C4] transition-colors mb-1.5"
        >
          {place.name}
        </h4>

        <p className="flex items-center gap-1.5 text-xs text-[#D5E4E4]/85 mb-2">
          <MapPin size={12} className="text-[#C9B580] shrink-0" />
          <span className="truncate">{place.districtName || "Đà Nẵng"}</span>
        </p>

        {place.reason && (
          <p className="line-clamp-2 text-[11.5px] text-[#CBD9DA]/78 leading-relaxed mb-3">
            {place.reason}
          </p>
        )}

        <div className="pt-2.5 border-t border-[#E6D9B7]/20 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#F2DFB4] truncate">
            {place.priceText || "Xem chi tiết"}
          </span>
          <ArrowRight
            size={14}
            className="text-[#E6D9B7] shrink-0 transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </div>
    </Link>
  );
}

export default function SimilarPlacesSection({
  currentId,
}: {
  currentId: number;
}) {
  const action = useAiAction<{
    items: (ChatPlaceCard & { method: string; reason: string })[];
    method: string;
  }>();

  useEffect(() => {
    action.run((signal) => similarPlaces(currentId, signal));
    return action.clear;
  }, [currentId, action.run, action.clear]);

  return (
    <section className="mb-8 space-y-5 rounded-[16px] border border-[#E5DAC8] bg-[#FFFDF9] p-6 sm:p-8 shadow-[0_14px_38px_rgba(16,40,50,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-[#E8DDCF]">
        <div>
          <div className="inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#216B70] mb-1">
            <Sparkles size={12} className="text-[#CB712D]" />
            <span>Gợi ý dành riêng cho bạn</span>
          </div>
          <h3 className="home-serif text-xl sm:text-2xl font-semibold text-[#102832]">
            Gợi ý địa điểm tương tự
          </h3>
        </div>

        <Link
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#216B70] hover:text-[#102832] transition-colors group"
          href="/khampha"
        >
          <span>Xem tất cả</span>
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {action.loading && (
        <div role="status" className="flex gap-4 overflow-x-auto pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[275px] h-[330px] shrink-0 rounded-[14px] bg-[#0C242E] border border-[#E6D9B7]/20 animate-pulse"
            />
          ))}
        </div>
      )}

      {action.error && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-[10px] p-3.5">
          {action.error}
          <button
            type="button"
            className="ml-2 underline font-semibold cursor-pointer"
            onClick={() =>
              action.run((signal) => similarPlaces(currentId, signal))
            }
          >
            Thử lại
          </button>
        </p>
      )}

      {action.data && !action.data.items.length && (
        <p className="text-sm text-[#738086]">
          Chưa có địa điểm cùng loại để gợi ý.
        </p>
      )}

      {action.data && action.data.items.length > 0 && (
        <div className="flex gap-5 overflow-x-auto pb-3 pt-1">
          {action.data.items.map((place, idx) => (
            <SimilarPlaceCard key={place.placeId} place={place} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}
