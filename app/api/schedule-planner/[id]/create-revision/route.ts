import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditSchedulePlanner } from "@/permissions";
import { createSchedulePlanRevision, getSchedulePlannerData, SchedulePlannerServiceError } from "@/modules/schedule-planner/service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canEditSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;

  try {
    const { schedulePlan, created } = await createSchedulePlanRevision({
      schedulePlanId: id,
      actorUserId: user.id
    });
    const data = await getSchedulePlannerData({
      locationId: schedulePlan.locationId,
      year: schedulePlan.year,
      month: schedulePlan.month
    });
    return NextResponse.json({ ...data, created }, { status: created ? 201 : 200 });
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
