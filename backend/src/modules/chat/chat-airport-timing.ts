import { clock, minutes } from "./chat.trip-preferences";
import type { ChatTravelPlan } from "./chat.types";

export function airportTimingAnswer(text: string, plan?: ChatTravelPlan) {
  if (!/\bsan bay\b/.test(text) || !/\b(kip|phai co mat|kiem tra lich)\b/.test(text)) return null;
  if (!plan) return "Cuộc trò chuyện này chưa có lịch để kiểm tra. Bạn gửi lịch cần kiểm tra hoặc nhờ Gô lập lịch trước nhé.";
  const time = text.match(/\b(\d{1,2})(?:\s*h\s*(\d{2})?|:(\d{2})|\s*gio(?:\s+(\d{2})\b)?)(?!\d)/);
  const hours = Number(time?.[1]);
  const minute = Number(time?.[2] ?? time?.[3] ?? time?.[4] ?? 0);
  if (!time || hours > 23 || minute > 59) return "Bạn cần có mặt ở sân bay lúc mấy giờ? Gô dùng giờ có mặt tại sân bay để kiểm tra lịch.";
  const requestedDay = text.match(/\bngay\s+(\d+)\b/);
  const day = requestedDay ? plan.days.find(entry => entry.day === Number(requestedDay[1])) : plan.days[plan.days.length - 1];
  if (!day) return "Bạn chọn một ngày có trong lịch để Gô kiểm tra nhé.";
  const deadline = hours * 60 + minute;
  const travel = text.match(/\b(?:di chuyen|di ra san bay|ra san bay)\s+(?:mat\s+)?(\d{1,3})\s*phut\b/);
  const travelMinutes = travel ? Number(travel[1]) : undefined;
  if (travelMinutes !== undefined && travelMinutes > deadline) return "Thời gian di chuyển bạn đưa vượt quá khung giờ trong ngày. Bạn kiểm tra lại giờ hẹn và thời gian đi sân bay nhé.";
  const cutoff = deadline - (travelMinutes ?? 0);
  const entries = day.periods.flatMap(period => period.items)
    .filter(item => item.kind !== "arrival" && item.kind !== "departure")
    .map(item => {
      const start = /^\d{2}:\d{2}\b/.test(item.title) ? minutes(item.title.slice(0, 5)) : NaN;
      const duration = item.durationMinutes;
      return { name: item.place?.name ?? item.title, start, end: duration != null && duration > 0 ? start + duration : NaN };
    });
  const affected = entries.filter(item => item.start >= cutoff || item.end > cutoff);
  const latest = entries.filter(item => Number.isFinite(item.end) && item.end <= cutoff).sort((a, b) => b.end - a.end)[0];
  const intro = `Ngày ${day.day}, bạn cần có mặt ở sân bay lúc ${clock(deadline)}. `;
  const route = travelMinutes === undefined
    ? "Gô chưa có thời gian đi từ điểm cuối đến sân bay. Bạn có thể nhắn kèm “di chuyển 30 phút” nếu đã tra tuyến."
    : `Theo ${travelMinutes} phút di chuyển bạn cung cấp, cần rời điểm cuối chậm nhất lúc ${clock(cutoff)}, trước khi cộng thời gian dự phòng.`;
  const impact = affected.length ? ` Cân nhắc bỏ hoặc dời: ${affected.map(item => item.name).join(", ")}.` : "";
  const buffer = latest ? ` Mục kết thúc muộn nhất trước mốc là ${latest.name} lúc ${clock(latest.end)}, còn ${cutoff - latest.end} phút ${travelMinutes === undefined ? "để di chuyển và dự phòng" : "dự phòng theo ước tính"}.` : "";
  const unknown = entries.some(item => !Number.isFinite(item.end)) ? " Một số mục thiếu giờ hoặc thời lượng nên Gô chưa kiểm tra được toàn bộ lịch." : "";
  return intro + route + impact + buffer + unknown;
}
