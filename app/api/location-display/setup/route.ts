import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { displaySetupSchema } from "@/modules/time-clock/schemas";
import { setupLocationDisplay, TimeClockServiceError } from "@/modules/time-clock/service";
import { DISPLAY_SESSION_COOKIE } from "@/modules/time-clock/utils";

export async function POST(request: NextRequest) {
  const parsed = displaySetupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Проверьте данные подключения", errors: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const context = await getRequestContext();
    const result = await setupLocationDisplay({
      ...parsed.data,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress
    });
    const response = NextResponse.json({
      locationName: result.location.name,
      displayDeviceName: result.device.name,
      redirectTo: "/location-display"
    });
    response.cookies.set(DISPLAY_SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: result.session.expiresAt
    });
    return response;
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
