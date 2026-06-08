"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  canManageEmployeeDevices,
  canManageTimeAdjustments,
  canManageWorkLocations,
  canManageWorkShifts,
  canReviewTimeEvents
} from "@/permissions";
import {
  adjustmentRequestSchema,
  formValue,
  rejectEventSchema,
  reviewAdjustmentSchema,
  reviewEventSchema,
  workLocationSchema,
  workShiftSchema
} from "@/modules/time-clock/schemas";
import {
  approveAdjustmentRequest,
  approveTimeEvent,
  blockDisplayDevice,
  cancelWorkShift,
  changeEmployeeDeviceStatus,
  createAdjustmentRequest,
  createOrUpdateWorkShift,
  createWorkLocation,
  rejectAdjustmentRequest,
  rejectTimeEvent,
  revokeDisplayDevice,
  setWorkLocationActive,
  TimeClockServiceError,
  updateWorkLocation
} from "@/modules/time-clock/service";
import { combineDateAndTime } from "@/modules/time-clock/utils";

export type TimeClockActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

export async function saveWorkLocationAction(_prev: TimeClockActionState, formData: FormData): Promise<TimeClockActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageWorkLocations(user)) return { message: "Недостаточно прав для управления рабочими точками" };
  const parsed = workLocationSchema.safeParse({
    id: formValue(formData, "id"),
    name: formValue(formData, "name"),
    code: formValue(formData, "code"),
    address: formValue(formData, "address"),
    latitude: formValue(formData, "latitude"),
    longitude: formValue(formData, "longitude"),
    allowedRadiusMeters: formValue(formData, "allowedRadiusMeters"),
    maxAllowedAccuracyMeters: formValue(formData, "maxAllowedAccuracyMeters"),
    timezone: formValue(formData, "timezone") || "Europe/Moscow",
    isActive: formData.get("isActive") === "on"
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    const { id, ...data } = parsed.data;
    if (id) await updateWorkLocation(id, data, user.id);
    else await createWorkLocation(data, user.id);
  } catch (error) {
    if (error instanceof TimeClockServiceError) return { message: error.message };
    throw error;
  }
  redirect("/admin/work-locations?saved=1");
}

export async function saveWorkLocationDirectAction(formData: FormData) {
  const result = await saveWorkLocationAction({}, formData);
  if (result.message) redirect(`/admin/work-locations?error=${encodeURIComponent(result.message)}`);
  if (result.errors) redirect("/admin/work-locations?error=validation");
}

export async function toggleWorkLocationAction(id: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user || !canManageWorkLocations(user)) redirect("/admin/work-locations?error=permission");
  try {
    await setWorkLocationActive(id, isActive, user.id);
  } catch (error) {
    if (error instanceof TimeClockServiceError) redirect(`/admin/work-locations?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  redirect("/admin/work-locations?saved=1");
}

export async function saveWorkShiftAction(_prev: TimeClockActionState, formData: FormData): Promise<TimeClockActionState> {
  const user = await getCurrentUser();
  if (!user || !canManageWorkShifts(user)) return { message: "Недостаточно прав для управления сменами" };
  const parsed = workShiftSchema.safeParse({
    id: formValue(formData, "id"),
    employeeId: formValue(formData, "employeeId"),
    locationId: formValue(formData, "locationId"),
    date: formValue(formData, "date"),
    startsAt: formValue(formData, "startsAt"),
    endsAt: formValue(formData, "endsAt"),
    breakMinutes: formValue(formData, "breakMinutes") || "0"
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await createOrUpdateWorkShift({
      id: parsed.data.id,
      employeeId: parsed.data.employeeId,
      locationId: parsed.data.locationId,
      date: parsed.data.date,
      startsAt: combineDateAndTime(parsed.data.date, parsed.data.startsAt),
      endsAt: combineDateAndTime(parsed.data.date, parsed.data.endsAt),
      breakMinutes: parsed.data.breakMinutes
    }, user.id);
  } catch (error) {
    if (error instanceof TimeClockServiceError) return { message: error.message };
    throw error;
  }
  redirect("/admin/work-shifts?saved=1");
}

export async function saveWorkShiftDirectAction(formData: FormData) {
  const result = await saveWorkShiftAction({}, formData);
  if (result.message) redirect(`/admin/work-shifts?error=${encodeURIComponent(result.message)}`);
  if (result.errors) redirect("/admin/work-shifts?error=validation");
}

export async function cancelWorkShiftAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageWorkShifts(user)) redirect("/admin/work-shifts?error=permission");
  try {
    await cancelWorkShift(id, user.id);
  } catch (error) {
    if (error instanceof TimeClockServiceError) redirect(`/admin/work-shifts?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  redirect("/admin/work-shifts?saved=1");
}

export async function approveTimeEventAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canReviewTimeEvents(user)) redirect("/admin/time-events/review?error=permission");
  const parsed = reviewEventSchema.safeParse({
    comment: formValue(formData, "comment"),
    overrideOccurredAt: formValue(formData, "overrideOccurredAt")
  });
  if (!parsed.success) redirect("/admin/time-events/review?error=validation");
  try {
    await approveTimeEvent(id, user.id, parsed.data.comment, parsed.data.overrideOccurredAt);
  } catch (error) {
    if (error instanceof TimeClockServiceError) redirect(`/admin/time-events/review?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  redirect("/admin/time-events/review?saved=1");
}

export async function rejectTimeEventAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canReviewTimeEvents(user)) redirect("/admin/time-events/review?error=permission");
  const parsed = rejectEventSchema.safeParse({ comment: formValue(formData, "comment") });
  if (!parsed.success) redirect("/admin/time-events/review?error=comment");
  try {
    await rejectTimeEvent(id, user.id, parsed.data.comment);
  } catch (error) {
    if (error instanceof TimeClockServiceError) redirect(`/admin/time-events/review?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  redirect("/admin/time-events/review?saved=1");
}

export async function approveEmployeeDeviceAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageEmployeeDevices(user)) redirect("/admin/employee-devices?error=permission");
  await changeEmployeeDeviceStatus(id, "TRUSTED", user.id);
  redirect("/admin/employee-devices?saved=1");
}

export async function blockEmployeeDeviceAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageEmployeeDevices(user)) redirect("/admin/employee-devices?error=permission");
  await changeEmployeeDeviceStatus(id, "BLOCKED", user.id, "Заблокировано руководителем");
  redirect("/admin/employee-devices?saved=1");
}

export async function revokeEmployeeDeviceAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageEmployeeDevices(user)) redirect("/admin/employee-devices?error=permission");
  await changeEmployeeDeviceStatus(id, "PENDING", user.id);
  redirect("/admin/employee-devices?saved=1");
}

export async function revokeDisplayDeviceAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageWorkLocations(user)) redirect("/admin/work-locations?error=permission");
  await revokeDisplayDevice(id, user.id, "Отозвано из админки");
  redirect("/admin/work-locations?saved=1");
}

export async function blockDisplayDeviceAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canManageWorkLocations(user)) redirect("/admin/work-locations?error=permission");
  await blockDisplayDevice(id, user.id, "Заблокировано из админки");
  redirect("/admin/work-locations?saved=1");
}

export async function createAdjustmentRequestAction(_prev: TimeClockActionState, formData: FormData): Promise<TimeClockActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };
  const parsed = adjustmentRequestSchema.safeParse({
    date: formValue(formData, "date"),
    eventType: formValue(formData, "eventType"),
    requestedOccurredAt: formValue(formData, "requestedOccurredAt"),
    comment: formValue(formData, "comment")
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  try {
    await createAdjustmentRequest({
      user,
      date: parsed.data.date,
      eventType: parsed.data.eventType,
      requestedOccurredAt: new Date(`${parsed.data.date}T${parsed.data.requestedOccurredAt}:00.000`),
      comment: parsed.data.comment
    });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return { message: error.message };
    throw error;
  }
  redirect("/employee/time-clock?adjustment=1");
}

export async function approveAdjustmentAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canManageTimeAdjustments(user)) redirect("/admin/time-adjustments?error=permission");
  const parsed = reviewAdjustmentSchema.safeParse({ comment: formValue(formData, "comment") });
  if (!parsed.success) redirect("/admin/time-adjustments?error=validation");
  await approveAdjustmentRequest(id, user.id, parsed.data.comment);
  redirect("/admin/time-adjustments?saved=1");
}

export async function rejectAdjustmentAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canManageTimeAdjustments(user)) redirect("/admin/time-adjustments?error=permission");
  const parsed = rejectEventSchema.safeParse({ comment: formValue(formData, "comment") });
  if (!parsed.success) redirect("/admin/time-adjustments?error=comment");
  await rejectAdjustmentRequest(id, user.id, parsed.data.comment);
  redirect("/admin/time-adjustments?saved=1");
}
