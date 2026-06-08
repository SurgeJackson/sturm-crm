import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canManageWorkLocations } from "@/permissions";
import { setupTokenSchema } from "@/modules/time-clock/schemas";
import { createDisplaySetupToken, TimeClockServiceError } from "@/modules/time-clock/service";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageWorkLocations(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const parsed = setupTokenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Проверьте данные", errors: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const { rawToken, expiresAt } = await createDisplaySetupToken(parsed.data.locationId, user.id, parsed.data.expiresInMinutes);
    const origin = request.nextUrl.origin;
    return NextResponse.json({
      setupUrl: `${origin}/location-display/setup?token=${rawToken}`,
      expiresAt
    });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
