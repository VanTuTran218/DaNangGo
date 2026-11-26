import { getWeatherForecast } from "../weather/weather.service";
import { addDaysVN, getVietnamToday } from "../weather/weather.timezone";
import type { ChatMessageDto, ChatTravelPlan } from "./chat.types";

export const isTomorrowPreparation = (text: string) =>
  /\b(mai|ngay mai)\b/.test(text) && /\b(chuan bi|mang theo|checklist)\b/.test(text);

export async function prepareTomorrow(
  plan?: ChatTravelPlan,
  options: NonNullable<Parameters<typeof getWeatherForecast>[1]> = {},
): Promise<{ content: string; sources?: ChatMessageDto["sources"] }> {
  const date = addDaysVN(getVietnamToday(options.now), 1);
  if (!plan) return { content: "Bạn tạo lịch trong cuộc trò chuyện này trước nhé. Gô sẽ dùng các điểm trong lịch để lập danh sách chuẩn bị cho ngày mai." };
  const day = plan.days.find(entry => (entry.date ?? (plan.startDate ? addDaysVN(plan.startDate, entry.day - 1) : null)) === date);
  if (!day) return { content: !plan.startDate && plan.days.every(entry => !entry.date)
    ? "Lịch chưa có ngày khởi hành. Bạn cập nhật ngày khởi hành để Gô biết ngày mai ứng với ngày nào trong lịch nhé."
    : `Lịch hiện tại chưa có mục cho ngày mai (${date}). Bạn kiểm tra lại ngày đi nhé.` };
  const entries = day.periods.flatMap(period => period.items.map(item => ({ period: period.label, item })));
  if (!entries.length) return { content: `Ngày mai (${date}) chưa có hoạt động trong lịch.` };
  const forecast = await getWeatherForecast({ date }, options).catch(() => null);
  const hourly = forecast?.hourly.filter(hour => hour.date === date) ?? [];
  const lines = entries.map(({ period, item }) => {
    const at = item.title.match(/^(\d{2}):(\d{2})\b/);
    const start = at ? Number(at[1]) * 60 + Number(at[2]) : null;
    const end = start === null ? null : start + (item.durationMinutes ?? 1);
    const rain = !forecast?.stale && start !== null && end !== null
      ? hourly.filter(hour => hour.hour * 60 < end && (hour.hour + 1) * 60 > start &&
          ((hour.precipitationProbability ?? 0) >= 60 || (hour.precipitation ?? 0) > 0))
      : [];
    const place = item.place;
    const checks = place ? ["xác nhận giờ hoạt động"] : [];
    if (place?.placeType === "ATTRACTION") checks.push(place.priceText ? `kiểm tra vé (danh mục: ${place.priceText})` : "kiểm tra giá vé và điều kiện đặt trước");
    if (rain.length && place) checks.push("mang áo mưa hoặc ô cho chặng di chuyển");
    const name = place ? `${at ? at[0] + " · " : ""}${place.name}` : item.title;
    return `• ${period} — ${name}${checks.length ? `: ${checks.join("; ")}.` : ""}`;
  });
  const weather = forecast && !forecast.stale && hourly.some(hour => hour.precipitationProbability !== null || hour.precipitation !== null)
    ? `Dự báo theo giờ cho ${forecast.location.areaLabel} từ ${forecast.source.name}, lấy lúc ${new Date(forecast.fetchedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`
    : "Chưa có dự báo theo giờ đủ mới để đối chiếu với các mục ngày mai.";
  const stops = entries.flatMap(({ item }) => item.place ? [item.place.name] : []);
  const legs = stops.slice(1).map((stop, index) => `${stops[index]} → ${stop}`);
  const routing = legs.length ? `Tra trước trên Bản đồ DaNangGo: ${legs.join(" | ")}.` : stops[0] ? `Tra trước tuyến từ nơi xuất phát của bạn đến ${stops[0]}.` : "";
  return {
    content: [`Chuẩn bị cho ngày mai (${date})`, weather, ...lines, routing].filter(Boolean).join("\n"),
    sources: forecast && !forecast.stale ? [{ url: forecast.source.url, label: forecast.source.name, checkedOn: forecast.fetchedAt.slice(0, 10), scope: forecast.location.areaLabel }] : [],
  };
}
