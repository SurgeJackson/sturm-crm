import { z } from "zod";
import { normalizeTimeEventType } from "@/modules/time-clock/utils";

export const deviceInputSchema = z.object({
  deviceId: z.string().trim().min(12).max(160),
  deviceName: z.string().trim().max(120).optional()
});

export const markTimeSchema = z.object({
  token: z.string().trim().min(16),
  type: z.string().transform((value, context) => {
    const type = normalizeTimeEventType(value);
    if (!type || (type !== "CHECK_IN" && type !== "CHECK_OUT")) {
      context.addIssue({ code: "custom", message: "Недопустимый тип отметки" });
      return z.NEVER;
    }
    return type;
  }),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  accuracy: z.coerce.number().positive().max(10_000).optional(),
  clientTime: z.string().trim().optional(),
  deviceId: z.string().trim().min(12).max(160),
  deviceName: z.string().trim().max(120).optional()
}).superRefine((data, context) => {
  const geoValues = [data.latitude, data.longitude, data.accuracy];
  const hasAnyGeoValue = geoValues.some((value) => value !== undefined);
  const hasAllGeoValues = geoValues.every((value) => value !== undefined);
  if (hasAnyGeoValue && !hasAllGeoValues) {
    context.addIssue({
      code: "custom",
      message: "Передайте широту, долготу и точность вместе"
    });
  }
});

export const workLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Укажите название").max(160),
  code: z.string().trim().min(2, "Укажите код").max(80).regex(/^[a-z0-9-]+$/, "Код может содержать латиницу, цифры и дефис"),
  address: z.string().trim().min(3, "Укажите адрес").max(240),
  latitude: z.coerce.number().min(-90, "Некорректная широта").max(90, "Некорректная широта"),
  longitude: z.coerce.number().min(-180, "Некорректная долгота").max(180, "Некорректная долгота"),
  allowedRadiusMeters: z.coerce.number().int().positive("Радиус должен быть больше 0").max(10_000),
  maxAllowedAccuracyMeters: z.coerce.number().int().positive("Погрешность должна быть больше 0").max(10_000),
  timezone: z.string().trim().min(2).max(80).default("Europe/Moscow"),
  isActive: z.coerce.boolean().default(true)
});

export const workShiftSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().trim().min(1, "Выберите сотрудника"),
  locationId: z.string().trim().min(1, "Выберите точку"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату"),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/, "Укажите начало"),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/, "Укажите окончание"),
  breakMinutes: z.coerce.number().int().min(0).max(600).default(0)
});

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Укажите время в формате ЧЧ:ММ").refine((value) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}, "Укажите корректное время");

export const shiftTemplateSchema = z.object({
  id: z.string().optional(),
  locationId: z.string().trim().min(1, "Выберите рабочую точку"),
  name: z.string().trim().min(2, "Укажите название смены").max(120),
  code: z.string().trim().min(1, "Укажите код").max(40).regex(/^[a-z0-9-]+$/, "Код может содержать латиницу, цифры и дефис"),
  startsAt: timeSchema,
  endsAt: timeSchema,
  breakMinutes: z.coerce.number().int().min(0, "Обед не может быть отрицательным").max(600),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Укажите цвет в формате #RRGGBB").optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0)
}).superRefine((data, context) => {
  if (timeToMinutes(data.endsAt) <= timeToMinutes(data.startsAt)) {
    context.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "Окончание должно быть позже начала"
    });
  }
});

export const setupTokenSchema = z.object({
  locationId: z.string().trim().min(1),
  expiresInMinutes: z.coerce.number().int().positive().max(60).optional()
});

export const displaySetupSchema = z.object({
  setupToken: z.string().trim().min(16),
  deviceId: z.string().trim().min(12).max(160),
  deviceName: z.string().trim().min(2).max(120),
  fingerprintHash: z.string().trim().min(16).max(160)
});

export const displayQrSchema = z.object({
  deviceId: z.string().trim().min(12).max(160)
});

export const reviewEventSchema = z.object({
  comment: z.string().trim().max(500).optional(),
  overrideOccurredAt: z.string().trim().optional()
});

export const rejectEventSchema = z.object({
  comment: z.string().trim().min(3, "Комментарий обязателен").max(500)
});

export const adjustmentRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату"),
  eventType: z.string().transform((value, context) => {
    const type = normalizeTimeEventType(value);
    if (!type || (type !== "CHECK_IN" && type !== "CHECK_OUT")) {
      context.addIssue({ code: "custom", message: "Выберите тип отметки" });
      return z.NEVER;
    }
    return type;
  }),
  requestedOccurredAt: z.string().trim().min(1, "Укажите время"),
  comment: z.string().trim().min(5, "Опишите причину").max(500)
});

export const reviewAdjustmentSchema = z.object({
  comment: z.string().trim().max(500).optional()
});

export function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
