import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditSchedulePlanner } from "@/permissions";
import { submitSchedulePlanSchema } from "@/modules/schedule-planner/schemas";
import { SchedulePlannerServiceError, SchedulePlannerValidationError, submitSchedulePlan } from "@/modules/schedule-planner/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canEditSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const [{ id }, body] = await Promise.all([params, request.json().catch(() => ({}))]);
  const parsed = submitSchedulePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте параметры отправки", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await submitSchedulePlan({
      schedulePlanId: id,
      actorUserId: user.id,
      confirmWarnings: parsed.data.confirmWarnings
    });
    return NextResponse.json(result, { status: result.requiresWarningConfirmation ? 409 : 200 });
  } catch (error) {
    if (error instanceof SchedulePlannerValidationError) {
      return NextResponse.json({ message: error.message, validation: error.validation }, { status: 400 });
    }
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
