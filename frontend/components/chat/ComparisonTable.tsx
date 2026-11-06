import type { ChatComparison } from "@/types/chat";
import Link from "next/link";
import StayFacts from "./page/StayFacts";

export default function ComparisonTable({ comparison }: { comparison: ChatComparison }) {
  return (
    <section className="mt-3 w-full overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-sm" aria-label="Bảng so sánh địa điểm">
      <div className="border-b border-teal-100 bg-teal-50 px-3 py-2">
        <h3 className="text-sm font-semibold text-teal-900">So sánh theo dữ liệu DaNangGo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] table-fixed text-left text-xs leading-relaxed">
          <caption className="sr-only">So sánh thông tin của hai địa điểm trong DaNangGo</caption>
          <thead className="bg-slate-50 text-slate-800">
            <tr><th scope="col" className="w-[26%] p-3">Tiêu chí</th>{comparison.places.map(place => <th scope="col" className="p-3" key={place.placeId}><Link className="text-teal-700 underline underline-offset-2" href={place.detailUrl}>{place.name}</Link></th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comparison.rows.map(row => <tr key={row.label}><th scope="row" className="p-3 font-medium text-slate-600">{row.label}</th>{row.values.map((value, index) => <td key={index} className="break-words p-3 align-top text-slate-700">{value}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      {comparison.places.map(place => place.stayFacts ? <div key={place.placeId} className="border-t border-slate-100 p-3"><p className="text-xs font-semibold text-slate-700">Nguồn của {place.name}</p><StayFacts place={place} /></div> : null)}
      {comparison.notices.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          {comparison.notices.map((notice) => <p key={notice}>• {notice}</p>)}
        </div>
      )}
    </section>
  );
}
