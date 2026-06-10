import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canManageShiftTemplates } from "@/permissions";
import { getShiftTemplates } from "@/modules/time-clock/queries";
import { shiftTemplateSchema } from "@/modules/time-clock/schemas";
import { createShiftTemplate, TimeClockServiceError } from "@/modules/time-clock/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShiftTemplates(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const shiftTemplates = await getShiftTemplates(id);
  return NextResponse.json({ shiftTemplates });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShiftTemplates(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const parsed = shiftTemplateSchema.safeParse({
    ...(await request.json().catch(() => null)),
    locationId: id
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте данные шаблона смены", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { locationId, id: _ignored, ...data } = parsed.data;
    const shiftTemplate = await createShiftTemplate({ locationId, ...data }, user.id);
    return NextResponse.json({ shiftTemplate }, { status: 201 });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
