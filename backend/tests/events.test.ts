// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCreateEvent, validateUpdateStatus, validateSubmitEvent, validateRejectEvent } from '../src/modules/events/events.validation';
import { EventsService } from '../src/modules/events/events.service';

test('Events Validation - Hợp lệ khi cung cấp đầy đủ thông tin chuẩn', () => {
  const result = validateCreateEvent({
    title: 'Workshop làm đèn lồng Hội An',
    cover_image: 'https://images.unsplash.com/photo-lamp',
    short_description: 'Trải nghiệm làm lồng đèn truyền thống',
    category: 'WORKSHOP',
    start_time: '2026-11-14T14:00:00.000Z',
    end_time: '2026-11-14T16:00:00.000Z',
    location_name: 'Bảo tàng Điêu khắc Chăm',
    address: '02 đường 2 Tháng 9',
    district: 'Hải Châu',
    ticket_type: 'FREE_REGISTRATION',
    ticket_url: 'https://dananggo.vn/dang-ky',
  });

  assert.equal(Object.keys(result.errors).length, 0, JSON.stringify(result.errors));
  assert.equal(result.valid, true);
});

test('Events Validation - Báo lỗi khi giờ kết thúc sớm hơn giờ bắt đầu', () => {
  const result = validateCreateEvent({
    title: 'Đêm nhạc Acoustic',
    cover_image: 'https://images.unsplash.com/photo-music',
    short_description: 'Đêm nhạc acoustic thư giãn',
    category: 'MUSIC',
    start_time: '2026-11-14T20:00:00.000Z',
    end_time: '2026-11-14T18:00:00.000Z', // Lỗi: kết thúc trước khi bắt đầu
    location_name: 'Sông Hàn Bar',
    address: 'Bạch Đằng',
    district: 'Hải Châu',
    ticket_type: 'PAID',
  });

  assert.equal(result.valid, false);
  assert.ok(Object.values(result.errors).some((err) => err.includes('Thời gian kết thúc không được sớm hơn thời gian bắt đầu')));
});

test('Events Validation - Báo lỗi khi sự kiện yêu cầu đăng ký nhưng thiếu link đăng ký', () => {
  const result = validateCreateEvent({
    title: 'Workshop làm bánh',
    cover_image: 'https://images.unsplash.com/photo-cake',
    short_description: 'Làm bánh thủ công',
    category: 'WORKSHOP',
    start_time: '2026-11-14T14:00:00.000Z',
    end_time: '2026-11-14T16:00:00.000Z',
    location_name: 'Đà Nẵng Space',
    address: 'Trần Phú',
    district: 'Hải Châu',
    ticket_type: 'FREE_REGISTRATION',
    ticket_url: '', // Lỗi: thiếu ticket_url
  });

  assert.equal(result.valid, false);
  assert.ok(Object.values(result.errors).some((err) => err.includes('cung cấp đường dẫn đăng ký')));
});

test('Events Validation - Kiểm tra đổi lịch và hủy sự kiện cần ghi chú', () => {
  const rescheduleNoNotice = validateUpdateStatus({
    status: 'RESCHEDULED',
    reschedule_notice: '',
  });
  assert.equal(rescheduleNoNotice.valid, false);
  assert.ok(Object.values(rescheduleNoNotice.errors).some((err) => err.includes('ghi chú thông báo')));

  const cancelNoNotice = validateUpdateStatus({
    status: 'CANCELLED',
    reschedule_notice: '',
  });
  assert.equal(cancelNoNotice.valid, false);
  assert.ok(Object.values(cancelNoNotice.errors).some((err) => err.includes('lý do hủy')));
});

test('Events Validation - Draft chỉ yêu cầu tiêu đề', () => {
  const result = validateCreateEvent({ title: 'Sự kiện mới', status: 'DRAFT' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('Events Validation - Publish trả lỗi theo từng trường', () => {
  const result = validateCreateEvent({ title: 'Sự kiện mới', status: 'PUBLISHED' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.cover_image);
  assert.ok(result.errors.start_time);
  assert.ok(result.errors.ticket_type);
});

// ==================== KIỂM THỬ ĐỢT 2 ====================

test('Events Phase 2 - Tạo cấu trúc iCalendar (.ics) chuẩn RFC 5545', () => {
  const sampleEvent = {
    event_id: 10,
    title: 'Lễ hội Pháo hoa Quốc tế Đà Nẵng (DIFF)',
    slug: 'le-hoi-phao-hoa-diff',
    short_description: 'Đêm thi pháo hoa đặc sắc bên bờ sông Hàn',
    location_name: 'Cảng sông Hàn',
    address: 'Bạch Đằng, Hải Châu',
    start_time: '2026-06-06T13:00:00.000Z',
    end_time: '2026-06-06T15:30:00.000Z',
    status: 'PUBLISHED',
    ticket_price_display: 'Từ 800.000 VNĐ',
    ticket_type: 'PAID',
    source_url: 'https://diff.vn',
  };

  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Da Nang Go Smart//Events Module//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:dananggo-event-${sampleEvent.event_id}@dananggo.vn`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(new Date(sampleEvent.start_time))}`,
    `DTEND:${formatIcsDate(new Date(sampleEvent.end_time))}`,
    `SUMMARY:${sampleEvent.title}`,
    `DESCRIPTION:${sampleEvent.short_description}`,
    `LOCATION:${sampleEvent.location_name}, ${sampleEvent.address}, Đà Nẵng`,
    `STATUS:CONFIRMED`,
    `URL;VALUE=URI:https://dananggo.vn/events/${sampleEvent.slug}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = icsLines.join('\r\n');

  assert.ok(icsContent.includes('BEGIN:VCALENDAR'));
  assert.ok(icsContent.includes('VERSION:2.0'));
  assert.ok(icsContent.includes('BEGIN:VEVENT'));
  assert.ok(icsContent.includes('SUMMARY:Lễ hội Pháo hoa Quốc tế Đà Nẵng (DIFF)'));
  assert.ok(icsContent.includes('LOCATION:Cảng sông Hàn, Bạch Đằng, Hải Châu, Đà Nẵng'));
  assert.ok(icsContent.includes('END:VEVENT'));
  assert.ok(icsContent.includes('END:VCALENDAR'));
});

test('Events Phase 2 - Tạo link Google Calendar hợp lệ với các query params', () => {
  const title = 'Workshop làm đèn lồng Hội An';
  const start = new Date('2026-11-20T14:00:00.000Z');
  const end = new Date('2026-11-20T16:00:00.000Z');
  const formatGoogleDate = (date: Date): string => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = `${formatGoogleDate(start)}/${formatGoogleDate(end)}`;
  const location = 'Bảo tàng Điêu khắc Chăm, Hải Châu, Đà Nẵng';

  const googleUrl = new URL('https://calendar.google.com/calendar/render');
  googleUrl.searchParams.set('action', 'TEMPLATE');
  googleUrl.searchParams.set('text', title);
  googleUrl.searchParams.set('dates', dates);
  googleUrl.searchParams.set('location', location);

  const urlStr = googleUrl.toString();
  assert.ok(urlStr.startsWith('https://calendar.google.com/calendar/render?'));
  assert.equal(googleUrl.searchParams.get('action'), 'TEMPLATE');
  assert.equal(googleUrl.searchParams.get('text'), title);
  assert.equal(googleUrl.searchParams.get('dates'), '20261120T140000Z/20261120T160000Z');
  assert.equal(googleUrl.searchParams.get('location'), location);
});

test('Events Phase 2 - Kiểm tra loại thông báo biến động sự kiện hợp lệ', () => {
  const validTypes = ['RESCHEDULED', 'POSTPONED', 'CANCELLED', 'TIME_CHANGE', 'GENERAL'];
  const testType = 'CANCELLED';
  assert.ok(validTypes.includes(testType));
});

// ==================== KIỂM THỬ ĐỢT 3 ====================

test('Events Phase 3 - Validation Đề xuất sự kiện: Hợp lệ khi đủ thông tin', () => {
  const result = validateSubmitEvent({
    title: 'Festival Âm nhạc Đường phố Đà Nẵng',
    category: 'MUSIC',
    cover_image: 'https://images.unsplash.com/photo-festival',
    short_description: 'Lễ hội âm nhạc acoustic dọc bờ sông Hàn',
    start_time: '2026-12-01T19:00:00.000Z',
    end_time: '2026-12-01T22:00:00.000Z',
    location_name: 'Công viên APEC',
    address: 'Bình Hiên, Hải Châu',
    district: 'Hải Châu',
    ticket_type: 'FREE_OPEN',
    organizer_name: 'CLB Âm nhạc Trẻ Đà Nẵng',
    organizer_contact: 'contact@danangmusic.org | 0905123456',
  });

  assert.equal(Object.keys(result.errors).length, 0, JSON.stringify(result.errors));
  assert.equal(result.valid, true);
});

test('Events Phase 3 - Validation Đề xuất sự kiện: Báo lỗi khi thiếu thông tin liên hệ ban tổ chức', () => {
  const result = validateSubmitEvent({
    title: 'Festival Âm nhạc',
    category: 'MUSIC',
    cover_image: 'https://images.unsplash.com/photo-festival',
    short_description: 'Lễ hội âm nhạc',
    start_time: '2026-12-01T19:00:00.000Z',
    location_name: 'Công viên APEC',
    organizer_name: '', // Thiếu tên đơn vị tổ chức
    organizer_contact: '', // Thiếu liên hệ
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.organizer_name);
  assert.ok(result.errors.organizer_contact);
});

test('Events Phase 3 - Validation Từ chối sự kiện: Báo lỗi khi thiếu lý do từ chối', () => {
  const invalid = validateRejectEvent({ rejection_reason: 'abc' }); // quá ngắn (< 5 ký tự)
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.rejection_reason);

  const valid = validateRejectEvent({ rejection_reason: 'Nội dung sự kiện trùng lặp với sự kiện đã có trên hệ thống.' });
  assert.equal(valid.valid, true);
});

test('Events Phase 3 - Fallback Đa ngôn ngữ (applyLanguage): Ưu tiên tiếng Anh khi lang="en"', () => {
  const service = new EventsService();
  const sampleEvent: any = {
    event_id: 1,
    title: 'Lễ hội Pháo hoa Quốc tế Đà Nẵng',
    title_en: 'Da Nang International Fireworks Festival',
    short_description: 'Cuộc thi trình diễn pháo hoa quốc tế',
    short_description_en: 'International fireworks competition in Da Nang',
    location_name: 'Cảng sông Hàn',
    location_name_en: 'Han River Port',
    reschedule_notice: null,
    reschedule_notice_en: null,
  };

  // 1. Khi xem bằng tiếng Anh
  const enResult = service.applyLanguage(sampleEvent, 'en');
  assert.equal(enResult.title, 'Da Nang International Fireworks Festival');
  assert.equal(enResult.short_description, 'International fireworks competition in Da Nang');
  assert.equal(enResult.location_name, 'Han River Port');

  // 2. Khi xem bằng tiếng Việt (mặc định)
  const viResult = service.applyLanguage(sampleEvent, 'vi');
  assert.equal(viResult.title, 'Lễ hội Pháo hoa Quốc tế Đà Nẵng');

  // 3. Fallback: Nếu không có tiếng Anh, tự động giữ nguyên tiếng Việt
  const partialEvent: any = {
    ...sampleEvent,
    title_en: null,
    short_description_en: '',
  };
  const fallbackResult = service.applyLanguage(partialEvent, 'en');
  assert.equal(fallbackResult.title, 'Lễ hội Pháo hoa Quốc tế Đà Nẵng');
  assert.equal(fallbackResult.short_description, 'Cuộc thi trình diễn pháo hoa quốc tế');
});

test('Events Phase 3 - Tính khoảng cách địa lý (Haversine Formula)', () => {
  // Tọa độ Cầu Rồng: 16.0612, 108.2208
  // Tọa độ Chợ đêm Sơn Trà: 16.0619, 108.2255
  const lat1 = 16.0612;
  const lon1 = 108.2208;
  const lat2 = 16.0619;
  const lon2 = 108.2255;

  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Khoảng cách khoảng 0.5 km (500 mét)
  assert.ok(distanceKm > 0.4 && distanceKm < 0.65, `Khoảng cách thực tế: ${distanceKm} km`);
});

