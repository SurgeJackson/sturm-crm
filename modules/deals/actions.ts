"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  DealLossReason,
  DealProbability,
  DealSource,
  DealStage
} from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeDealResponsible,
  canCloseDealAsLost,
  canCreateDeal,
  canEditRecord
} from "@/permissions";
import { compactString, optionalDate, toAuditValue } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncDealDiscipline } from "@/modules/crm-discipline/service";

export type DealActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const dealStages = [
  "NEW_REQUEST",
  "QUALIFICATION",
  "SELECTION",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_SENT",
  "WAITING_DECISION",
  "NEGOTIATION",
  "INVOICE_OR_ORDER",
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
  "LOST"
] as const;

const dealProbabilities = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const;
const dealSources = [
  "DESIGNER",
  "SHOWROOM",
  "WEBSITE",
  "PHONE",
  "RECOMMENDATION",
  "REPEAT_CLIENT",
  "COMMERCIAL_PROJECT",
  "OTHER"
] as const;
const dealLossReasons = [
  "PRICE",
  "DEADLINES",
  "COMPETITOR",
  "CHINA",
  "SELF_PURCHASE",
  "CLIENT_DISAPPEARED",
  "ASSORTMENT",
  "PAYMENT_TERMS",
  "DELIVERY_TERMS",
  "DESIGNER_NOT_SUPPORT",
  "PROCUREMENT_CHOSE_OTHER",
  "PROJECT_FROZEN",
  "OTHER"
] as const;

const dealSchema = z
  .object({
    title: z.string().trim().min(1, "Укажите название сделки"),
    clientId: z.string().trim().min(1, "Укажите клиента сделки"),
    objectId: z.string().trim().min(1, "Укажите объект сделки"),
    designerId: z.string().trim().optional(),
    responsibleId: z.string().trim().min(1, "Укажите ответственного по сделке"),
    stage: z.enum(dealStages),
    potentialAmount: z.string().trim().optional(),
    probability: z.union([z.literal(""), z.enum(dealProbabilities)]).optional(),
    nextActionAt: z.string().trim().optional(),
    nextActionText: z.string().trim().optional(),
    source: z.enum(dealSources, { message: "Укажите источник сделки" }),
    lossReason: z.union([z.literal(""), z.enum(dealLossReasons)]).optional(),
    lossComment: z.string().trim().optional(),
    comment: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.stage === "LOST") {
      if (!value.lossReason) {
        ctx.addIssue({ code: "custom", message: "Укажите причину проигрыша сделки", path: ["lossReason"] });
      }
      return;
    }

    if (value.stage === "COMPLETED") return;

    if (!value.nextActionText) {
      ctx.addIssue({ code: "custom", message: "Укажите следующий шаг по сделке", path: ["nextActionText"] });
    }

    if (!value.nextActionAt) {
      ctx.addIssue({ code: "custom", message: "Укажите дату следующего действия", path: ["nextActionAt"] });
    }
  });

function parseDealForm(formData: FormData) {
  return dealSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId"),
    objectId: formData.get("objectId"),
    designerId: compactString(formData.get("designerId")),
    responsibleId: formData.get("responsibleId"),
    stage: formData.get("stage"),
    potentialAmount: compactString(formData.get("potentialAmount")),
    probability: formData.get("probability") ?? "",
    nextActionAt: compactString(formData.get("nextActionAt")),
    nextActionText: compactString(formData.get("nextActionText")),
    source: formData.get("source"),
    lossReason: formData.get("lossReason") ?? "",
    lossComment: compactString(formData.get("lossComment")),
    comment: compactString(formData.get("comment"))
  });
}

function parseAmount(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function closedAtForStage(stage: DealStage, previous?: Date | null) {
  if (stage === "LOST" || stage === "COMPLETED") {
    return previous ?? new Date();
  }

  return null;
}

async function getObjectForDeal(objectId: string) {
  return prisma.projectObject.findUnique({
    where: { id: objectId },
    select: { id: true, clientId: true, designerId: true }
  });
}

function toDealDocument(
  data: z.infer<typeof dealSchema>,
  object: { clientId: string; designerId: string | null },
  responsibleId: string,
  previousClosedAt?: Date | null,
  lockFinancial = false,
  previousFinancial?: { potentialAmount: number | null; probability: DealProbability | null }
) {
  const stage = data.stage as DealStage;
  const isClosed = stage === "LOST" || stage === "COMPLETED";

  return {
    title: data.title,
    clientId: object.clientId,
    objectId: data.objectId,
    designerId: data.designerId || object.designerId || null,
    responsibleId,
    stage,
    potentialAmount: lockFinancial ? previousFinancial?.potentialAmount ?? null : parseAmount(data.potentialAmount),
    probability: lockFinancial ? previousFinancial?.probability ?? null : data.probability ? (data.probability as DealProbability) : null,
    nextActionAt: isClosed ? null : optionalDate(data.nextActionAt),
    nextActionText: isClosed ? null : data.nextActionText || null,
    source: data.source as DealSource,
    lossReason: stage === "LOST" ? (data.lossReason as DealLossReason) : null,
    lossComment: stage === "LOST" ? data.lossComment || null : null,
    comment: data.comment || null,
    notes: data.comment || null,
    closedAt: closedAtForStage(stage, previousClosedAt)
  };
}

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

  await writeAuditLog({
    entityType: "DEAL",
    entityId: deal.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(deal)
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

  await writeAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
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

  for (const [field, action, previous, next] of trackedFields) {
    if (previous !== next) {
      await writeAuditLog({
        entityType: "DEAL",
        entityId: id,
        action,
        userId: user.id,
        before: { [field]: previous },
        after: { [field]: next }
      });
    }
  }

  if (before.stage !== "LOST" && after.stage === "LOST") {
    await writeAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "MARK_LOST",
      userId: user.id,
      before: { stage: before.stage },
      after: { stage: after.stage, lossReason: after.lossReason }
    });
  }

  if (before.stage !== "COMPLETED" && after.stage === "COMPLETED") {
    await writeAuditLog({
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

  await writeAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
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

  const after = await prisma.deal.update({
    where: { id },
    data: {
      stage,
      closedAt: closedAtForStage(stage as DealStage, before.closedAt),
      nextActionAt: stage === "LOST" || stage === "COMPLETED" ? null : before.nextActionAt,
      nextActionText: stage === "LOST" || stage === "COMPLETED" ? null : before.nextActionText
    }
  });

  await writeAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: stage === "COMPLETED" ? "MARK_COMPLETED" : "CHANGE_STAGE",
    userId: user.id,
    before: { stage: before.stage },
    after: { stage: after.stage }
  });

  await syncDealDiscipline(id, user.id);

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

  const after = await prisma.deal.update({
    where: { id },
    data: {
      stage: "LOST",
      lossReason,
      lossComment: lossComment || null,
      closedAt: before.closedAt ?? new Date(),
      nextActionAt: null,
      nextActionText: null
    }
  });

  await writeAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: "MARK_LOST",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await writeAuditLog({
    entityType: "DEAL",
    entityId: id,
    action: "SET_LOSS_REASON",
    userId: user.id,
    before: { lossReason: before.lossReason },
    after: { lossReason }
  });

  await syncDealDiscipline(id, user.id);

  redirect(`/deals/${id}?lost=1`);
}
