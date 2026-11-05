import { z } from "zod";

const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:");
const date = z.iso.date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const sourced = { sourceUrl: httpsUrl, checkedOn: date };
export const stayDetailsSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    coordinates: z
      .object({
        latitude: z.number().min(15.8).max(16.5),
        longitude: z.number().min(107.8).max(108.6),
        note: z.string().min(1).max(250),
        ...sourced,
      })
      .strict()
      .optional(),
    hours: z
      .object({ checkIn: time, checkOut: time, ...sourced })
      .strict()
      .optional(),
    rooms: z
      .array(
        z
          .object({
            name: z.string().min(1).max(100),
            occupancyText: z.string().min(1).max(250),
            ...sourced,
          })
          .strict(),
      )
      .max(10),
    publicRates: z
      .array(
        z
          .object({
            roomName: z.string().min(1).max(100),
            nightlyVnd: z.number().int().positive(),
            includedGuests: z.number().int().positive().max(20),
            validFrom: date,
            validTo: date,
            conditions: z.string().min(1).max(500),
            ...sourced,
          })
          .strict()
          .refine(
            (rate) => rate.validFrom <= rate.validTo,
            "Khoảng hiệu lực không hợp lệ",
          ),
      )
      .max(10),
    notices: z.array(z.string().min(1).max(500)).max(10),
  })
  .strict();
export type StayDetails = z.infer<typeof stayDetailsSchema>;
export type ChatStayFacts = Omit<StayDetails, "key" | "coordinates">;

/** Public facts are not saleable inventory. Expired rates must never appear as current. */
export function publicStayFacts(
  json: string | null | undefined,
  today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }),
): ChatStayFacts | undefined {
  if (!json) return undefined;
  try {
    const parsed = stayDetailsSchema.parse(JSON.parse(json));
    const age = (checked: string) =>
      (Date.parse(today) - Date.parse(checked)) / 86400000;
    const fresh = (checked: string, days: number) =>
      age(checked) >= 0 && age(checked) <= days;
    const rates = parsed.publicRates.filter(
      (rate) =>
        fresh(rate.checkedOn, 30) &&
        rate.validFrom <= today &&
        today <= rate.validTo,
    );
    return {
      hours:
        parsed.hours && fresh(parsed.hours.checkedOn, 180)
          ? parsed.hours
          : undefined,
      rooms: parsed.rooms.filter((room) => fresh(room.checkedOn, 180)),
      publicRates: rates,
      notices: [
        ...parsed.notices,
        ...(rates.length < parsed.publicRates.length
          ? [
              "Bảng giá tham khảo đã hết hiệu lực hoặc cần đối chiếu lại; liên hệ cơ sở để lấy giá mới.",
            ]
          : []),
      ],
    };
  } catch {
    return undefined;
  }
}
