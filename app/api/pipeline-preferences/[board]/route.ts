import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/auth/get-current-user";
import type { PipelineBoardId, PipelineBoardPreference } from "@/lib/pipeline-preferences";
import { mergePipelinePreference, parseUserProfileSettings } from "@/lib/pipeline-preferences";
import { dealStages } from "@/modules/deals/form";
import { relationshipStages } from "@/modules/designers/form";

const boardColumnIds: Record<PipelineBoardId, readonly string[]> = {
  deals: dealStages,
  designers: relationshipStages
};

export async function PUT(request: Request, { params }: { params: Promise<{ board: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
  }

  const { board } = await params;
  if (board !== "deals" && board !== "designers") {
    return NextResponse.json({ message: "Некорректная воронка" }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as { preference?: PipelineBoardPreference } | null;
  if (!body?.preference) {
    return NextResponse.json({ message: "Некорректные настройки" }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profileSettings: true }
  });

  if (!current) {
    return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 });
  }

  const profileSettings = mergePipelinePreference(current.profileSettings, board, body.preference, boardColumnIds[board]);

  await prisma.user.update({
    where: { id: user.id },
    data: { profileSettings }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ board: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Необходима авторизация" }, { status: 401 });
  }

  const { board } = await params;
  if (board !== "deals" && board !== "designers") {
    return NextResponse.json({ message: "Некорректная воронка" }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { profileSettings: true }
  });

  if (!current) {
    return NextResponse.json({ message: "Пользователь не найден" }, { status: 404 });
  }

  const profileSettings = parseUserProfileSettings(current.profileSettings);
  if (profileSettings.pipeline && typeof profileSettings.pipeline === "object" && !Array.isArray(profileSettings.pipeline)) {
    profileSettings.pipeline = { ...profileSettings.pipeline };
    delete profileSettings.pipeline[board];
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { profileSettings }
  });

  return NextResponse.json({ ok: true });
}
