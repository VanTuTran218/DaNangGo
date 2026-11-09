import { sql } from "../../config/db";
import type { ChatTravelPlan } from "./chat.types";
import type {
  GeneratedItinerary,
  GenerateItineraryInput,
  ItineraryItem,
} from "../itineraries/itineraries.types";
import { saveDraftItinerary } from "../itineraries/itineraries.repository";
import { minutes, clock, preferenceContext } from "./chat.trip-preferences";

export function itineraryDraft(plan: ChatTravelPlan): {
  input: GenerateItineraryInput;
  output: GeneratedItinerary;
} {
  if (!plan.startDate || !plan.guestCount || !plan.budget)
    throw new Error(
      "Bạn cho Gô biết đủ ngày khởi hành, số khách và ngân sách trước khi lưu nhé.",
    );
  const input: GenerateItineraryInput = {
    startDate: plan.startDate,
    days: plan.dayCount,
    guestCount: plan.guestCount,
    budget: plan.budget,
    prefs: [],
    needs: ["accommodation", "food", "attractions"],
  };
  const costs = {
    accommodation: plan.costs.accommodation ?? 0,
    food: plan.costs.foodAllowance ?? 0,
    transport: plan.costs.transportAllowance ?? 0,
    attractions: plan.costs.tickets ?? 0,
    contingency: plan.costs.contingencyAllowance ?? 0,
    entertainment: 0,
  };
  // Public place IDs belong to a different catalog: intentionally leave catalogPlaceId empty.
  const days = plan.days.map((day) => ({
    day: day.day,
    date: day.date ?? undefined,
    items: day.periods.flatMap((period, pi) =>
      period.items.map((item, ii): ItineraryItem => ({
        id: `chat_${day.day}_${pi}_${ii}`,
        time:
          item.title.match(/\d{2}:\d{2}/)?.[0] ??
          period.time.match(/\d{2}:\d{2}/)?.[0] ??
          "08:00",
        title: item.place?.name ?? item.title,
        description: `${item.title}. ${item.detail}${item.place?.priceText ? ` · ${item.place.priceText}` : ""} · Chi phí được tổng hợp theo nhóm; số 0 tại từng mục có nghĩa là chưa phân bổ, không phải giá bán.`,
        type:
          item.kind === "arrival" || item.kind === "departure"
            ? "transport"
            : item.place?.placeType === "ACCOMMODATION"
              ? "hotel"
              : item.place?.placeType === "RESTAURANT"
                ? "food"
                : "attraction",
        location: item.place?.address ?? undefined,
        imageUrl: item.place?.imageUrl ?? undefined,
        estimatedCost: 0,
        unitPrice: 0,
        quantity: 1,
      })),
    ),
  }));
  const stay = plan.groups
    .flatMap((group) => group.places)
    .find((place) => place.placeType === "ACCOMMODATION");
  if (
    stay &&
    !days.some((day) => day.items.some((item) => item.type === "hotel"))
  ) {
    for (const day of days.slice(0, Math.max(0, plan.dayCount - 1)))
      day.items.push({
        id: `chat_stay_${day.day}`,
        time:
          day.day === 1 && plan.preferences?.arrivalTime
            ? clock(Math.max(14 * 60, minutes(plan.preferences.arrivalTime)))
            : "14:00",
        title: stay.name,
        type: "hotel",
        description: `Lưu trú dự kiến · ${plan.costs.roomNote}. Chưa xác nhận phòng trống.`,
        location: stay.address ?? undefined,
        imageUrl: stay.imageUrl ?? undefined,
        estimatedCost: 0,
        unitPrice: 0,
        quantity: 1,
      });
  }
  const firstTime =
    days[0]?.items.map((item) => item.time).sort()[0] ??
    plan.preferences?.arrivalTime ??
    "08:00";
  // Allocate aggregate estimates once across matching items so management totals reconcile.
  for (const [type, amount] of [
    ["hotel", costs.accommodation],
    ["food", costs.food],
    ["attraction", costs.attractions],
  ] as const) {
    const matches = days.flatMap((d) => d.items).filter((i) => i.type === type);
    if (matches.length) {
      matches[0]!.estimatedCost = amount;
      matches[0]!.unitPrice = amount;
      matches[0]!.description +=
        " · Chi phí tổng nhóm được gộp tại mục này; các mục còn lại chưa phân bổ.";
    } else if (amount)
      days[0]!.items.push({
        id: `chat_cost_${type}`,
        time: firstTime,
        type,
        title:
          "Dự trù " +
          { hotel: "lưu trú", food: "ăn uống", attraction: "vé tham quan" }[
            type
          ],
        description: "Khoản tổng dự kiến chưa phân bổ theo địa điểm.",
        estimatedCost: amount,
        unitPrice: amount,
        quantity: 1,
      });
  }
  if (costs.transport)
    days[0]!.items.push({
      id: "chat_transport",
      time: firstTime,
      type: "transport",
      title: "Di chuyển dự kiến",
      description: "Ngân sách do bạn nhập cho toàn chuyến.",
      estimatedCost: costs.transport,
      unitPrice: costs.transport,
      quantity: 1,
    });
  const total = Object.values(costs).reduce((a, b) => a + b, 0);
  for (const day of days)
    day.items.sort((a, b) => a.time.localeCompare(b.time));
  return {
    input,
    output: {
      days,
      suggestions: [],
      summary: {
        budget: plan.budget,
        estimatedTotal: total,
        remainingBudget: plan.budget - total,
        budgetStatus: total > plan.budget ? "over-budget" : "within-budget",
        overBudgetAmount: Math.max(0, total - plan.budget),
        costs,
      },
      notices: [
        ...(plan.preferences
          ? [`Thông tin chuyến đi: ${preferenceContext(plan.preferences)}`]
          : []),
        ...(plan.questions ?? []),
        ...plan.assumptions,
        ...plan.notes,
        "Bản nháp từ Gô. Chi phí đều là dự kiến, chưa đặt dịch vụ. Giá chưa biết được tạm tính 0, không có nghĩa là miễn phí. Chi phí được gộp theo nhóm, chưa phân bổ từng điểm.",
      ],
      recommendations: [],
      generatedAt: new Date().toISOString(),
    },
  };
}
export async function saveChatPlan(
  plan: ChatTravelPlan,
  userId: number,
  transaction?: sql.Transaction,
) {
  const { input, output } = itineraryDraft(plan);
  return saveDraftItinerary(input, output, userId, transaction);
}
