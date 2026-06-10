import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canApproveSchedulePlanner } from "@/permissions";
import { approveSchedulePlan, SchedulePlannerServiceError, SchedulePlannerValidationError } from "@/modules/schedule-planner/service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canApproveSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;

  try {
    const result = await approveSchedulePlan({
      schedulePlanId: id,
      actorUserId: user.id
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SchedulePlannerValidationError) {
      return NextResponse.json({ message: error.message, validation: error.validation }, { status: 400 });
    }
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
