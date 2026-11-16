import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { connectDB, closeDB } from '../src/config/db';
import {
  clearWeatherCache,
  getWeatherForecast,
  type WeatherFetcher,
} from '../src/modules/weather/weather.service';
import {
  addDaysVN,
  getVietnamToday,
  parseWeatherDateQuery,
} from '../src/modules/weather/weather.timezone';
import { processUserMessage } from '../src/modules/chat/chat.service';
import { normalize } from '../src/modules/ai/ai.rules';

function buildOpenMeteoPayload(baseDate: string, opts?: {
  nullCurrentTemp?: boolean;
  rainy?: boolean;
  hot?: boolean;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysVN(baseDate, i));
  const hourlyTimes: string[] = [];
  const hourlyTemp: (number | null)[] = [];
  const hourlyCode: (number | null)[] = [];
  const hourlyProb: (number | null)[] = [];
  const hourlyPrecip: (number | null)[] = [];
  const hourlyWind: (number | null)[] = [];

  for (const d of days) {
    for (let h = 0; h < 24; h++) {
      const hh = String(h).padStart(2, '0');
      hourlyTimes.push(`${d}T${hh}:00`);
      const temp = opts?.hot ? 37 : opts?.rainy ? 25 : 29;
      hourlyTemp.push(h === 12 && opts?.nullCurrentTemp ? null : temp);
      hourlyCode.push(opts?.rainy ? 63 : 2);
      hourlyProb.push(opts?.rainy ? 85 : 15);
      hourlyPrecip.push(opts?.rainy ? 6.4 : 0);
      hourlyWind.push(opts?.rainy ? 28 : 14);
    }
  }

  return {
    latitude: 16.0544,
    longitude: 108.2022,
    generationtime_ms: 1.5,
    timezone: 'Asia/Ho_Chi_Minh',
    current: {
      time: `${baseDate}T10:00`,
      temperature_2m: opts?.nullCurrentTemp ? null : opts?.hot ? 36.5 : 28.4,
      apparent_temperature: opts?.nullCurrentTemp ? null : 31.2,
      relative_humidity_2m: 78,
      weather_code: opts?.rainy ? 63 : 2,
      precipitation: opts?.rainy ? 3.2 : 0,
      wind_speed_10m: opts?.rainy ? 26 : 12,
      wind_gusts_10m: opts?.rainy ? 40 : 20,
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTemp,
      weather_code: hourlyCode,
      precipitation_probability: hourlyProb,
      precipitation: hourlyPrecip,
      wind_speed_10m: hourlyWind,
    },
    daily: {
      time: days,
      weather_code: days.map(() => (opts?.rainy ? 63 : 2)),
      temperature_2m_max: days.map(() => (opts?.hot ? 38 : opts?.rainy ? 27 : 31)),
      temperature_2m_min: days.map(() => (opts?.hot ? 28 : opts?.rainy ? 23 : 25)),
      precipitation_probability_max: days.map(() => (opts?.rainy ? 85 : 20)),
      precipitation_sum: days.map(() => (opts?.rainy ? 24.5 : 0.4)),
      wind_speed_10m_max: days.map(() => (opts?.rainy ? 30 : 16)),
    },
  };
}

function makeMockFetcher(
  payloadFactory: (url: string) => { status?: number; body?: unknown; error?: Error }
): WeatherFetcher {
  return async (url: string) => {
    const res = payloadFactory(url);
    if (res.error) throw res.error;
    const status = res.status ?? 200;
    return new Response(JSON.stringify(res.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

test('timezone helper handles Vietnam midnight boundary (UTC+7)', () => {
  // 2026-11-13 17:30 UTC === 2026-11-14 00:30 Asia/Ho_Chi_Minh
  const lateUtc = new Date('2026-11-13T17:30:00.000Z');
  assert.equal(getVietnamToday(lateUtc), '2026-11-14');

  // 2026-11-13 16:30 UTC === 2026-11-13 23:30 Asia/Ho_Chi_Minh
  const beforeMidnightUtc = new Date('2026-11-13T16:30:00.000Z');
  assert.equal(getVietnamToday(beforeMidnightUtc), '2026-11-13');

  const weekend = parseWeatherDateQuery(normalize('Thời tiết cuối tuần như thế nào?'), new Date('2026-11-12T03:00:00.000Z')); // Thursday
  assert.ok(weekend.label?.startsWith('cuối tuần'));
  assert.deepEqual(weekend.dates, ['2026-11-14', '2026-11-15']);
});

test('weather service normalizes fields, preserves null, and distinguishes UNAVAILABLE alerts', async () => {
  clearWeatherCache();
  const now = new Date('2026-11-13T03:00:00.000Z');
  const today = getVietnamToday(now);

  const fetcher = makeMockFetcher(() => ({
    body: buildOpenMeteoPayload(today, { nullCurrentTemp: true }),
  }));

  const data = await getWeatherForecast({ days: 5 }, { now, fetcher });
  assert.equal(data.timezone, 'Asia/Ho_Chi_Minh');
  assert.equal(data.location.scope, 'CITY');
  assert.equal(data.current?.temperature, null);
  assert.equal(data.stale, false);
  assert.ok(data.daily.length >= 5);
  assert.equal(data.alerts.state, 'UNAVAILABLE');
  assert.equal(data.marineAvailable, false);
  assert.match(data.source.attribution, /Open-Meteo/);
});

test('weather service resolves specific place coordinates and uses cache + stale cache fallback', async () => {
  clearWeatherCache();
  await connectDB();

  let calls = 0;
  let shouldFail = false;
  const t0 = new Date('2026-11-13T03:00:00.000Z');
  const today = getVietnamToday(t0);

  const fetcher = makeMockFetcher((url) => {
    calls += 1;
    if (shouldFail) return { status: 429, body: { error: true, reason: 'Rate limit' } };
    assert.match(url, /latitude=15\.998/);
    return { body: buildOpenMeteoPayload(today) };
  });

  const first = await getWeatherForecast({ place: 'Bà Nà Hills', days: 3 }, { now: t0, fetcher });
  assert.equal(first.location.scope, 'PLACE');
  assert.equal(first.stale, false);
  assert.equal(calls, 1);

  // Cache hit within TTL
  const tWithinTtl = new Date(t0.getTime() + 60_000);
  const second = await getWeatherForecast({ place: 'Bà Nà Hills', days: 3 }, { now: tWithinTtl, fetcher });
  assert.equal(second.stale, false);
  assert.equal(calls, 1);

  // After TTL (>10m) and provider returns 429 -> stale cache returned with staleReason
  shouldFail = true;
  const tAfterTtl = new Date(t0.getTime() + 15 * 60_000);
  const stale = await getWeatherForecast({ place: 'Bà Nà Hills', days: 3 }, { now: tAfterTtl, fetcher });
  assert.equal(stale.stale, true);
  assert.ok(stale.staleReason && stale.staleReason.includes('đã lưu tạm'));
  assert.equal(calls, 2);
});

test('weather service throws AuthError when provider fails and no cache exists', async () => {
  clearWeatherCache();
  const fetcher = makeMockFetcher(() => ({ status: 502, body: { error: true } }));
  await assert.rejects(
    () => getWeatherForecast({ days: 3 }, { now: new Date('2026-11-13T03:00:00.000Z'), fetcher }),
    (err: unknown) => err instanceof Error && err.message.length > 0
  );
});

test('Gô handles all 10 weather acceptance prompts and edge cases via processUserMessage', async () => {
  await connectDB();
  clearWeatherCache();

  const now = new Date('2026-11-12T03:00:00.000Z'); // 2026-11-12 (Thursday) 10:00 VN
  const today = getVietnamToday(now);

  const rainyFetcher = makeMockFetcher(() => ({
    body: buildOpenMeteoPayload(today, { rainy: true }),
  }));
  const hotFetcher = makeMockFetcher(() => ({
    body: buildOpenMeteoPayload(today, { hot: true }),
  }));
  const failingFetcher = makeMockFetcher(() => ({
    error: new Error('ETIMEDOUT'),
  }));

  const guestId = `test-weather-${randomUUID()}`;

  // 1. “Hôm nay Đà Nẵng có mưa không?”
  const r1 = await processUserMessage(
    { guestId, message: 'Hôm nay Đà Nẵng có mưa không?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r1.message.intent, 'WEATHER');
  assert.match(r1.message.content, /Open-Meteo/);
  assert.match(r1.message.content, /Đà Nẵng/);

  // 2. “Ngày mai có phù hợp để đi biển không?”
  const r2 = await processUserMessage(
    { guestId, message: 'Ngày mai có phù hợp để đi biển không?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r2.message.intent, 'WEATHER');
  assert.match(r2.message.content, /gió|mưa/);
  assert.match(r2.message.content, /sóng|thủy triều|biển/i);

  // 3. “Tháng nào đi Đà Nẵng đẹp nhất?”
  const r3 = await processUserMessage(
    { guestId, message: 'Tháng nào đi Đà Nẵng đẹp nhất?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r3.message.intent, 'WEATHER');
  assert.match(r3.message.content, /tắm biển|tham quan|nghỉ dưỡng/);

  // 4. “Mùa mưa nên tham quan ở đâu?”
  const r4 = await processUserMessage(
    { guestId, message: 'Mùa mưa nên tham quan ở đâu?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r4.message.intent, 'WEATHER');
  assert.match(r4.message.content, /trong nhà|bảo tàng|chợ|tham khảo/i);

  // 5. “Có nên đi Bà Nà Hills khi trời mưa không?”
  const r5 = await processUserMessage(
    { guestId, sessionId: r1.sessionId, message: 'Có nên đi Bà Nà Hills khi trời mưa không?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r5.message.intent, 'WEATHER');
  assert.match(r5.message.content, /Bà Nà Hills/);

  // 6. “Thời tiết cuối tuần như thế nào?”
  const r6 = await processUserMessage(
    { guestId, message: 'Thời tiết cuối tuần như thế nào?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r6.message.intent, 'WEATHER');
  assert.match(r6.message.content, /14\/11|15\/11|2026-11-14|2026-11-15/);

  // 7a. “Tôi nên mang theo những gì?” (no prior context -> asks or gives conditional advice)
  const r7NoCtx = await processUserMessage(
    { guestId: `test-noctx-${randomUUID()}`, message: 'Tôi nên mang theo những gì?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r7NoCtx.message.intent, 'WEATHER');
  assert.match(r7NoCtx.message.content, /ngày nào|khu vực nào|áo mưa/i);

  // 7b. “Tôi nên mang theo những gì?” (uses Bà Nà Hills context from r5 in same session)
  const r7WithCtx = await processUserMessage(
    { guestId, sessionId: r5.sessionId, message: 'Tôi nên mang theo những gì?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r7WithCtx.message.intent, 'WEATHER');
  assert.match(r7WithCtx.message.content, /Bà Nà Hills/);

  // 8. “Trời quá nóng thì nên đi đâu?”
  clearWeatherCache();
  const r8 = await processUserMessage(
    { guestId, message: 'Trời quá nóng thì nên đi đâu?' },
    undefined,
    { weatherFetcher: hotFetcher, now }
  );
  assert.equal(r8.message.intent, 'WEATHER');
  assert.match(r8.message.content, /trong nhà|sáng sớm|chiều muộn/i);

  // 9. “Có cảnh báo thời tiết nguy hiểm không?”
  const r9 = await processUserMessage(
    { guestId, message: 'Có cảnh báo thời tiết nguy hiểm không?' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r9.message.intent, 'WEATHER');
  assert.match(r9.message.content, /không cung cấp|cảnh báo|không đồng nghĩa/i);

  // 10. “Hãy thay đổi lịch trình theo thời tiết.” (create a 2-day plan first, then change by weather)
  const planGuestId = `test-plan-${randomUUID()}`;
  const planTurn = await processUserMessage(
    {
      guestId: planGuestId,
      message: 'Lập lịch trình 2 ngày 1 đêm Đà Nẵng cho 2 người lớn tổng ngân sách 4 triệu cho cả nhóm, muốn đi biển Mỹ Khê, tham quan và ăn hải sản',
    },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.ok(planTurn.message.travelPlan, `Expected an itinerary draft in session, got: ${planTurn.message.content}`);

  const r10 = await processUserMessage(
    {
      guestId: planGuestId,
      sessionId: planTurn.sessionId,
      message: 'Hãy thay đổi lịch trình theo thời tiết.',
    },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.equal(r10.message.intent, 'MODIFY_ITINERARY');
  if (r10.message.quickReplies?.includes("Áp dụng phương án cứu lịch")) {
    assert.equal(r10.message.travelPlan, undefined);
    const applied = await processUserMessage({
      guestId: planGuestId,
      sessionId: planTurn.sessionId,
      message: "Áp dụng phương án cứu lịch",
    }, undefined, { weatherFetcher: rainyFetcher, now });
    assert.ok(applied.message.travelPlan, applied.message.content);
  } else {
    assert.ok(r10.message.travelPlan);
  }

  // Edge case: Provider failure/timeout falls back gracefully
  clearWeatherCache();
  const rErr = await processUserMessage(
    { guestId, message: 'Hôm nay Đà Nẵng có mưa không?' },
    undefined,
    { weatherFetcher: failingFetcher, now }
  );
  assert.equal(rErr.message.intent, 'WEATHER');
  assert.match(rErr.message.content, /chưa lấy được dữ liệu thời tiết|không khả dụng/i);

  // Edge case: Multi-need (weather + food) answers both
  clearWeatherCache();
  const rMulti = await processUserMessage(
    { guestId, message: 'Hôm nay Đà Nẵng có mưa không, gợi ý cho mình quán ăn ngon' },
    undefined,
    { weatherFetcher: rainyFetcher, now }
  );
  assert.match(rMulti.message.content, /Open-Meteo/);
  assert.ok(
    (rMulti.message.places && rMulti.message.places.length > 0) ||
      (rMulti.message.recommendationGroups && rMulti.message.recommendationGroups.length > 0) ||
      rMulti.message.content.includes('quán') ||
      rMulti.message.content.includes('ăn')
  );
});

test.after(async () => {
  await closeDB();
});
