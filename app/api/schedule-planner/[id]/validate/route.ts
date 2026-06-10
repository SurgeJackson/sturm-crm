import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canViewSchedulePlanner } from "@/permissions";
import { SchedulePlannerServiceError, validateSchedulePlan } from "@/modules/schedule-planner/service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canViewSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;

  try {
    const validation = await validateSchedulePlan(id);
    return NextResponse.json({ validation });
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
