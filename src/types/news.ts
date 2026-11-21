import { z } from "zod";

const localTextSchema = z.object({ en: z.string().min(1), ne: z.string().min(1) });
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}, "Expected a valid YYYY-MM-DD calendar date");

export const noticeSchema = z.object({
  id: z.string().min(1),
  title: localTextSchema,
  date: dateSchema,
  description: localTextSchema,
  category: z.enum(["notice", "announcement", "community"]),
  image: z.string().startsWith("/").optional(),
  status: z.enum(["published", "draft"]),
  demo: z.boolean().default(false),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  title: localTextSchema,
  type: z.enum(["festival", "jatra", "event", "other"]),
  date: dateSchema,
  endDate: dateSchema.optional(),
  description: localTextSchema,
  important: z.boolean().default(false),
  status: z.enum(["published", "draft"]),
  demo: z.boolean().default(false),
}).refine((event) => !event.endDate || event.endDate >= event.date, {
  message: "endDate must be the same as or later than date",
  path: ["endDate"],
});

export const newsPortalSchema = z.object({
  notices: z.array(noticeSchema),
  events: z.array(eventSchema),
});

export type Notice = z.infer<typeof noticeSchema>;
export type WardEvent = z.infer<typeof eventSchema>;
export type NewsPortalContent = z.infer<typeof newsPortalSchema>;
export type EventType = WardEvent["type"];
