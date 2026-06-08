import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { getRequestContext } from "@/lib/request-context";
import { canViewOwnTimeClock } from "@/permissions";
import { getMyDay, TimeClockServiceError } from "@/modules/time-clock/service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canViewOwnTimeClock(user)) return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
  try {
    const deviceId = request.nextUrl.searchParams.get("deviceId") ?? undefined;
    const data = await getMyDay({ user, deviceId, requestContext: await getRequestContext() });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
