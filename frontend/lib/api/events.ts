import { apiRequest, ApiError } from '@/lib/api/client';
import {
  EVENT_TYPES,
  TICKET_TYPES,
  type Event,
  type EventFilterParams,
  type EventStatus,
  type TicketType,
} from '@/types/event';

const DANANG_OFFSET_MS = 7 * 3600 * 1000;

/**
 * Chuẩn hóa chuỗi thời gian từ Backend (SQL Server DATETIME2 hoặc ISO) sang ISO UTC
 * Nếu chuỗi không có offset, mặc định hiểu là giờ Đà Nẵng (UTC+7).
 */
export function parseEventDate(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim().replace(' ', 'T');
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const date = new Date(hasZone ? trimmed : `${trimmed}+07:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

/**
 * Lấy thông tin Năm, Tháng (0-11), Ngày, Thứ (0=CN..6=T7) theo giờ Đà Nẵng (UTC+7)
 */
export function getDanangWallClock(date: Date = new Date()) {
  const shifted = new Date(date.getTime() + DANANG_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    dayOfWeek: shifted.getUTCDay(), // 0: CN, 1: T2, ..., 6: T7
  };
}

/**
 * Tạo mốc Timestamp (ms) từ ngày giờ theo múi giờ Đà Nẵng (UTC+7)
 */
export function makeDanangTimestamp(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): number {
  return Date.UTC(year, month, day, hour, minute, second, ms) - DANANG_OFFSET_MS;
}

/**
 * Khoảng thời gian "Hôm nay" theo giờ Đà Nẵng (00:00:00.000 -> 23:59:59.999 UTC+7)
 */
export function getDanangTodayRange(now: Date = new Date()): { startMs: number; endMs: number } {
  const { year, month, day } = getDanangWallClock(now);
  return {
    startMs: makeDanangTimestamp(year, month, day, 0, 0, 0, 0),
    endMs: makeDanangTimestamp(year, month, day, 23, 59, 59, 999),
  };
}

/**
 * Khoảng thời gian "Cuối tuần này" (Thứ Bảy 00:00 -> Chủ Nhật 23:59:59.999) theo giờ Đà Nẵng (UTC+7)
 */
export function getDanangWeekendRange(now: Date = new Date()): { startMs: number; endMs: number } {
  const { year, month, day, dayOfWeek } = getDanangWallClock(now);
  // Nếu hôm nay là Chủ Nhật (0), Thứ Bảy của cuối tuần này là hôm qua (-1).
  // Nếu hôm nay là Thứ Hai..Thứ Bảy (1..6), Thứ Bảy là +(6 - dayOfWeek).
  const offsetToSaturday = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;
  const saturdayStartMs = makeDanangTimestamp(year, month, day + offsetToSaturday, 0, 0, 0, 0);
  const sundayEndMs = makeDanangTimestamp(year, month, day + offsetToSaturday + 1, 23, 59, 59, 999);
  return {
    startMs: saturdayStartMs,
    endMs: sundayEndMs,
  };
}

/**
 * Khoảng thời gian của một ngày cụ thể YYYY-MM-DD theo giờ Đà Nẵng (UTC+7)
 */
export function getDanangCustomDateRange(yyyyMmDd: string): { startMs: number; endMs: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return {
    startMs: makeDanangTimestamp(year, month, day, 0, 0, 0, 0),
    endMs: makeDanangTimestamp(year, month, day, 23, 59, 59, 999),
  };
}

/**
 * Kiểm tra sự kiện (kể cả sự kiện kéo dài nhiều ngày) có giao với khoảng [rangeStartMs, rangeEndMs] không
 */
export function doesEventOverlapRange(
  event: Pick<Event, 'startAt' | 'endAt'>,
  rangeStartMs: number,
  rangeEndMs: number,
): boolean {
  const startMs = Date.parse(event.startAt);
  const endMs = Date.parse(event.endAt || event.startAt);
  if (!Number.isFinite(startMs)) return false;
  const effectiveEndMs = Number.isFinite(endMs) && endMs >= startMs ? endMs : startMs;
  return startMs <= rangeEndMs && effectiveEndMs >= rangeStartMs;
}

/**
 * Kiểm tra sự kiện có kéo dài nhiều ngày theo lịch Đà Nẵng hay không
 */
export function isMultiDayEvent(event: Pick<Event, 'startAt' | 'endAt'>): boolean {
  const startMs = Date.parse(event.startAt);
  const endMs = Date.parse(event.endAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return false;
  const s = getDanangWallClock(new Date(startMs));
  const e = getDanangWallClock(new Date(endMs));
  return s.year !== e.year || s.month !== e.month || s.day !== e.day;
}

/**
 * Định dạng ngày giờ hiển thị chuẩn múi giờ Đà Nẵng (Asia/Ho_Chi_Minh)
 */
export function formatEventDateRange(startAt: string, endAt: string, isAllDay = false): string {
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  if (!Number.isFinite(startMs)) return 'Đang cập nhật thời gian';

  const dateFmt = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const startDateObj = new Date(startMs);
  if (!Number.isFinite(endMs) || endMs <= startMs) {
    return isAllDay
      ? `${dateFmt.format(startDateObj)} · Cả ngày`
      : `${timeFmt.format(startDateObj)}, ${dateFmt.format(startDateObj)}`;
  }

  const endDateObj = new Date(endMs);
  const multiDay = isMultiDayEvent({ startAt, endAt });

  if (multiDay) {
    if (isAllDay) {
      return `${dateFmt.format(startDateObj)} – ${dateFmt.format(endDateObj)} · Cả ngày`;
    }
    return `${timeFmt.format(startDateObj)} ${dateFmt.format(startDateObj)} – ${timeFmt.format(endDateObj)} ${dateFmt.format(endDateObj)}`;
  }

  if (isAllDay) {
    return `${dateFmt.format(startDateObj)} · Cả ngày`;
  }
  return `${timeFmt.format(startDateObj)} – ${timeFmt.format(endDateObj)}, ${dateFmt.format(startDateObj)}`;
}

/**
 * Định dạng ngày ngắn gọn cho thẻ EventCard
 */
export function formatEventCardDate(startAt: string, endAt: string, isAllDay = false): string {
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  if (!Number.isFinite(startMs)) return 'Đang cập nhật';

  const shortDateFmt = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const startObj = new Date(startMs);
  if (Number.isFinite(endMs) && isMultiDayEvent({ startAt, endAt })) {
    const endObj = new Date(endMs);
    return `${shortDateFmt.format(startObj)} – ${shortDateFmt.format(endObj)}`;
  }

  if (isAllDay) {
    return `${shortDateFmt.format(startObj)} · Cả ngày`;
  }
  if (Number.isFinite(endMs) && endMs > startMs) {
    return `${timeFmt.format(startObj)} – ${timeFmt.format( new Date(endMs))} · ${shortDateFmt.format(startObj)}`;
  }
  return `${timeFmt.format(startObj)} · ${shortDateFmt.format(startObj)}`;
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// ============================================================================
// DỮ LIỆU MẪU CHUẨN CHO CẢ NHÓM KHI TÍCH HỢP
// Bao gồm đầy đủ: Miễn phí vào tự do, Miễn phí cần đăng ký (Workshop), Có phí,
// Kéo dài nhiều ngày, Đã đổi lịch (dời từ T7 sang T2), Tạm hoãn, Đã hủy, Bản nháp.
// ============================================================================

function buildSampleEvents(now: Date = new Date()): Event[] {
  const { year, month, day, dayOfWeek } = getDanangWallClock(now);
  const offsetToSat = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;

  const isoAt = (dayOffset: number, hour: number, minute = 0) =>
    new Date(makeDanangTimestamp(year, month, day + dayOffset, hour, minute, 0)).toISOString();

  return [
    {
      id: '101',
      slug: 'le-hoi-am-thuc-va-bia-thu-cong-song-han',
      name: 'Lễ Hội Ẩm Thực & Bia Thủ Công Bên Bờ Sông Hàn 2026',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Hơn 60 gian hàng đặc sản miền Trung, bia thủ công Đà Nẵng và trình diễn âm nhạc đường phố sôi động suốt 3 ngày cuối tuần.',
      description:
        'Lễ hội Ẩm thực & Bia Thủ công Bên Bờ Sông Hàn quy tụ hơn 60 gian hàng ẩm thực đặc sắc từ Mì Quảng, Bánh xèo tôm nhảy, Hải sản nướng đến các dòng bia thủ công ủ lạnh đặc trưng của Đà Nẵng.\n\nChương trình chi tiết:\n• 16:30 – 18:30: Khai mở khu phố ẩm thực & trải nghiệm làm bánh dân gian.\n• 18:30 – 20:30: Giao lưu Acoustic & DJ Sunset bên bờ Đông Cầu Rồng.\n• 21:00 – 21:15: Cùng thưởng thức màn trình diễn Cầu Rồng phun lửa và phun nước từ vị trí đẹp nhất.\n• 21:15 – 22:30: Đêm nhạc hội vũ điệu ánh sáng Sông Hàn.',
      eventType: 'FOOD',
      // Kéo dài nhiều ngày: từ hôm nay qua hết Chủ Nhật cuối tuần này
      startAt: isoAt(Math.min(0, offsetToSat - 1), 16, 30),
      endAt: isoAt(offsetToSat + 1, 22, 30),
      isAllDay: false,
      placeId: '100',
      locationName: 'Công viên Bờ Đông Cầu Rồng',
      address: 'Đường Trần Hưng Đạo, Phường An Hải Tây',
      district: 'Sơn Trà',
      latitude: 16.0611,
      longitude: 108.2295,
      ticketType: 'FREE_OPEN',
      ticketPriceDisplay: 'Miễn phí vào cổng',
      ticketUrl: '',
      registrationDeadline: '',
      organizerName: 'Trung tâm Xúc tiến Du lịch Đà Nẵng',
      organizerContact: '0236 386 3595 · danangfantasticity@danang.gov.vn',
      officialSourceUrl: 'https://danangfantasticity.com',
      isFeatured: true,
      status: 'PUBLISHED',
      updatedAt: isoAt(-1, 9, 0),
    },
    {
      id: '102',
      slug: 'workshop-lam-den-long-va-gom-thu-cong-apec',
      name: 'Workshop Làm Đèn Lồng Truyền Thống & Vẽ Gốm Tại Công Viên APEC',
      imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Trải nghiệm tự tay làm đèn lồng tre lụa và vẽ gốm thủ công cùng các nghệ nhân làng nghề ngay tại không gian mái vòm Công viên APEC.',
      description:
        'Buổi workshop dành cho du khách và các gia đình yêu thích nghệ thuật thủ công truyền thống miền Trung. Dưới sự hướng dẫn trực tiếp của các nghệ nhân, mỗi người tham dự sẽ tự tay hoàn thiện một chiếc đèn lồng lụa gấp gọn để mang về làm quà lưu niệm.\n\nNội dung chương trình:\n• 08:30 – 09:00: Đón khách, giới thiệu lịch sử nghề làm đèn lồng và gốm miền Trung.\n• 09:00 – 10:30: Thực hành căng vải lụa, vẽ họa tiết hoa sen và Cầu Vàng lên đèn lồng.\n• 10:30 – 11:30: Trải nghiệm chuốt gốm mini và trưng bày tác phẩm tại vườn tượng APEC.\n\nLưu ý: Sự kiện hoàn toàn miễn phí nguyên vật liệu nhưng giới hạn 40 suất mỗi buổi, vui lòng đăng ký trước qua đường dẫn chính thức.',
      eventType: 'WORKSHOP',
      // Diễn ra sáng Thứ Bảy cuối tuần này
      startAt: isoAt(offsetToSat, 8, 30),
      endAt: isoAt(offsetToSat, 11, 30),
      isAllDay: false,
      placeId: '100',
      locationName: 'Công viên APEC Đà Nẵng',
      address: 'Đường 2 Tháng 9, Phường Bình Hiên',
      district: 'Hải Châu',
      latitude: 16.0598,
      longitude: 108.2236,
      ticketType: 'FREE_REGISTRATION',
      ticketPriceDisplay: 'Miễn phí (Giới hạn 40 suất)',
      ticketUrl: 'https://danangfantasticity.com/dang-ky-workshop-apec',
      registrationDeadline: isoAt(offsetToSat - 1, 20, 0),
      organizerName: 'CLB Nghệ nhân Trẻ Đà Nẵng & Không gian Sáng tạo APEC',
      organizerContact: '0905 888 123 · workshop.apec@dananggo.vn',
      officialSourceUrl: 'https://danangfantasticity.com',
      isFeatured: true,
      status: 'PUBLISHED',
      updatedAt: isoAt(-1, 10, 30),
    },
    {
      id: '103',
      slug: 'dem-nhac-acoustic-sunset-bien-my-khe',
      name: 'Đêm Nhạc Acoustic Sunset & Giao Hưởng Biển Mỹ Khê — Live Concert',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Đắm mình trong giai điệu Acoustic và Indie lãng mạn lúc hoàng hôn ngay trên bãi cát trắng mịn của biển Mỹ Khê.',
      description:
        'Đêm nhạc ngoài trời kết hợp sân khấu ánh sáng nghệ thuật trên bờ biển Mỹ Khê. Sự kiện mang đến hơn 20 ca khúc Pop Ballad, Indie và Tropical Chill cùng dàn nhạc sống và các nghệ sĩ khách mời được yêu thích.\n\nLịch trình đêm nhạc:\n• 17:00 – 18:00: Check-in nhận vòng tay phát sáng & thưởng thức cocktail nhiệt đới đón hoàng hôn.\n• 18:00 – 19:30: Phần 1 — Acoustic Chill: Những bản tình ca của biển.\n• 19:30 – 21:30: Phần 2 — Full Band Live Concert & Giao lưu cùng khán giả.\n\nGiá vé đã bao gồm 01 đồ uống tự chọn và ghế ngồi lười trên bãi biển.',
      eventType: 'MUSIC',
      // Diễn ra tối Chủ Nhật cuối tuần này
      startAt: isoAt(offsetToSat + 1, 17, 0),
      endAt: isoAt(offsetToSat + 1, 21, 30),
      isAllDay: false,
      placeId: '102',
      locationName: 'Quảng trường Công viên Biển Đông — Bãi biển Mỹ Khê',
      address: 'Đường Võ Nguyên Giáp, Phường Phước Mỹ',
      district: 'Sơn Trà',
      latitude: 16.0702,
      longitude: 108.2465,
      ticketType: 'PAID',
      ticketPriceDisplay: '250.000đ – 550.000đ',
      ticketUrl: 'https://ticketbox.vn/danang-sunset-concert',
      registrationDeadline: isoAt(offsetToSat + 1, 16, 0),
      organizerName: 'Danang Beach Music Live',
      organizerContact: '1900 6400 · booking@danangbeachlive.vn',
      officialSourceUrl: 'https://danangfantasticity.com',
      isFeatured: true,
      status: 'PUBLISHED',
      updatedAt: isoAt(-2, 15, 0),
    },
    {
      id: '104',
      slug: 'trien-lam-nghe-thuat-anh-sang-di-san-cham-pa',
      name: 'Triển Lãm Nghệ Thuật Ánh Sáng 3D & Di Sản Văn Hóa Chăm Pa',
      imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Sự kiện kéo dài 7 ngày tái hiện các tháp cổ và cổ vật Chăm Pa bằng công nghệ trình chiếu 3D Mapping hiện đại.',
      description:
        'Triển lãm chuyên đề kéo dài xuyên suốt tuần lễ văn hóa tại Bảo tàng Điêu khắc Chăm Đà Nẵng. Lần đầu tiên du khách được chiêm ngưỡng các bảo vật quốc gia kết hợp cùng nghệ thuật trình chiếu ánh sáng 3D Mapping và âm nhạc dân gian Chăm.\n\nHoạt động nổi bật:\n• Mở cửa xuyên suốt từ 08:00 đến 21:00 hàng ngày.\n• Thuyết minh tự động đa ngôn ngữ qua mã QR tại từng khu trưng bày.\n• Trình diễn múa Apsara truyền thống vào khung giờ 19:00 mỗi tối tại sân vườn bảo tàng.',
      eventType: 'EXHIBITION',
      // Kéo dài nhiều ngày: bắt đầu từ 2 ngày trước và kéo dài thêm 5 ngày (luôn khớp cả Hôm nay & Cuối tuần này)
      startAt: isoAt(-2, 8, 0),
      endAt: isoAt(offsetToSat + 2, 21, 0),
      isAllDay: true,
      placeId: '101',
      locationName: 'Bảo tàng Điêu khắc Chăm Đà Nẵng',
      address: 'Số 02 Đường 2 Tháng 9, Phường Bình Hiên',
      district: 'Hải Châu',
      latitude: 16.0604,
      longitude: 108.2233,
      ticketType: 'PAID',
      ticketPriceDisplay: '60.000đ / người',
      ticketUrl: 'https://chammuseum.vn/dat-ve-trien-lam',
      registrationDeadline: '',
      organizerName: 'Bảo tàng Điêu khắc Chăm Đà Nẵng',
      organizerContact: '0236 357 2935 · chammuseum@danang.gov.vn',
      officialSourceUrl: 'https://chammuseum.vn',
      isFeatured: false,
      status: 'PUBLISHED',
      updatedAt: isoAt(-3, 11, 0),
    },
    {
      id: '105',
      slug: 'giai-chay-marathon-cung-duong-bien-son-tra',
      name: 'Giải Chạy Marathon Cung Đường Biển Sơn Trà — Danang Sunrise Run',
      imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Chinh phục cung đường ven biển Hoàng Sa – Bán đảo Sơn Trà đón bình minh với các cự ly 5km, 10km và 21km.',
      description:
        'Danang Sunrise Run đưa các vận động viên băng qua cung đường ven biển đẹp nhất Đà Nẵng, xuất phát từ Công viên Biển Đông hướng lên Chùa Linh Ứng — Bán đảo Sơn Trà.\n\nLịch trình mới sau khi điều chỉnh:\n• 04:30 – 05:15: Tập trung vận động viên, gửi đồ và khởi động cùng huấn luyện viên.\n• 05:30: Xuất phát cự ly 21km.\n• 06:00: Xuất phát cự ly 10km và 5km.\n• 08:30: Trao giải chung cuộc và tiệc nhẹ năng lượng bên bờ biển.',
      eventType: 'SPORTS',
      // ĐÃ ĐỔI LỊCH: Dời từ Thứ Bảy cuối tuần sang sáng Thứ Hai tuần kế tiếp (không nằm trong bộ lọc Cuối tuần này!)
      startAt: isoAt(offsetToSat + 2, 5, 0),
      endAt: isoAt(offsetToSat + 2, 9, 30),
      isAllDay: false,
      placeId: '98',
      locationName: 'Cung đường Hoàng Sa — Bán đảo Sơn Trà',
      address: 'Đường Hoàng Sa, Phường Thọ Quang',
      district: 'Sơn Trà',
      latitude: 16.1003,
      longitude: 108.2778,
      ticketType: 'FREE_REGISTRATION',
      ticketPriceDisplay: 'Miễn phí đăng ký BIB chạy phong trào',
      ticketUrl: 'https://danangfantasticity.com/dang-ky-sunrise-run',
      registrationDeadline: isoAt(offsetToSat + 1, 18, 0),
      organizerName: 'Liên đoàn Điền kinh & Cộng đồng Runner Đà Nẵng',
      organizerContact: '0236 382 1234 · sunriserun@dananggo.vn',
      officialSourceUrl: 'https://danangfantasticity.com',
      isFeatured: false,
      status: 'RESCHEDULED',
      changeNote:
        'Thông báo đổi lịch: Do dự báo có mưa rào vào rạng sáng Thứ Bảy, Ban tổ chức quyết định dời lịch xuất phát từ Thứ Bảy sang 05:00 sáng Thứ Hai đầu tuần để đảm bảo mặt đường khô ráo và an toàn tuyệt đối cho người tham gia.',
      updatedAt: isoAt(0, 8, 15),
    },
    {
      id: '106',
      slug: 'ngay-hoi-gia-dinh-va-tha-dieu-nghe-thuat',
      name: 'Ngày Hội Gia Đình & Trình Diễn Diều Khổng Lồ Trên Biển 2026',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Không gian vui chơi cuối tuần cho bé và gia đình với hơn 50 cánh diều nghệ thuật khổng lồ và khu trò chơi cát.',
      description:
        'Sự kiện quy tụ các câu lạc bộ diều nghệ thuật với những cánh diều mô phỏng sinh vật biển dài hơn 15m bay lượn trên bầu trời Đà Nẵng, kết hợp khu vực tô tượng, xây lâu đài cát cho các gia đình có trẻ nhỏ.',
      eventType: 'FAMILY',
      startAt: isoAt(offsetToSat + 7, 15, 0),
      endAt: isoAt(offsetToSat + 8, 18, 30),
      isAllDay: false,
      placeId: '102',
      locationName: 'Bãi biển Phạm Văn Đồng',
      address: 'Ngã ba Phạm Văn Đồng – Võ Nguyên Giáp',
      district: 'Sơn Trà',
      latitude: 16.0715,
      longitude: 108.2452,
      ticketType: 'FREE_REGISTRATION',
      ticketPriceDisplay: 'Miễn phí cho gia đình đăng ký trước',
      ticketUrl: 'https://danangfantasticity.com/ngay-hoi-gia-dinh',
      registrationDeadline: isoAt(offsetToSat + 5, 18, 0),
      organizerName: 'Cộng đồng Gia đình Trẻ Đà Nẵng',
      organizerContact: '0914 222 333 · familyfest@dananggo.vn',
      officialSourceUrl: 'https://danangfantasticity.com',
      isFeatured: false,
      status: 'POSTPONED',
      changeNote:
        'Thông báo tạm hoãn: Sự kiện tạm thời hoãn tổ chức để nâng cấp khu vực sân bãi và kiểm tra an toàn gió biển. Cổng đăng ký tạm đóng và thời gian tổ chức mới sẽ được thông báo sớm nhất.',
      updatedAt: isoAt(0, 9, 45),
    },
    {
      id: '107',
      slug: 'le-hoi-phao-hoa-va-trinh-dien-anh-sang-ba-na',
      name: 'Lễ Hội Hóa Trang Carnival & Vũ Hội Ánh Sáng Sun World Bà Nà Hills',
      imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Đoàn diễu hành Carnival rực rỡ sắc màu châu Âu tại Quảng trường Nhật Thực và Làng Pháp trên đỉnh Bà Nà.',
      description:
        'Thưởng thức lễ hội Carnival quy mô lớn với sự tham gia của hơn 100 nghệ sĩ quốc tế tại Làng Pháp và Quảng trường Nhật Thực.\n\nKhung giờ biểu diễn hàng ngày:\n• 10:30 – 11:15: Diễu hành Carnival Vũ hội Mặt Trời.\n• 13:30 – 14:15: Trình diễn nghệ thuật đường phố & Cà kheo.\n• 15:00 – 16:00: Giao lưu chụp ảnh cùng đoàn nghệ sĩ tại Cầu Vàng.',
      eventType: 'FESTIVAL',
      startAt: isoAt(offsetToSat, 10, 0),
      endAt: isoAt(offsetToSat + 1, 16, 30),
      isAllDay: false,
      placeId: '97',
      locationName: 'Sun World Bà Nà Hills',
      address: 'Thôn An Sơn, Xã Hòa Ninh',
      district: 'Hòa Vang',
      latitude: 15.9977,
      longitude: 107.9881,
      ticketType: 'PAID',
      ticketPriceDisplay: 'Từ 600.000đ (Theo vé cáp treo)',
      ticketUrl: 'https://sunworld.vn/ba-na-hills',
      registrationDeadline: '',
      organizerName: 'Sun World Bà Nà Hills',
      organizerContact: '0236 374 9888 · banahills@sunworld.vn',
      officialSourceUrl: 'https://sunworld.vn/ba-na-hills',
      isFeatured: true,
      status: 'PUBLISHED',
      updatedAt: isoAt(-2, 14, 0),
    },
    {
      id: '108',
      slug: 'workshop-nhiep-anh-san-may-dinh-ban-co-da-huy',
      name: 'Workshop Nhiếp Ảnh Đường Phố & Săn Mây Bình Minh Đỉnh Bàn Cờ',
      imageUrl: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1600&q=90&auto=format&fit=crop',
      shortDescription:
        'Buổi thực hành chụp ảnh phong cảnh bình minh trên đỉnh Bàn Cờ — Bán đảo Sơn Trà (Sự kiện đã hủy).',
      description:
        'Chương trình dự kiến tổ chức cho các thành viên yêu thích nhiếp ảnh phong cảnh cùng nhau đón bình minh trên Đỉnh Bàn Cờ ở độ cao gần 700m so với mực nước biển.',
      eventType: 'WORKSHOP',
      startAt: isoAt(offsetToSat, 5, 0),
      endAt: isoAt(offsetToSat, 8, 30),
      isAllDay: false,
      placeId: '98',
      locationName: 'Đỉnh Bàn Cờ — Bán đảo Sơn Trà',
      address: 'Bán đảo Sơn Trà, Phường Thọ Quang',
      district: 'Sơn Trà',
      latitude: 16.1185,
      longitude: 108.2615,
      ticketType: 'FREE_REGISTRATION',
      ticketPriceDisplay: 'Miễn phí (Cần đăng ký trước)',
      ticketUrl: 'https://danangfantasticity.com/dang-ky-san-may',
      registrationDeadline: isoAt(offsetToSat - 1, 18, 0),
      organizerName: 'Hội Nhiếp ảnh Du lịch Đà Nẵng',
      organizerContact: '0905 111 999 · photo@dananggo.vn',
      officialSourceUrl: 'https://danangfantasticity.com',
      isFeatured: false,
      status: 'CANCELLED',
      changeNote:
        'Thông báo hủy sự kiện: Do tuyến đường lên Đỉnh Bàn Cờ đang tạm phong tỏa để bảo trì taluy và sương mù dày đặc hạn chế tầm nhìn, Ban tổ chức rất tiếc phải hủy buổi workshop này. Các bạn đã đăng ký sẽ được ưu tiên giữ chỗ cho đợt tiếp theo.',
      updatedAt: isoAt(0, 10, 0),
    },
    {
      id: '109',
      slug: 'ban-nhap-le-hoi-dua-thuyen-song-han',
      name: 'Bản nháp: Giải Đua Thuyền Truyền Thống Sông Hàn Mở Rộng',
      imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop',
      shortDescription: 'Sự kiện đang ở trạng thái bản nháp (chỉ dành cho Admin).',
      description: 'Bản nháp nội bộ, chưa công bố ra trang công khai.',
      eventType: 'FESTIVAL',
      startAt: isoAt(offsetToSat, 7, 30),
      endAt: isoAt(offsetToSat, 11, 30),
      isAllDay: false,
      locationName: 'Bến du thuyền Sông Hàn',
      address: 'Đường Bạch Đằng',
      district: 'Hải Châu',
      ticketType: 'FREE_OPEN',
      ticketPriceDisplay: 'Miễn phí',
      ticketUrl: '',
      registrationDeadline: '',
      organizerName: 'Sở Văn hóa và Thể thao Đà Nẵng',
      organizerContact: '',
      officialSourceUrl: '',
      isFeatured: false,
      status: 'DRAFT',
      updatedAt: isoAt(0, 7, 0),
    },
  ];
}

export const MOCK_EVENTS: Event[] = buildSampleEvents();

// ============================================================================
// CHUYỂN ĐỔI RECORD TỪ BACKEND (HỖ TRỢ CẢ SNAKE_CASE VÀ CAMELCASE)
// ============================================================================

type RawBackendEvent = Record<string, unknown>;

export function normalizeEventRecord(raw: RawBackendEvent): Event {
  const id = raw.event_id != null ? String(raw.event_id) : raw.id != null ? String(raw.id) : '';
  const statusRaw = String(raw.status ?? 'PUBLISHED').toUpperCase() as EventStatus;
  const ticketRaw = String(raw.ticket_type ?? raw.ticketType ?? 'FREE_OPEN').toUpperCase() as TicketType;

  return {
    id,
    slug: typeof raw.slug === 'string' && raw.slug ? raw.slug : id,
    name: String(raw.title ?? raw.name ?? ''),
    imageUrl: String(raw.cover_image ?? raw.image_url ?? raw.imageUrl ?? ''),
    shortDescription: String(raw.short_description ?? raw.shortDescription ?? ''),
    description: String(raw.description ?? ''),
    eventType: String(raw.category ?? raw.event_type ?? raw.eventType ?? 'FESTIVAL').toUpperCase(),
    startAt: parseEventDate(String(raw.start_time ?? raw.startAt ?? '')),
    endAt: parseEventDate(String(raw.end_time ?? raw.endAt ?? '')),
    isAllDay: Boolean(raw.is_all_day ?? raw.isAllDay),
    placeId:
      raw.place_id != null
        ? String(raw.place_id)
        : raw.placeId != null
          ? String(raw.placeId)
          : undefined,
    locationName: String(raw.location_name ?? raw.locationName ?? ''),
    address: String(raw.address ?? ''),
    district: String(raw.district ?? raw.district_name ?? ''),
    latitude: typeof raw.latitude === 'number' ? raw.latitude : undefined,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : undefined,
    ticketType: Object.hasOwn(TICKET_TYPES, ticketRaw) ? ticketRaw : 'FREE_OPEN',
    ticketPriceDisplay: String(raw.ticket_price_display ?? raw.ticketPriceDisplay ?? ''),
    ticketUrl: String(raw.ticket_url ?? raw.ticketUrl ?? ''),
    registrationDeadline: parseEventDate(
      typeof (raw.registration_deadline ?? raw.registrationDeadline) === 'string'
        ? String(raw.registration_deadline ?? raw.registrationDeadline)
        : null,
    ),
    organizerName: String(raw.organizer_name ?? raw.organizerName ?? ''),
    organizerContact: String(raw.organizer_contact ?? raw.organizerContact ?? ''),
    officialSourceUrl: String(raw.source_url ?? raw.official_source_url ?? raw.officialSourceUrl ?? ''),
    isFeatured: Boolean(raw.is_featured ?? raw.isFeatured),
    status: statusRaw,
    changeNote:
      typeof (raw.reschedule_notice ?? raw.change_note ?? raw.changeNote) === 'string'
        ? String(raw.reschedule_notice ?? raw.change_note ?? raw.changeNote)
        : undefined,
    updatedAt: parseEventDate(
      typeof (raw.updated_at ?? raw.updatedAt) === 'string'
        ? String(raw.updated_at ?? raw.updatedAt)
        : null,
    ),
  };
}

/**
 * Áp dụng quy tắc hiển thị và bộ lọc phía Client (đồng bộ 100% với quy tắc nghiệp vụ của Phúc)
 * - Bản nháp (DRAFT) chỉ dành cho Admin -> ẩn khỏi danh sách công khai.
 * - Sự kiện đã hủy (CANCELLED) được gỡ khỏi các mục khám phá (Trang chủ, Danh sách).
 */
export function filterPublicEvents(
  events: Event[],
  filters: EventFilterParams = {},
  now: Date = new Date(),
): Event[] {
  const normalizedSearch = filters.search ? removeVietnameseTones(filters.search) : '';
  const datePreset = filters.datePreset ?? 'ALL';
  const eventType = filters.eventType && filters.eventType !== 'ALL' ? filters.eventType : '';
  const district = filters.district && filters.district !== 'ALL' ? filters.district : '';
  const priceFilter = filters.priceFilter ?? 'ALL';

  const todayRange = getDanangTodayRange(now);
  const weekendRange = getDanangWeekendRange(now);
  const customRange =
    datePreset === 'CUSTOM_DATE' && filters.customDate
      ? getDanangCustomDateRange(filters.customDate)
      : null;

  return events
    .filter((ev) => {
      // 1. Quy tắc hiển thị ở mục khám phá: ẩn DRAFT và CANCELLED
      if (ev.status === 'DRAFT' || ev.status === 'CANCELLED') {
        return false;
      }

      // 2. Tìm kiếm theo từ khóa (tên, mô tả ngắn, địa điểm, quận/huyện)
      if (normalizedSearch) {
        const haystack = removeVietnameseTones(
          `${ev.name} ${ev.shortDescription} ${ev.locationName} ${ev.address} ${ev.district} ${
            EVENT_TYPES[ev.eventType as keyof typeof EVENT_TYPES] ?? ''
          }`,
        );
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      // 3. Lọc theo loại sự kiện
      if (eventType && ev.eventType !== eventType) {
        return false;
      }

      // 4. Lọc theo khu vực (quận/huyện)
      if (district) {
        const evDistrictNorm = removeVietnameseTones(ev.district);
        const filterDistrictNorm = removeVietnameseTones(district);
        if (!evDistrictNorm.includes(filterDistrictNorm)) {
          return false;
        }
      }

      // 5. Lọc theo giá vé (Miễn phí / Có phí)
      if (priceFilter === 'FREE') {
        if (ev.ticketType !== 'FREE_OPEN' && ev.ticketType !== 'FREE_REGISTRATION') {
          return false;
        }
      } else if (priceFilter === 'PAID') {
        if (ev.ticketType !== 'PAID') {
          return false;
        }
      }

      // 6. Lọc theo ngày (theo múi giờ Đà Nẵng UTC+7, hỗ trợ sự kiện nhiều ngày)
      if (datePreset === 'TODAY') {
        if (!doesEventOverlapRange(ev, todayRange.startMs, todayRange.endMs)) {
          return false;
        }
      } else if (datePreset === 'THIS_WEEKEND') {
        if (!doesEventOverlapRange(ev, weekendRange.startMs, weekendRange.endMs)) {
          return false;
        }
      } else if (datePreset === 'UPCOMING') {
        const endMs = Date.parse(ev.endAt || ev.startAt);
        if (!Number.isFinite(endMs) || endMs < todayRange.startMs) {
          return false;
        }
      } else if (datePreset === 'CUSTOM_DATE' && customRange) {
        if (!doesEventOverlapRange(ev, customRange.startMs, customRange.endMs)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Ưu tiên sự kiện nổi bật trước, sau đó sắp xếp theo thời gian bắt đầu tăng dần
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }
      return Date.parse(a.startAt) - Date.parse(b.startAt);
    });
}

/**
 * Lấy danh sách sự kiện công khai cho trang Danh sách (/su-kien)
 * Ưu tiên gọi API thật từ Backend (/api/events); nếu Backend chưa chạy hoặc chưa có route thì dùng dữ liệu mẫu.
 */
export async function getPublicEvents(
  filters: EventFilterParams = {},
  signal?: AbortSignal,
): Promise<{ events: Event[]; isMockData: boolean }> {
  try {
    const query = new URLSearchParams();
    if (filters.search?.trim()) query.set('q', filters.search.trim());
    if (filters.eventType && filters.eventType !== 'ALL') query.set('category', filters.eventType);
    if (filters.district && filters.district !== 'ALL') query.set('district', filters.district);
    if (filters.priceFilter && filters.priceFilter !== 'ALL') {
      query.set('price_type', filters.priceFilter.toLowerCase());
    }
    if (filters.datePreset && filters.datePreset !== 'ALL') {
      query.set('date_filter', filters.datePreset.toLowerCase());
    }
    if (filters.datePreset === 'CUSTOM_DATE' && filters.customDate) {
      query.set('date', filters.customDate);
    }

    const qs = query.toString();
    const res = await apiRequest<RawBackendEvent[] | { items?: RawBackendEvent[] }>(
      `/api/events${qs ? `?${qs}` : ''}`,
      { signal, cache: 'no-store' },
      { retryAfterRefresh: false },
    );

    const rawList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.items)
        ? res.data.items
        : null;

    if (rawList && rawList.length > 0) {
      const normalized = rawList.map(normalizeEventRecord);
      return {
        events: filterPublicEvents(normalized, filters),
        isMockData: false,
      };
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    // Fallback sang MOCK_EVENTS khi backend chưa sẵn sàng
  }

  return {
    events: filterPublicEvents(buildSampleEvents(), filters),
    isMockData: true,
  };
}

/**
 * Lấy danh sách sự kiện cho mục "Cuối tuần này ở Đà Nẵng" trên Trang chủ.
 * Nếu cuối tuần trống, tự động hiển thị các sự kiện sắp tới.
 */
export async function getHomeWeekendEvents(
  limit = 4,
  signal?: AbortSignal,
): Promise<{ events: Event[]; isFallbackUpcoming: boolean; isMockData: boolean }> {
  const { events: allPublic, isMockData } = await getPublicEvents({}, signal);
  const now = new Date();

  const weekendEvents = filterPublicEvents(
    allPublic,
    { datePreset: 'THIS_WEEKEND' },
    now,
  );

  if (weekendEvents.length > 0) {
    return {
      events: weekendEvents.slice(0, limit),
      isFallbackUpcoming: false,
      isMockData,
    };
  }

  const upcomingEvents = filterPublicEvents(
    allPublic,
    { datePreset: 'UPCOMING' },
    now,
  );

  return {
    events: (upcomingEvents.length > 0 ? upcomingEvents : allPublic).slice(0, limit),
    isFallbackUpcoming: true,
    isMockData,
  };
}

/**
 * Lấy chi tiết 1 sự kiện theo ID hoặc Slug.
 * Quy tắc hiển thị:
 * - Bản nháp (DRAFT) bị chặn với người dùng thường.
 * - Sự kiện đã hủy (CANCELLED) VẪN MỞ ĐƯỢC qua link chi tiết để người dùng xem thông báo hủy.
 */
export async function getPublicEventDetail(
  idOrSlug: string,
  signal?: AbortSignal,
): Promise<Event | null> {
  const cleanKey = decodeURIComponent(idOrSlug).trim();
  if (!cleanKey) return null;

  try {
    const res = await apiRequest<RawBackendEvent>(
      `/api/events/${encodeURIComponent(cleanKey)}`,
      { signal, cache: 'no-store' },
      { retryAfterRefresh: false },
    );
    if (res.data) {
      const event = normalizeEventRecord(res.data);
      if (event.status === 'DRAFT') return null;
      return event;
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    if (err instanceof ApiError && err.status === 403) {
      return null;
    }
    // Fallback tìm trong dữ liệu mẫu nếu backend chưa sẵn sàng
  }

  const samples = buildSampleEvents();
  const found = samples.find(
    (item) => item.id === cleanKey || item.slug === cleanKey,
  );
  if (!found || found.status === 'DRAFT') {
    return null;
  }
  return found;
}
