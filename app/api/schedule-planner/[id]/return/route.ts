import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canApproveSchedulePlanner } from "@/permissions";
import { returnSchedulePlanSchema } from "@/modules/schedule-planner/schemas";
import { returnSchedulePlanForRevision, SchedulePlannerServiceError } from "@/modules/schedule-planner/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canApproveSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const parsed = returnSchedulePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Укажите причину возврата", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await returnSchedulePlanForRevision({
      schedulePlanId: id,
      actorUserId: user.id,
      comment: parsed.data.comment
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SchedulePlannerServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
