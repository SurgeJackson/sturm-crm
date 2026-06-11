import { NextResponse } from "next/server";
import type { DealStage } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { canCloseDealAsLost, canEditRecord } from "@/permissions";
import { dealStages } from "@/modules/deals/form";
import { getDealForMutation } from "@/modules/deals/services/queries";
import { changeDealStage } from "@/modules/deals/services/stage";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null) as { stage?: string } | null;
  const nextStage = body?.stage;

  if (!dealStages.includes(nextStage as DealStage)) {
    return NextResponse.json({ message: "Некорректная стадия сделки" }, { status: 400 });
  }

  const stage = nextStage as DealStage;
  const before = await getDealForMutation(id);

  if (!before || !canEditRecord(user, before)) {
    return NextResponse.json({ message: "Недостаточно прав для изменения стадии" }, { status: 403 });
  }

  if (stage === "LOST" && !before.lossReason) {
    return NextResponse.json({ message: "Перед переносом в проигрыш укажите причину проигрыша в карточке сделки" }, { status: 409 });
  }

  if (stage === "LOST" && !canCloseDealAsLost(user)) {
    return NextResponse.json({ message: "Недостаточно прав для закрытия сделки как проигранной" }, { status: 403 });
  }

  await changeDealStage(id, before, stage, user.id);

  return NextResponse.json({ ok: true });
}
