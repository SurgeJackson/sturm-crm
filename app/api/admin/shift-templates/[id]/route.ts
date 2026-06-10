import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canManageShiftTemplates } from "@/permissions";
import { shiftTemplateSchema } from "@/modules/time-clock/schemas";
import { TimeClockServiceError, updateShiftTemplate } from "@/modules/time-clock/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageShiftTemplates(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const parsed = shiftTemplateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Проверьте данные шаблона смены", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const { locationId: _locationId, id: _ignored, ...data } = parsed.data;
    const shiftTemplate = await updateShiftTemplate(id, data, user.id);
    return NextResponse.json({ shiftTemplate });
  } catch (error) {
    if (error instanceof TimeClockServiceError) return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
