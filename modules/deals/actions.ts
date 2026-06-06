"use server";

import { redirect } from "next/navigation";
import type { DealLossReason, DealStage } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeDealResponsible,
  canCloseDealAsLost,
  canCreateDeal,
  canEditRecord
} from "@/permissions";
import { compactString } from "@/modules/crm/form-utils";
import { dealLossReasons, dealStages, parseDealForm } from "@/modules/deals/form";
import { archiveDeal, changeDealStage, createDeal, getObjectForDeal, markDealAsLost, updateDeal } from "@/modules/deals/service";

export type DealActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createDealAction(_prevState: DealActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user || !canCreateDeal(user)) {
    return { message: "Недостаточно прав для создания сделки" };
  }

  const parsed = parseDealForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.stage === "LOST" && !canCloseDealAsLost(user)) {
    return { message: "Недостаточно прав для закрытия сделки как проигранной" };
  }

  const object = await getObjectForDeal(parsed.data.objectId);
  if (!object) return { message: "Укажите объект сделки" };

  const responsibleId = canChangeDealResponsible(user) ? parsed.data.responsibleId : user.id;
  const deal = await createDeal(parsed.data, object, responsibleId, user.id, user.role === "ADMINISTRATOR");

  redirect(`/deals/${deal.id}?saved=1`);
}

export async function updateDealAction(id: string, _prevState: DealActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await prisma.deal.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, before)) {
    return { message: "Недостаточно прав для редактирования сделки" };
  }

  const parsed = parseDealForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.stage === "LOST" && !canCloseDealAsLost(user)) {
    return { message: "Недостаточно прав для закрытия сделки как проигранной" };
  }

  const object = await getObjectForDeal(parsed.data.objectId);
  if (!object) return { message: "Укажите объект сделки" };

  const responsibleId = canChangeDealResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  await updateDeal(id, before, parsed.data, object, responsibleId, user.id, user.role === "ADMINISTRATOR");

  redirect(`/deals/${id}?saved=1`);
}

export async function archiveDealAction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const before = await prisma.deal.findUnique({ where: { id } });

  if (!before || !canArchiveRecord(user, before)) {
    redirect(`/deals/${id}?error=archive`);
  }

  await archiveDeal(id, before, user.id);

  redirect(`/deals/${id}?archived=1`);
}

export async function changeDealStageAction(id: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const nextStage = formData.get("stage") as DealStage | null;
  if (!dealStages.includes(nextStage as DealStage)) {
    redirect("/deals/pipeline?error=stage");
  }
  const stage = nextStage as DealStage;

  const before = await prisma.deal.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, before)) {
    redirect("/deals/pipeline?error=permission");
  }

  if (stage === "LOST" && !before.lossReason) {
    redirect(`/deals/${id}?error=lossReason`);
  }

  if (stage === "LOST" && !canCloseDealAsLost(user)) {
    redirect("/deals/pipeline?error=permission");
  }

  await changeDealStage(id, before, stage, user.id);

  redirect("/deals/pipeline?saved=1");
}

export async function closeDealAsLostAction(id: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const lossReason = formData.get("lossReason") as DealLossReason | null;
  const lossComment = compactString(formData.get("lossComment"));

  if (!dealLossReasons.includes(lossReason as DealLossReason)) {
    redirect(`/deals/${id}?error=lossReason`);
  }

  const before = await prisma.deal.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, before) || !canCloseDealAsLost(user)) {
    redirect(`/deals/${id}?error=permission`);
  }

  await markDealAsLost(id, before, lossReason as DealLossReason, lossComment ?? null, user.id);

  redirect(`/deals/${id}?lost=1`);
}
