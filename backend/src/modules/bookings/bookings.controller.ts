import type { RequestHandler } from 'express';
import { bookingSchema } from './bookings.validation';
import { BookingError, createBooking } from './bookings.service';

export const postBooking: RequestHandler = async (req, res) => {
  const key = req.header('Idempotency-Key');
  if (!key || key.length > 128 || !/^[\x21-\x7e]+$/.test(key)) {
    res.status(400).json({ message: 'Valid Idempotency-Key required' });
    return;
  }
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid booking request', issues: parsed.error.issues });
    return;
  }
  try {
    const result = await createBooking(res.locals.userId as number, key, parsed.data);
    res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof BookingError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('Booking creation failed', error instanceof Error ? error.name : 'Unknown error');
    res.status(500).json({ message: 'Internal server error' });
  }
};
