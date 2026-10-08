import { z } from 'zod';

const date = z.iso.date();
const positiveId = z.number().int().positive();
const quantity = z.number().int().min(1).max(100);
const common = {
  place_id: positiveId,
  contact_name: z.string().trim().min(1).max(100),
  contact_phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/),
  note: z.string().trim().max(500).optional(),
};

export const bookingSchema = z.discriminatedUnion('booking_type', [
  z.strictObject({ ...common, booking_type: z.literal('STAY'), room_type_id: positiveId,
    check_in_date: date, check_out_date: date, room_quantity: quantity, guest_count: quantity })
    .refine(v => v.check_out_date > v.check_in_date, { path: ['check_out_date'], message: 'Must be after check_in_date' }),
  z.strictObject({ ...common, booking_type: z.literal('TICKET'), ticket_type_id: positiveId,
    use_date: date, ticket_quantity: quantity }),
  z.strictObject({ ...common, booking_type: z.literal('TABLE'), booking_date: date,
    arrival_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), guest_count: quantity }),
]);

export type BookingInput = z.infer<typeof bookingSchema>;

export function normalizeBooking(input: BookingInput): BookingInput {
  const ordered = Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
  return ordered as BookingInput;
}
