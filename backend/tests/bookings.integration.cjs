const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { connectDB, closeDB } = require('../dist/config/db');
const { createBooking, BookingError } = require('../dist/modules/bookings/bookings.service');

test('SQL Server create, replay, concurrency, pending limit and rollback', { skip: process.env.BOOKING_INTEGRATION !== 'true' }, async () => {
  await connectDB();
  const pool = require('../dist/config/db').getPool();
  const ids = { places: [], bookings: [] };
  const query = (text, inputs = {}) => {
    const request = pool.request();
    for (const [name, value] of Object.entries(inputs)) request.input(name, value);
    return request.query(text);
  };
  let triggerCreated = false;
  try {
    const role = (await query('SELECT TOP 1 role_id FROM dbo.roles ORDER BY role_id')).recordset[0].role_id;
    const user = await query("INSERT dbo.users(role_id,full_name,email,password_hash,status) OUTPUT INSERTED.user_id VALUES(@role,'Booking test',@email,'test','ACTIVE')", { role, email: `${randomUUID()}@example.test` });
    ids.user = user.recordset[0].user_id;
    for (const type of ['ACCOMMODATION', 'ATTRACTION', 'RESTAURANT']) {
      const place = await query("INSERT dbo.places(place_type,name,status) OUTPUT INSERTED.place_id VALUES(@type,@name,'ACTIVE')", { type, name: `Booking test ${randomUUID()}` });
      ids.places.push(place.recordset[0].place_id);
    }
    const [stayPlace, ticketPlace, tablePlace] = ids.places;
    await query("INSERT dbo.accommodations(place_id,place_type,accommodation_type,accepts_cash,accepts_bank_transfer) VALUES(@id,'ACCOMMODATION','HOTEL',1,1)", { id: stayPlace });
    await query("INSERT dbo.attractions(place_id,place_type,ticket_price) VALUES(@id,'ATTRACTION',0)", { id: ticketPlace });
    await query("INSERT dbo.restaurants(place_id,place_type,seating_capacity) VALUES(@id,'RESTAURANT',20)", { id: tablePlace });
    const room = await query("INSERT dbo.room_types(place_id,name,capacity,price_per_night,status,total_rooms) OUTPUT INSERTED.room_type_id VALUES(@id,'Test room',2,100,'ACTIVE',5)", { id: stayPlace });
    ids.room = room.recordset[0].room_type_id;
    const ticket = await query("INSERT dbo.ticket_types(place_id,name,price,daily_capacity,status) OUTPUT INSERTED.ticket_type_id VALUES(@id,'Test ticket',50.25,20,'ACTIVE')", { id: ticketPlace });
    ids.ticket = ticket.recordset[0].ticket_type_id;
    const common = { contact_name: 'Test', contact_phone: '0912345678' };
    const stay = { ...common, booking_type: 'STAY', place_id: stayPlace, room_type_id: ids.room, check_in_date: '2099-01-02', check_out_date: '2099-01-04', room_quantity: 2, guest_count: 3 };
    const ticketInput = { ...common, booking_type: 'TICKET', place_id: ticketPlace, ticket_type_id: ids.ticket, use_date: '2099-01-02', ticket_quantity: 2 };
    const table = { ...common, booking_type: 'TABLE', place_id: tablePlace, booking_date: '2099-01-02', arrival_time: '18:30', guest_count: 2 };
    const created = await createBooking(ids.user, 'stay', stay);
    assert.equal(created.status, 201);
    assert.equal(created.body.total_amount, 400);
    assert.equal((await createBooking(ids.user, 'stay', stay)).status, 200);
    await assert.rejects(createBooking(ids.user, 'stay', { ...stay, room_quantity: 1 }), e => e instanceof BookingError && e.status === 409);
    const parallel = await Promise.all([createBooking(ids.user, 'ticket', ticketInput), createBooking(ids.user, 'ticket', ticketInput)]);
    assert.deepEqual(parallel.map(x => x.status).sort(), [200, 201]);
    assert.equal(parallel[0].body.booking_id, parallel[1].body.booking_id);
    assert.equal(parallel[0].body.total_amount, 100.5);
    await assert.rejects(createBooking(ids.user, 'missing-service', { ...ticketInput, ticket_type_id: 2147483647 }), e => e instanceof BookingError && e.status === 404);
    await assert.rejects(createBooking(ids.user, 'bad-date', { ...ticketInput, use_date: '2020-01-01' }), e => e instanceof BookingError && e.status === 400);
    await assert.rejects(createBooking(ids.user, 'capacity', { ...stay, room_quantity: 6 }), e => e instanceof BookingError && e.status === 409);
    assert.equal((await createBooking(ids.user, 'table', table)).body.total_amount, 0);
    assert.equal((await createBooking(ids.user, 'stay', stay)).status, 200); // replay precedes quota
    const count = await query("SELECT COUNT(*) AS n FROM dbo.bookings WHERE user_id=@id AND status='PENDING'", { id: ids.user });
    assert.equal(count.recordset[0].n, 3);
    const payment = await query('SELECT COUNT(*) AS n FROM dbo.payments WHERE booking_id IN (SELECT booking_id FROM dbo.bookings WHERE user_id=@id)', { id: ids.user });
    assert.equal(payment.recordset[0].n, 0);

    await query('DELETE dbo.booking_items WHERE booking_id=@id', { id: created.body.booking_id });
    await query('DELETE dbo.bookings WHERE booking_id=@id', { id: created.body.booking_id });
    const competing = await Promise.allSettled([createBooking(ids.user, 'fourth', table), createBooking(ids.user, 'fifth', table)]);
    assert.equal(competing.filter(x => x.status === 'fulfilled' && x.value.status === 201).length, 1);
    assert.equal(competing.filter(x => x.status === 'rejected' && x.reason.status === 409).length, 1);
    const winner = competing.find(x => x.status === 'fulfilled').value.body.booking_id;
    assert.equal((await query("SELECT COUNT(*) AS n FROM dbo.bookings WHERE user_id=@id AND status='PENDING'", { id: ids.user })).recordset[0].n, 3);
    await query('DELETE dbo.booking_items WHERE booking_id=@id', { id: winner });
    await query('DELETE dbo.bookings WHERE booking_id=@id', { id: winner });
    await query(`CREATE TRIGGER dbo.test_booking_item_rollback ON dbo.booking_items AFTER INSERT AS BEGIN IF EXISTS (SELECT 1 FROM inserted i JOIN dbo.bookings b ON b.booking_id=i.booking_id WHERE b.user_id=${ids.user}) THROW 51000, 'Test rollback', 1; END`);
    triggerCreated = true;
    await assert.rejects(createBooking(ids.user, 'rollback', stay));
    const after = await query('SELECT COUNT(*) AS n FROM dbo.bookings WHERE user_id=@id', { id: ids.user });
    assert.equal(after.recordset[0].n, 2);
    const key = await query("SELECT COUNT(*) AS n FROM dbo.idempotency_requests WHERE user_id=@id AND idempotency_key='rollback'", { id: ids.user });
    assert.equal(key.recordset[0].n, 0);
  } finally {
    if (triggerCreated) await query('DROP TRIGGER dbo.test_booking_item_rollback');
    if (ids.user) {
      await query('DELETE dbo.idempotency_requests WHERE user_id=@id', { id: ids.user });
      await query('DELETE dbo.booking_items WHERE booking_id IN (SELECT booking_id FROM dbo.bookings WHERE user_id=@id)', { id: ids.user });
      await query('DELETE dbo.bookings WHERE user_id=@id', { id: ids.user });
    }
    if (ids.room) await query('DELETE dbo.room_types WHERE room_type_id=@id', { id: ids.room });
    if (ids.ticket) await query('DELETE dbo.ticket_types WHERE ticket_type_id=@id', { id: ids.ticket });
    for (const [table, placeId] of [['accommodations', ids.places[0]], ['attractions', ids.places[1]], ['restaurants', ids.places[2]]]) {
      if (placeId) await query(`DELETE dbo.${table} WHERE place_id=@id`, { id: placeId });
    }
    for (const placeId of ids.places) await query('DELETE dbo.places WHERE place_id=@id', { id: placeId });
    if (ids.user) await query('DELETE dbo.users WHERE user_id=@id', { id: ids.user });
    await closeDB();
  }
});
