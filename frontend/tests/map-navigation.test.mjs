import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DANANG_CENTER, fetchDrivingRoute, googleMapsDirections, haversineDistance } from '../lib/map-navigation.ts';

test('Haversine: cùng tọa độ, một độ kinh tuyến và hai điểm đối cực', () => {
  assert.equal(haversineDistance(DANANG_CENTER, DANANG_CENTER), 0);
  assert.ok(Math.abs(haversineDistance([0, 0], [0, 1]) - 111.1949) < 0.001);
  assert.ok(Math.abs(haversineDistance([0, 0], [0, 180]) - Math.PI * 6371) < 0.001);
});

test('Bán kính 2/5/10 km thay đổi kết quả và dùng tâm GPS mới', () => {
  const places = [[0, 0.01], [0, 0.03], [0, 0.07]];
  const within = (center, radius) => places.filter(point => haversineDistance(center, point) <= radius);
  assert.deepEqual(within([0, 0], 2), [places[0]]);
  assert.deepEqual(within([0, 0], 5), places.slice(0, 2));
  assert.deepEqual(within([0, 0], 10), places);
  assert.deepEqual(within(places[2], 2), [places[2]]);
  assert.equal(haversineDistance(places[0], places[2]), haversineDistance(places[2], places[0]));
});

const destination = [16.06, 108.245];
const validRoute = {
  code: 'Ok',
  routes: [{ distance: 4567, duration: 601, geometry: { type: 'LineString', coordinates: [[108.2022, 16.0544], [108.245, 16.06]] } }],
};

test('OSRM: thứ tự tọa độ URL/GeoJSON, mét sang km, giây sang phút', async context => {
  const fetch = context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://router.project-osrm.org/route/v1/driving/108.2022,16.0544;108.245,16.06?overview=full&geometries=geojson');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json(validRoute);
  });
  const result = await fetchDrivingRoute(DANANG_CENTER, destination);
  assert.deepEqual(result, { coordinates: [DANANG_CENTER, destination], distanceKm: 4.567, durationMinutes: 11 });
  assert.equal(fetch.mock.callCount(), 1);
});

test('OSRM: không có tuyến đường hoặc không khớp đường giao thông', async context => {
  for (const code of ['NoRoute', 'NoSegment']) {
    const mocked = context.mock.method(globalThis, 'fetch', async () => Response.json({ code }));
    await assert.rejects(fetchDrivingRoute(DANANG_CENTER, destination), /Không tìm thấy tuyến đường/);
    mocked.mock.restore();
  }
});

test('OSRM: xử lý HTTP 429/500/503', async context => {
  for (const status of [429, 500, 503]) {
    const mocked = context.mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
    await assert.rejects(fetchDrivingRoute(DANANG_CENTER, destination), /Dịch vụ chỉ đường đang bận/);
    mocked.mock.restore();
  }
});

test('OSRM: từ chối dữ liệu rỗng, hình học sai, tọa độ ngoài phạm vi và giá trị âm', async context => {
  const invalid = [null, {}, { code: 'Ok', routes: [] },
    { ...validRoute, routes: [{ ...validRoute.routes[0], distance: -1 }] },
    { ...validRoute, routes: [{ ...validRoute.routes[0], duration: -1 }] },
    ...[
      { type: 'Point', coordinates: [[108, 16], [109, 17]] },
      { type: 'LineString', coordinates: [] },
      { type: 'LineString', coordinates: [[108, 16]] },
      { type: 'LineString', coordinates: [[108, 91], [109, 16]] },
      { type: 'LineString', coordinates: [[181, 16], [109, 16]] },
      { type: 'LineString', coordinates: [['108', 16], [109, 16]] },
    ].map(geometry => ({ ...validRoute, routes: [{ ...validRoute.routes[0], geometry }] })),
  ];
  for (const payload of invalid) {
    const mocked = context.mock.method(globalThis, 'fetch', async () => Response.json(payload));
    await assert.rejects(fetchDrivingRoute(DANANG_CENTER, destination), /Dữ liệu tuyến đường không hợp lệ/);
    mocked.mock.restore();
  }
});

test('OSRM: hủy request khi đổi hoặc đóng tuyến đường', async context => {
  const controller = new AbortController();
  context.mock.method(globalThis, 'fetch', (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true });
  }));
  const pending = fetchDrivingRoute(DANANG_CENTER, destination, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('OSRM: quãng đường ngắn vẫn hiển thị ít nhất một phút', async context => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ ...validRoute, routes: [{ ...validRoute.routes[0], duration: 0 }] }));
  assert.equal((await fetchDrivingRoute(DANANG_CENTER, destination)).durationMinutes, 1);
});

test('Google Maps: tọa độ lat,lng và điểm xuất phát tùy chọn', () => {
  const fallback = new URL(googleMapsDirections(destination));
  assert.equal(fallback.origin, 'https://www.google.com');
  assert.equal(fallback.searchParams.get('api'), '1');
  assert.equal(fallback.searchParams.get('destination'), '16.06,108.245');
  assert.equal(fallback.searchParams.get('travelmode'), 'driving');
  assert.equal(fallback.searchParams.has('origin'), false);
  assert.equal(new URL(googleMapsDirections(destination, DANANG_CENTER)).searchParams.get('origin'), '16.0544,108.2022');
});
