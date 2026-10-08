import { createHash } from 'node:crypto';
import { getPool, sql } from '../../config/db';
import type { BookingInput } from './bookings.validation';
import { normalizeBooking } from './bookings.validation';

export class BookingError extends Error {
  constructor(public readonly status: 400 | 404 | 409, message: string) { super(message); }
}

export type BookingResponse = { booking_id: number; booking_type: BookingInput['booking_type']; status: 'PENDING'; total_amount: number };

function daysBetween(start: string, end: string): number {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
}

export async function createBooking(userId: number, key: string, input: BookingInput): Promise<{ status: 200 | 201; body: BookingResponse }> {
  const canonical = normalizeBooking(input);
  const hash = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  const tx = new sql.Transaction(getPool());
  await tx.begin();
  try {
    // Transaction-owned per-user lock serializes both replay and the pending-booking limit.
    const lock = await new sql.Request(tx).input('resource', sql.NVarChar(255), `booking-user:${userId}`)
      .query("DECLARE @result int; EXEC @result = sp_getapplock @Resource=@resource, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; SELECT @result AS result");
    if (lock.recordset[0].result < 0) throw new Error('Booking lock unavailable');

    const prior = await new sql.Request(tx).input('userId', sql.Int, userId).input('key', sql.NVarChar(128), key)
      .query('SELECT request_hash, response_status, response_body FROM dbo.idempotency_requests WHERE user_id=@userId AND idempotency_key=@key');
    if (prior.recordset.length) {
      const row = prior.recordset[0];
      if (row.request_hash !== hash) throw new BookingError(409, 'Idempotency-Key used with different payload');
      const body = JSON.parse(row.response_body) as BookingResponse;
      await tx.commit();
      return { status: 200, body };
    }

    const count = await new sql.Request(tx).input('userId', sql.Int, userId)
      .query("SELECT COUNT(*) AS n FROM dbo.bookings WHERE user_id=@userId AND status='PENDING'");
    if (count.recordset[0].n >= 3) throw new BookingError(409, 'Pending booking limit reached');

    const placeType = input.booking_type === 'STAY' ? 'ACCOMMODATION' : input.booking_type === 'TICKET' ? 'ATTRACTION' : 'RESTAURANT';
    const place = await new sql.Request(tx).input('placeId', sql.Int, input.place_id).input('placeType', sql.VarChar(20), placeType)
      .query("SELECT place_id FROM dbo.places WHERE place_id=@placeId AND place_type=@placeType AND status='ACTIVE'");
    if (!place.recordset.length) throw new BookingError(404, 'Service not found');

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    let unitPrice = 0;
    let quantity = 1;
    let total = 0;
    if (input.booking_type === 'STAY') {
      if (input.check_in_date < today || daysBetween(input.check_in_date, input.check_out_date) < 1)
        throw new BookingError(400, 'Invalid stay dates');
      const room = await new sql.Request(tx).input('placeId', sql.Int, input.place_id).input('roomTypeId', sql.Int, input.room_type_id)
        .query("SELECT price_per_night, capacity, total_rooms FROM dbo.room_types WHERE room_type_id=@roomTypeId AND place_id=@placeId AND status='ACTIVE'");
      if (!room.recordset.length) throw new BookingError(404, 'Service not found');
      const r = room.recordset[0];
      if (r.total_rooms === null || r.capacity === null) throw new BookingError(409, 'Room capacity not configured');
      if (input.room_quantity > r.total_rooms || input.guest_count > r.capacity * input.room_quantity)
        throw new BookingError(409, 'Requested room capacity unavailable');
      const occupied = await new sql.Request(tx).input('roomTypeId', sql.Int, input.room_type_id)
        .input('start', sql.Date, new Date(`${input.check_in_date}T00:00:00Z`))
        .input('end', sql.Date, new Date(`${input.check_out_date}T00:00:00Z`))
        .query("SELECT COALESCE(SUM(i.quantity),0) AS n FROM dbo.booking_items i JOIN dbo.bookings b ON b.booking_id=i.booking_id WHERE b.status='CONFIRMED' AND i.room_type_id=@roomTypeId AND i.check_in < @end AND i.check_out > @start");
      if (Number(occupied.recordset[0].n) + input.room_quantity > r.total_rooms)
        throw new BookingError(409, 'Requested room capacity unavailable');
      unitPrice = Number(r.price_per_night);
      quantity = input.room_quantity;
      total = unitPrice * quantity * daysBetween(input.check_in_date, input.check_out_date);
    } else if (input.booking_type === 'TICKET') {
      if (input.use_date < today) throw new BookingError(400, 'Invalid use date');
      const ticket = await new sql.Request(tx).input('placeId', sql.Int, input.place_id).input('ticketTypeId', sql.Int, input.ticket_type_id)
        .query("SELECT price, daily_capacity FROM dbo.ticket_types WHERE ticket_type_id=@ticketTypeId AND place_id=@placeId AND status='ACTIVE'");
      if (!ticket.recordset.length) throw new BookingError(404, 'Service not found');
      const t = ticket.recordset[0];
      if (t.daily_capacity === null) throw new BookingError(409, 'Ticket capacity not configured');
      if (input.ticket_quantity > t.daily_capacity) throw new BookingError(409, 'Requested ticket capacity unavailable');
      const sold = await new sql.Request(tx).input('ticketTypeId', sql.Int, input.ticket_type_id)
        .input('date', sql.Date, new Date(`${input.use_date}T00:00:00Z`))
        .query("SELECT COALESCE(SUM(i.quantity),0) AS n FROM dbo.booking_items i JOIN dbo.bookings b ON b.booking_id=i.booking_id WHERE b.status='CONFIRMED' AND i.ticket_type_id=@ticketTypeId AND i.visit_date=@date");
      if (Number(sold.recordset[0].n) + input.ticket_quantity > t.daily_capacity)
        throw new BookingError(409, 'Requested ticket capacity unavailable');
      unitPrice = Number(t.price);
      quantity = input.ticket_quantity;
      total = unitPrice * quantity;
    } else {
      if (input.booking_date < today) throw new BookingError(400, 'Invalid booking date');
      const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
      if (input.booking_date === today && input.arrival_time <= currentTime)
        throw new BookingError(400, 'Arrival time must be in the future');
      const restaurant = await new sql.Request(tx).input('placeId', sql.Int, input.place_id)
        .query('SELECT seating_capacity FROM dbo.restaurants WHERE place_id=@placeId');
      if (!restaurant.recordset.length) throw new BookingError(404, 'Service not found');
      const seats = restaurant.recordset[0].seating_capacity;
      if (seats === null) throw new BookingError(409, 'Table capacity not configured');
      if (input.guest_count > seats) throw new BookingError(409, 'Requested table capacity unavailable');
      const seated = await new sql.Request(tx).input('placeId', sql.Int, input.place_id)
        .input('date', sql.Date, new Date(`${input.booking_date}T00:00:00Z`))
        .input('time', sql.Time, new Date(`1970-01-01T${input.arrival_time}:00Z`))
        .query("SELECT COALESCE(SUM(i.party_size),0) AS n FROM dbo.booking_items i JOIN dbo.bookings b ON b.booking_id=i.booking_id WHERE b.status='CONFIRMED' AND b.place_id=@placeId AND i.visit_date=@date AND i.arrival_time=@time");
      if (Number(seated.recordset[0].n) + input.guest_count > seats)
        throw new BookingError(409, 'Requested table capacity unavailable');
    }
    const cents = Math.round(total * 100);
    if (!Number.isSafeInteger(cents) || Math.abs(total * 100 - cents) > 0.000001 || total < 0)
      throw new BookingError(409, 'Price cannot be represented safely');
    total = cents / 100;

    const booking = await new sql.Request(tx)
      .input('userId', sql.Int, userId).input('placeId', sql.Int, input.place_id)
      .input('type', sql.NVarChar(20), input.booking_type).input('total', sql.Decimal(18, 2), total)
      .input('name', sql.NVarChar(100), input.contact_name).input('phone', sql.NVarChar(20), input.contact_phone)
      .input('note', sql.NVarChar(500), input.note ?? null)
      .query("INSERT dbo.bookings(user_id,place_id,booking_type,status,total_amount,contact_name,contact_phone,note) OUTPUT INSERTED.booking_id VALUES(@userId,@placeId,@type,'PENDING',@total,@name,@phone,@note)");
    const bookingId = booking.recordset[0].booking_id as number;
    const item = new sql.Request(tx).input('bookingId', sql.Int, bookingId)
      .input('roomTypeId', sql.Int, input.booking_type === 'STAY' ? input.room_type_id : null)
      .input('ticketTypeId', sql.Int, input.booking_type === 'TICKET' ? input.ticket_type_id : null)
      .input('quantity', sql.Int, quantity).input('price', sql.Decimal(18, 2), unitPrice)
      .input('checkIn', sql.Date, input.booking_type === 'STAY' ? new Date(`${input.check_in_date}T00:00:00Z`) : null)
      .input('checkOut', sql.Date, input.booking_type === 'STAY' ? new Date(`${input.check_out_date}T00:00:00Z`) : null)
      .input('visitDate', sql.Date, input.booking_type === 'TICKET' ? new Date(`${input.use_date}T00:00:00Z`) : input.booking_type === 'TABLE' ? new Date(`${input.booking_date}T00:00:00Z`) : null)
      .input('arrivalTime', sql.Time, input.booking_type === 'TABLE' ? new Date(`1970-01-01T${input.arrival_time}:00Z`) : null)
      .input('partySize', sql.Int, input.booking_type === 'STAY' || input.booking_type === 'TABLE' ? input.guest_count : null);
    await item.query('INSERT dbo.booking_items(booking_id,room_type_id,ticket_type_id,quantity,unit_price,check_in,check_out,visit_date,arrival_time,party_size) VALUES(@bookingId,@roomTypeId,@ticketTypeId,@quantity,@price,@checkIn,@checkOut,@visitDate,@arrivalTime,@partySize)');
    const body: BookingResponse = { booking_id: bookingId, booking_type: input.booking_type, status: 'PENDING', total_amount: total };
    await new sql.Request(tx).input('userId', sql.Int, userId).input('key', sql.NVarChar(128), key)
      .input('hash', sql.Char(64), hash).input('body', sql.NVarChar(sql.MAX), JSON.stringify(body))
      .query('INSERT dbo.idempotency_requests(user_id,idempotency_key,request_hash,response_status,response_body) VALUES(@userId,@key,@hash,201,@body)');
    await tx.commit();
    return { status: 201, body };
  } catch (error) {
    try { await tx.rollback(); } catch (rollbackError) {
      const code = (rollbackError as { code?: string }).code;
      if (code !== 'EABORT') console.error('Booking rollback failed', code ?? 'unknown');
    }
    throw error;
  }
}
