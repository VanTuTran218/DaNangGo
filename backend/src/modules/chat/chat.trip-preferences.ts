import { normalize } from "../ai/ai.rules";

export interface TripPreferences {
  arrivalTime?: string;
  departureTime?: string;
  transport?: "car" | "motorbike" | "taxi" | "walk" | "bus";
  adults?: number;
  children?: number;
  childAges: number[];
  hasChildren?: boolean;
  seniors?: boolean;
  avoidWalking?: boolean;
  pace?: "gentle" | "active";
}
export const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const clock = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export const transportLabels = {
  car: "ô tô",
  motorbike: "xe máy",
  taxi: "taxi",
  walk: "đi bộ",
  bus: "xe buýt",
};

function readTime(text: string, label: "arrival" | "departure") {
  const prefix =
    label === "arrival"
      ? "(?:gio den|ha canh|den(?:\\s+(?:da nang|dn|san bay|ga))?|toi\\s+(?:da nang|dn|san bay|ga))"
      : "(?:gio ve|bay ve|chuyen ve|roi(?:\\s+(?:da nang|dn))?|ve)";
  const match = text.match(
    new RegExp(
      `${prefix}\\s*(?:(?:luc|vao|la|khoang)\\s*)?(\\d{1,2})(?:(:|h|\\s*gio)\\s*(\\d{1,2})?)?\\s*(sang|trua|chieu|toi|dem)?\\b`,
    ),
  );
  if (!match || (!match[2] && !match[4])) return undefined;
  let hour = Number(match[1]);
  const minute = Number(match[3] ?? 0),
    part = match[4];
  if (hour > 23 || minute > 59) return null;
  if (part && ["chieu", "toi"].includes(part) && hour < 12) hour += 12;
  if (part === "dem" && hour === 12) hour = 0;
  if (part === "trua" && hour < 11) return null;
  return clock(hour * 60 + minute);
}

export function tripPreferences(texts: string[]) {
  const value: TripPreferences = { childAges: [] };
  const issues = new Map<string, string>();
  for (const original of texts) {
    const text = normalize(original);
    for (const [field, label, title] of [
      ["arrivalTime", "arrival", "Giờ đến"],
      ["departureTime", "departure", "Giờ về"],
    ] as const) {
      const time = readTime(text, label);
      if (time === null)
        issues.set(
          field,
          `${title} chưa hợp lệ. Bạn ghi theo dạng 18:30 hoặc 6h chiều, trong khoảng 00:00–23:59 nhé.`,
        );
      else if (time !== undefined) {
        value[field] = time;
        issues.delete(field);
      }
    }
    const adults = text.match(/(\d+)\s*(?:nguoi lon(?!\s*tuoi)|khach lon)/);
    if (adults) value.adults = Number(adults[1]);
    const kids = text.match(/(\d+)\s*(?:tre em|tre nho|be|em be)\b/);
    if (/khong (?:co |di cung )?(?:tre em|tre nho|be)\b/.test(text)) {
      value.children = 0;
      value.hasChildren = false;
      value.childAges = [];
    } else if (
      kids ||
      /\b(co tre nho|co tre em|co be|cung tre nho|be\s*\d+\s*(tuoi|thang))\b/.test(
        text,
      )
    ) {
      value.hasChildren = kids ? Number(kids[1]) > 0 : true;
      if (kids) value.children = Number(kids[1]);
      const ages = [
        ...text.matchAll(
          /(?:be|tre|em be)\s*(\d+(?:[.,]\d+)?)\s*(tuoi|thang)/g,
        ),
      ].map(
        (m) => Number(m[1]!.replace(",", ".")) / (m[2] === "thang" ? 12 : 1),
      );
      if (ages.length) value.childAges = ages;
      if (ages.length && !kids && value.children === undefined)
        value.children = ages.length;
    }
    if (
      /khong (?:co |di cung )?(?:nguoi lon tuoi|nguoi cao tuoi|ong ba)/.test(
        text,
      )
    )
      value.seniors = false;
    else if (/nguoi lon tuoi|nguoi cao tuoi|ong ba/.test(text))
      value.seniors = true;
    if (/khong (?:can )?(?:han che di bo|tranh bac thang)/.test(text))
      value.avoidWalking = false;
    else if (
      /han che di bo|it di bo|khong di bo nhieu|tranh bac thang|khong leo|xe lan/.test(
        text,
      )
    )
      value.avoidWalking = true;
    if (/nhe nhang|di cham|thu tha|nghi nhieu/.test(text))
      value.pace = "gentle";
    else if (/nhieu diem|nang dong|lich day/.test(text)) value.pace = "active";
    for (const [mode, pattern] of [
      ["car", "o to|xe hoi"],
      ["motorbike", "xe may"],
      ["taxi", "taxi|grab"],
      ["walk", "di bo"],
      ["bus", "xe buyt|bus"],
    ] as const) {
      if (mode === "walk" && /di bo nhieu|it di bo|han che di bo/.test(text))
        continue;
      const m = text.match(new RegExp(`\\b(?:${pattern})\\b`));
      if (!m) continue;
      const before = text.slice(Math.max(0, m.index! - 20), m.index);
      if (/(?:khong|tranh)(?:\s+(?:di|dung|thue))?\s*$/.test(before)) {
        if (value.transport === mode) delete value.transport;
      } else value.transport = mode;
    }
  }
  if (value.adults !== undefined && (value.adults < 1 || value.adults > 100))
    issues.set(
      "party",
      "Số người lớn cần từ 1 đến 100; bạn kiểm tra lại nhóm khách nhé.",
    );
  if (
    value.children !== undefined &&
    (value.children > 99 || value.childAges.length > value.children)
  )
    issues.set(
      "children",
      "Số trẻ em và số tuổi đã cung cấp chưa khớp; bạn xác nhận lại nhé.",
    );
  if (value.childAges.some((age) => age < 0 || age >= 18))
    issues.set(
      "ages",
      "Bạn xác nhận lại tuổi trẻ em dưới 18; khách từ 18 tuổi được tính riêng trong nhóm người lớn nhé.",
    );
  return { value, issues: [...issues.values()] };
}

export function preferenceContext(p: TripPreferences) {
  return [
    p.arrivalTime ? `đến lúc ${p.arrivalTime}` : "",
    p.departureTime ? `về lúc ${p.departureTime}` : "",
    p.transport ? `di chuyển bằng ${transportLabels[p.transport]}` : "",
    p.adults !== undefined ? `${p.adults} người lớn` : "",
    p.children !== undefined
      ? `${p.children} trẻ em`
      : p.hasChildren
        ? "có trẻ nhỏ"
        : "",
    ...p.childAges.map((age) => `bé ${age} tuổi`),
    p.seniors === true
      ? "có người lớn tuổi"
      : p.seniors === false
        ? "không có người lớn tuổi"
        : "",
    p.avoidWalking ? "hạn chế đi bộ" : "",
    p.pace === "gentle"
      ? "đi nhẹ nhàng"
      : p.pace === "active"
        ? "đi nhiều điểm"
        : "",
  ]
    .filter(Boolean)
    .join(", ");
}
export function tripQuestions(p: TripPreferences) {
  return [
    !p.arrivalTime ? "Bạn đến Đà Nẵng lúc mấy giờ ngày đầu?" : "",
    !p.departureTime ? "Bạn rời Đà Nẵng lúc mấy giờ ngày cuối?" : "",
    !p.transport
      ? "Bạn di chuyển bằng ô tô, xe máy, taxi, xe buýt hay đi bộ?"
      : "",
    p.hasChildren && p.children === undefined
      ? "Nhóm có bao nhiêu trẻ em?"
      : "",
    p.hasChildren && p.adults === undefined
      ? "Số khách bạn cung cấp đã bao gồm các bé chưa? Nhóm có bao nhiêu người lớn?"
      : "",
    p.hasChildren && p.childAges.length < (p.children ?? 1)
      ? "Bạn cho biết tuổi của từng bé để điều chỉnh lịch và kiểm tra chính sách vé/phòng nhé."
      : "",
    p.seniors && p.avoidWalking === undefined
      ? "Nhóm có cần hạn chế đi bộ hoặc tránh bậc thang không?"
      : "",
  ].filter(Boolean);
}
