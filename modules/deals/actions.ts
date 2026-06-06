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
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { compactString } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncDealDiscipline } from "@/modules/crm-discipline/service";
import { dealLossReasons, dealStages, parseDealForm, toDealDocument } from "@/modules/deals/form";
import { changeDealStage, getObjectForDeal, markDealAsLost } from "@/modules/deals/service";

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
  const deal = await prisma.deal.create({
    data: {
      ...toDealDocument(parsed.data, object, responsibleId, null, user.role === "ADMINISTRATOR"),
      createdById: user.id
    }
  });

  await writeEntityAuditLog({
    entityType: "DEAL",
    entityId: deal.id,
    action: "CREATE",
    userId: user.id,
    after: deal
  });

  await syncDealDiscipline(deal.id, user.id);

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
  const update = toDealDocument(
    parsed.data,
    object,
    responsibleId,
    before.closedAt,
    user.role === "ADMINISTRATOR",
    {
      potentialAmount: before.potentialAmount,
      probability: before.probability
    }
  );

  const after = await prisma.deal.update({
    where: { id },
    data: update
  });

  await writeEntityAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before,
    after
  });

  const trackedFields = [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["stage", "CHANGE_STAGE", before.stage, after.stage],
    ["potentialAmount", "CHANGE_AMOUNT", before.potentialAmount, after.potentialAmount],
    ["probability", "CHANGE_PROBABILITY", before.probability, after.probability],
    ["nextActionText", "CHANGE_NEXT_ACTION", before.nextActionText, after.nextActionText],
    ["nextActionAt", "CHANGE_NEXT_ACTION", before.nextActionAt?.toISOString?.(), after.nextActionAt?.toISOString?.()],
    ["lossReason", "SET_LOSS_REASON", before.lossReason, after.lossReason]
  ] as const;

  await writeTrackedFieldAuditLogs({
    entityType: "DEAL",
    entityId: id,
    userId: user.id,
    fields: trackedFields
  });

  if (before.stage !== "LOST" && after.stage === "LOST") {
    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "MARK_LOST",
      userId: user.id,
      before: { stage: before.stage },
      after: { stage: after.stage, lossReason: after.lossReason }
    });
  }

  if (before.stage !== "COMPLETED" && after.stage === "COMPLETED") {
    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "MARK_COMPLETED",
      userId: user.id,
      before: { stage: before.stage },
      after: { stage: after.stage }
    });
  }

  await syncDealDiscipline(id, user.id);

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

  const after = await prisma.deal.update({
    where: { id },
    data: { archivedAt: new Date() }
  });

  await writeEntityAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before,
    after
  });

  await expireViolationsForEntity("DEAL", id, user.id);

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
