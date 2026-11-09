"use client";

import Link from "next/link";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  MapPin,
  Navigation,
  Utensils,
  BedDouble,
} from "lucide-react";
import type { ChatPlaceCard, ChatTravelPlan } from "@/types/chat";
import StayFacts from "./page/StayFacts";
import TripPreferencesSummary from "./TripPreferencesSummary";

const money = (value: number | null) =>
  value === null ? "Chưa đủ dữ liệu" : `${value.toLocaleString("vi-VN")}đ`;
function PlaceLink({ place }: { place: ChatPlaceCard }) {
  return (
    <div className="mt-2 space-y-1 rounded-xl border border-teal-100 bg-white p-2.5">
      <Link
        href={`/places/${place.placeId}`}
        className="block text-[13px] font-semibold text-teal-800 hover:underline"
      >
        {place.name}
      </Link>
      <p className="text-[11px] leading-relaxed text-slate-600">
        {place.address || place.districtName || "Chưa cập nhật địa chỉ"}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-teal-700">
          {place.priceText ||
            (place.stayFacts
              ? "Giá theo ngày: cần xác nhận"
              : "Chưa cập nhật giá")}
        </span>
        <Link
          href={`/bando?search=${encodeURIComponent(place.name)}`}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-teal-700"
        >
          <Navigation size={11} />
          Chỉ đường
        </Link>
      </div>
      <StayFacts place={place} />
    </div>
  );
}

export default function TravelPlan({ plan }: { plan: ChatTravelPlan }) {
  return (
    <section
      aria-label="Lịch trình du lịch đề xuất"
      className="mt-3 w-full min-w-0 space-y-3 text-[13px]"
    >
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3.5">
        <h3 className="flex items-center gap-2 font-bold text-teal-900">
          <CalendarDays size={17} />
          {plan.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-teal-800">
          {plan.guestCount ? `${plan.guestCount} khách` : "Chưa chốt số khách"}{" "}
          ·{" "}
          {plan.startDate
            ? `Từ ${new Date(plan.startDate + "T00:00:00").toLocaleDateString("vi-VN")}`
            : "Chưa chốt ngày đi"}
          {plan.budget !== null ? ` · Ngân sách ${money(plan.budget)}` : ""}
        </p>
        {plan.assumptions.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-amber-800">
            {plan.assumptions.map((text) => (
              <li key={text}>• {text}</li>
            ))}
          </ul>
        )}
      </div>
      <TripPreferencesSummary plan={plan} />
      {plan.days.map((day) => (
        <details
          key={day.day}
          open={day.day === 1}
          className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3.5">
            <span>
              <b className="text-slate-900">
                Ngày {day.day}
                {day.date
                  ? ` · ${new Date(day.date + "T00:00:00").toLocaleDateString("vi-VN")}`
                  : ""}
              </b>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin size={11} />
                {day.area}
              </span>
            </span>
            <ChevronDown
              size={16}
              className="shrink-0 text-teal-600 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t border-slate-100 p-3.5">
            {day.periods.map((period) => (
              <section
                key={period.label}
                aria-label={`Ngày ${day.day} - ${period.label}`}
              >
                <h4 className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs">
                  <b className="rounded-lg bg-teal-100 px-2 py-1 text-teal-900">
                    {period.label}
                  </b>
                  <span className="text-slate-500">{period.time}</span>
                </h4>
                <div className="ml-1 space-y-3 border-l-2 border-teal-100 pl-3">
                  {period.items.map((item, index) => (
                    <div key={`${item.title}-${index}`}>
                      <p className="font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {item.detail}
                      </p>
                      {item.place && <PlaceLink place={item.place} />}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      ))}
      {plan.groups.map((group) => (
        <section
          key={group.title}
          className="rounded-2xl border border-slate-200 bg-white p-3.5"
        >
          <h4 className="flex items-center gap-2 font-bold text-slate-800">
            {group.places[0]?.placeType === "ACCOMMODATION" ? (
              <BedDouble size={15} />
            ) : group.places[0]?.placeType === "RESTAURANT" ? (
              <Utensils size={15} />
            ) : (
              <Camera size={15} />
            )}{" "}
            {group.title}
          </h4>
          {group.places.map((place) => (
            <PlaceLink key={place.placeId} place={place} />
          ))}
        </section>
      ))}
      <section className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
        <h4 className="text-sm font-bold text-amber-950">
          Dự trù để bạn cân đối
        </h4>
        <dl className="space-y-2">
          <div className="flex justify-between gap-2">
            <dt>Lưu trú</dt>
            <dd className="text-right font-semibold">
              {money(plan.costs.accommodation)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Vé tham quan đã chọn</dt>
            <dd className="text-right font-semibold">
              {money(plan.costs.tickets)}
            </dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-amber-200 pt-2">
            <dt>Cộng các khoản đã có giá</dt>
            <dd className="text-right font-bold">
              {money(plan.costs.knownSubtotal)}
            </dd>
          </div>
        </dl>
        <p className="leading-relaxed text-amber-900">{plan.costs.roomNote}</p>
        {plan.costs.foodAllowance !== null && (
          <p>
            Khoản ăn uống gợi ý dành riêng:{" "}
            <b>{money(plan.costs.foodAllowance)}</b> (khoản dự kiến, chưa phải
            giá bữa ăn thực tế).
          </p>
        )}
        {plan.costs.remaining !== null && (
          <p>
            {plan.costs.projectedSubtotal != null ? "Sau các khoản dự kiến" : plan.costs.contingencyAllowance != null ? "Sau các khoản đã có giá và phần dự phòng" : "Sau các khoản đã có giá"} còn <b>{money(plan.costs.remaining)}</b>.
          </p>
        )}
        <p className="font-semibold text-amber-900">
          Đây chưa phải tổng chi phí chuyến đi hoặc xác nhận đặt dịch vụ.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-600">
        <h4 className="mb-2 font-bold text-slate-800">Gô nhắc bạn</h4>
        <ul className="space-y-2">
          {plan.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
