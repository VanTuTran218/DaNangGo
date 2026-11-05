import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { connectDB, closeDB, sql } from '../src/config/db';
import { GuestChatSessions, openChatConversation, ChatSessionError } from '../src/modules/chat/chat.sessions';
import { acquireChatSlot, createChatRateLimit } from '../src/modules/chat/chat.middleware';
import { chatInputSchema } from '../src/modules/chat/chat.routes';
import { groundChatAnswer } from '../src/modules/chat/chat.safety';
import { DEFAULT_INTENT } from '../src/Ai/promt';

test('Phiên khách tách chủ sở hữu, hết hạn, giới hạn bộ nhớ và số tin', () => {
  let now = 0;
  const sessions = new GuestChatSessions(100, 2, () => now);
  const id = sessions.open('guest-a');
  sessions.save(id, 'guest-a', 'USER', 'Nội dung riêng');
  assert.throws(() => sessions.history(id, 'guest-b'), ChatSessionError);
  assert.throws(() => sessions.save(id, 'guest-b', 'USER', 'Giả mạo'), ChatSessionError);
  for (let i = 0; i < 20; i++) sessions.save(id, 'guest-a', 'USER', String(i));
  assert.equal(sessions.history(id, 'guest-a').length, 12);
  now = 101;
  assert.throws(() => sessions.open('guest-a', id), ChatSessionError);
  const evicted = sessions.open('a'); sessions.open('b'); sessions.open('c');
  assert.throws(() => sessions.open('a', evicted), ChatSessionError);
});

test('Khách không gắn vào user đầu tiên; phiên DB chỉ đọc/ghi đúng user', async t => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
  const pool = { request() {
    const params: Record<string, unknown> = {};
    return { input(name: string, _type: unknown, value: unknown) { params[name] = value; return this; },
      async query(text: string) {
        queries.push({ text, params });
        if (text.includes('SELECT session_id FROM')) return { recordset: params.userId === 10 ? [{ session_id: 7 }] : [] };
        if (text.includes('INSERT INTO dbo.chat_messages')) return { recordset: [{ message_id: 1n }] };
        return { recordset: [] };
      } };
  }, async close() {} };
  t.mock.method(sql, 'connect', async () => pool as never);
  await connectDB();
  try {
    const guest = await openChatConversation({ message: 'Chào', guestId: 'guest-a' });
    await guest.save('USER', 'Riêng tư');
    assert.equal(queries.length, 0);
    await assert.rejects(openChatConversation({ message: 'Chào', userId: 11, sessionId: 7 }), ChatSessionError);
    assert.equal(queries.length, 1);
    assert.ok(!queries[0]!.text.includes('chat_messages'));
    const own = await openChatConversation({ message: 'Chào', userId: 10, sessionId: 7 });
    await own.history(); await own.save('USER', 'Của user 10');
    for (const query of queries) {
      assert.equal(typeof query.params.userId, 'number');
      assert.match(query.text, /user_id = @userId/);
    }
    assert.ok(!queries.some(query => query.text.includes('FROM dbo.users')));
  } finally { await closeDB(); }
});

test('Không chấp nhận client tự gán userId/guestId hoặc mã phiên sai', () => {
  for (const body of [null, { message: '' }, { message: 'a'.repeat(501) }, { message: 'Hi', userId: 1 }, { message: 'Hi', guestId: 'khác' }, { message: 'Hi', sessionId: '7' }, { message: 'Hi', sessionId: -1 }, { message: 'Hi', sessionId: 2 ** 40 }]) assert.equal(chatInputSchema.safeParse(body).success, false);
  assert.equal(chatInputSchema.safeParse({ message: 'Xin chào', sessionId: 7 }).success, true);
});

test('Thông tin AI tự bịa không được đưa vào lời nhắn hoặc lý do gợi ý', () => {
  const row = { placeId: 42, name: 'Tên từ DB', placeType: 'RESTAURANT' as const, address: 'Địa chỉ DB', districtName: 'Hải Châu', rating: 4, reviewCount: 1, priceMin: 30000, priceMax: 50000, priceText: '30.000–50.000đ/món', detailUrl: '/places/42', description: null };
  const output = groundChatAnswer({ message: 'Quán Bịa tại số 999 có giá 1đ, mở 24:00, gọi 0999999999', places: [{ id: 42, reason: 'Miễn phí ăn buffet 24:00' }, { id: 999, reason: 'Không tồn tại' }, { id: 42, reason: 'Trùng' }] }, [row], { ...DEFAULT_INTENT, category: 'food' });
  assert.equal(output.places.length, 1);
  assert.equal(output.places[0]!.reason, 'Hải Châu · Giá trong dữ liệu: 30.000–50.000đ/món');
  assert.doesNotMatch(JSON.stringify(output), /Quán Bịa|0999999999|24:00|buffet/);
});

test('Chặn yêu cầu đồng thời và giải phóng slot sau khi xử lý', () => {
  const release = acquireChatSlot('test-owner');
  assert.ok(release);
  assert.equal(acquireChatSlot('test-owner'), null);
  release();
  acquireChatSlot('test-owner')!();
});

test('Rate limit trả 429 trước khi xử lý chat thứ ba', async () => {
  const app = express(); let processed = 0;
  app.post('/chat', createChatRateLimit(2), (_req, res) => { processed++; res.json({ ok: true }); });
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    const url = `http://127.0.0.1:${address.port}/chat`;
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    const limited = await fetch(url, { method: 'POST' });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).code, 'CHAT_RATE_LIMITED');
    assert.equal(processed, 2);
  } finally { server.close(); server.closeAllConnections(); }
});
