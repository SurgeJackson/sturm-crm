import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { getRequestContext } from "@/lib/request-context";
import { canMarkTimeClock } from "@/permissions";
import { markTimeSchema } from "@/modules/time-clock/schemas";
import { markTimeEvent, TimeClockServiceError } from "@/modules/time-clock/service";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canMarkTimeClock(user)) return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });

  const parsed = markTimeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте данные отметки", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await markTimeEvent({
      user,
      ...parsed.data,
      requestContext: await getRequestContext()
    });
    return NextResponse.json(result, { status: result.status === "REJECTED" ? 422 : 200 });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
