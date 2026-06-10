import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canManageShiftTemplates } from "@/permissions";
import { TimeClockServiceError, setShiftTemplateActive } from "@/modules/time-clock/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShiftTemplates(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.isActive !== "boolean") {
    return NextResponse.json({ message: "Передайте isActive" }, { status: 400 });
  }

  try {
    const shiftTemplate = await setShiftTemplateActive(id, body.isActive, user.id);
    return NextResponse.json({ shiftTemplate });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
