import type { ChatTravelPlan } from "@/types/chat";

export default function TripPreferencesSummary({
  plan,
  theme = "light",
}: {
  plan: ChatTravelPlan;
  theme?: "light" | "dark";
}) {
  const p = plan.preferences;
  if (!p) return null;
  const labels = {
    car: "Ô tô",
    motorbike: "Xe máy",
    taxi: "Taxi",
    walk: "Đi bộ",
    bus: "Xe buýt",
  };
  const facts = [
    p.arrivalTime ? `Đến ngày đầu: ${p.arrivalTime}` : "",
    p.departureTime ? `Về ngày cuối: ${p.departureTime}` : "",
    p.transport ? labels[p.transport] : "",
    p.adults !== undefined ? `${p.adults} người lớn` : "",
    p.hasChildren
      ? `${p.children ?? "Chưa rõ số"} trẻ em${p.childAges.length ? ` · ${p.childAges.map((age) => `${age.toLocaleString("vi-VN")} tuổi`).join(", ")}` : ""}`
      : "",
    p.seniors ? "Có người lớn tuổi" : "",
    p.avoidWalking ? "Hạn chế đi bộ" : "",
    p.pace === "gentle" ? "Nhịp đi nhẹ" : "",
  ].filter(Boolean);
  if (!facts.length) return null;
  const isDark = theme === "dark";
  return (
    <div
      aria-label="Thông tin chuyến đi đã ghi nhận"
      className={isDark ? "px-5 pt-3 flex flex-wrap gap-2" : "mt-3 flex flex-wrap gap-2"}
    >
      {facts.map((fact) => (
        <span
          key={fact}
          className={
            isDark
              ? "rounded-full border border-[#E6D9B7]/24 bg-[#0B2430]/90 px-3 py-1 text-xs font-medium text-[#E6D9B7]"
              : "rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-xs text-teal-900"
          }
        >
          {fact}
        </span>
      ))}
    </div>
  );
}
