import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canReviewTimeEvents } from "@/permissions";
import { reviewEventSchema } from "@/modules/time-clock/schemas";
import { approveTimeEvent, TimeClockServiceError } from "@/modules/time-clock/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canReviewTimeEvents(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const parsed = reviewEventSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Проверьте данные" }, { status: 400 });
  try {
    const { id } = await params;
    const event = await approveTimeEvent(id, user.id, parsed.data.comment, parsed.data.overrideOccurredAt);
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
