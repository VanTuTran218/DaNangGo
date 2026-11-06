"use client";

import Link from "next/link";
import type { ChatMessage, ChatPlaceCard } from "@/types/chat";
import { useState } from "react";
import { chatRequest } from "@/lib/api/chat";
import { useAuth } from "@/contexts/AuthContext";

export function MenuItems({ place }: { place: ChatPlaceCard }) {
  if (place.placeType !== "RESTAURANT") return null;
  return <div className="px-3 py-2 text-xs text-slate-600"><strong>Món trong menu</strong>{place.menuItems?.length ? <ul className="mt-1 space-y-1">{place.menuItems.map(item => <li key={item.id}>{item.name} · {item.price === null ? "Chưa cập nhật giá" : `${item.price.toLocaleString("vi-VN")}đ`}</li>)}</ul> : <p>Chưa có menu để gợi ý món cụ thể.</p>}</div>;
}

function Consent({ suggestions }: { suggestions: NonNullable<ChatMessage["profileSuggestions"]> }) {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user || !suggestions.length) return null;
  return <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-slate-700">
    <p>Ghi nhớ cho các chuyến sau: {suggestions.map(item => item.label).join(", ")}?</p>
    {suggestions.some(item => item.sensitive) && <p className="mt-1 text-xs">Có thông tin dị ứng. Chỉ lưu khi bạn đồng ý; bạn có thể xóa trong Sở thích đã lưu.</p>}
    <button type="button" className="mt-2 rounded-lg border border-teal-300 px-3 py-1 text-teal-800 disabled:opacity-50" disabled={busy || status === "Đã lưu sở thích."} onClick={async () => {
      setBusy(true); setStatus("");
      try { await chatRequest("/profile", { method: "PATCH", body: JSON.stringify({ keys: suggestions.map(item => item.key), consent: true }) }); setStatus("Đã lưu sở thích."); }
      catch (error) { setStatus(error instanceof Error ? error.message : "Chưa lưu được. Bạn thử lại."); }
      finally { setBusy(false); }
    }}>{busy ? "Đang lưu…" : "Đồng ý lưu"}</button><p role="status">{status}</p>
  </div>;
}
export default function ResponseDetails({ message }: { message: ChatMessage }) {
  const { user } = useAuth();
  const questions = (message.questions ?? []).filter(q => !message.content.includes(q)).slice(0, 3);
  return <div className="space-y-3 text-sm text-slate-700">
    {questions.length > 0 && <ul className="list-disc space-y-1 rounded-xl bg-teal-50 p-4 pl-8">{questions.map(q => <li key={q}>{q}</li>)}</ul>}
    {message.recommendationGroups?.map(group => <section key={group.category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <h3 className="bg-teal-50 px-4 py-3 font-semibold text-teal-900">{group.title}</h3>
      {group.places.map(place => <article key={place.placeId} className="border-b border-slate-100 p-3">
        <Link className="font-semibold text-slate-800 hover:text-teal-700" href={place.detailUrl}>{place.name} ↗</Link>
        <p className="mt-1 text-xs">{place.districtName ?? "Đà Nẵng"} · {place.priceText ?? "Chưa cập nhật giá"}</p>
        <MenuItems place={place} /><Link className="text-xs text-teal-700" href={`/bando?search=${encodeURIComponent(place.name)}`}>Chỉ đường trên bản đồ →</Link>
      </article>)}
      <p className="px-4 py-3 text-xs leading-relaxed text-slate-500">{group.notice}</p>
    </section>)}
    <Consent key={`${user?.id ?? "guest"}:${message.id}`} suggestions={message.profileSuggestions ?? []} />
    {(!!message.sources?.length || !!message.warnings?.length) && <details className="rounded-xl border border-slate-100 px-3 py-2 text-xs text-slate-500"><summary className="cursor-pointer">Nguồn & lưu ý</summary>
      {message.sources?.map((source, index) => /^https?:\/\//.test(source.url) && <p className="mt-2" key={index}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.label}</a> · Đối chiếu {source.checkedOn} · {source.scope}</p>)}
      {message.warnings?.map(warning => <p className="mt-2" key={warning}>{warning}</p>)}
    </details>}
  </div>;
}
