import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditSchedulePlanner, canViewSchedulePlanner } from "@/permissions";
import { createSchedulePlanSchema, schedulePlannerPeriodSchema } from "@/modules/schedule-planner/schemas";
import { createSchedulePlan, getSchedulePlannerData, SchedulePlannerServiceError } from "@/modules/schedule-planner/service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canViewSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });

  const parsed = schedulePlannerPeriodSchema.safeParse({
    locationId: request.nextUrl.searchParams.get("locationId"),
    year: request.nextUrl.searchParams.get("year"),
    month: request.nextUrl.searchParams.get("month")
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте параметры графика", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const data = await getSchedulePlannerData(parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canEditSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });

  const parsed = createSchedulePlanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте параметры графика", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { schedulePlan, created } = await createSchedulePlan({
      ...parsed.data,
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
