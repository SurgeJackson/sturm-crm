import { NextResponse } from "next/server";
import type { DesignerRelationshipStage } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { canEditRecord } from "@/permissions";
import { relationshipStages } from "@/modules/designers/form";
import { getDesignerForMutation } from "@/modules/designers/services/queries";
import { changeDesignerStage } from "@/modules/designers/services/stage";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null) as { relationshipStage?: string } | null;
  const relationshipStage = body?.relationshipStage;

  if (!relationshipStages.includes(relationshipStage as DesignerRelationshipStage)) {
    return NextResponse.json({ message: "Некорректная стадия отношений" }, { status: 400 });
  }

  const before = await getDesignerForMutation(id);

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    return NextResponse.json({ message: "Недостаточно прав для изменения стадии" }, { status: 403 });
  }

  await changeDesignerStage(id, before, relationshipStage as DesignerRelationshipStage, user.id);

  return NextResponse.json({ ok: true });
}
