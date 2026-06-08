import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { getPublicRequestOrigin } from "@/lib/public-origin";
import { displayQrSchema } from "@/modules/time-clock/schemas";
import { getCurrentQr, TimeClockServiceError } from "@/modules/time-clock/service";
import { DISPLAY_SESSION_COOKIE } from "@/modules/time-clock/utils";

export async function POST(request: NextRequest) {
  const parsed = displayQrSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Не удалось определить QR-экран" }, { status: 400 });
  const context = await getRequestContext();

  try {
    const result = await getCurrentQr({
      sessionToken: request.cookies.get(DISPLAY_SESSION_COOKIE)?.value,
      deviceId: parsed.data.deviceId,
      ipAddress: context.ipAddress,
      origin: getPublicRequestOrigin(request)
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
