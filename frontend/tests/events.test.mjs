import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) return { url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const schema = await import('../lib/events/schema.ts');
const api = await import('../services/events.ts');
const submissions = await import('../services/event-submissions.ts');

const values = {
  ...schema.toFormValues(),
  name: 'Workshop làm đèn lồng',
  imageUrl: 'https://example.com/workshop.jpg',
  shortDescription: 'Tự làm đèn lồng',
  eventType: 'WORKSHOP',
  startAt: '2026-12-19T08:00',
  endAt: '2026-12-19T10:00',
  placeId: '24',
  locationName: 'Công viên APEC',
  address: 'Đường 2 Tháng 9',
  district: 'Hải Châu',
};

test('Duyệt đề xuất dùng phiên admin và chỉ gửi lý do khi từ chối', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const request = new URL(url);
    calls.push([request.pathname + request.search, init.method ?? 'GET', init.credentials, init.body && JSON.parse(init.body)]);
    const item = { submission_id: 19, title: 'Workshop', status: 'PENDING' };
    return Response.json({ success: true, data: request.search ? { items: [item], total_pages: 2 } : item });
  });
  const signal = new AbortController().signal;
  assert.equal((await submissions.listSubmissions('PENDING', 1, signal)).totalPages, 2);
  assert.equal((await submissions.getSubmission(19, signal)).submission_id, 19);
  await submissions.reviewSubmission(19, 'APPROVED', '');
  await submissions.reviewSubmission(19, 'REJECTED', ' Thiếu thông tin ');
  assert.deepEqual(calls, [
    ['/api/admin/event-submissions?status=PENDING&page=1&limit=20', 'GET', 'include', undefined],
    ['/api/admin/event-submissions/19', 'GET', 'include', undefined],
    ['/api/admin/event-submissions/19/status', 'PATCH', 'include', { status: 'APPROVED' }],
    ['/api/admin/event-submissions/19/status', 'PATCH', 'include', { status: 'REJECTED', rejection_reason: 'Thiếu thông tin' }],
  ]);
});

test('Bản nháp chấp nhận form chưa đủ dữ liệu; đăng báo đúng trường', () => {
  assert.equal(schema.draftSchema.safeParse({ ...schema.toFormValues(), name: 'Bản nháp' }).success, true);
  assert.equal(schema.eventSchema.safeParse(values).success, true);
  const result = schema.eventSchema.safeParse({
    ...values, district: '', endAt: '2026-12-19T07:00', ticketType: 'FREE_REGISTRATION',
  });
  assert.equal(result.success, false);
  assert.deepEqual(new Set(result.error.issues.map(issue => issue.path[0])), new Set(['district', 'endAt', 'ticketUrl']));
});

test('Giờ DATETIME2 dùng múi giờ Đà Nẵng kể cả trên máy khác múi giờ', () => {
  assert.equal(schema.parseEventDate('2026-12-19T08:00:00'), '2026-12-19T01:00:00.000Z');
  assert.equal(schema.parseEventDate('2026-12-19T01:00:00.000Z'), '2026-12-19T01:00:00.000Z');
  assert.equal(schema.toLocalInput(schema.toISO(values.startAt)), values.startAt);
  assert.equal(schema.isLocalDateTime('2026-02-31T08:00'), false);
});

test('Gọi danh sách, tạo, cập nhật và PATCH trạng thái bằng cookie admin', async t => {
  const record = { event_id: 42, title: values.name, status: 'DRAFT', start_time: '2026-12-19T08:00:00' };
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const path = new URL(url);
    const body = init.body ? JSON.parse(init.body) : undefined;
    requests.push({ url: path.pathname + path.search, method: init.method ?? 'GET', body, credentials: init.credentials });
    const data = path.search ? { items: [record], total: 30, limit: 10 }
      : { ...record, ...body, status: body?.status ?? record.status };
    return Response.json({ success: true, data });
  });
  const list = await api.listEvents('ALL', 1);
  assert.equal(list.totalPages, 3);
  assert.equal(list.events[0].id, '42');
  const event = await api.createEvent(schema.toEvent(values), 'DRAFT');
  await api.getEvent(event.id);
  await api.updateEvent(event.id, schema.toEvent(values, event));
  await api.changeEventStatus(event.id, 'PUBLISHED');
  await api.changeEventStatus(event.id, 'RESCHEDULED', {
    startAt: '2026-12-21T08:00', endAt: '2026-12-21T10:00', changeNote: 'Dời sang thứ Hai',
  });
  await api.changeEventStatus(event.id, 'POSTPONED', { changeNote: 'Hoãn', startAt: '', endAt: '' });
  await api.changeEventStatus(event.id, 'CANCELLED', { changeNote: 'Hủy', startAt: '', endAt: '' });
  assert.deepEqual(requests.map(item => [item.method, item.url]), [
    ['GET', '/api/admin/events?status=ALL&page=1'], ['POST', '/api/admin/events'],
    ['GET', '/api/admin/events/42'], ['PUT', '/api/admin/events/42'],
    ...Array(4).fill(['PATCH', '/api/admin/events/42/status']),
  ]);
  assert.ok(requests.every(request => request.credentials === 'include'));
  assert.equal(requests[1].body.place_id, 24);
  assert.equal(requests[1].body.short_description, values.shortDescription);
  assert.equal(requests[1].body.start_time, '2026-12-19T08:00:00');
  assert.deepEqual(requests[4].body, { status: 'PUBLISHED' });
  assert.deepEqual(requests[5].body, {
    status: 'RESCHEDULED', start_time: '2026-12-21T08:00:00', end_time: '2026-12-21T10:00:00',
    reschedule_notice: 'Dời sang thứ Hai',
  });
  assert.equal(requests[6].body.status, 'POSTPONED');
  assert.equal(requests[7].body.status, 'CANCELLED');
});

test('Ánh xạ lỗi backend sang đúng trường và lấy địa điểm thật qua API', async t => {
  t.mock.method(globalThis, 'fetch', async url => new URL(url).pathname === '/api/places'
    ? Response.json({ success: true, data: { items: [{ place_id: 24, name: 'APEC', address: 'Đường 2 Tháng 9', district_name: 'Hải Châu' }] } })
    : Response.json({ success: false, errors: [{ path: ['end_time'], message: 'Giờ kết thúc không hợp lệ' }] }, { status: 400 }));
  assert.deepEqual((await api.fetchPlaces('APEC'))[0], {
    id: '24', name: 'APEC', address: 'Đường 2 Tháng 9', district: 'Hải Châu', latitude: undefined, longitude: undefined,
  });
  await assert.rejects(() => api.createEvent(schema.toEvent(values), 'PUBLISHED'), error => {
    assert.deepEqual(api.eventFieldErrors(error), { endAt: 'Giờ kết thúc không hợp lệ' });
    return true;
  });
});
