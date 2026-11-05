import test from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, closeDB, sql } from '../src/config/db';
import { searchPlacesForChat } from '../src/modules/chat/chat.repository';
import { processUserMessage, fallbackIntent } from '../src/modules/chat/chat.service';
import { filterChatAnswer } from '../src/Ai/promt';

test('Chat lấy giá món đang bán từ SQL, truyền tham số và fallback đúng dữ liệu DB', async t => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
  const pool = {
    request() {
      const params: Record<string, unknown> = {};
      return {
        input(name: string, _type: unknown, value: unknown) { params[name] = value; return this; },
        async query(text: string) {
          queries.push({ text, params });
          if (text.includes('SELECT * FROM (')) return { recordset: [
            { place_id: 42, name: 'Mì Quảng trong DB', place_type: 'RESTAURANT', address: 'Địa chỉ trong DB', district_name: 'Hải Châu', avg_rating: 4.5, review_count: 3, image_url: null, description: 'Mì Quảng', price_min: 30000, price_max: 60000 },
            { place_id: 43, name: 'Chưa có món', place_type: 'RESTAURANT', address: null, district_name: null, avg_rating: 0, review_count: 0, image_url: null, description: null, price_min: null, price_max: null },
          ] };
          if (text.includes('INSERT INTO dbo.chat_messages')) return { recordset: [{ message_id: 1n }] };
          return { recordset: [] };
        },
      };
    }, async close() {},
  };
  t.mock.method(sql, 'connect', async () => pool as never);
  const oldKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  await connectDB();
  try {
    const rows = await searchPlacesForChat({ placeType: 'RESTAURANT', budget: 50000, keywords: ["Mì Quảng' OR 1=1 --"] });
    assert.equal(rows[0]!.priceMin, 30000);
    assert.equal(rows[0]!.priceMax, 60000);
    assert.equal(rows[0]!.priceText, '30.000–60.000đ/món');
    assert.equal(rows[1]!.priceText, null);
    assert.match(queries[0]!.text, /MIN\(mi.price\).*dbo.menu_items.*mi.is_available = 1/);
    assert.match(queries[0]!.text, /MAX\(mi.price\).*dbo.menu_items.*mi.is_available = 1/);
    assert.match(queries[0]!.text, /p.status = 'ACTIVE'/);
    assert.equal(queries[0]!.params.budget, 50000);
    assert.equal(queries[0]!.params.kw_0, "%Mì Quảng' OR 1=1 --%");
    assert.ok(!queries[0]!.text.includes("OR 1=1 --"));
    const events: unknown[] = [];
    const result = await processUserMessage({ guestId: 'guest-test', message: 'Quán mì Quảng ngon' }, event => events.push(event));
    assert.deepEqual(result.message.places?.map(place => place.placeId), [42, 43]);
    assert.equal(result.message.places?.[0]?.detailUrl, '/places/42');
    assert.ok(events.some((event: any) => event.type === 'candidates'));
    const offTopic = await processUserMessage({ guestId: 'guest-test', sessionId: result.sessionId, message: 'Viết code Python cho tôi' });
    assert.equal(offTopic.message.places, undefined);
    assert.equal(offTopic.message.actionLink, undefined);
  } finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
    await closeDB();
  }
});

test('Lọc ID lạ và ID trùng trước khi hiển thị thẻ AI', () => {
  const result = filterChatAnswer({ message: 'Các gợi ý', places: [{ id: 42, reason: 'Trong DB' }, { id: 99999, reason: 'Bịa' }, { id: 42, reason: 'Lặp' }] }, new Set([42]));
  assert.deepEqual(result.places, [{ id: 42, reason: 'Trong DB' }]);
});

test('Dự phòng vẫn hiểu ngân sách và quận khi Gemini không hoạt động', () => {
  const intent = fallbackIntent('Gợi ý quán Mì Quảng dưới 100000 đồng ở Hải Châu');
  assert.equal(intent.budget, 100000);
  assert.equal(intent.district, 'Hải Châu');
  assert.equal(intent.category, 'food');
  assert.equal(fallbackIntent('Khách sạn ngân sách 1,5 triệu ở Sơn Trà').budget, 1500000);
  assert.equal(fallbackIntent('Hải sản dưới 300k').budget, 300000);
});
