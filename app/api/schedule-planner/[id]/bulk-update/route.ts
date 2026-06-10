import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditSchedulePlanner } from "@/permissions";
import { bulkUpdateSchedulePlanCellsSchema } from "@/modules/schedule-planner/schemas";
import { bulkUpdateSchedulePlanCells, SchedulePlannerServiceError } from "@/modules/schedule-planner/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canEditSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const parsed = bulkUpdateSchedulePlanCellsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте параметры массового заполнения", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await bulkUpdateSchedulePlanCells({
      schedulePlanId: id,
      ...parsed.data,
      actorUserId: user.id
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
