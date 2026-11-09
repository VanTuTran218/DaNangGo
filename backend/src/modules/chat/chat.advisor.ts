import type { ItineraryRequest } from "../../Ai/promt";
import { normalize } from "../ai/ai.rules";
import type { PlaceSearchRow } from "./chat.repository";
import type { ChatPlaceCard, ChatTravelPlan, ChatPlanItem } from "./chat.types";
import {
  tripPreferences,
  tripQuestions,
  minutes,
  clock,
  transportLabels,
  type TripPreferences,
} from "./chat.trip-preferences";
import { tripBudget } from "./chat.budget";
import { dietaryConcern, dietaryNotice } from "./chat.knowledge";

export function placeCard(row: PlaceSearchRow, reason?: string): ChatPlaceCard {
  return {
    placeId: row.placeId,
    name: row.name,
    placeType: row.placeType,
    address: row.address,
    districtName: row.districtName,
    rating: row.rating,
    reviewCount: row.reviewCount,
    imageUrl: row.imageUrl,
    priceText: row.priceText,
    ...(row.stayFacts ? { stayFacts: row.stayFacts } : {}),
    ...(row.distanceOriginName
      ? { distanceOriginName: row.distanceOriginName }
      : {}),
    ...(row.distanceKm != null ? { distanceKm: row.distanceKm } : {}),
    detailUrl: `/places/${row.placeId}`,
    ...(reason ? { reason } : {}),
  };
}
const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;
function distance(a: PlaceSearchRow, b: PlaceSearchRow) {
  if (
    ![a.latitude, a.longitude, b.latitude, b.longitude].every(
      (n) => typeof n === "number" && Number.isFinite(n),
    )
  )
    return a.districtName && a.districtName === b.districtName ? 1 : 25;
  const rad = (n: number) => (n * Math.PI) / 180;
  const x =
    Math.sin(rad(b.latitude! - a.latitude!) / 2) ** 2 +
    Math.cos(rad(a.latitude!)) *
      Math.cos(rad(b.latitude!)) *
      Math.sin(rad(b.longitude! - a.longitude!) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, x)));
}
function preferenceScore(row: PlaceSearchRow, text: string) {
  const n = normalize(`${row.name} ${row.description ?? ""}`),
    query = normalize(text);
  let score = 0;
  for (const name of ["ba na", "ngu hanh son", "my khe", "cau rong", "son tra"])
    if (query.includes(name) && n.includes(name)) score += 10;
  for (const [request, match] of [
    [/bien|nghi duong/, /bien|bai tam|my khe|non nuoc/],
    [/chup|check.in|song ao/, /chup|check.in|cau|bien|canh|kien truc/],
    [/van hoa|di san/, /bao tang|chua|di tich|van hoa/],
    [/hai san/, /hai san/],
  ])
    if (request!.test(query) && match!.test(n)) score += 5;
  return score;
}
function reason(row: PlaceSearchRow, purpose: string) {
  return `${purpose}${row.districtName ? ` · ${row.districtName}` : ""} · ${row.priceText ?? "Chưa cập nhật giá"}`;
}
const item = (
  row: PlaceSearchRow | undefined,
  title: string,
  purpose: string,
): ChatPlanItem =>
  row
    ? { title, detail: reason(row, purpose), place: placeCard(row, purpose) }
    : {
        title,
        detail:
          "Chưa có địa điểm phù hợp được xác nhận trong dữ liệu; mình để trống để bạn chọn thêm.",
      };

/** A suggested schedule, never a claim about opening hours or guaranteed travel time. */
export function buildTravelPlan(
  brief: ItineraryRequest,
  text: string,
  pools: {
    sights: PlaceSearchRow[];
    food: PlaceSearchRow[];
    stays: PlaceSearchRow[];
  },
  options: {
    freeOnly?: boolean;
    excludeStayIds?: number[];
    preferences?: TripPreferences;
    dietaryRestricted?: boolean;
  } = {},
): ChatTravelPlan {
  const preferences = options.preferences ?? tripPreferences([text]).value;
  const financial = tripBudget([text]);
  const reserve = brief.budget === null ? null : financial.reserve ?? Math.round(brief.budget * 0.08);
  const available = brief.budget === null ? null : brief.budget - (reserve ?? 0);
  const dietRestricted = options.dietaryRestricted ?? dietaryConcern(text);
  const gentle =
    preferences.pace === "gentle" ||
    (preferences.pace !== "active" &&
      Boolean(
        preferences.hasChildren ||
        preferences.seniors ||
        preferences.avoidWalking,
      ));
  const walking = preferences.transport === "walk";
  const coordinates = (row: PlaceSearchRow) =>
    typeof row.latitude === "number" &&
    Number.isFinite(row.latitude) &&
    typeof row.longitude === "number" &&
    Number.isFinite(row.longitude);
  const nearby = (a: PlaceSearchRow, b: PlaceSearchRow, limit: number) => {
    if (walking && (!coordinates(a) || !coordinates(b))) return false;
    return distance(a, b) <= limit;
  };
  const dayCount = brief.days ?? 1,
    people = brief.guests,
    budget = brief.budget,
    nights = Math.max(dayCount - 1, 0);
  const assumptions: string[] = [];
  if (!brief.days)
    assumptions.push(
      "Mình phác thảo trước 1 ngày; bạn cho biết số ngày để mình điều chỉnh (hỗ trợ tối đa 3 ngày).",
    );
  if (!people)
    assumptions.push(
      "Chưa rõ số khách nên mình chưa tính tổng tiền vé hoặc số phòng.",
    );
  if (!brief.start_date)
    assumptions.push(
      "Chưa chốt ngày khởi hành; lịch hiện theo Ngày 1, Ngày 2…",
    );
  if (!budget)
    assumptions.push(
      "Chưa có tổng ngân sách; các mức giá bên dưới là giá trong dữ liệu, chưa phải báo giá trọn chuyến.",
    );
  const noStay =
    financial.hasLodging || /\b(khong (can|o|dat) (khach san|luu tru|phong)|khong can cho o|da (co|dat) (khach san|cho o))\b/.test(
      normalize(text),
    );
  const noFood = /\b(khong can (an uong|am thuc)|bo an uong)\b/.test(
    normalize(text),
  );
  const freeOnly =
    options.freeOnly ??
    /\b(mien phi|khong mat phi|khong ton tien)\b/.test(normalize(text));
  const sights = pools.sights.filter(
    (p) =>
      p.placeType === "ATTRACTION" &&
      (!freeOnly || p.priceMin === 0) &&
      (!walking || coordinates(p)) &&
      (!gentle || (p.visitDurationMinutes ?? 90) < 240) &&
      (!(gentle || preferences.avoidWalking) ||
        !/leo nui|leo bo|bac thang|trekking|di bo nhieu|duong doc/.test(
          normalize(`${p.name} ${p.description ?? ""}`),
        )),
  );
  const food = noFood || dietRestricted
    ? []
    : pools.food.filter((p) => p.placeType === "RESTAURANT");
  const stays =
    noStay || financial.hasLodging || financial.dayUse || nights === 0
      ? []
      : pools.stays.filter((p) => p.placeType === "ACCOMMODATION");
  const stayCost = (row: PlaceSearchRow) =>
    !preferences.hasChildren &&
    people &&
    row.roomCapacity &&
    row.roomCapacity > 0 &&
    row.priceMin !== null
      ? row.priceMin * Math.ceil(people / row.roomCapacity) * nights
      : null;
  const alternatives = stays.filter(
    (p) => !options.excludeStayIds?.includes(p.placeId),
  );
  const rankedStays = [...alternatives].sort(
    (a, b) => {
      const ca = stayCost(a),
        cb = stayCost(b);
      const fitsA = budget && ca !== null ? ca <= budget * 0.4 : true;
      const fitsB = budget && cb !== null ? cb <= budget * 0.4 : true;
      return (
        Number(fitsB) - Number(fitsA) ||
        preferenceScore(b, text) - preferenceScore(a, text) ||
        (stayCost(a) ?? a.priceMin ?? Infinity) -
          (stayCost(b) ?? b.priceMin ?? Infinity) ||
        b.rating - a.rating
      );
    },
  );
  const hotel = rankedStays[0];
  const usedSights = new Set<number>(),
    usedFood = new Set<number>();
  const usedEvening = new Set<number>();
  const chosenSights: PlaceSearchRow[] = [],
    chosenFood: PlaceSearchRow[] = [];
  const chooseSight = (
    anchor?: PlaceSearchRow,
    fits: (row: PlaceSearchRow) => boolean = () => true,
  ) => {
    const candidates = sights.filter(
      (p) =>
        !usedSights.has(p.placeId) &&
        fits(p) &&
        (!anchor ||
          (nearby(p, anchor, walking ? 2 : 15) &&
            (p.visitDurationMinutes ?? 90) < 240)),
    );
    candidates.sort((a, b) => {
      const localityA = anchor ? distance(a, anchor) : 0,
        localityB = anchor ? distance(b, anchor) : 0;
      const affordableA =
        budget && a.priceMin !== null && people
          ? a.priceMin * people <= budget * 0.1
          : true;
      const affordableB =
        budget && b.priceMin !== null && people
          ? b.priceMin * people <= budget * 0.1
          : true;
      return (
        Number(affordableB) - Number(affordableA) ||
        (localityA > 15 ? 1 : 0) - (localityB > 15 ? 1 : 0) ||
        preferenceScore(b, text) - preferenceScore(a, text) ||
        localityA - localityB ||
        b.rating - a.rating
      );
    });
    const selected = candidates[0];
    if (selected) {
      usedSights.add(selected.placeId);
      chosenSights.push(selected);
    }
    return selected;
  };
  const chooseFood = (
    meal: "breakfast" | "lunch" | "dinner",
    anchor?: PlaceSearchRow,
  ) => {
    const breakfast = /\b(mi|bun|pho|banh mi|chao|banh canh|banh cuon)\b/;
    const eligible = food.filter(
      (p) =>
        (!anchor || nearby(p, anchor, walking ? 1.5 : 8)) &&
        (meal !== "breakfast" ||
          breakfast.test(normalize(`${p.name} ${p.description ?? ""}`))),
    );
    const fresh = eligible.filter((p) => !usedFood.has(p.placeId));
    const choices = fresh.length ? fresh : eligible;
    choices.sort(
      (a, b) =>
        (anchor
          ? Number(distance(a, anchor) > 8) - Number(distance(b, anchor) > 8)
          : 0) ||
        (meal === "dinner"
          ? preferenceScore(b, text) - preferenceScore(a, text)
          : 0) ||
        (anchor ? distance(a, anchor) - distance(b, anchor) : 0) ||
        b.rating - a.rating,
    );
    const selected = choices[0];
    if (selected) {
      usedFood.add(selected.placeId);
      chosenFood.push(selected);
    }
    return selected;
  };
  const days: ChatTravelPlan["days"] = [];
  for (let day = 1; day <= dayCount; day++) {
    const start =
      day === 1 && preferences.arrivalTime
        ? Math.min(1440, minutes(preferences.arrivalTime) + 60)
        : 0;
    const end =
      day === dayCount && preferences.departureTime
        ? Math.max(0, minutes(preferences.departureTime) - 90)
        : 1440;
    const slot = (from: number, to: number) => ({
      start: Math.max(start, from),
      end: Math.min(end, to),
    });
    const morningSlot = slot(9 * 60, 11 * 60 + 30),
      afternoonSlot = slot(15 * 60, 18 * 60);
    const morning =
      morningSlot.end - morningSlot.start >= 60
        ? chooseSight(undefined, (row) => {
            const duration = row.visitDurationMinutes ?? 90;
            return duration >= 240
              ? morningSlot.start <= 10 * 60 &&
                  duration <= Math.min(end, 18 * 60) - morningSlot.start - 60
              : duration <= morningSlot.end - morningSlot.start;
          })
        : undefined;
    const fullDay = (morning?.visitDurationMinutes ?? 0) >= 240;
    const afternoon = fullDay
      ? morning
      : afternoonSlot.end - afternoonSlot.start >= 60 && (!gentle || !morning)
        ? chooseSight(
            morning,
            (row) =>
              (row.visitDurationMinutes ?? 90) < 240 &&
              (row.visitDurationMinutes ?? 90) <=
                afternoonSlot.end - afternoonSlot.start,
          )
        : undefined;
    const breakfastSlot = slot(7 * 60 + 30, 8 * 60 + 30),
      lunchSlot = slot(12 * 60, 13 * 60),
      dinnerSlot = slot(18 * 60 + 30, 20 * 60 + 30),
      restSlot = slot(13 * 60, 14 * 60 + 30);
    const breakfast =
      !noFood && breakfastSlot.end - breakfastSlot.start >= 30
        ? chooseFood("breakfast", fullDay ? hotel : morning)
        : undefined;
    const lunch =
      !noFood && lunchSlot.end - lunchSlot.start >= 45
        ? chooseFood("lunch", morning)
        : undefined;
    const dinner =
      !noFood && dinnerSlot.end - dinnerSlot.start >= 45
        ? chooseFood("dinner", fullDay ? hotel : (afternoon ?? morning))
        : undefined;
    const eveningSlot = slot(
      Math.max(20 * 60, dinner ? dinnerSlot.start + 75 : 20 * 60),
      21 * 60,
    );
    const evening =
      !gentle && eveningSlot.end - eveningSlot.start >= 45
        ? sights.find(
            (p) =>
              p.priceMin === 0 &&
              !usedSights.has(p.placeId) &&
              !usedEvening.has(p.placeId) &&
              /\b(cau|pho di bo)\b/.test(normalize(p.name)) &&
              /\b(toi|dem)\b/.test(normalize(p.description ?? "")) &&
              (!dinner || nearby(p, dinner, walking ? 2 : 15)),
          )
        : undefined;
    if (evening) {
      usedEvening.add(evening.placeId);
      usedSights.add(evening.placeId);
      chosenSights.push(evening);
    }
    let date: string | null = null;
    if (brief.start_date) {
      const value = new Date(brief.start_date + "T00:00:00Z");
      value.setUTCDate(value.getUTCDate() + day - 1);
      date = value.toISOString().slice(0, 10);
    }
    const periods: ChatTravelPlan["days"][number]["periods"] = [
      {
        label: "Sáng",
        time: "",
        items: [
          ...(!noFood && breakfastSlot.end - breakfastSlot.start >= 30
            ? [
                item(
                  breakfast,
                  `${clock(breakfastSlot.start)} · Ăn sáng`,
                  "Gợi ý bữa sáng; cần kiểm tra giờ phục vụ",
                ),
              ]
            : []),
          ...(morning
            ? [
                item(
                  morning,
                  `${clock(morningSlot.start)} · Khám phá & chụp hình`,
                  morning.visitDurationMinutes
                    ? `Thời lượng trong dữ liệu: ${morning.visitDurationMinutes} phút`
                    : "Tham quan; chưa xác minh giờ mở cửa",
                ),
              ]
            : []),
        ],
      },
      {
        label: "Trưa",
        time: "",
        items: [
          ...(!noFood && lunchSlot.end - lunchSlot.start >= 45
            ? [
                item(
                  lunch,
                  `${clock(lunchSlot.start)} · Ăn trưa`,
                  fullDay
                    ? "Gợi ý trong khu vực tham quan, không quay về trung tâm"
                    : "Gợi ý quán ăn trên hành trình",
                ),
              ]
            : []),
          ...(restSlot.end - restSlot.start >= 30
            ? [
                {
                  kind: "rest" as const,
                  title: `${clock(restSlot.start)} · Nghỉ trưa`,
                  detail: fullDay
                    ? "Nghỉ tại khu vực tham quan."
                    : day === 1 && hotel
                      ? `Nghỉ ở khu vực thuận tiện. ${hotel.name}${hotel.stayFacts?.hours ? ` công bố nhận phòng từ ${hotel.stayFacts.hours.checkIn}; nhận sớm cần xác nhận riêng.` : " cần xác nhận giờ nhận phòng; chưa mặc định có thể vào phòng lúc nghỉ trưa."}`
                      : "Dành thời gian nghỉ, không ghép nhiều điểm liên tục.",
                },
              ]
            : []),
        ],
      },
      {
        label: "Chiều",
        time: "",
        items: afternoon
          ? [
              item(
                afternoon,
                `${clock(afternoonSlot.start)} · ${fullDay ? "Tiếp tục khám phá" : "Tham quan & check-in"}`,
                fullDay
                  ? "Tiếp tục tại cùng điểm, không tính thêm lần vé"
                  : "Gợi ý theo khoảng thời gian còn lại",
              ),
            ]
          : [],
      },
      {
        label: "Tối",
        time: "",
        items: [
          ...(!noFood && dinnerSlot.end - dinnerSlot.start >= 45
            ? [
                item(
                  dinner,
                  `${clock(dinnerSlot.start)} · Ăn tối`,
                  "Gợi ý quán ăn; giờ phục vụ cần kiểm tra",
                ),
              ]
            : []),
          ...(evening
            ? [
                item(
                  evening,
                  `${clock(eveningSlot.start)} · Dạo bộ & ngắm cảnh`,
                  "Cần kiểm tra điều kiện tiếp cận và lịch sự kiện thực tế",
                ),
              ]
            : eveningSlot.end - eveningSlot.start >= 30
              ? [
                  {
                    kind: "rest" as const,
                    title: `${clock(eveningSlot.start)} · Nghỉ ngơi`,
                    detail: gentle
                      ? "Giữ nhịp đi nhẹ, không thêm điểm tham quan buổi tối."
                      : "Dành thời gian tự do hoặc trở về nghỉ.",
                  },
                ]
              : []),
        ],
      },
    ];
    const periodIndex = (time: string) =>
      minutes(time) < 12 * 60
        ? 0
        : minutes(time) < 15 * 60
          ? 1
          : minutes(time) < 18 * 60
            ? 2
            : 3;
    if (day === 1 && preferences.arrivalTime)
      periods[periodIndex(preferences.arrivalTime)]!.items.push({
        kind: "arrival",
        title: `${preferences.arrivalTime} · Đến Đà Nẵng`,
        detail:
          "Dành dự kiến 60 phút cho thủ tục/di chuyển và nghỉ; chưa phải thời gian tuyến đường thực tế. Nếu đến muộn, cần liên hệ cơ sở xác nhận nhận phòng muộn.",
      });
    if (day === dayCount && preferences.departureTime) {
      const prepare = clock(end);
      periods[periodIndex(prepare)]!.items.push({
        kind: "departure",
        title: `${prepare} · Chuẩn bị rời Đà Nẵng`,
        detail: `Giờ về bạn cung cấp: ${preferences.departureTime}. Chừa dự kiến 90 phút, cần xác nhận thời gian ra sân bay/ga và yêu cầu của nhà vận chuyển.`,
      });
    }
    for (let i = 0; i < periods.length; i++) {
      const period = periods[i]!;
      period.items.sort((a, b) => a.title.localeCompare(b.title));
      const ranges = [
        [450, 690],
        [720, 870],
        [900, 1080],
        [1110, 1260],
      ][i]!;
      const current = slot(ranges[0]!, ranges[1]!);
      const first = period.items[0]?.title.slice(0, 5);
      const last = period.items.length
        ? clock(
            Math.max(
              current.end,
              minutes(period.items[period.items.length - 1]!.title.slice(0, 5)),
            ),
          )
        : undefined;
      period.time = first
        ? first === last
          ? first
          : `${first}–${last}`
        : "Không xếp hoạt động";
    }
    days.push({
      day,
      date,
      area:
        [
          ...new Set(
            [morning?.districtName, afternoon?.districtName].filter(Boolean),
          ),
        ].join(" → ") || "Chưa xếp điểm tham quan trong khung giờ này",
      periods,
    });
  }
  const accommodation =
    noStay || nights === 0 ? 0 : hotel ? stayCost(hotel) : null;
  const ticketKnown =
    chosenSights.length > 0 && chosenSights.every((p) => p.priceMin !== null);
  const tickets =
    people &&
    ticketKnown &&
    (!preferences.hasChildren || chosenSights.every((p) => p.priceMin === 0))
      ? chosenSights.reduce((sum, p) => sum + p.priceMin! * people, 0)
      : null;
  const knownSubtotal =
    accommodation === null && tickets === null
      ? null
      : (accommodation ?? 0) + (tickets ?? 0);
  const foodAllowance =
    available && !noFood && !dietRestricted ? Math.round((available * 0.35) / 10000) * 10000 : null;
  const roomNote =
    hotel && people && hotel.roomCapacity && nights > 0 && !noStay
      ? `${Math.ceil(people / hotel.roomCapacity)} phòng × ${nights} đêm, tính theo loại phòng có tổng tiền phù hợp số khách, sức chứa ${hotel.roomCapacity} khách/phòng trong dữ liệu; chưa xác nhận phòng trống.`
      : nights === 0
        ? "Lịch một ngày chưa tính đêm lưu trú."
        : noStay
          ? "Bạn đã chọn không cần lưu trú."
          : "Chưa đủ thông tin khách, giá phòng hoặc sức chứa để tính tiền lưu trú.";
  const notes = [
    ...(reserve !== null ? [`Dự phòng ${money(reserve)} (${financial.reserve !== null ? "theo yêu cầu của bạn" : "dự kiến 8% tổng ngân sách"}); ngân sách khả dụng còn ${money(available!)}. Dự phòng chưa phải tiền đã chi.`] : []),
    "Chưa xác nhận phạm vi ngân sách có bao gồm vé máy bay/tàu, ăn uống, lưu trú hoặc di chuyển hay không. Các khoản chưa có giá vẫn là chưa xác định; mình không kết luận đủ tiền trọn chuyến.",
    ...(dietRestricted ? [dietaryNotice] : []),
    ...(financial.dayUse ? ["Bạn cần nghỉ ban ngày; hiện chưa có cơ sở/giá theo giờ đã xác minh. Không thay bằng phòng qua đêm và chưa cộng chi phí nghỉ ban ngày."] : []),
    "Mọi giờ trong lịch theo giờ Đà Nẵng (UTC+7). Nếu giờ vé theo múi giờ khác, bạn cần xác nhận giờ địa phương trước khi dùng lịch.",
    "Các khung giờ là lịch đề xuất, không phải giờ mở cửa. Hãy xác nhận giờ hoạt động và thời tiết trước khi đi.",
    ...(!preferences.arrivalTime || !preferences.departureTime
      ? [
          "Chưa đủ giờ đến/về; các buổi chưa có giới hạn thời gian chỉ là bản phác thảo.",
        ]
      : []),
    ...(preferences.arrivalTime || preferences.departureTime
      ? [
          "Đã chừa dự kiến 60 phút sau giờ đến và 90 phút trước giờ về. Đây là giả định lập lịch, chưa xác nhận thời gian di chuyển hoặc thủ tục; cần kiểm tra với nhà vận chuyển.",
        ]
      : []),
    ...(preferences.transport
      ? [
          `Phương tiện dự kiến: ${transportLabels[preferences.transport]}. ${walking ? "Chỉ ghép thêm điểm trong khoảng 2km đường chim bay khi có tọa độ; quán ăn trong 1,5km. Chưa xác nhận lối đi bộ hoặc điểm xuất phát của bạn." : "Chưa có thời gian tuyến đường, giá cước hoặc lịch xe buýt trực tiếp."}`,
        ]
      : []),
    ...(gentle
      ? [
          "Nhịp đi nhẹ: tối đa một điểm tham quan chính mỗi ngày, có nghỉ trưa, không thêm điểm dạo tối; bỏ điểm có thời lượng từ 4 giờ hoặc mô tả leo/bậc thang. Chưa xác minh đầy đủ khả năng tiếp cận, bạn cần hỏi cơ sở trước khi đi.",
        ]
      : []),
    ...(preferences.hasChildren
      ? [
          "Có trẻ em: chưa áp dụng giá vé hoặc chia phòng theo giá người lớn khi thiếu chính sách tuổi/giường phù hợp. Chi phí tương ứng giữ chưa xác định; điểm có vé 0đ vẫn được tính đúng.",
        ]
      : []),
    "Mình ưu tiên ghép điểm gần nhau khi có tọa độ; đây chưa phải tuyến đường hay thời gian di chuyển thực tế. Bạn có thể bấm Chỉ đường ở từng điểm.",
    "Giá nhà hàng là giá món đang bán, không phải chi phí một bữa cho cả nhóm. Di chuyển, đồ uống, phụ thu và các khoản chưa có giá chưa được cộng vào phần đã biết.",
  ];
  if (options.excludeStayIds?.length && !alternatives.length && stays.length)
    notes.push(
      "Chưa có cơ sở lưu trú khác phù hợp trong dữ liệu; mình để trống, không gợi ý lại cơ sở bạn đã loại.",
    );
  if (chosenSights.length < dayCount * 2)
    notes.push(
      `Đã xếp ${chosenSights.length}/${dayCount * (gentle ? 1 : 2)} điểm tham quan tối đa theo nhịp đi; số buổi thực tế còn phụ thuộc giờ đến/về. Không ghép thêm điểm quá xa hoặc kéo dài lịch để lấp chỗ trống.`,
    );
  if (knownSubtotal !== null && available !== null && knownSubtotal > available)
    notes.push(
      `Riêng các khoản đã biết đã vượt ngân sách khả dụng ${money(knownSubtotal - available)}; cần giảm điểm có vé, đổi lưu trú hoặc tăng ngân sách.`,
    );
  return {
    preferences,
    questions: [
      ...(!brief.days ? ["Bạn đi mấy ngày (hỗ trợ 1–3 ngày)?"] : []),
      ...(!people ? ["Nhóm có bao nhiêu khách?"] : []),
      ...(!budget ? ["Tổng ngân sách dự kiến của nhóm là bao nhiêu?"] : []),
      ...(!brief.start_date ? ["Bạn khởi hành ngày nào?"] : []),
      ...tripQuestions(preferences),
    ].slice(0, 3),
    title: `Gợi ý ${dayCount} ngày khám phá Đà Nẵng`,
    dayCount,
    guestCount: people,
    startDate: brief.start_date,
    budget,
    assumptions,
    days,
    groups: [
      {
        title: "Điểm tham quan & check-in",
        places: chosenSights
          .slice(0, 3)
          .map((p) => placeCard(p, reason(p, "Có trong lịch đề xuất"))),
      },
      {
        title: "Ẩm thực gợi ý",
        places: [...new Map(chosenFood.map((p) => [p.placeId, p])).values()]
          .slice(0, 3)
          .map((p) => placeCard(p, reason(p, "Gợi ý từ dữ liệu quán ăn"))),
      },
      {
        title: "Lưu trú để bạn cân nhắc",
        places: rankedStays
          .slice(0, 2)
          .map((p) => placeCard(p, reason(p, "Cần xác nhận phòng trống"))),
      },
    ].filter((g) => g.places.length),
    costs: {
      accommodation,
      tickets,
      knownSubtotal,
      foodAllowance,
      ...(reserve !== null ? { contingencyAllowance: reserve, ...(financial.reserve === null ? { contingencyPercent: 8 } : {}) } : {}),
      remaining:
        available !== null && knownSubtotal !== null
          ? available - knownSubtotal
          : null,
      roomNote,
    },
    notes,
  };
}

export function planIntroduction(plan: ChatTravelPlan) {
  return `Mình lên trước lịch ${plan.dayCount} ngày${plan.guestCount ? ` cho ${plan.guestCount} người` : ""}${plan.budget ? `, tổng ngân sách bạn đưa ra ${money(plan.budget)}` : ""}. Các buổi được cân đối theo giờ đến/về và nhịp đi bạn đã cung cấp; buổi không còn thời gian sẽ không xếp hoạt động.\n\n${plan.questions?.length ? "Để chỉnh lịch sát hơn, bạn bổ sung giúp mình:\n" + plan.questions.map((q) => "• " + q).join("\n") : "Bạn có thể nhắn đổi giờ đến/về, đổi phương tiện, thêm điểm hoặc điều chỉnh nhịp đi ngay trong cuộc trò chuyện này."}`;
}

export function consultationText(
  rows: PlaceSearchRow[],
  category: string,
  free: boolean,
  cheap: boolean,
) {
  const label =
    category === "food"
      ? "quán ăn"
      : category === "stay"
        ? "chỗ ở"
        : "điểm tham quan";
  if (!rows.length)
    return `Mình chưa tìm thấy ${label}${free ? " có giá vé 0đ được xác nhận trong dữ liệu" : ""} khớp yêu cầu của bạn. Mình giữ đúng điều kiện thay vì đổi sang loại địa điểm khác. Bạn muốn mở rộng khu vực${free ? " hoặc cân nhắc cả điểm có vé" : ""} không?`;
  const intro = free
    ? `Mình chọn ${rows.length} điểm tham quan có giá vé 0đ trong dữ liệu DaNangGo. Miễn phí vé không có nghĩa là miễn phí gửi xe hoặc các dịch vụ phát sinh.`
    : `Mình chọn ${rows.length} ${label}${cheap ? " theo hướng tiết kiệm hơn" : ""} để bạn dễ so sánh${rows.every((p) => p.districtName === rows[0]?.districtName) && rows[0]?.districtName ? ` ở ${rows[0].districtName}` : ""}.`;
  const advice =
    category === "food"
      ? "Bạn xem giá món ở từng quán trước; tổng hóa đơn còn tùy số món và số người. Nếu có món kiêng hoặc dị ứng, bạn nên trao đổi trực tiếp với quán."
      : category === "stay"
        ? rows.every((p) => !p.priceText)
          ? "Mình chưa có giá đặt phòng theo ngày ở cho các cơ sở này. Mình chưa thể xác nhận phù hợp ngân sách hoặc còn phòng; bạn nên liên hệ cơ sở để lấy giá đúng ngày và số khách."
          : "Giá hiển thị là giá phòng trong dữ liệu; cơ sở chưa cập nhật giá cần được hỏi riêng. Mình chưa xác nhận phòng trống hoặc phụ thu theo ngày. Nên ưu tiên khu vực gần những điểm bạn dự định đi để tiện di chuyển."
        : "Nếu muốn chụp hình, mình gợi ý dành buổi sáng hoặc cuối chiều và chừa thời gian nghỉ trưa. Đây là cách sắp xếp thời gian, không phải xác nhận giờ hoạt động của từng điểm.";
  const question =
    category === "food"
      ? "Bạn đi mấy người và muốn dành khoảng bao nhiêu cho một bữa?"
      : category === "stay"
        ? "Bạn nhận phòng ngày nào, ở mấy đêm và có bao nhiêu khách?"
        : "Bạn muốn đi nửa ngày hay cả ngày, và di chuyển bằng xe máy hay ô tô?";
  const verified =
    category === "stay"
      ? rows.flatMap((row) => {
          const facts = row.stayFacts;
          if (!facts) return [];
          const details: string[] = [];
          if (facts.hours)
            details.push(
              `nhận phòng từ ${facts.hours.checkIn}, trả phòng trước ${facts.hours.checkOut} (giờ Đà Nẵng)`,
            );
          if (facts.rooms.length)
            details.push(
              ...facts.rooms.map(
                (room) => `${room.name}: ${room.occupancyText}`,
              ),
            );
          if (facts.publicRates.length)
            details.push(
              ...facts.publicRates.map(
                (rate) =>
                  `${rate.roomName}: giá niêm yết tham khảo ${money(rate.nightlyVnd)}/phòng/đêm, gồm ${rate.includedGuests} khách trong giá, hiệu lực ${rate.validFrom}–${rate.validTo}; có thể có phụ thu và ngày không áp dụng, cần xác nhận giá và phòng trống`,
              ),
            );
          return details.length ? [`${row.name}: ${details.join("; ")}.`] : [];
        })
      : [];
  return [intro, advice, ...verified, question].join("\n\n");
}
