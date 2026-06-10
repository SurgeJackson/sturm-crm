import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditSchedulePlanner } from "@/permissions";
import { updateSchedulePlanCellSchema } from "@/modules/schedule-planner/schemas";
import { SchedulePlannerServiceError, updateSchedulePlanCell } from "@/modules/schedule-planner/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cellId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !canEditSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const [{ id, cellId }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const parsed = updateSchedulePlanCellSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте данные ячейки", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const cell = await updateSchedulePlanCell({
      schedulePlanId: id,
      cellId,
      ...parsed.data,
      actorUserId: user.id
    });
    return NextResponse.json({ cell });
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
