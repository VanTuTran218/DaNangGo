import { Router } from 'express';
import type { ErrorRequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { mockAuth } from '../../middleware/mockAuth.middleware';
import { postBooking } from './bookings.controller';

const router = Router();
const bookingLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { message: 'Too many booking requests' } });

router.post('/', mockAuth, bookingLimit, postBooking);
const bookingError: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Booking request failed', error instanceof Error ? error.name : 'Unknown error');
  res.status(500).json({ message: 'Internal server error' });
};
router.use(bookingError);
export default router;
