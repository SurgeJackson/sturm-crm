"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditSchedulePlanner } from "@/permissions";
import { formValue } from "@/modules/time-clock/schemas";
import { createSchedulePlanSchema } from "@/modules/schedule-planner/schemas";
import { createSchedulePlan, SchedulePlannerServiceError } from "@/modules/schedule-planner/service";

export async function createSchedulePlanAction(formData: FormData) {
  const user = await getCurrentUser();
  const locationId = formValue(formData, "locationId") ?? "";
  const year = formValue(formData, "year") ?? "";
  const month = formValue(formData, "month") ?? "";
  const redirectPath = `/admin/schedule-planner?locationId=${encodeURIComponent(locationId)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;
  if (!user || !canEditSchedulePlanner(user)) redirect(`${redirectPath}&error=permission`);

  const parsed = createSchedulePlanSchema.safeParse({
    locationId,
    year,
    month,
    title: formValue(formData, "title")
  });
  if (!parsed.success) redirect(`${redirectPath}&error=validation`);

  try {
    const result = await createSchedulePlan({
      ...parsed.data,
      actorUserId: user.id
    });
    redirect(`${redirectPath}&saved=${result.created ? "created" : "loaded"}`);
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) redirect(`${redirectPath}&error=${encodeURIComponent(error.message)}`);
    throw error;
  }
}
