import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { getPool, sql } from "../../config/db";
import { maskEmail } from "../../utils/emailTemplates";
import {
  EventError,
  parseDanangDateTimeToMs,
  toDanangSqlDateTimeString,
  validateEventPublishRequirements,
  type EventInputPayload,
  type EventReminderInput,
  type EventStatus,
  type StatusPatchPayload,
  type SubmissionStatus,
} from "./events.validation";

export interface EventRecord {
  event_id: number;
  slug: string;
  title: string;
  cover_image: string | null;
  short_description: string | null;
  description: string | null;
  category: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  place_id: number | null;
  location_name: string | null;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  ticket_type: string;
  ticket_price_display: string | null;
  ticket_url: string | null;
  registration_deadline: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  source_url: string | null;
  is_featured: boolean;
  status: EventStatus;
  reschedule_notice: string | null;
  updated_at: string | null;
}

export interface SubmissionRecord {
  submission_id: number;
  title: string;
  organizer_name: string;
  organizer_contact: string | null;
  category: string | null;
  short_description: string | null;
  description: string | null;
  location_name: string | null;
  address: string | null;
  district: string | null;
  start_time: string | null;
  end_time: string | null;
  source_url: string | null;
  cover_image: string | null;
  status: SubmissionStatus;
  rejection_reason: string | null;
  submitted_at: string;
}

function slugifyVietnamese(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return base || "su-kien-da-nang";
}

function formatSqlDateForJson(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    // SQL Server DATETIME2 được đọc bởi mssql theo UTC; lấy YYYY-MM-DDTHH:mm:ss giữ nguyên mặt đồng hồ Đà Nẵng đã lưu
    return val.toISOString().slice(0, 19);
  }
  const str = String(val).trim();
  return str ? str.replace(" ", "T").slice(0, 19) : null;
}

function mapEventRow(row: Record<string, any>): EventRecord {
  return {
    event_id: Number(row.event_id),
    slug: String(row.slug),
    title: String(row.title ?? ""),
    cover_image: row.cover_image ?? null,
    short_description: row.short_description ?? null,
    description: row.description ?? null,
    category: row.category ?? null,
    start_time: formatSqlDateForJson(row.start_time),
    end_time: formatSqlDateForJson(row.end_time),
    is_all_day: Boolean(row.is_all_day),
    place_id: row.place_id != null ? Number(row.place_id) : null,
    location_name: row.location_name ?? null,
    address: row.address ?? null,
    district: row.district ?? null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    ticket_type: String(row.ticket_type ?? "FREE_OPEN"),
    ticket_price_display: row.ticket_price_display ?? null,
    ticket_url: row.ticket_url ?? null,
    registration_deadline: formatSqlDateForJson(row.registration_deadline),
    organizer_name: row.organizer_name ?? null,
    organizer_contact: row.organizer_contact ?? null,
    source_url: row.source_url ?? null,
    is_featured: Boolean(row.is_featured),
    status: String(row.status ?? "DRAFT") as EventStatus,
    reschedule_notice: row.reschedule_notice ?? null,
    updated_at: formatSqlDateForJson(row.updated_at),
  };
}

const EVENT_SELECT_COLUMNS = `
  e.event_id,
  e.slug,
  e.title,
  e.cover_image,
  e.short_description,
  e.description,
  e.category,
  CONVERT(VARCHAR(19), e.start_time, 126) AS start_time,
  CONVERT(VARCHAR(19), e.end_time, 126) AS end_time,
  e.is_all_day,
  e.place_id,
  e.location_name,
  e.address,
  e.district,
  e.latitude,
  e.longitude,
  e.ticket_type,
  e.ticket_price_display,
  e.ticket_url,
  CONVERT(VARCHAR(19), e.registration_deadline, 126) AS registration_deadline,
  e.organizer_name,
  e.organizer_contact,
  e.source_url,
  e.is_featured,
  e.status,
  e.reschedule_notice,
  CONVERT(VARCHAR(19), e.updated_at, 126) AS updated_at
`;

let schemaReadyPromise: Promise<void> | null = null;

/**
 * Đảm bảo bảng dbo.events, dbo.event_submissions và dbo.event_reminders đã được tạo.
 */
export async function ensureEventsSchemaAndSeed(): Promise<void> {
  if (schemaReadyPromise) return schemaReadyPromise;
  schemaReadyPromise = (async () => {
    try {
      const pool = getPool();
      const sqlFile = resolve(
        __dirname,
        "../../../../database/migrations/017_events_module.sql",
      );
      const migrationSql = readFileSync(sqlFile, "utf8");
      for (const batch of migrationSql
        .split(/^\s*GO\s*$/gim)
        .filter((s) => s.trim())) {
        await pool.request().query(batch);
      }

      // Seed 9 sự kiện Đà Nẵng chuẩn nếu bảng dbo.events chưa có dữ liệu
      const countRes = await pool
        .request()
        .query<{ cnt: number }>("SELECT COUNT(*) AS cnt FROM dbo.events");
      if ((countRes.recordset[0]?.cnt ?? 0) === 0) {
        await seedInitialEvents();
      }

      // Seed 3 đề xuất sự kiện mẫu nếu bảng dbo.event_submissions chưa có dữ liệu
      const subCountRes = await pool
        .request()
        .query<{ cnt: number }>("SELECT COUNT(*) AS cnt FROM dbo.event_submissions");
      if ((subCountRes.recordset[0]?.cnt ?? 0) === 0) {
        await seedInitialSubmissions();
      }
    } catch (err) {
      schemaReadyPromise = null;
      throw err;
    }
  })();
  return schemaReadyPromise;
}

function getDanangWallClockNow() {
  const shifted = new Date(Date.now() + 7 * 3600 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const dayOfWeek = shifted.getUTCDay();
  const offsetToSat = dayOfWeek === 0 ? -1 : 6 - dayOfWeek;

  const danangDateTime = (dayOffset: number, hour: number, minute = 0) => {
    const dt = new Date(Date.UTC(year, month, day + dayOffset, hour, minute, 0));
    return dt.toISOString().slice(0, 19);
  };

  return { offsetToSat, danangDateTime };
}

async function seedInitialEvents(): Promise<void> {
  const pool = getPool();
  const { offsetToSat, danangDateTime } = getDanangWallClockNow();

  const samples = [
    {
      slug: "le-hoi-am-thuc-va-bia-thu-cong-song-han",
      title: "Lễ Hội Ẩm Thực & Bia Thủ Công Bên Bờ Sông Hàn 2026",
      cover_image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Hơn 60 gian hàng đặc sản miền Trung, bia thủ công Đà Nẵng và trình diễn âm nhạc đường phố sôi động suốt 3 ngày cuối tuần.",
      description:
        "Lễ hội Ẩm thực & Bia Thủ công Bên Bờ Sông Hàn quy tụ hơn 60 gian hàng ẩm thực đặc sắc từ Mì Quảng, Bánh xèo tôm nhảy, Hải sản nướng đến các dòng bia thủ công ủ lạnh đặc trưng của Đà Nẵng.\n\nChương trình chi tiết:\n• 16:30 – 18:30: Khai mở khu phố ẩm thực & trải nghiệm làm bánh dân gian.\n• 18:30 – 20:30: Giao lưu Acoustic & DJ Sunset bên bờ Đông Cầu Rồng.\n• 21:00 – 21:15: Cùng thưởng thức màn trình diễn Cầu Rồng phun lửa và phun nước từ vị trí đẹp nhất.\n• 21:15 – 22:30: Đêm nhạc hội vũ điệu ánh sáng Sông Hàn.",
      category: "FOOD",
      start_time: danangDateTime(Math.min(0, offsetToSat - 1), 16, 30),
      end_time: danangDateTime(offsetToSat + 1, 22, 30),
      is_all_day: false,
      location_name: "Công viên Bờ Đông Cầu Rồng",
      address: "Đường Trần Hưng Đạo, Phường An Hải Tây",
      district: "Sơn Trà",
      latitude: 16.0611,
      longitude: 108.2295,
      ticket_type: "FREE_OPEN",
      ticket_price_display: "Miễn phí vào cổng",
      ticket_url: null,
      registration_deadline: null,
      organizer_name: "Trung tâm Xúc tiến Du lịch Đà Nẵng",
      organizer_contact: "0236 386 3595 · danangfantasticity@danang.gov.vn",
      source_url: "https://danangfantasticity.com",
      is_featured: true,
      status: "PUBLISHED",
      reschedule_notice: null,
    },
    {
      slug: "workshop-lam-den-long-va-gom-thu-cong-apec",
      title: "Workshop Làm Đèn Lồng Truyền Thống & Vẽ Gốm Tại Công Viên APEC",
      cover_image:
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Trải nghiệm tự tay làm đèn lồng tre lụa và vẽ gốm thủ công cùng các nghệ nhân làng nghề ngay tại không gian mái vòm Công viên APEC.",
      description:
        "Buổi workshop dành cho du khách và các gia đình yêu thích nghệ thuật thủ công truyền thống miền Trung. Dưới sự hướng dẫn trực tiếp của các nghệ nhân, mỗi người tham dự sẽ tự tay hoàn thiện một chiếc đèn lồng lụa gấp gọn để mang về làm quà lưu niệm.",
      category: "WORKSHOP",
      start_time: danangDateTime(offsetToSat, 8, 30),
      end_time: danangDateTime(offsetToSat, 11, 30),
      is_all_day: false,
      location_name: "Công viên APEC Đà Nẵng",
      address: "Đường 2 Tháng 9, Phường Bình Hiên",
      district: "Hải Châu",
      latitude: 16.0598,
      longitude: 108.2236,
      ticket_type: "FREE_REGISTRATION",
      ticket_price_display: "Miễn phí (Giới hạn 40 suất)",
      ticket_url: "https://danangfantasticity.com/dang-ky-workshop-apec",
      registration_deadline: danangDateTime(offsetToSat - 1, 20, 0),
      organizer_name: "CLB Nghệ nhân Trẻ Đà Nẵng & Không gian Sáng tạo APEC",
      organizer_contact: "0905 888 123 · workshop.apec@dananggo.vn",
      source_url: "https://danangfantasticity.com",
      is_featured: true,
      status: "PUBLISHED",
      reschedule_notice: null,
    },
    {
      slug: "dem-nhac-acoustic-sunset-bien-my-khe",
      title: "Đêm Nhạc Acoustic Sunset & Giao Hưởng Biển Mỹ Khê — Live Concert",
      cover_image:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Đắm mình trong giai điệu Acoustic và Indie lãng mạn lúc hoàng hôn ngay trên bãi cát trắng mịn của biển Mỹ Khê.",
      description:
        "Đêm nhạc ngoài trời kết hợp sân khấu ánh sáng nghệ thuật trên bờ biển Mỹ Khê. Sự kiện mang đến hơn 20 ca khúc Pop Ballad, Indie và Tropical Chill cùng dàn nhạc sống và các nghệ sĩ khách mời được yêu thích.",
      category: "MUSIC",
      start_time: danangDateTime(offsetToSat + 1, 17, 0),
      end_time: danangDateTime(offsetToSat + 1, 21, 30),
      is_all_day: false,
      location_name: "Quảng trường Công viên Biển Đông — Bãi biển Mỹ Khê",
      address: "Đường Võ Nguyên Giáp, Phường Phước Mỹ",
      district: "Sơn Trà",
      latitude: 16.0702,
      longitude: 108.2465,
      ticket_type: "PAID",
      ticket_price_display: "250.000đ – 550.000đ",
      ticket_url: "https://ticketbox.vn/danang-sunset-concert",
      registration_deadline: danangDateTime(offsetToSat + 1, 16, 0),
      organizer_name: "Danang Beach Music Live",
      organizer_contact: "1900 6400 · booking@danangbeachlive.vn",
      source_url: "https://danangfantasticity.com",
      is_featured: true,
      status: "PUBLISHED",
      reschedule_notice: null,
    },
    {
      slug: "trien-lam-nghe-thuat-anh-sang-di-san-cham-pa",
      title: "Triển Lãm Nghệ Thuật Ánh Sáng 3D & Di Sản Văn Hóa Chăm Pa",
      cover_image:
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Sự kiện kéo dài 7 ngày tái hiện các tháp cổ và cổ vật Chăm Pa bằng công nghệ trình chiếu 3D Mapping hiện đại.",
      description:
        "Triển lãm chuyên đề kéo dài xuyên suốt tuần lễ văn hóa tại Bảo tàng Điêu khắc Chăm Đà Nẵng.",
      category: "EXHIBITION",
      start_time: danangDateTime(-2, 8, 0),
      end_time: danangDateTime(offsetToSat + 2, 21, 0),
      is_all_day: true,
      location_name: "Bảo tàng Điêu khắc Chăm Đà Nẵng",
      address: "Số 02 Đường 2 Tháng 9, Phường Bình Hiên",
      district: "Hải Châu",
      latitude: 16.0604,
      longitude: 108.2233,
      ticket_type: "PAID",
      ticket_price_display: "60.000đ / người",
      ticket_url: "https://chammuseum.vn/dat-ve-trien-lam",
      registration_deadline: null,
      organizer_name: "Bảo tàng Điêu khắc Chăm Đà Nẵng",
      organizer_contact: "0236 357 2935 · chammuseum@danang.gov.vn",
      source_url: "https://chammuseum.vn",
      is_featured: false,
      status: "PUBLISHED",
      reschedule_notice: null,
    },
    {
      slug: "giai-chay-marathon-cung-duong-bien-son-tra",
      title: "Giải Chạy Marathon Cung Đường Biển Sơn Trà — Danang Sunrise Run",
      cover_image:
        "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Chinh phục cung đường ven biển Hoàng Sa – Bán đảo Sơn Trà đón bình minh với các cự ly 5km, 10km và 21km.",
      description:
        "Danang Sunrise Run đưa các vận động viên băng qua cung đường ven biển đẹp nhất Đà Nẵng, xuất phát từ Công viên Biển Đông hướng lên Chùa Linh Ứng — Bán đảo Sơn Trà.",
      category: "SPORTS",
      start_time: danangDateTime(offsetToSat + 2, 5, 0),
      end_time: danangDateTime(offsetToSat + 2, 9, 30),
      is_all_day: false,
      location_name: "Cung đường Hoàng Sa — Bán đảo Sơn Trà",
      address: "Đường Hoàng Sa, Phường Thọ Quang",
      district: "Sơn Trà",
      latitude: 16.1003,
      longitude: 108.2778,
      ticket_type: "FREE_REGISTRATION",
      ticket_price_display: "Miễn phí đăng ký BIB chạy phong trào",
      ticket_url: "https://danangfantasticity.com/dang-ky-sunrise-run",
      registration_deadline: danangDateTime(offsetToSat + 1, 18, 0),
      organizer_name: "Liên đoàn Điền kinh & Cộng đồng Runner Đà Nẵng",
      organizer_contact: "0236 382 1234 · sunriserun@dananggo.vn",
      source_url: "https://danangfantasticity.com",
      is_featured: false,
      status: "RESCHEDULED",
      reschedule_notice:
        "Thông báo đổi lịch: Do dự báo có mưa rào vào rạng sáng Thứ Bảy, Ban tổ chức quyết định dời lịch xuất phát từ Thứ Bảy sang 05:00 sáng Thứ Hai đầu tuần để đảm bảo mặt đường khô ráo và an toàn tuyệt đối cho người tham gia.",
    },
    {
      slug: "ngay-hoi-gia-dinh-va-tha-dieu-nghe-thuat",
      title: "Ngày Hội Gia Đình & Trình Diễn Diều Khổng Lồ Trên Biển 2026",
      cover_image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Không gian vui chơi cuối tuần cho bé và gia đình với hơn 50 cánh diều nghệ thuật khổng lồ và khu trò chơi cát.",
      description:
        "Sự kiện quy tụ các câu lạc bộ diều nghệ thuật với những cánh diều mô phỏng sinh vật biển dài hơn 15m bay lượn trên bầu trời Đà Nẵng.",
      category: "FAMILY",
      start_time: danangDateTime(offsetToSat + 7, 15, 0),
      end_time: danangDateTime(offsetToSat + 8, 18, 30),
      is_all_day: false,
      location_name: "Bãi biển Phạm Văn Đồng",
      address: "Ngã ba Phạm Văn Đồng – Võ Nguyên Giáp",
      district: "Sơn Trà",
      latitude: 16.0715,
      longitude: 108.2452,
      ticket_type: "FREE_REGISTRATION",
      ticket_price_display: "Miễn phí cho gia đình đăng ký trước",
      ticket_url: "https://danangfantasticity.com/ngay-hoi-gia-dinh",
      registration_deadline: danangDateTime(offsetToSat + 5, 18, 0),
      organizer_name: "Cộng đồng Gia đình Trẻ Đà Nẵng",
      organizer_contact: "0914 222 333 · familyfest@dananggo.vn",
      source_url: "https://danangfantasticity.com",
      is_featured: false,
      status: "POSTPONED",
      reschedule_notice:
        "Thông báo tạm hoãn: Sự kiện tạm thời hoãn tổ chức để nâng cấp khu vực sân bãi và kiểm tra an toàn gió biển. Cổng đăng ký tạm đóng và thời gian tổ chức mới sẽ được thông báo sớm nhất.",
    },
    {
      slug: "le-hoi-phao-hoa-va-trinh-dien-anh-sang-ba-na",
      title: "Lễ Hội Hóa Trang Carnival & Vũ Hội Ánh Sáng Sun World Bà Nà Hills",
      cover_image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Đoàn diễu hành Carnival rực rỡ sắc màu châu Âu tại Quảng trường Nhật Thực và Làng Pháp trên đỉnh Bà Nà.",
      description:
        "Thưởng thức lễ hội Carnival quy mô lớn với sự tham gia của hơn 100 nghệ sĩ quốc tế tại Làng Pháp và Quảng trường Nhật Thực.",
      category: "FESTIVAL",
      start_time: danangDateTime(offsetToSat, 10, 0),
      end_time: danangDateTime(offsetToSat + 1, 16, 30),
      is_all_day: false,
      location_name: "Sun World Bà Nà Hills",
      address: "Thôn An Sơn, Xã Hòa Ninh",
      district: "Hòa Vang",
      latitude: 15.9977,
      longitude: 107.9881,
      ticket_type: "PAID",
      ticket_price_display: "Từ 600.000đ (Theo vé cáp treo)",
      ticket_url: "https://sunworld.vn/ba-na-hills",
      registration_deadline: null,
      organizer_name: "Sun World Bà Nà Hills",
      organizer_contact: "0236 374 9888 · banahills@sunworld.vn",
      source_url: "https://sunworld.vn/ba-na-hills",
      is_featured: true,
      status: "PUBLISHED",
      reschedule_notice: null,
    },
    {
      slug: "workshop-nhiep-anh-san-may-dinh-ban-co-da-huy",
      title: "Workshop Nhiếp Ảnh Đường Phố & Săn Mây Bình Minh Đỉnh Bàn Cờ",
      cover_image:
        "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Buổi thực hành chụp ảnh phong cảnh bình minh trên đỉnh Bàn Cờ — Bán đảo Sơn Trà (Sự kiện đã hủy).",
      description:
        "Chương trình dự kiến tổ chức cho các thành viên yêu thích nhiếp ảnh phong cảnh cùng nhau đón bình minh trên Đỉnh Bàn Cờ.",
      category: "WORKSHOP",
      start_time: danangDateTime(offsetToSat, 5, 0),
      end_time: danangDateTime(offsetToSat, 8, 30),
      is_all_day: false,
      location_name: "Đỉnh Bàn Cờ — Bán đảo Sơn Trà",
      address: "Bán đảo Sơn Trà, Phường Thọ Quang",
      district: "Sơn Trà",
      latitude: 16.1185,
      longitude: 108.2615,
      ticket_type: "FREE_REGISTRATION",
      ticket_price_display: "Miễn phí (Cần đăng ký trước)",
      ticket_url: "https://danangfantasticity.com/dang-ky-san-may",
      registration_deadline: danangDateTime(offsetToSat - 1, 18, 0),
      organizer_name: "Hội Nhiếp ảnh Du lịch Đà Nẵng",
      organizer_contact: "0905 111 999 · photo@dananggo.vn",
      source_url: "https://danangfantasticity.com",
      is_featured: false,
      status: "CANCELLED",
      reschedule_notice:
        "Thông báo hủy sự kiện: Do tuyến đường lên Đỉnh Bàn Cờ đang tạm phong tỏa để bảo trì taluy và sương mù dày đặc hạn chế tầm nhìn, Ban tổ chức rất tiếc phải hủy buổi workshop này. Các bạn đã đăng ký sẽ được ưu tiên giữ chỗ cho đợt tiếp theo.",
    },
    {
      slug: "ban-nhap-le-hoi-dua-thuyen-song-han",
      title: "Bản nháp: Giải Đua Thuyền Truyền Thống Sông Hàn Mở Rộng",
      cover_image:
        "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=90&auto=format&fit=crop",
      short_description:
        "Sự kiện đang ở trạng thái bản nháp (chỉ dành cho Admin).",
      description: "Bản nháp nội bộ, chưa công bố ra trang công khai.",
      category: "FESTIVAL",
      start_time: danangDateTime(offsetToSat, 7, 30),
      end_time: danangDateTime(offsetToSat, 11, 30),
      is_all_day: false,
      location_name: "Bến du thuyền Sông Hàn",
      address: "Đường Bạch Đằng",
      district: "Hải Châu",
      latitude: 16.0678,
      longitude: 108.2244,
      ticket_type: "FREE_OPEN",
      ticket_price_display: "Miễn phí",
      ticket_url: null,
      registration_deadline: null,
      organizer_name: "Sở Văn hóa và Thể thao Đà Nẵng",
      organizer_contact: null,
      source_url: null,
      is_featured: false,
      status: "DRAFT",
      reschedule_notice: null,
    },
  ];

  for (const s of samples) {
    await pool
      .request()
      .input("slug", sql.VarChar(180), s.slug)
      .input("title", sql.NVarChar(200), s.title)
      .input("cover_image", sql.NVarChar(500), s.cover_image)
      .input("short_description", sql.NVarChar(500), s.short_description)
      .input("description", sql.NVarChar(sql.MAX), s.description)
      .input("category", sql.VarChar(40), s.category)
      .input("start_time", sql.VarChar(30), s.start_time)
      .input("end_time", sql.VarChar(30), s.end_time)
      .input("is_all_day", sql.Bit, s.is_all_day)
      .input("location_name", sql.NVarChar(200), s.location_name)
      .input("address", sql.NVarChar(300), s.address)
      .input("district", sql.NVarChar(100), s.district)
      .input("latitude", sql.Decimal(9, 6), s.latitude)
      .input("longitude", sql.Decimal(9, 6), s.longitude)
      .input("ticket_type", sql.VarChar(30), s.ticket_type)
      .input("ticket_price_display", sql.NVarChar(100), s.ticket_price_display)
      .input("ticket_url", sql.NVarChar(500), s.ticket_url)
      .input("registration_deadline", sql.VarChar(30), s.registration_deadline)
      .input("organizer_name", sql.NVarChar(200), s.organizer_name)
      .input("organizer_contact", sql.NVarChar(255), s.organizer_contact)
      .input("source_url", sql.NVarChar(500), s.source_url)
      .input("is_featured", sql.Bit, s.is_featured)
      .input("status", sql.VarChar(20), s.status)
      .input("reschedule_notice", sql.NVarChar(500), s.reschedule_notice)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.events WHERE slug = @slug)
        INSERT INTO dbo.events (
          slug, title, cover_image, short_description, description, category,
          start_time, end_time, is_all_day, location_name, address, district,
          latitude, longitude, ticket_type, ticket_price_display, ticket_url,
          registration_deadline, organizer_name, organizer_contact, source_url,
          is_featured, status, reschedule_notice, updated_at
        )
        VALUES (
          @slug, @title, @cover_image, @short_description, @description, @category,
          CAST(@start_time AS DATETIME2), CAST(@end_time AS DATETIME2), @is_all_day,
          @location_name, @address, @district, @latitude, @longitude, @ticket_type,
          @ticket_price_display, @ticket_url, CAST(@registration_deadline AS DATETIME2),
          @organizer_name, @organizer_contact, @source_url, @is_featured, @status,
          @reschedule_notice, SYSUTCDATETIME()
        )
      `);
  }
}

async function seedInitialSubmissions(): Promise<void> {
  const pool = getPool();
  const { offsetToSat, danangDateTime } = getDanangWallClockNow();
  const submissions = [
    {
      title: "Đêm Hội Đèn Hoa Đăng & Hát Bài Chòi Ven Sông Hàn",
      organizer_name: "CLB Văn Hóa Dân Gian Xứ Quảng",
      organizer_contact: "0905 321 654 · baichoidanang@gmail.com",
      category: "FESTIVAL",
      short_description:
        "Trải nghiệm thả đèn hoa đăng và nghe hô hát Bài Chòi di sản văn hóa phi vật thể bên bờ Tây cầu Rồng.",
      description:
        "Sự kiện cộng đồng miễn phí dành cho du khách và người dân thành phố Đà Nẵng mỗi tối cuối tuần.",
      location_name: "Bờ Tây Cầu Rồng (Đối diện Bảo tàng Chăm)",
      address: "Đường Bạch Đằng, Quận Hải Châu",
      district: "Hải Châu",
      start_time: danangDateTime(offsetToSat + 7, 19, 0),
      end_time: danangDateTime(offsetToSat + 7, 21, 30),
      source_url: "https://danangfantasticity.com",
      cover_image:
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=85&auto=format&fit=crop",
      status: "PENDING",
    },
    {
      title: "Phiên Chợ Xanh Nông Sản & Đồ Thủ Công Hòa Vang",
      organizer_name: "Hợp tác xã Du lịch Sinh thái Hòa Vang",
      organizer_contact: "0935 777 888 · nongsanhoavang@danang.vn",
      category: "FOOD",
      short_description:
        "Phiên chợ cuối tuần giới thiệu nông sản sạch, trà hoa quả và các món bánh quê truyền thống Hòa Vang.",
      description:
        "Du khách được thưởng thức miễn phí các món bánh quê và mua sắm quà lưu niệm thủ công thân thiện môi trường.",
      location_name: "Không gian Văn hóa Hòa Vang",
      address: "Quốc lộ 14B, Xã Hòa Phong, Huyện Hòa Vang",
      district: "Hòa Vang",
      start_time: danangDateTime(offsetToSat + 8, 7, 30),
      end_time: danangDateTime(offsetToSat + 8, 17, 0),
      source_url: "https://danangfantasticity.com",
      cover_image:
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&q=85&auto=format&fit=crop",
      status: "PENDING",
    },
  ];

  for (const sub of submissions) {
    await pool
      .request()
      .input("title", sql.NVarChar(200), sub.title)
      .input("organizer_name", sql.NVarChar(200), sub.organizer_name)
      .input("organizer_contact", sql.NVarChar(255), sub.organizer_contact)
      .input("category", sql.VarChar(40), sub.category)
      .input("short_description", sql.NVarChar(500), sub.short_description)
      .input("description", sql.NVarChar(sql.MAX), sub.description)
      .input("location_name", sql.NVarChar(200), sub.location_name)
      .input("address", sql.NVarChar(300), sub.address)
      .input("district", sql.NVarChar(100), sub.district)
      .input("start_time", sql.VarChar(30), sub.start_time)
      .input("end_time", sql.VarChar(30), sub.end_time)
      .input("source_url", sql.NVarChar(500), sub.source_url)
      .input("cover_image", sql.NVarChar(500), sub.cover_image)
      .input("status", sql.VarChar(20), sub.status)
      .query(`
        INSERT INTO dbo.event_submissions (
          title, organizer_name, organizer_contact, category, short_description,
          description, location_name, address, district, start_time, end_time,
          source_url, cover_image, status
        )
        VALUES (
          @title, @organizer_name, @organizer_contact, @category, @short_description,
          @description, @location_name, @address, @district,
          CAST(@start_time AS DATETIME2), CAST(@end_time AS DATETIME2),
          @source_url, @cover_image, @status
        )
      `);
  }
}

async function generateUniqueSlug(
  title: string,
  excludeEventId?: number,
): Promise<string> {
  const base = slugifyVietnamese(title);
  const pool = getPool();
  const check = await pool
    .request()
    .input("slug", sql.VarChar(180), base)
    .input("excludeId", sql.Int, excludeEventId ?? 0)
    .query<{ event_id: number }>(
      "SELECT event_id FROM dbo.events WHERE slug = @slug AND event_id <> @excludeId",
    );
  if (!check.recordset.length) return base;
  const suffix = randomBytes(2).toString("hex");
  return `${base.slice(0, 160)}-${suffix}`;
}

async function verifyPlaceExistsIfProvided(placeId?: number | null) {
  if (!placeId) return;
  const res = await getPool()
    .request()
    .input("placeId", sql.Int, placeId)
    .query<{ place_id: number }>(
      "SELECT place_id FROM dbo.places WHERE place_id = @placeId",
    );
  if (!res.recordset.length) {
    throw new EventError(400, "Địa điểm đã chọn không tồn tại.", [
      { path: ["place_id"], message: "Địa điểm đã chọn không tồn tại trong hệ thống." },
    ]);
  }
}

// ============================================================================
// PUBLIC EVENTS API (/api/events)
// ============================================================================

const sampleEventSlugs = new Set([
  "le-hoi-am-thuc-va-bia-thu-cong-song-han",
  "workshop-lam-den-long-va-gom-thu-cong-apec",
  "dem-nhac-acoustic-sunset-bien-my-khe",
  "trien-lam-nghe-thuat-anh-sang-di-san-cham-pa",
  "giai-chay-marathon-cung-duong-bien-son-tra",
  "ngay-hoi-gia-dinh-va-tha-dieu-nghe-thuat",
  "le-hoi-phao-hoa-va-trinh-dien-anh-sang-ba-na",
  "workshop-nhiep-anh-san-may-dinh-ban-co-da-huy",
  "ban-nhap-le-hoi-dua-thuyen-song-han",
]);

export async function listPublicEvents(): Promise<EventRecord[]> {
  await ensureEventsSchemaAndSeed();
  const res = await getPool().request().query(`
    SELECT ${EVENT_SELECT_COLUMNS}
    FROM dbo.events AS e
    WHERE e.status NOT IN ('DRAFT', 'CANCELLED')
    ORDER BY e.is_featured DESC, e.start_time ASC, e.event_id DESC
  `);
  return res.recordset.map(mapEventRow);
}

/** Chat recommendations exclude built-in examples whose dates roll with the seed. */
export async function listPublicEventsForChat(): Promise<EventRecord[]> {
  return (await listPublicEvents()).filter(event => !sampleEventSlugs.has(event.slug));
}

export async function getPublicEventByIdOrSlug(
  idOrSlug: string,
): Promise<EventRecord | null> {
  await ensureEventsSchemaAndSeed();
  const clean = idOrSlug.trim();
  const isNumericId = /^[1-9]\d*$/.test(clean) && Number(clean) <= 2147483647;
  const req = getPool().request().input("slug", sql.VarChar(180), clean);
  if (isNumericId) req.input("id", sql.Int, Number(clean));

  const res = await req.query(`
    SELECT TOP (1) ${EVENT_SELECT_COLUMNS}
    FROM dbo.events AS e
    WHERE ${isNumericId ? "(e.event_id = @id OR e.slug = @slug)" : "e.slug = @slug"}
  `);

  const row = res.recordset[0];
  if (!row) return null;
  const mapped = mapEventRow(row);
  // Bản nháp (DRAFT) không cho phép người dùng công khai truy cập
  if (mapped.status === "DRAFT") {
    throw new EventError(403, "Sự kiện này đang ở trạng thái bản nháp.");
  }
  return mapped;
}

// ============================================================================
// ADMIN EVENTS API (/api/admin/events)
// ============================================================================

export async function listAdminEvents(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await ensureEventsSchemaAndSeed();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 10));
  const offset = (page - 1) * limit;
  const statusFilter =
    params.status && params.status !== "ALL" ? params.status.toUpperCase() : null;

  const pool = getPool();
  const countReq = pool.request();
  if (statusFilter) countReq.input("status", sql.VarChar(20), statusFilter);
  const countRes = await countReq.query<{ total: number }>(`
    SELECT COUNT(*) AS total
    FROM dbo.events
    ${statusFilter ? "WHERE status = @status" : ""}
  `);
  const total = countRes.recordset[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listReq = pool
    .request()
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit);
  if (statusFilter) listReq.input("status", sql.VarChar(20), statusFilter);

  const listRes = await listReq.query(`
    SELECT ${EVENT_SELECT_COLUMNS}
    FROM dbo.events AS e
    ${statusFilter ? "WHERE e.status = @status" : ""}
    ORDER BY e.updated_at DESC, e.event_id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    items: listRes.recordset.map(mapEventRow),
    total,
    limit,
    page,
    total_pages: totalPages,
    totalPages,
  };
}

export async function getAdminEventById(id: number): Promise<EventRecord> {
  await ensureEventsSchemaAndSeed();
  const res = await getPool()
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT ${EVENT_SELECT_COLUMNS}
      FROM dbo.events AS e
      WHERE e.event_id = @id
    `);
  const row = res.recordset[0];
  if (!row) throw new EventError(404, "Không tìm thấy sự kiện.");
  return mapEventRow(row);
}

export async function createAdminEvent(
  input: EventInputPayload,
  userId?: number,
): Promise<EventRecord> {
  await ensureEventsSchemaAndSeed();
  const targetStatus: EventStatus = input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const issues = validateEventPublishRequirements(input, targetStatus);
  if (issues.length > 0) {
    throw new EventError(400, issues[0]!.message, issues);
  }
  await verifyPlaceExistsIfProvided(input.place_id);

  const slug = await generateUniqueSlug(input.title);
  const startTime = toDanangSqlDateTimeString(input.start_time ?? null);
  const endTime = toDanangSqlDateTimeString(input.end_time ?? null);
  const regDeadline = toDanangSqlDateTimeString(input.registration_deadline ?? null);

  const res = await getPool()
    .request()
    .input("slug", sql.VarChar(180), slug)
    .input("title", sql.NVarChar(200), input.title)
    .input("cover_image", sql.NVarChar(500), input.cover_image ?? null)
    .input("short_description", sql.NVarChar(500), input.short_description ?? null)
    .input("description", sql.NVarChar(sql.MAX), input.description ?? null)
    .input("category", sql.VarChar(40), input.category ?? null)
    .input("start_time", sql.VarChar(30), startTime)
    .input("end_time", sql.VarChar(30), endTime)
    .input("is_all_day", sql.Bit, Boolean(input.is_all_day))
    .input("place_id", sql.Int, input.place_id ?? null)
    .input("location_name", sql.NVarChar(200), input.location_name ?? null)
    .input("address", sql.NVarChar(300), input.address ?? null)
    .input("district", sql.NVarChar(100), input.district ?? null)
    .input("latitude", sql.Decimal(9, 6), input.latitude ?? null)
    .input("longitude", sql.Decimal(9, 6), input.longitude ?? null)
    .input("ticket_type", sql.VarChar(30), input.ticket_type ?? "FREE_OPEN")
    .input("ticket_price_display", sql.NVarChar(100), input.ticket_price_display ?? null)
    .input("ticket_url", sql.NVarChar(500), input.ticket_url ?? null)
    .input("registration_deadline", sql.VarChar(30), regDeadline)
    .input("organizer_name", sql.NVarChar(200), input.organizer_name ?? null)
    .input("organizer_contact", sql.NVarChar(255), input.organizer_contact ?? null)
    .input("source_url", sql.NVarChar(500), input.source_url ?? null)
    .input("is_featured", sql.Bit, Boolean(input.is_featured))
    .input("status", sql.VarChar(20), targetStatus)
    .input("created_by", sql.Int, userId ?? null)
    .query<{ event_id: number }>(`
      INSERT INTO dbo.events (
        slug, title, cover_image, short_description, description, category,
        start_time, end_time, is_all_day, place_id, location_name, address,
        district, latitude, longitude, ticket_type, ticket_price_display,
        ticket_url, registration_deadline, organizer_name, organizer_contact,
        source_url, is_featured, status, created_by, created_at, updated_at
      )
      OUTPUT INSERTED.event_id
      VALUES (
        @slug, @title, @cover_image, @short_description, @description, @category,
        CAST(@start_time AS DATETIME2), CAST(@end_time AS DATETIME2), @is_all_day,
        @place_id, @location_name, @address, @district, @latitude, @longitude,
        @ticket_type, @ticket_price_display, @ticket_url,
        CAST(@registration_deadline AS DATETIME2), @organizer_name, @organizer_contact,
        @source_url, @is_featured, @status, @created_by, SYSUTCDATETIME(), SYSUTCDATETIME()
      )
    `);

  return getAdminEventById(res.recordset[0]!.event_id);
}

export async function updateAdminEvent(
  id: number,
  input: EventInputPayload,
): Promise<EventRecord> {
  const existing = await getAdminEventById(id);
  const issues = validateEventPublishRequirements(input, existing.status);
  if (issues.length > 0) {
    throw new EventError(400, issues[0]!.message, issues);
  }
  await verifyPlaceExistsIfProvided(input.place_id);

  // Nếu sự kiện đã công bố (khác DRAFT), khóa lịch trực tiếp qua PUT (phải dùng PATCH /:id/status để đổi lịch kèm ghi chú)
  const startTime =
    existing.status === "DRAFT"
      ? toDanangSqlDateTimeString(input.start_time ?? null)
      : existing.start_time;
  const endTime =
    existing.status === "DRAFT"
      ? toDanangSqlDateTimeString(input.end_time ?? null)
      : existing.end_time;
  const regDeadline = toDanangSqlDateTimeString(input.registration_deadline ?? null);

  await getPool()
    .request()
    .input("id", sql.Int, id)
    .input("title", sql.NVarChar(200), input.title)
    .input("cover_image", sql.NVarChar(500), input.cover_image ?? null)
    .input("short_description", sql.NVarChar(500), input.short_description ?? null)
    .input("description", sql.NVarChar(sql.MAX), input.description ?? null)
    .input("category", sql.VarChar(40), input.category ?? null)
    .input("start_time", sql.VarChar(30), startTime)
    .input("end_time", sql.VarChar(30), endTime)
    .input("is_all_day", sql.Bit, Boolean(input.is_all_day))
    .input("place_id", sql.Int, input.place_id ?? null)
    .input("location_name", sql.NVarChar(200), input.location_name ?? null)
    .input("address", sql.NVarChar(300), input.address ?? null)
    .input("district", sql.NVarChar(100), input.district ?? null)
    .input("latitude", sql.Decimal(9, 6), input.latitude ?? null)
    .input("longitude", sql.Decimal(9, 6), input.longitude ?? null)
    .input("ticket_type", sql.VarChar(30), input.ticket_type ?? "FREE_OPEN")
    .input("ticket_price_display", sql.NVarChar(100), input.ticket_price_display ?? null)
    .input("ticket_url", sql.NVarChar(500), input.ticket_url ?? null)
    .input("registration_deadline", sql.VarChar(30), regDeadline)
    .input("organizer_name", sql.NVarChar(200), input.organizer_name ?? null)
    .input("organizer_contact", sql.NVarChar(255), input.organizer_contact ?? null)
    .input("source_url", sql.NVarChar(500), input.source_url ?? null)
    .input("is_featured", sql.Bit, Boolean(input.is_featured))
    .query(`
      UPDATE dbo.events
      SET
        title = @title,
        cover_image = @cover_image,
        short_description = @short_description,
        description = @description,
        category = @category,
        start_time = CAST(@start_time AS DATETIME2),
        end_time = CAST(@end_time AS DATETIME2),
        is_all_day = @is_all_day,
        place_id = @place_id,
        location_name = @location_name,
        address = @address,
        district = @district,
        latitude = @latitude,
        longitude = @longitude,
        ticket_type = @ticket_type,
        ticket_price_display = @ticket_price_display,
        ticket_url = @ticket_url,
        registration_deadline = CAST(@registration_deadline AS DATETIME2),
        organizer_name = @organizer_name,
        organizer_contact = @organizer_contact,
        source_url = @source_url,
        is_featured = @is_featured,
        updated_at = SYSUTCDATETIME()
      WHERE event_id = @id
    `);

  return getAdminEventById(id);
}

export async function changeAdminEventStatus(
  id: number,
  patch: StatusPatchPayload,
): Promise<EventRecord> {
  const existing = await getAdminEventById(id);

  if (existing.status === "CANCELLED") {
    throw new EventError(
      400,
      "Sự kiện đã hủy không thể đổi lịch, tạm hoãn hoặc đăng lại.",
    );
  }

  if (patch.status === "PUBLISHED") {
    const issues = validateEventPublishRequirements(
      {
        title: existing.title,
        cover_image: existing.cover_image,
        short_description: existing.short_description,
        description: existing.description,
        category: existing.category,
        start_time: existing.start_time,
        end_time: existing.end_time,
        is_all_day: existing.is_all_day,
        place_id: existing.place_id,
        location_name: existing.location_name,
        address: existing.address,
        district: existing.district,
        latitude: existing.latitude,
        longitude: existing.longitude,
        ticket_type: existing.ticket_type as any,
        ticket_price_display: existing.ticket_price_display,
        ticket_url: existing.ticket_url,
        registration_deadline: existing.registration_deadline,
        organizer_name: existing.organizer_name,
        organizer_contact: existing.organizer_contact,
        source_url: existing.source_url,
        is_featured: existing.is_featured,
        status: "PUBLISHED",
      },
      "PUBLISHED",
    );
    if (issues.length > 0) {
      throw new EventError(400, issues[0]!.message, issues);
    }
  } else {
    // RESCHEDULED, POSTPONED, CANCELLED chỉ áp dụng khi sự kiện đã công bố (khác DRAFT)
    if (existing.status === "DRAFT") {
      throw new EventError(
        400,
        "Vui lòng đăng sự kiện trước khi đổi lịch, tạm hoãn hoặc hủy.",
      );
    }
    if (patch.status === "POSTPONED" && existing.status === "POSTPONED") {
      throw new EventError(400, "Sự kiện hiện đang ở trạng thái tạm hoãn.");
    }
    if (!patch.reschedule_notice?.trim()) {
      throw new EventError(400, "Vui lòng nhập ghi chú thay đổi cho người tham dự.", [
        {
          path: ["reschedule_notice"],
          message: "Vui lòng nhập ghi chú để người xem biết lý do.",
        },
      ]);
    }
  }

  let nextStart = existing.start_time;
  let nextEnd = existing.end_time;

  if (patch.status === "RESCHEDULED") {
    const startMs = parseDanangDateTimeToMs(patch.start_time ?? null);
    const endMs = parseDanangDateTimeToMs(patch.end_time ?? null);
    if (startMs === null) {
      throw new EventError(400, "Vui lòng chọn thời gian bắt đầu mới.", [
        { path: ["start_time"], message: "Vui lòng chọn thời gian bắt đầu mới." },
      ]);
    }
    if (endMs === null) {
      throw new EventError(400, "Vui lòng chọn thời gian kết thúc mới.", [
        { path: ["end_time"], message: "Vui lòng chọn thời gian kết thúc mới." },
      ]);
    }
    if (endMs <= startMs) {
      throw new EventError(400, "Giờ kết thúc phải sau giờ bắt đầu.", [
        { path: ["end_time"], message: "Giờ kết thúc phải sau giờ bắt đầu." },
      ]);
    }
    nextStart = toDanangSqlDateTimeString(patch.start_time ?? null);
    nextEnd = toDanangSqlDateTimeString(patch.end_time ?? null);
  }

  await getPool()
    .request()
    .input("id", sql.Int, id)
    .input("status", sql.VarChar(20), patch.status)
    .input("start_time", sql.VarChar(30), nextStart)
    .input("end_time", sql.VarChar(30), nextEnd)
    .input(
      "notice",
      sql.NVarChar(500),
      patch.reschedule_notice?.trim() ?? existing.reschedule_notice ?? null,
    )
    .query(`
      UPDATE dbo.events
      SET
        status = @status,
        start_time = CAST(@start_time AS DATETIME2),
        end_time = CAST(@end_time AS DATETIME2),
        reschedule_notice = @notice,
        updated_at = SYSUTCDATETIME()
      WHERE event_id = @id
    `);

  return getAdminEventById(id);
}

// ============================================================================
// ADMIN EVENT SUBMISSIONS API (/api/admin/event-submissions)
// ============================================================================

function mapSubmissionRow(row: Record<string, any>): SubmissionRecord {
  return {
    submission_id: Number(row.submission_id),
    title: String(row.title ?? ""),
    organizer_name: String(row.organizer_name ?? ""),
    organizer_contact: row.organizer_contact ?? null,
    category: row.category ?? "FESTIVAL",
    short_description: row.short_description ?? null,
    description: row.description ?? null,
    location_name: row.location_name ?? null,
    address: row.address ?? null,
    district: row.district ?? null,
    start_time: formatSqlDateForJson(row.start_time),
    end_time: formatSqlDateForJson(row.end_time),
    source_url: row.source_url ?? null,
    cover_image: row.cover_image ?? null,
    status: String(row.status ?? "PENDING") as SubmissionStatus,
    rejection_reason: row.rejection_reason ?? null,
    submitted_at:
      formatSqlDateForJson(row.submitted_at) ?? new Date().toISOString().slice(0, 19),
  };
}

export async function listEventSubmissions(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await ensureEventsSchemaAndSeed();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(params.limit) || 20));
  const offset = (page - 1) * limit;
  const status = (params.status || "PENDING").toUpperCase();

  const pool = getPool();
  const countRes = await pool
    .request()
    .input("status", sql.VarChar(20), status)
    .query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM dbo.event_submissions WHERE status = @status",
    );
  const total = countRes.recordset[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listRes = await pool
    .request()
    .input("status", sql.VarChar(20), status)
    .input("offset", sql.Int, offset)
    .input("limit", sql.Int, limit)
    .query(`
      SELECT
        submission_id,
        title,
        organizer_name,
        status,
        CONVERT(VARCHAR(19), submitted_at, 126) AS submitted_at
      FROM dbo.event_submissions
      WHERE status = @status
      ORDER BY submitted_at DESC, submission_id DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  return {
    items: listRes.recordset.map((r) => ({
      submission_id: Number(r.submission_id),
      title: String(r.title ?? ""),
      organizer_name: String(r.organizer_name ?? ""),
      status: String(r.status ?? "PENDING") as SubmissionStatus,
      submitted_at:
        formatSqlDateForJson(r.submitted_at) ?? new Date().toISOString().slice(0, 19),
    })),
    total,
    limit,
    page,
    total_pages: totalPages,
    totalPages,
  };
}

export async function getEventSubmissionById(
  id: number,
): Promise<SubmissionRecord> {
  await ensureEventsSchemaAndSeed();
  const res = await getPool()
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        submission_id,
        title,
        organizer_name,
        organizer_contact,
        category,
        short_description,
        description,
        location_name,
        address,
        district,
        CONVERT(VARCHAR(19), start_time, 126) AS start_time,
        CONVERT(VARCHAR(19), end_time, 126) AS end_time,
        source_url,
        cover_image,
        status,
        rejection_reason,
        CONVERT(VARCHAR(19), submitted_at, 126) AS submitted_at
      FROM dbo.event_submissions
      WHERE submission_id = @id
    `);
  const row = res.recordset[0];
  if (!row) throw new EventError(404, "Không tìm thấy đề xuất sự kiện.");
  return mapSubmissionRow(row);
}

export async function reviewEventSubmission(
  id: number,
  decision: "APPROVED" | "REJECTED",
  rejectionReason?: string,
  reviewerUserId?: number,
): Promise<{ submission: SubmissionRecord; createdEventId?: number }> {
  await ensureEventsSchemaAndSeed();
  const sub = await getEventSubmissionById(id);
  if (sub.status !== "PENDING") {
    throw new EventError(409, "Đề xuất này đã được xử lý trước đó.");
  }

  const pool = getPool();
  let createdEventId: number | undefined;

  if (decision === "APPROVED") {
    // Khi Admin duyệt đề xuất, tự động tạo một bản nháp sự kiện (DRAFT) trong dbo.events để Admin kiểm tra và công bố
    const slug = await generateUniqueSlug(sub.title);
    const evInsert = await pool
      .request()
      .input("slug", sql.VarChar(180), slug)
      .input("title", sql.NVarChar(200), sub.title)
      .input("cover_image", sql.NVarChar(500), sub.cover_image)
      .input(
        "short_description",
        sql.NVarChar(500),
        sub.short_description ?? sub.description?.slice(0, 280) ?? sub.title,
      )
      .input("description", sql.NVarChar(sql.MAX), sub.description)
      .input("category", sql.VarChar(40), sub.category ?? "FESTIVAL")
      .input("start_time", sql.VarChar(30), sub.start_time)
      .input("end_time", sql.VarChar(30), sub.end_time)
      .input("location_name", sql.NVarChar(200), sub.location_name)
      .input("address", sql.NVarChar(300), sub.address)
      .input("district", sql.NVarChar(100), sub.district ?? "Hải Châu")
      .input("organizer_name", sql.NVarChar(200), sub.organizer_name)
      .input("organizer_contact", sql.NVarChar(255), sub.organizer_contact)
      .input("source_url", sql.NVarChar(500), sub.source_url)
      .input("created_by", sql.Int, reviewerUserId ?? null)
      .query<{ event_id: number }>(`
        INSERT INTO dbo.events (
          slug, title, cover_image, short_description, description, category,
          start_time, end_time, is_all_day, location_name, address, district,
          ticket_type, organizer_name, organizer_contact, source_url,
          is_featured, status, created_by, created_at, updated_at
        )
        OUTPUT INSERTED.event_id
        VALUES (
          @slug, @title, @cover_image, @short_description, @description, @category,
          CAST(@start_time AS DATETIME2), CAST(@end_time AS DATETIME2), 0,
          @location_name, @address, @district, 'FREE_OPEN',
          @organizer_name, @organizer_contact, @source_url,
          0, 'DRAFT', @created_by, SYSUTCDATETIME(), SYSUTCDATETIME()
        )
      `);
    createdEventId = evInsert.recordset[0]?.event_id;
  }

  await pool
    .request()
    .input("id", sql.Int, id)
    .input("status", sql.VarChar(20), decision)
    .input(
      "reason",
      sql.NVarChar(500),
      decision === "REJECTED" ? rejectionReason?.trim() ?? null : null,
    )
    .input("eventId", sql.Int, createdEventId ?? null)
    .input("reviewerId", sql.Int, reviewerUserId ?? null)
    .query(`
      UPDATE dbo.event_submissions
      SET
        status = @status,
        rejection_reason = @reason,
        approved_event_id = @eventId,
        reviewed_by = @reviewerId,
        reviewed_at = SYSUTCDATETIME()
      WHERE submission_id = @id
    `);

  return {
    submission: await getEventSubmissionById(id),
    ...(createdEventId ? { createdEventId } : {}),
  };
}

// ============================================================================
// UPCOMING EVENT NOTIFICATIONS & REMINDERS (/api/events/upcoming-alerts, /:id/remind)
// ============================================================================

export interface UpcomingEventAlertItem extends EventRecord {
  startsInHours: number;
  isHappeningNow: boolean;
}

/**
 * Lấy danh sách các sự kiện đang diễn ra hoặc sắp diễn ra trong vòng `withinHours` giờ tới (mặc định 72 giờ)
 * theo đúng giờ Đà Nẵng (UTC+7).
 */
export async function listUpcomingEventAlerts(
  withinHours = 72,
): Promise<UpcomingEventAlertItem[]> {
  await ensureEventsSchemaAndSeed();
  const events = await listPublicEvents();
  const nowMs = Date.now();
  const windowEndMs = nowMs + Math.max(1, withinHours) * 3600 * 1000;

  const alerts: UpcomingEventAlertItem[] = [];
  for (const ev of events) {
    if (ev.status !== "PUBLISHED" && ev.status !== "RESCHEDULED") continue;
    const startMs = parseDanangDateTimeToMs(ev.start_time);
    const endMs = parseDanangDateTimeToMs(ev.end_time) ?? startMs;
    if (startMs === null || endMs === null) continue;

    // Sự kiện đang diễn ra (startMs <= nowMs <= endMs) hoặc sắp bắt đầu trong vòng withinHours tới
    const isHappeningNow = startMs <= nowMs && endMs >= nowMs;
    const isStartingSoon = startMs > nowMs && startMs <= windowEndMs;
    if (!isHappeningNow && !isStartingSoon) continue;

    const startsInHours = isHappeningNow
      ? 0
      : Math.max(1, Math.round((startMs - nowMs) / (3600 * 1000)));

    alerts.push({
      ...ev,
      startsInHours,
      isHappeningNow,
    });
  }

  return alerts.sort((a, b) => a.startsInHours - b.startsInHours);
}

/**
 * Đăng ký nhận nhắc lịch khi sự kiện sắp diễn ra (lưu vào dbo.event_reminders).
 */
export async function subscribeEventReminder(
  idOrSlug: string,
  input: EventReminderInput,
  authUserId?: number,
): Promise<{
  reminderId: number;
  eventId: number;
  eventTitle: string;
  maskedEmail: string;
  alreadySubscribed: boolean;
}> {
  await ensureEventsSchemaAndSeed();
  const event = await getPublicEventByIdOrSlug(idOrSlug);
  if (!event) throw new EventError(404, "Không tìm thấy sự kiện.");
  if (event.status === "CANCELLED" || event.status === "POSTPONED") {
    throw new EventError(
      400,
      "Sự kiện này đang tạm hoãn hoặc đã hủy, không thể đặt lịch nhắc.",
    );
  }

  const pool = getPool();
  let email = input.recipient_email?.trim() ?? "";
  let name = input.recipient_name?.trim() ?? "";

  if (authUserId && !email) {
    const uRes = await pool
      .request()
      .input("userId", sql.Int, authUserId)
      .query<{ email: string; full_name: string }>(
        "SELECT email, full_name FROM dbo.users WHERE user_id = @userId",
      );
    const u = uRes.recordset[0];
    if (u) {
      email = u.email;
      if (!name) name = u.full_name;
    }
  }

  if (!email) {
    throw new EventError(
      400,
      "Vui lòng nhập email hoặc đăng nhập để nhận thông báo nhắc lịch sự kiện.",
    );
  }

  const emailHash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  const masked = maskEmail(email);

  const existing = await pool
    .request()
    .input("eventId", sql.Int, event.event_id)
    .input("emailHash", sql.VarChar(64), emailHash)
    .query<{ reminder_id: number }>(
      "SELECT reminder_id FROM dbo.event_reminders WHERE event_id = @eventId AND email_hash = @emailHash",
    );

  if (existing.recordset[0]) {
    return {
      reminderId: existing.recordset[0].reminder_id,
      eventId: event.event_id,
      eventTitle: event.title,
      maskedEmail: masked,
      alreadySubscribed: true,
    };
  }

  const inserted = await pool
    .request()
    .input("eventId", sql.Int, event.event_id)
    .input("userId", sql.Int, authUserId ?? null)
    .input("email", sql.NVarChar(160), email)
    .input("emailHash", sql.VarChar(64), emailHash)
    .input("name", sql.NVarChar(120), name || "Bạn du khách")
    .query<{ reminder_id: number }>(`
      INSERT INTO dbo.event_reminders (
        event_id, user_id, recipient_email, email_hash, recipient_name, delivery_status
      )
      OUTPUT INSERTED.reminder_id
      VALUES (
        @eventId, @userId, @email, @emailHash, @name, 'PENDING'
      )
    `);

  return {
    reminderId: inserted.recordset[0]!.reminder_id,
    eventId: event.event_id,
    eventTitle: event.title,
    maskedEmail: masked,
    alreadySubscribed: false,
  };
}

// ============================================================================
// EXTENSION APIs FROM origin/feature/events-module (Home, Map, Nearby Places, Calendar/ICS, Delete)
// ============================================================================

export async function getHomeEventsSummary(limit = 4): Promise<{
  title: string;
  is_weekend: boolean;
  events: EventRecord[];
}> {
  const all = await listPublicEvents();
  const { offsetToSat, danangDateTime } = getDanangWallClockNow();
  const satStartMs = parseDanangDateTimeToMs(danangDateTime(offsetToSat, 0, 0)) ?? Date.now();
  const sunEndMs = parseDanangDateTimeToMs(danangDateTime(offsetToSat + 1, 23, 59)) ?? Date.now();
  const todayStartMs = parseDanangDateTimeToMs(danangDateTime(0, 0, 0)) ?? Date.now();

  const weekendEvents = all.filter((e) => {
    const s = parseDanangDateTimeToMs(e.start_time);
    const end = parseDanangDateTimeToMs(e.end_time) ?? s;
    if (s === null || end === null) return false;
    return s <= sunEndMs && end >= satStartMs;
  });

  if (weekendEvents.length > 0) {
    return {
      title: "Cuối tuần này ở Đà Nẵng",
      is_weekend: true,
      events: weekendEvents.slice(0, limit),
    };
  }

  const upcomingEvents = all.filter((e) => {
    const end = parseDanangDateTimeToMs(e.end_time ?? e.start_time);
    return end !== null && end >= todayStartMs;
  });

  return {
    title: "Sắp diễn ra ở Đà Nẵng",
    is_weekend: false,
    events: (upcomingEvents.length > 0 ? upcomingEvents : all).slice(0, limit),
  };
}

export async function listEventsForMap(): Promise<EventRecord[]> {
  const all = await listPublicEvents();
  return all.filter(
    (e) =>
      typeof e.latitude === "number" &&
      Number.isFinite(e.latitude) &&
      typeof e.longitude === "number" &&
      Number.isFinite(e.longitude),
  );
}

export interface NearbyPlaceItem {
  place_id: number;
  name: string;
  place_type: string;
  address: string | null;
  district: string | null;
  cover_image: string | null;
  avg_rating: number;
  latitude: number | null;
  longitude: number | null;
  distance_km: number;
  distance_meters: number;
}

export async function getNearbyPlacesForEvent(
  idOrSlug: string,
  radiusKm = 3,
  placeType?: string,
  limit = 6,
): Promise<NearbyPlaceItem[]> {
  const event = await getPublicEventByIdOrSlug(idOrSlug);
  if (!event) throw new EventError(404, "Không tìm thấy sự kiện.");
  if (event.latitude == null || event.longitude == null) {
    return [];
  }

  const safeRadius = Math.max(0.5, Math.min(25, Number(radiusKm) || 3));
  const safeLimit = Math.max(1, Math.min(20, Number(limit) || 6));
  const req = getPool()
    .request()
    .input("evLat", sql.Float, Number(event.latitude))
    .input("evLng", sql.Float, Number(event.longitude))
    .input("radiusKm", sql.Float, safeRadius)
    .input("limit", sql.Int, safeLimit);

  let typeFilter = "";
  if (placeType && placeType.trim()) {
    req.input("placeType", sql.VarChar(50), placeType.trim().toUpperCase());
    typeFilter = "AND p.place_type = @placeType";
  }

  const query = `
    WITH PlacesWithDistance AS (
      SELECT
        p.place_id,
        p.name,
        p.place_type,
        p.address,
        d.name AS district,
        (SELECT TOP 1 image_url FROM dbo.place_images WHERE place_id = p.place_id AND is_cover = 1) AS cover_image,
        ISNULL(CAST(p.avg_rating AS float), 0) AS avg_rating,
        CAST(p.latitude AS float) AS latitude,
        CAST(p.longitude AS float) AS longitude,
        ROUND(
          6371 * ACOS(
            CASE
              WHEN (
                COS(RADIANS(@evLat)) * COS(RADIANS(CAST(p.latitude AS float))) *
                COS(RADIANS(CAST(p.longitude AS float)) - RADIANS(@evLng)) +
                SIN(RADIANS(@evLat)) * SIN(RADIANS(CAST(p.latitude AS float)))
              ) > 1.0 THEN 1.0
              WHEN (
                COS(RADIANS(@evLat)) * COS(RADIANS(CAST(p.latitude AS float))) *
                COS(RADIANS(CAST(p.longitude AS float)) - RADIANS(@evLng)) +
                SIN(RADIANS(@evLat)) * SIN(RADIANS(CAST(p.latitude AS float)))
              ) < -1.0 THEN -1.0
              ELSE (
                COS(RADIANS(@evLat)) * COS(RADIANS(CAST(p.latitude AS float))) *
                COS(RADIANS(CAST(p.longitude AS float)) - RADIANS(@evLng)) +
                SIN(RADIANS(@evLat)) * SIN(RADIANS(CAST(p.latitude AS float)))
              )
            END
          ), 2
        ) AS distance_km
      FROM dbo.places p
      LEFT JOIN dbo.districts d ON d.district_id = p.district_id
      WHERE p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        ${typeFilter}
    )
    SELECT
      pwd.*,
      CAST(pwd.distance_km * 1000 AS INT) AS distance_meters
    FROM PlacesWithDistance pwd
    WHERE pwd.distance_km <= @radiusKm
    ORDER BY pwd.distance_km ASC, pwd.avg_rating DESC
    OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const result = await req.query<NearbyPlaceItem>(query);
  return result.recordset;
}

export async function generateEventIcs(
  idOrSlug: string,
): Promise<{ filename: string; content: string }> {
  const event = await getPublicEventByIdOrSlug(idOrSlug);
  if (!event) throw new EventError(404, "Không tìm thấy sự kiện để xuất lịch.");

  const formatIcsUtc = (ms: number | null): string => {
    const d = ms !== null ? new Date(ms) : new Date();
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const nowStr = formatIcsUtc(Date.now());
  const startMs = parseDanangDateTimeToMs(event.start_time);
  const endMs = parseDanangDateTimeToMs(event.end_time) ?? (startMs ? startMs + 2 * 3600 * 1000 : null);
  const startStr = formatIcsUtc(startMs);
  const endStr = formatIcsUtc(endMs);

  const escapeIcs = (str: string | null | undefined): string =>
    String(str ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const summary = escapeIcs(event.title);
  const description = escapeIcs(
    `${event.short_description ?? ""}\n\nVé tham dự: ${event.ticket_price_display ?? event.ticket_type}\nNguồn: ${event.source_url ?? "DaNangGo"}`,
  );
  const location = escapeIcs(
    [event.location_name, event.address, event.district, "Đà Nẵng"].filter(Boolean).join(", "),
  );
  const status = event.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED";

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DaNangGo//Events Module//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:dananggo-event-${event.event_id}@dananggo.vn`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:${status}`,
    `URL;VALUE=URI:https://dananggo.vn/su-kien/${event.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    filename: `dananggo-event-${event.slug || event.event_id}.ics`,
    content,
  };
}

export async function getEventCalendarLinks(idOrSlug: string) {
  const event = await getPublicEventByIdOrSlug(idOrSlug);
  if (!event) throw new EventError(404, "Không tìm thấy sự kiện.");

  const startMs = parseDanangDateTimeToMs(event.start_time) ?? Date.now();
  const endMs = parseDanangDateTimeToMs(event.end_time) ?? startMs + 2 * 3600 * 1000;
  const start = new Date(startMs);
  const end = new Date(endMs);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dates = `${fmt(start)}/${fmt(end)}`;
  const details = `${event.short_description ?? ""}\n\nVé: ${event.ticket_price_display ?? event.ticket_type}`;
  const location = [event.location_name, event.address, event.district, "Đà Nẵng"]
    .filter(Boolean)
    .join(", ");

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", event.title);
  googleUrl.searchParams.set("dates", dates);
  googleUrl.searchParams.set("details", details);
  googleUrl.searchParams.set("location", location);

  const outlookUrl = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  outlookUrl.searchParams.set("path", "/calendar/action/compose");
  outlookUrl.searchParams.set("rru", "addevent");
  outlookUrl.searchParams.set("subject", event.title);
  outlookUrl.searchParams.set("startdt", start.toISOString());
  outlookUrl.searchParams.set("enddt", end.toISOString());
  outlookUrl.searchParams.set("body", details);
  outlookUrl.searchParams.set("location", location);

  return {
    event_id: event.event_id,
    title: event.title,
    google_calendar_url: googleUrl.toString(),
    outlook_web_url: outlookUrl.toString(),
    ics_download_url: `/api/events/${encodeURIComponent(event.slug || String(event.event_id))}/calendar/ics`,
  };
}

export async function deleteAdminEvent(id: number): Promise<void> {
  await getAdminEventById(id);
  await getPool()
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM dbo.events WHERE event_id = @id");
}

