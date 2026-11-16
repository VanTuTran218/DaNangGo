import type { DayPeriod } from './weather.types';

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh' as const;

const vnDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: VIETNAM_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const vnTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: VIETNAM_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const vnWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: VIETNAM_TIMEZONE,
  weekday: 'short',
});

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const WEEKDAY_VI: Record<number, string> = {
  0: 'Chủ Nhật',
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
};

/** Trả về YYYY-MM-DD hiện tại theo múi giờ Asia/Ho_Chi_Minh */
export function getVietnamToday(now: Date = new Date()): string {
  return vnDateFormatter.format(now);
}

/** Trả về giờ (0-23) hiện tại theo múi giờ Asia/Ho_Chi_Minh */
export function getVietnamHour(now: Date = new Date()): number {
  const parts = vnTimeFormatter.format(now).split(':');
  return Number(parts[0] ?? 0);
}

/** Trả về thứ trong tuần (0=CN..6=T7) theo múi giờ Asia/Ho_Chi_Minh */
export function getVietnamWeekday(now: Date = new Date()): number {
  const short = vnWeekdayFormatter.format(now);
  return WEEKDAY_MAP[short] ?? 0;
}

/** Cộng/trừ ngày trên chuỗi YYYY-MM-DD (không phụ thuộc timezone hệ thống) */
export function addDaysVN(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = Date.UTC(y!, (m! - 1), d! + offsetDays);
  const next = new Date(utc);
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Số ngày chênh lệch (target - base) trên YYYY-MM-DD */
export function diffDaysVN(baseDateStr: string, targetDateStr: string): number {
  const [by, bm, bd] = baseDateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  const baseMs = Date.UTC(by!, bm! - 1, bd!);
  const targetMs = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((targetMs - baseMs) / 86_400_000);
}

/** Định dạng YYYY-MM-DD thành dd/MM/yyyy */
export function formatDateVi(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Nhãn ngày thân thiện theo giờ Việt Nam (VD: Hôm nay (13/11), Ngày mai (14/11), Thứ Bảy (15/11)) */
export function formatDayLabelVN(dateStr: string, now: Date = new Date()): string {
  const today = getVietnamToday(now);
  const diff = diffDaysVN(today, dateStr);
  const [, m, d] = dateStr.split('-');
  const shortDate = `${d}/${m}`;
  if (diff === 0) return `Hôm nay (${shortDate})`;
  if (diff === 1) return `Ngày mai (${shortDate})`;
  if (diff === 2) return `Ngày mốt (${shortDate})`;
  const [yy, mm, dd] = dateStr.split('-').map(Number);
  const weekday = new Date(Date.UTC(yy!, mm! - 1, dd!)).getUTCDay();
  return `${WEEKDAY_VI[weekday] ?? 'Ngày'} (${shortDate})`;
}

/** Tính cặp ngày Thứ 7 & Chủ Nhật của cuối tuần hiện tại/sắp tới theo giờ Việt Nam */
export function getVietnamWeekendDates(now: Date = new Date()): { saturday: string; sunday: string; dates: string[] } {
  const today = getVietnamToday(now);
  const weekday = getVietnamWeekday(now); // 0=CN..6=T7
  if (weekday === 0) {
    // Hôm nay là Chủ Nhật -> cuối tuần hiện tại còn hôm nay (CN)
    return { saturday: addDaysVN(today, -1), sunday: today, dates: [today] };
  }
  if (weekday === 6) {
    // Hôm nay là Thứ Bảy -> Thứ Bảy hôm nay & Chủ Nhật ngày mai
    const sunday = addDaysVN(today, 1);
    return { saturday: today, sunday, dates: [today, sunday] };
  }
  const daysToSaturday = 6 - weekday;
  const saturday = addDaysVN(today, daysToSaturday);
  const sunday = addDaysVN(today, daysToSaturday + 1);
  return { saturday, sunday, dates: [saturday, sunday] };
}

/** Phân loại khung giờ trong ngày từ giờ 0-23 */
export function hourToPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 11) return 'MORNING';
  if (hour >= 11 && hour < 14) return 'NOON';
  if (hour >= 14 && hour < 18) return 'AFTERNOON';
  if (hour >= 18 && hour < 22) return 'EVENING';
  return 'NIGHT';
}

export function periodLabelVi(period: DayPeriod): string {
  switch (period) {
    case 'MORNING': return 'buổi sáng';
    case 'NOON': return 'buổi trưa';
    case 'AFTERNOON': return 'buổi chiều';
    case 'EVENING': return 'buổi tối';
    case 'NIGHT': return 'đêm';
  }
}

export interface ParsedDateQuery {
  date: string | null;
  dates: string[];
  label: string | null;
  isWeekend: boolean;
  outOfRangeReason?: string;
}

/**
 * Phân tích ngày từ câu tiếng Việt (đã normalize không dấu hoặc có dấu) theo múi giờ Asia/Ho_Chi_Minh.
 */
export function parseWeatherDateQuery(normalizedText: string, now: Date = new Date()): ParsedDateQuery {
  const today = getVietnamToday(now);

  if (/\b(cuoi tuan)\b/.test(normalizedText)) {
    const weekend = getVietnamWeekendDates(now);
    const label =
      weekend.dates.length === 1
        ? `Chủ Nhật (${formatDateVi(weekend.dates[0]!)})`
        : `cuối tuần (${formatDateVi(weekend.saturday)} – ${formatDateVi(weekend.sunday)})`;
    return { date: weekend.dates[0]!, dates: weekend.dates, label, isWeekend: true };
  }

  if (/\b(ngay mai|sang mai|chieu mai|toi mai|mai)\b/.test(normalizedText)) {
    const tomorrow = addDaysVN(today, 1);
    return { date: tomorrow, dates: [tomorrow], label: `ngày mai (${formatDateVi(tomorrow)})`, isWeekend: false };
  }

  if (/\b(ngay mot|mot)\b/.test(normalizedText)) {
    const dayAfter = addDaysVN(today, 2);
    return { date: dayAfter, dates: [dayAfter], label: `ngày mốt (${formatDateVi(dayAfter)})`, isWeekend: false };
  }

  if (/\b(hom nay|bay gio|hien tai|sang nay|chieu nay|toi nay)\b/.test(normalizedText)) {
    return { date: today, dates: [today], label: `hôm nay (${formatDateVi(today)})`, isWeekend: false };
  }

  // Ngày cụ thể dạng YYYY-MM-DD
  const isoMatch = normalizedText.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const candidate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const diff = diffDaysVN(today, candidate);
    if (diff < 0 || diff > 14) {
      return {
        date: null,
        dates: [],
        label: formatDateVi(candidate),
        isWeekend: false,
        outOfRangeReason: `Nguồn dự báo hiện chỉ hỗ trợ từ hôm nay (${formatDateVi(today)}) đến tối đa 14 ngày tới.`,
      };
    }
    return { date: candidate, dates: [candidate], label: `ngày ${formatDateVi(candidate)}`, isWeekend: false };
  }

  // Ngày cụ thể dạng dd/mm hoặc dd/mm/yyyy hoặc dd-mm
  const dmyMatch = normalizedText.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const currentYear = Number(today.slice(0, 4));
    const year = dmyMatch[3] ? Number(dmyMatch[3]) : currentYear;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const diff = diffDaysVN(today, candidate);
      if (diff < 0 || diff > 14) {
        return {
          date: null,
          dates: [],
          label: formatDateVi(candidate),
          isWeekend: false,
          outOfRangeReason: `Nguồn dự báo hiện chỉ hỗ trợ từ hôm nay (${formatDateVi(today)}) đến tối đa 14 ngày tới.`,
        };
      }
      return { date: candidate, dates: [candidate], label: `ngày ${formatDateVi(candidate)}`, isWeekend: false };
    }
  }

  return { date: today, dates: [today], label: null, isWeekend: false };
}
