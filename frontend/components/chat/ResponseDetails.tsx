"use client";

import HeartButton from "@/components/HeartButton";
import Link from "next/link";
import type { ChatMessage, ChatPlaceCard } from "@/types/chat";
import { useState } from "react";
import { chatRequest } from "@/lib/api/chat";
import { useAuth } from "@/contexts/AuthContext";

export function MenuItems({ place, theme = "light" }: { place: ChatPlaceCard; theme?: "light" | "dark" }) {
  if (place.placeType !== "RESTAURANT") return null;
  const isDark = theme === "dark";
  return (
    <div
      className={
        isDark
          ? "px-4 py-2.5 text-xs text-[#CBD9DA] border-t border-[#E6D9B7]/12 bg-[#061620]/55"
          : "px-3 py-2 text-xs text-slate-600"
      }
    >
      <strong className={isDark ? "text-[#E6D9B7]" : ""}>Món trong menu</strong>
      {place.menuItems?.length ? (
        <ul className="mt-1 space-y-1">
          {place.menuItems.map((item) => (
            <li key={item.id}>
              {item.name} ·{" "}
              <span className={isDark ? "text-[#2DD4BF] font-medium" : ""}>
                {item.price === null ? "Chưa cập nhật giá" : `${item.price.toLocaleString("vi-VN")}đ`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={isDark ? "text-[#94B0B3] mt-0.5" : ""}>Chưa có menu để gợi ý món cụ thể.</p>
      )}
    </div>
  );
}

function Consent({
  suggestions,
  theme = "light",
}: {
  suggestions: NonNullable<ChatMessage["profileSuggestions"]>;
  theme?: "light" | "dark";
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user || !suggestions.length) return null;
  const isDark = theme === "dark";
  return (
    <div
      className={
        isDark
          ? "rounded-xl border border-[#2DD4BF]/28 bg-[#09212C]/85 p-3.5 text-sm text-[#FFFDF5]"
          : "rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-slate-700"
      }
    >
      <p>Ghi nhớ cho các chuyến sau: {suggestions.map((item) => item.label).join(", ")}?</p>
      {suggestions.some((item) => item.sensitive) && (
        <p className={isDark ? "mt-1 text-xs text-[#CBD9DA]" : "mt-1 text-xs"}>
          Có thông tin dị ứng. Chỉ lưu khi bạn đồng ý; bạn có thể xóa trong Sở thích đã lưu.
        </p>
      )}
      <button
        type="button"
        className={
          isDark
            ? "mt-2.5 rounded-lg border border-[#E6D9B7]/40 bg-[#E6D9B7]/14 px-3.5 py-1.5 text-xs font-semibold text-[#E6D9B7] hover:bg-[#E6D9B7] hover:text-[#06151C] transition-colors disabled:opacity-50 cursor-pointer"
            : "mt-2 rounded-lg border border-teal-300 px-3 py-1 text-teal-800 disabled:opacity-50"
        }
        disabled={busy || status === "Đã lưu sở thích."}
        onClick={async () => {
          setBusy(true);
          setStatus("");
          try {
            await chatRequest("/profile", {
              method: "PATCH",
              body: JSON.stringify({ keys: suggestions.map((item) => item.key), consent: true }),
            });
            setStatus("Đã lưu sở thích.");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Chưa lưu được. Bạn thử lại.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Đang lưu…" : "Đồng ý lưu"}
      </button>
      <p role="status" className={isDark ? "mt-1.5 text-xs text-[#2DD4BF]" : ""}>
        {status}
      </p>
    </div>
  );
}

export default function ResponseDetails({
  message,
  theme = "light",
}: {
  message: ChatMessage;
  theme?: "light" | "dark";
}) {
  const { user } = useAuth();
  const isDark = theme === "dark";
  const questions = (message.questions ?? []).filter((q) => !message.content.includes(q)).slice(0, 3);
  return (
    <div className={isDark ? "mt-3 space-y-3 text-sm text-[#CBD9DA]" : "space-y-3 text-sm text-slate-700"}>
      {questions.length > 0 && (
        <ul
          className={
            isDark
              ? "list-disc space-y-1 rounded-xl border border-[#E6D9B7]/20 bg-[#09212C]/85 p-4 pl-8 text-[#FFFDF5]"
              : "list-disc space-y-1 rounded-xl bg-teal-50 p-4 pl-8"
          }
        >
          {questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      )}
      {message.recommendationGroups?.map((group) => (
        <section
          key={group.category}
          className={
            isDark
              ? "overflow-hidden rounded-2xl border border-[#E6D9B7]/22 bg-[#081D27]/90"
              : "overflow-hidden rounded-2xl border border-slate-200 bg-white"
          }
        >
          <h3
            className={
              isDark
                ? "border-b border-[#E6D9B7]/14 bg-[#0B2532] px-4 py-3 font-semibold text-[#E6D9B7]"
                : "bg-teal-50 px-4 py-3 font-semibold text-teal-900"
            }
          >
            {group.title}
          </h3>
          {group.places.map((place) => (
            <article
              key={place.placeId}
              className={
                isDark
                  ? "border-b border-[#E6D9B7]/12 p-3.5"
                  : "border-b border-slate-100 p-3"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  className={
                    isDark
                      ? "font-semibold text-[#FFFDF5] hover:text-[#E6D9B7]"
                      : "font-semibold text-slate-800 hover:text-teal-700"
                  }
                  href={place.detailUrl}
                >
                  {place.name} ↗
                </Link>
                <HeartButton placeId={place.placeId} placeName={place.name} />
              </div>
              <p className={isDark ? "mt-1 text-xs text-[#94B0B3]" : "mt-1 text-xs"}>
                {place.districtName ?? "Đà Nẵng"} · {place.priceText ?? "Chưa cập nhật giá"}
              </p>
              <MenuItems place={place} theme={theme} />
              <Link
                className={isDark ? "mt-1 inline-block text-xs font-semibold text-[#2DD4BF] hover:underline" : "text-xs text-teal-700"}
                href={`/bando?search=${encodeURIComponent(place.name)}`}
              >
                Chỉ đường trên bản đồ →
              </Link>
            </article>
          ))}
          <p className={isDark ? "px-4 py-3 text-xs leading-relaxed text-[#94B0B3]" : "px-4 py-3 text-xs leading-relaxed text-slate-500"}>
            {group.notice}
          </p>
        </section>
      ))}
      <Consent key={`${user?.id ?? "guest"}:${message.id}`} suggestions={message.profileSuggestions ?? []} theme={theme} />
      {(!!message.sources?.length || !!message.warnings?.length) && (
        <details
          className={
            isDark
              ? "rounded-xl border border-[#E6D9B7]/16 bg-[#071922]/75 px-3.5 py-2.5 text-xs text-[#94B0B3]"
              : "rounded-xl border border-slate-100 px-3 py-2 text-xs text-slate-500"
          }
        >
          <summary className={isDark ? "cursor-pointer font-semibold text-[#E6D9B7]" : "cursor-pointer"}>
            Nguồn &amp; lưu ý
          </summary>
          {message.sources?.map(
            (source, index) =>
              /^https?:\/\//.test(source.url) && (
                <p className="mt-2" key={index}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={isDark ? "text-[#2DD4BF] underline" : "underline"}
                  >
                    {source.label}
                  </a>{" "}
                  · Đối chiếu {source.checkedOn} · {source.scope}
                </p>
              ),
          )}
          {message.warnings?.map((warning) => (
            <p className="mt-2" key={warning}>
              {warning}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
