'use client';

import HeartButton from "@/components/HeartButton";
import type { ChatComparison } from "@/types/chat";
import Link from "next/link";
import StayFacts from "./page/StayFacts";

export default function ComparisonTable({
  comparison,
  theme = "light",
}: {
  comparison: ChatComparison;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";
  return (
    <section
      className={
        isDark
          ? "mt-3 w-full overflow-hidden rounded-2xl border border-[#E6D9B7]/24 bg-[#081D27]/92 shadow-[0_14px_34px_rgba(2,10,15,0.45)]"
          : "mt-3 w-full overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm"
      }
      aria-label="Bảng so sánh địa điểm"
    >
      <div
        className={
          isDark
            ? "border-b border-[#E6D9B7]/16 bg-[#0B2532] px-4 py-2.5"
            : "border-b border-teal-100 bg-teal-50 px-3 py-2"
        }
      >
        <h3 className={isDark ? "text-sm font-semibold text-[#E6D9B7]" : "text-sm font-semibold text-teal-900"}>
          So sánh theo dữ liệu DaNangGo
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] table-fixed text-left text-xs leading-relaxed">
          <caption className="sr-only">So sánh thông tin của hai địa điểm trong DaNangGo</caption>
          <thead className={isDark ? "bg-[#061620] text-[#FFFDF5]" : "bg-slate-50 text-slate-800"}>
            <tr>
              <th scope="col" className="w-[26%] p-3">Tiêu chí</th>
              {comparison.places.map((place) => (
                <th scope="col" className="p-3" key={place.placeId}>
                  <Link
                    className={isDark ? "text-[#2DD4BF] underline underline-offset-2" : "text-teal-700 underline underline-offset-2"}
                    href={place.detailUrl}
                  >
                    {place.name}
                  </Link>
                  <div className="mt-2">
                    <HeartButton placeId={place.placeId} placeName={place.name} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isDark ? "divide-y divide-[#E6D9B7]/12" : "divide-y divide-slate-100"}>
            {comparison.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className={isDark ? "p-3 font-medium text-[#E6D9B7]" : "p-3 font-medium text-slate-600"}>
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={index}
                    className={isDark ? "break-words p-3 align-top text-[#CBD9DA]" : "break-words p-3 align-top text-slate-700"}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {comparison.places.map((place) =>
        place.stayFacts ? (
          <div key={place.placeId} className={isDark ? "border-t border-[#E6D9B7]/12 p-3" : "border-t border-slate-100 p-3"}>
            <p className={isDark ? "text-xs font-semibold text-[#E6D9B7]" : "text-xs font-semibold text-slate-700"}>
              Nguồn của {place.name}
            </p>
            <StayFacts place={place} />
          </div>
        ) : null,
      )}
      {comparison.notices.length > 0 && (
        <div
          className={
            isDark
              ? "border-t border-[#E87B39]/25 bg-[#2A1810]/70 px-4 py-2.5 text-[11px] leading-relaxed text-[#F5C199]"
              : "border-t border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900"
          }
        >
          {comparison.notices.map((notice) => (
            <p key={notice}>• {notice}</p>
          ))}
        </div>
      )}
    </section>
  );
}
