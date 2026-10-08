const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bookingSchema, normalizeBooking } = require('../dist/modules/bookings/bookings.validation');
const { createHash } = require('node:crypto');
const { mockAuth } = require('../dist/middleware/mockAuth.middleware');
const db = require('../dist/config/db');

const common = { place_id: 2, contact_name: 'A', contact_phone: '0912345678' };
const future = '2099-01-02';

test('strict STAY, TICKET, TABLE contracts and canonical payload', () => {
  const stay = { ...common, booking_type: 'STAY', room_type_id: 3, check_in_date: future,
    check_out_date: '2099-01-04', room_quantity: 2, guest_count: 3 };
  const ticket = { ...common, booking_type: 'TICKET', ticket_type_id: 4, use_date: future, ticket_quantity: 2 };
  const table = { ...common, booking_type: 'TABLE', booking_date: future, arrival_time: '18:30', guest_count: 2 };
  for (const data of [stay, ticket, table]) assert.equal(bookingSchema.safeParse(data).success, true);
  for (const extra of [{ price: 1 }, { total_amount: 1 }, { user_id: 1 }])
    assert.equal(bookingSchema.safeParse({ ...stay, ...extra }).success, false);
  assert.equal(bookingSchema.safeParse({ ...stay, check_out_date: stay.check_in_date }).success, false);
  assert.equal(bookingSchema.safeParse({ ...stay, room_quantity: 0 }).success, false);
  assert.equal(bookingSchema.safeParse({ ...ticket, ticket_quantity: 1.5 }).success, false);
  assert.equal(bookingSchema.safeParse({ ...table, arrival_time: '25:00' }).success, false);
  assert.equal(bookingSchema.safeParse({ ...ticket, place_id: 0 }).success, false);
  const hash = x => createHash('sha256').update(JSON.stringify(normalizeBooking(x))).digest('hex');
  assert.equal(hash(stay), hash(Object.fromEntries(Object.entries(stay).reverse())));
});

test('production request without authentication returns 401', async () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let status;
  let body;
  const response = { status(n) { status = n; return this; }, json(value) { body = value; } };
  await mockAuth({ header: () => '1' }, response, () => assert.fail('must not call next'));
  assert.equal(status, 401);
  assert.equal(body.message, 'Authentication required');
  if (before === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before;
});

test('HTTP validation and in-memory rate limit', async () => {
  const express = require('express');
  const savedPool = db.getPool;
  const savedNodeEnv = process.env.NODE_ENV;
  const savedMock = process.env.ENABLE_MOCK_AUTH;
  db.getPool = () => ({ request: () => ({ input() { return this; }, async query() { return { recordset: [{ user_id: 7 }] }; } }) });
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_MOCK_AUTH = 'true';
  const app = express();
  app.use(express.json());
  app.use('/api/bookings', require('../dist/modules/bookings/bookings.routes').default);
  const server = app.listen(0);
  try {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}/api/bookings`;
    const send = headers => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Test-User-Id': '7', ...headers }, body: '{}' });
    assert.equal((await send({})).status, 400);
    for (let i = 0; i < 9; i++) assert.equal((await send({ 'Idempotency-Key': `bad-${i}` })).status, 400);
    assert.equal((await send({ 'Idempotency-Key': 'over-limit' })).status, 429);
  } finally {
    server.close();
    db.getPool = savedPool;
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = savedNodeEnv;
    if (savedMock === undefined) delete process.env.ENABLE_MOCK_AUTH; else process.env.ENABLE_MOCK_AUTH = savedMock;
  }
});
