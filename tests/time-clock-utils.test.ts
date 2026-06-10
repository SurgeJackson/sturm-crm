import { describe, expect, it } from "vitest";
import { markTimeSchema, shiftTemplateSchema } from "@/modules/time-clock/schemas";
import {
  bulkUpdateSchedulePlanCellsSchema,
  createSchedulePlanSchema,
  returnSchedulePlanSchema,
  submitSchedulePlanSchema
} from "@/modules/schedule-planner/schemas";
import { timesheetDayStatusLabels } from "@/lib/constants/time-clock";
import { getMonthDays } from "@/modules/schedule-planner/utils";
import { getDateKey, getDistanceMeters, nextSuggestedAction, publicTimeEventType } from "@/modules/time-clock/utils";

describe("time clock utilities", () => {
  it("calculates distance in meters with haversine formula", () => {
    const distance = getDistanceMeters(55.751244, 37.618423, 55.751244, 37.619423);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(80);
  });

  it("returns the next allowed check action", () => {
    expect(nextSuggestedAction([])).toBe("check_in");
    expect(nextSuggestedAction([{ type: "CHECK_IN" }])).toBe("check_out");
    expect(nextSuggestedAction([{ type: "CHECK_IN" }, { type: "CHECK_OUT" }])).toBe("none");
  });

  it("formats date keys in requested timezone", () => {
    expect(getDateKey(new Date("2026-06-08T21:30:00.000Z"), "Europe/Moscow")).toBe("2026-06-09");
  });

  it("maps internal event types to public API values", () => {
    expect(publicTimeEventType("CHECK_IN")).toBe("check_in");
    expect(publicTimeEventType("CHECK_OUT")).toBe("check_out");
  });

  it("allows QR marks without browser geolocation", () => {
    const parsed = markTimeSchema.safeParse({
      token: "xCl03lUsbTqJn5A3ePEjpLV15iMbFmCMh3aCtPngAuA",
      type: "check_in",
      clientTime: "2026-06-08T10:00:00.000Z",
      deviceId: "device-id-for-mobile-test"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects partial geolocation payloads", () => {
    const parsed = markTimeSchema.safeParse({
      token: "xCl03lUsbTqJn5A3ePEjpLV15iMbFmCMh3aCtPngAuA",
      type: "check_in",
      latitude: 55.751244,
      deviceId: "device-id-for-mobile-test"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid shift templates", () => {
    const parsed = shiftTemplateSchema.safeParse({
      locationId: "seed_work_location_showroom_1",
      name: "10-19",
      code: "10-19",
      startsAt: "10:00",
      endsAt: "19:00",
      breakMinutes: 60,
      color: "#2563eb",
      isActive: true,
      sortOrder: 10
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid shift template time ranges and breaks", () => {
    const parsed = shiftTemplateSchema.safeParse({
      locationId: "seed_work_location_showroom_1",
      name: "Ночная",
      code: "night",
      startsAt: "19:00",
      endsAt: "10:00",
      breakMinutes: -1,
      color: "#2563eb",
      isActive: true,
      sortOrder: 10
    });

    expect(parsed.success).toBe(false);
  });

  it("builds calendar days for schedule planning months", () => {
    const days = getMonthDays(2026, 7);

    expect(days).toHaveLength(31);
    expect(days[0]).toMatchObject({ date: "2026-07-01", day: 1, isWeekend: false });
    expect(days[4]).toMatchObject({ date: "2026-07-05", day: 5, isWeekend: true });
  });

  it("validates schedule plan creation params", () => {
    const parsed = createSchedulePlanSchema.safeParse({
      locationId: "seed_work_location_showroom_1",
      year: "2026",
      month: "7"
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.year).toBe(2026);
      expect(parsed.data.month).toBe(7);
    }
  });

  it("validates schedule bulk update params", () => {
    const parsed = bulkUpdateSchedulePlanCellsSchema.safeParse({
      employeeIds: ["seed_employee_seed_owner"],
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      applyToWeekdays: true,
      cellType: "day_off"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects schedule bulk updates with inverted date ranges", () => {
    const parsed = bulkUpdateSchedulePlanCellsSchema.safeParse({
      dateFrom: "2026-07-31",
      dateTo: "2026-07-01",
      cellType: "day_off"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts schedule submit warning confirmation", () => {
    const parsed = submitSchedulePlanSchema.safeParse({ confirmWarnings: true });

    expect(parsed.success).toBe(true);
  });

  it("requires return comment for schedule revision returns", () => {
    expect(returnSchedulePlanSchema.safeParse({ comment: "Исправить пустые дни" }).success).toBe(true);
    expect(returnSchedulePlanSchema.safeParse({ comment: "" }).success).toBe(false);
  });

  it("labels non-working schedule statuses in timesheet", () => {
    expect(timesheetDayStatusLabels.DAY_OFF).toBe("Выходной");
    expect(timesheetDayStatusLabels.VACATION).toBe("Отпуск");
    expect(timesheetDayStatusLabels.SICK_LEAVE).toBe("Больничный");
    expect(timesheetDayStatusLabels.BUSINESS_TRIP).toBe("Командировка");
  });
});
