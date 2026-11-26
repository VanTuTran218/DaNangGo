import { normalize } from "../ai/ai.rules";
import { listPublicEventsForChat } from "../events/events.repository";
import { addDaysVN, getVietnamToday, getVietnamWeekendDates } from "../weather/weather.timezone";
import type { KnowledgeReply } from "./chat.knowledge";

export async function eventReply(
  message: string,
  now = new Date(),
  load = listPublicEventsForChat,
): Promise<KnowledgeReply> {
  const text = normalize(message);
  const today = getVietnamToday(now);
  const weekend = /\bcuoi tuan\b/.test(text) ? getVietnamWeekendDates(now) : null;
  const start = weekend?.saturday ?? (/\b(?:ngay mai|mai)\b/.test(text) ? addDaysVN(today, 1) : today);
  const end = weekend?.sunday ?? (/\b(hom nay|ngay mai|mai)\b/.test(text) ? start : null);
  const year = text.match(/\b(20\d{2})\b/)?.[1];
  const topic = ["phun lua", "phun nuoc", "phao hoa", "am thuc", "am nhac", "trien lam"].find(term => text.includes(term));
  const actionLink = { text: "Xem lịch sự kiện DaNangGo", url: "/su-kien" };
  const reply = (content: string, link = actionLink): KnowledgeReply => ({ intentKey: "RT_EVENT", content, actionLink: link });

  try {
    const events = (await load()).filter(event => {
      const day = event.start_time?.slice(0, 10);
      const lastDay = event.end_time?.slice(0, 10) ?? day;
      const title = normalize(event.title);
      return day && lastDay && event.status !== "DRAFT" && event.status !== "CANCELLED"
        && (!topic || title.includes(topic))
        && (year ? day.startsWith(year + "-") : lastDay >= start)
        && (!end || (lastDay >= start && day <= end));
    }).sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? "")).slice(0, 5);
    const range = end && end !== start ? ` (${start} đến ${end})` : end ? ` (${start})` : "";
    if (!events.length) return reply(`Gô chưa tìm thấy sự kiện công khai phù hợp trong lịch DaNangGo${range}. Bạn có thể mở trang Sự kiện để xem các lịch đã đăng.`);
    return reply([
      `Lịch sự kiện trên DaNangGo${range} (giờ Đà Nẵng)`,
      ...events.map(event => {
        const date = event.start_time!.slice(0, 10);
        const time = event.is_all_day ? "cả ngày" : event.start_time!.slice(11, 16);
        const status = event.status === "POSTPONED" ? "đang hoãn, giờ cũ chỉ để tham khảo"
          : event.status === "RESCHEDULED" ? "đã đổi lịch" : null;
        const schedule = status === "đang hoãn, giờ cũ chỉ để tham khảo" ? status : [date, time, status].filter(Boolean).join(" · ");
        return `• ${event.title} — ${[schedule, event.location_name ?? event.address, event.ticket_price_display].filter(Boolean).join(" · ")}`;
      }),
      "Kiểm tra trang sự kiện trước khi đi để xem thông báo mới nhất và điều kiện vé.",
    ].join("\n"), events.length === 1 ? { text: "Xem chi tiết sự kiện", url: `/su-kien/${events[0]!.event_id}` } : actionLink);
  } catch {
    return reply("Gô chưa tải được lịch sự kiện DaNangGo lúc này. Bạn có thể mở trang Sự kiện hoặc thử lại sau.");
  }
}
