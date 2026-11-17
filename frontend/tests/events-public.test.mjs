import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return {
        url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

const eventsApi = await import('../lib/api/events.ts');

test('Quy tắc hiển thị: ẩn DRAFT và CANCELLED khỏi danh sách khám phá nhưng mở được CANCELLED qua link chi tiết', async () => {
  const { events } = await eventsApi.getPublicEvents({});
  const statuses = new Set(events.map((e) => e.status));

  // DRAFT và CANCELLED không xuất hiện ở trang danh sách khám phá
  assert.equal(statuses.has('DRAFT'), false);
  assert.equal(statuses.has('CANCELLED'), false);

  // Mở trực tiếp link của sự kiện đã hủy vẫn trả về dữ liệu kèm thông báo hủy
  const cancelledDetail = await eventsApi.getPublicEventDetail(
    'workshop-nhiep-anh-san-may-dinh-ban-co-da-huy',
  );
  assert.ok(cancelledDetail);
  assert.equal(cancelledDetail.status, 'CANCELLED');
  assert.ok(cancelledDetail.changeNote?.includes('hủy'));

  // Mở link của bản nháp (DRAFT) bị chặn với người dùng công khai
  const draftDetail = await eventsApi.getPublicEventDetail('ban-nhap-le-hoi-dua-thuyen-song-han');
  assert.equal(draftDetail, null);
});

test('Bộ lọc Cuối tuần này theo giờ Đà Nẵng (UTC+7): bao gồm sự kiện nhiều ngày và loại trừ sự kiện đã dời sang Thứ Hai', async () => {
  const { events: weekendEvents } = await eventsApi.getPublicEvents({
    datePreset: 'THIS_WEEKEND',
  });

  const ids = new Set(weekendEvents.map((e) => e.id));
  // Sự kiện nhiều ngày (101, 104) và sự kiện cuối tuần (102, 103, 107) xuất hiện
  assert.equal(ids.has('101'), true);
  assert.equal(ids.has('102'), true);
  assert.equal(ids.has('103'), true);
  assert.equal(ids.has('104'), true);

  // Sự kiện 105 đã đổi lịch từ Thứ Bảy sang Thứ Hai nên biến mất khỏi bộ lọc Cuối tuần này
  assert.equal(ids.has('105'), false);
});

test('Bộ lọc kết hợp: tìm kiếm từ khóa, loại sự kiện, khu vực và giá vé (Miễn phí / Có phí)', async () => {
  const { events: freeWorkshops } = await eventsApi.getPublicEvents({
    eventType: 'WORKSHOP',
    district: 'Hải Châu',
    priceFilter: 'FREE',
  });
  assert.equal(freeWorkshops.length, 1);
  assert.equal(freeWorkshops[0].id, '102');

  const { events: paidMusic } = await eventsApi.getPublicEvents({
    search: 'Mỹ Khê',
    eventType: 'MUSIC',
    priceFilter: 'PAID',
  });
  assert.equal(paidMusic.length, 1);
  assert.equal(paidMusic[0].id, '103');
});

test('Mục Cuối tuần này ở Đà Nẵng trên Trang chủ: tự động fallback sang sự kiện sắp tới nếu cuối tuần trống', () => {
  // Giả lập thời điểm chỉ có 1 sự kiện vào Thứ Tư tuần sau (cuối tuần này trống)
  const now = new Date('2026-11-17T07:00:00.000Z'); // Thứ Ba 14:00 giờ Đà Nẵng
  const nextWedEvent = {
    ...eventsApi.MOCK_EVENTS[0],
    id: '999',
    startAt: '2026-11-25T02:00:00.000Z', // Thứ Tư tuần sau 09:00 giờ Đà Nẵng
    endAt: '2026-11-25T05:00:00.000Z',
    status: 'PUBLISHED',
  };

  const weekendMatches = eventsApi.filterPublicEvents(
    [nextWedEvent],
    { datePreset: 'THIS_WEEKEND' },
    now,
  );
  assert.equal(weekendMatches.length, 0);

  const upcomingMatches = eventsApi.filterPublicEvents(
    [nextWedEvent],
    { datePreset: 'UPCOMING' },
    now,
  );
  assert.equal(upcomingMatches.length, 1);
  assert.equal(upcomingMatches[0].id, '999');
});
