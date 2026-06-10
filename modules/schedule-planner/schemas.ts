import { z } from "zod";

export const schedulePlannerPeriodSchema = z.object({
  locationId: z.string().trim().min(1, "Выберите рабочую точку"),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export const createSchedulePlanSchema = schedulePlannerPeriodSchema.extend({
  title: z.string().trim().max(160).optional()
});

export const schedulePlanCellTypeSchema = z.enum([
  "shift",
  "day_off",
  "vacation",
  "sick_leave",
  "business_trip",
  "empty"
]);

export const updateSchedulePlanCellSchema = z.object({
  cellType: schedulePlanCellTypeSchema,
  shiftTemplateId: z.string().trim().min(1).optional(),
  comment: z.string().trim().max(500).optional().or(z.literal(""))
}).superRefine((data, context) => {
  if (data.cellType === "shift" && !data.shiftTemplateId) {
    context.addIssue({
      code: "custom",
      path: ["shiftTemplateId"],
      message: "Выберите смену"
    });
  }
});

export const bulkUpdateSchedulePlanCellsSchema = z.object({
  employeeIds: z.array(z.string().trim().min(1)).optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  applyToWeekdays: z.boolean().optional(),
  applyToWeekends: z.boolean().optional(),
  cellType: schedulePlanCellTypeSchema,
  shiftTemplateId: z.string().trim().min(1).optional(),
  comment: z.string().trim().max(500).optional().or(z.literal(""))
}).superRefine((data, context) => {
  if (data.cellType === "shift" && !data.shiftTemplateId) {
    context.addIssue({
      code: "custom",
      path: ["shiftTemplateId"],
      message: "Выберите смену"
    });
  }
  if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
    context.addIssue({
      code: "custom",
      path: ["dateTo"],
      message: "Дата окончания должна быть не раньше даты начала"
    });
  }
});

export const submitSchedulePlanSchema = z.object({
  confirmWarnings: z.boolean().optional()
});

export const returnSchedulePlanSchema = z.object({
  comment: z.string().trim().min(1, "Укажите причину возврата").max(1000, "Комментарий должен быть короче 1000 символов")
});
