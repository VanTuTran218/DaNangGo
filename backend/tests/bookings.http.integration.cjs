const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { connectDB, closeDB } = require('../dist/config/db');

test('live POST /api/bookings against SQL Server', { skip: process.env.BOOKING_INTEGRATION !== 'true' }, async () => {
  const pool = await connectDB();
  const query = (text, inputs = {}) => {
    const request = pool.request();
    for (const [name, value] of Object.entries(inputs)) request.input(name, value);
    return request.query(text);
  };
  const ids = { places: [] };
  let child;
  try {
    const role = (await query('SELECT TOP 1 role_id FROM dbo.roles ORDER BY role_id')).recordset[0].role_id;
    ids.user = (await query("INSERT dbo.users(role_id,full_name,email,password_hash,status) OUTPUT INSERTED.user_id VALUES(@role,'HTTP test',@email,'test','ACTIVE')", { role, email: `${randomUUID()}@example.test` })).recordset[0].user_id;
    for (const type of ['ACCOMMODATION', 'ATTRACTION', 'RESTAURANT']) {
      ids.places.push((await query("INSERT dbo.places(place_type,name,status) OUTPUT INSERTED.place_id VALUES(@type,@name,'ACTIVE')", { type, name: `HTTP test ${randomUUID()}` })).recordset[0].place_id);
    }
    const [stayPlace, ticketPlace, tablePlace] = ids.places;
    await query("INSERT dbo.accommodations(place_id,place_type,accommodation_type,accepts_cash,accepts_bank_transfer) VALUES(@id,'ACCOMMODATION','HOTEL',1,1)", { id: stayPlace });
    await query("INSERT dbo.attractions(place_id,place_type,ticket_price) VALUES(@id,'ATTRACTION',0)", { id: ticketPlace });
    await query("INSERT dbo.restaurants(place_id,place_type,seating_capacity) VALUES(@id,'RESTAURANT',20)", { id: tablePlace });
    ids.room = (await query("INSERT dbo.room_types(place_id,name,capacity,price_per_night,status,total_rooms) OUTPUT INSERTED.room_type_id VALUES(@id,'HTTP room',2,100,'ACTIVE',5)", { id: stayPlace })).recordset[0].room_type_id;
    ids.ticket = (await query("INSERT dbo.ticket_types(place_id,name,price,daily_capacity,status) OUTPUT INSERTED.ticket_type_id VALUES(@id,'HTTP ticket',50.25,20,'ACTIVE')", { id: ticketPlace })).recordset[0].ticket_type_id;

    const port = await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once('error', reject);
      probe.listen(0, '127.0.0.1', () => { const p = probe.address().port; probe.close(() => resolve(p)); });
    });
    child = spawn(process.execPath, ['dist/index.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), NODE_ENV: 'test', ENABLE_MOCK_AUTH: 'true' }, stdio: 'ignore' });
    const url = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 50; i++) {
      if (child.exitCode !== null) throw new Error(`Backend exited: ${child.exitCode}`);
      try { ready = (await fetch(`${url}/api/health`)).ok; } catch { /* starting */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, 'backend health endpoint did not become ready');
    const post = async (key, body, authenticated = true) => {
      const headers = { 'Content-Type': 'application/json' };
      if (key) headers['Idempotency-Key'] = key;
      if (authenticated) headers['X-Test-User-Id'] = String(ids.user);
      const response = await fetch(`${url}/api/bookings`, { method: 'POST', headers, body: JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    const common = { contact_name: 'HTTP test', contact_phone: '0912345678' };
    const stay = { ...common, booking_type: 'STAY', place_id: stayPlace, room_type_id: ids.room, check_in_date: '2099-01-02', check_out_date: '2099-01-04', room_quantity: 2, guest_count: 3 };
    const ticket = { ...common, booking_type: 'TICKET', place_id: ticketPlace, ticket_type_id: ids.ticket, use_date: '2099-01-02', ticket_quantity: 2 };
    const table = { ...common, booking_type: 'TABLE', place_id: tablePlace, booking_date: '2099-01-02', arrival_time: '18:30', guest_count: 2 };
    assert.equal((await post('unauthenticated', stay, false)).status, 401);
    assert.equal((await post(null, stay)).status, 400);
    assert.equal((await post('client-price', { ...stay, price: 1, user_id: ids.user })).status, 400);
    assert.equal((await post('bad-date', { ...stay, check_out_date: stay.check_in_date })).status, 400);
    assert.equal((await post('missing-service', { ...stay, room_type_id: 2147483647 })).status, 404);
    const created = await post('stay', stay);
    assert.equal(created.status, 201);
    assert.deepEqual({ type: created.body.booking_type, state: created.body.status, total: created.body.total_amount }, { type: 'STAY', state: 'PENDING', total: 400 });
    const replay = await post('stay', Object.fromEntries(Object.entries(stay).reverse()));
    assert.equal(replay.status, 200);
    assert.equal(replay.body.booking_id, created.body.booking_id);
    assert.equal((await post('stay', { ...stay, room_quantity: 1 })).status, 409);
    const ticketResult = await post('ticket', ticket);
    assert.equal(ticketResult.status, 201);
    assert.equal(ticketResult.body.total_amount, 100.5);
    const tableResult = await post('table', table);
    assert.equal(tableResult.status, 201);
    assert.equal(tableResult.body.total_amount, 0);
    assert.equal((await post('quota', table)).status, 409);
    assert.equal((await post('rate-limit', table)).status, 429);
    const persisted = await query("SELECT COUNT(*) AS bookings, SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending FROM dbo.bookings WHERE user_id=@id", { id: ids.user });
    assert.deepEqual(persisted.recordset[0], { bookings: 3, pending: 3 });
    const payment = await query('SELECT COUNT(*) AS n FROM dbo.payments WHERE booking_id IN (SELECT booking_id FROM dbo.bookings WHERE user_id=@id)', { id: ids.user });
    assert.equal(payment.recordset[0].n, 0);
  } finally {
    if (child) child.kill();
    if (ids.user) {
      await query('DELETE dbo.idempotency_requests WHERE user_id=@id', { id: ids.user });
      await query('DELETE dbo.booking_items WHERE booking_id IN (SELECT booking_id FROM dbo.bookings WHERE user_id=@id)', { id: ids.user });
      await query('DELETE dbo.bookings WHERE user_id=@id', { id: ids.user });
    }
    if (ids.room) await query('DELETE dbo.room_types WHERE room_type_id=@id', { id: ids.room });
    if (ids.ticket) await query('DELETE dbo.ticket_types WHERE ticket_type_id=@id', { id: ids.ticket });
    for (const [table, id] of [['accommodations', ids.places[0]], ['attractions', ids.places[1]], ['restaurants', ids.places[2]]]) {
      if (id) await query(`DELETE dbo.${table} WHERE place_id=@id`, { id });
    }
    for (const id of ids.places) await query('DELETE dbo.places WHERE place_id=@id', { id });
    if (ids.user) await query('DELETE dbo.users WHERE user_id=@id', { id: ids.user });
    await closeDB();
  }
});
