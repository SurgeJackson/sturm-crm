"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  TaskActionType,
  TaskActivity,
  TaskAutoRule,
  TaskPriority,
  TaskRecordType,
  TaskStatus
} from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { compactString, toAuditValue } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncClientDiscipline, syncDesignerDiscipline, syncTaskDiscipline } from "@/modules/crm-discipline/service";
import {
  canCancelTask,
  canChangeTaskResponsible,
  canCreateTask,
  canCreateTouch,
  canEditRecord
} from "@/permissions";

export type TaskActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const recordTypes = ["TASK", "TOUCH"] as const;
const actionTypes = [
  "CALL",
  "INCOMING_CALL",
  "WHATSAPP",
  "TELEGRAM",
  "EMAIL",
  "SHOWROOM_MEETING",
  "OUTSIDE_MEETING",
  "PRESENTATION",
  "PROPOSAL_SENT",
  "FOLLOW_UP",
  "REQUEST_PLANS",
  "TERMS_APPROVAL",
  "SHOWROOM_INVITE",
  "EVENT_INVITE",
  "INTERNAL_TASK",
  "OTHER"
] as const;
const statuses = ["NEW", "IN_PROGRESS", "WAITING", "DONE", "OVERDUE", "CANCELLED", "RECORDED", "NEEDS_NEXT_STEP", "CLOSED"] as const;
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const taskSchema = z
  .object({
    recordType: z.enum(recordTypes),
    actionType: z.enum(actionTypes),
    title: z.string().trim().min(1, "Укажите название задачи"),
    description: z.string().trim().optional(),
    responsibleId: z.string().trim().min(1, "Укажите ответственного за задачу"),
    clientId: z.string().trim().optional(),
    designerId: z.string().trim().optional(),
    objectId: z.string().trim().optional(),
    dealId: z.string().trim().optional(),
    proposalId: z.string().trim().optional(),
    objectParticipantId: z.string().trim().optional(),
    status: z.enum(statuses),
    priority: z.enum(priorities),
    dueAt: z.string().trim().optional(),
    result: z.string().trim().optional(),
    nextStepText: z.string().trim().optional(),
    nextStepAt: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    const hasLink = Boolean(value.clientId || value.designerId || value.objectId || value.dealId || value.proposalId || value.objectParticipantId);
    if (!hasLink) {
      ctx.addIssue({
        code: "custom",
        message: "Привяжите задачу к клиенту, дизайнеру, объекту, сделке, КП или участнику объекта",
        path: ["clientId"]
      });
    }

    if (value.recordType === "TASK" && !value.dueAt) {
      ctx.addIssue({ code: "custom", message: "Укажите срок выполнения задачи", path: ["dueAt"] });
    }

    if (value.recordType === "TASK" && value.status === "DONE" && !value.result) {
      ctx.addIssue({ code: "custom", message: "Укажите результат выполнения задачи", path: ["result"] });
    }

    if (value.recordType === "TOUCH") {
      if (!value.dueAt) {
        ctx.addIssue({ code: "custom", message: "Укажите дату касания", path: ["dueAt"] });
      }
      if (!value.result) {
        ctx.addIssue({ code: "custom", message: "Укажите результат касания", path: ["result"] });
      }
    }

    if ((value.nextStepText && !value.nextStepAt) || (!value.nextStepText && value.nextStepAt)) {
      ctx.addIssue({ code: "custom", message: "Заполните текст и дату следующего шага", path: ["nextStepText"] });
    }
  });

function parseDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    recordType: formData.get("recordType"),
    actionType: formData.get("actionType"),
    title: formData.get("title"),
    description: compactString(formData.get("description")),
    responsibleId: formData.get("responsibleId"),
    clientId: compactString(formData.get("clientId")),
    designerId: compactString(formData.get("designerId")),
    objectId: compactString(formData.get("objectId")),
    dealId: compactString(formData.get("dealId")),
    proposalId: compactString(formData.get("proposalId")),
    objectParticipantId: compactString(formData.get("objectParticipantId")),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueAt: compactString(formData.get("dueAt")),
    result: compactString(formData.get("result")),
    nextStepText: compactString(formData.get("nextStepText")),
    nextStepAt: compactString(formData.get("nextStepAt"))
  });
}

async function resolveLinks(input: {
  clientId?: string;
  designerId?: string;
  objectId?: string;
  dealId?: string;
  proposalId?: string;
  objectParticipantId?: string;
}) {
  const links = { ...input };

  if (links.proposalId) {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: links.proposalId },
      select: { clientId: true, designerId: true, objectId: true, dealId: true }
    });
    if (proposal) {
      links.clientId ||= proposal.clientId;
      links.designerId ||= proposal.designerId ?? undefined;
      links.objectId ||= proposal.objectId;
      links.dealId ||= proposal.dealId;
    }
  }

  if (links.dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: links.dealId },
      select: { clientId: true, designerId: true, objectId: true }
    });
    if (deal) {
      links.clientId ||= deal.clientId;
      links.designerId ||= deal.designerId ?? undefined;
      links.objectId ||= deal.objectId;
    }
  }

  if (links.objectParticipantId) {
    const participant = await prisma.projectObjectParticipant.findUnique({
      where: { id: links.objectParticipantId },
      include: { object: { select: { id: true, clientId: true, designerId: true } } }
    });
    if (participant) {
      links.objectId ||= participant.object.id;
      links.clientId ||= participant.object.clientId;
      links.designerId ||= participant.object.designerId ?? undefined;
    }
  }

  if (links.objectId) {
    const object = await prisma.projectObject.findUnique({
      where: { id: links.objectId },
      select: { clientId: true, designerId: true }
    });
    if (object) {
      links.clientId ||= object.clientId;
      links.designerId ||= object.designerId ?? undefined;
    }
  }

  return {
    clientId: links.clientId || null,
    designerId: links.designerId || null,
    objectId: links.objectId || null,
    dealId: links.dealId || null,
    proposalId: links.proposalId || null,
    objectParticipantId: links.objectParticipantId || null
  };
}

function normalizeStatus(recordType: TaskRecordType, status: TaskStatus, result?: string | null): TaskStatus {
  if (recordType === "TOUCH") {
    if (status === "NEEDS_NEXT_STEP" || status === "CLOSED") return status;
    return result ? "RECORDED" : "NEEDS_NEXT_STEP";
  }
  return status;
}

function toTaskDocument(data: z.infer<typeof taskSchema>, links: Awaited<ReturnType<typeof resolveLinks>>, forceResponsibleId?: string) {
  const recordType = data.recordType as TaskRecordType;
  const status = normalizeStatus(recordType, data.status as TaskStatus, data.result);
  const dueAt = parseDateTime(data.dueAt);
  const completedAt =
    recordType === "TOUCH"
      ? dueAt ?? new Date()
      : status === "DONE" || status === "CLOSED"
        ? new Date()
        : null;

  return {
    recordType,
    actionType: data.actionType as TaskActionType,
    title: data.title,
    description: data.description || null,
    responsibleId: forceResponsibleId ?? data.responsibleId,
    ...links,
    status,
    priority: data.priority as TaskPriority,
    dueAt,
    completedAt,
    result: data.result || null,
    nextStepText: data.nextStepText || null,
    nextStepAt: parseDateTime(data.nextStepAt),
    notes: data.description || null
  };
}

async function createNextStep(source: TaskActivity, userId: string) {
  if (!source.nextStepText || !source.nextStepAt) return null;

  const existing = await prisma.taskActivity.findFirst({
    where: {
      recordType: "TASK",
      title: source.nextStepText,
      dueAt: source.nextStepAt,
      responsibleId: source.responsibleId,
      clientId: source.clientId,
      designerId: source.designerId,
      objectId: source.objectId,
      dealId: source.dealId,
      proposalId: source.proposalId,
      objectParticipantId: source.objectParticipantId
    },
    select: { id: true }
  });
  if (existing) return null;

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: source.nextStepText,
      description: `Следующий шаг после ${source.recordType === "TOUCH" ? "касания" : "задачи"}: ${source.title}`,
      responsibleId: source.responsibleId,
      createdById: userId,
      clientId: source.clientId,
      designerId: source.designerId,
      objectId: source.objectId,
      dealId: source.dealId,
      proposalId: source.proposalId,
      objectParticipantId: source.objectParticipantId,
      status: "NEW",
      priority: source.priority,
      dueAt: source.nextStepAt
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: "CREATE_NEXT_STEP",
    userId,
    after: toAuditValue(task)
  });

  await syncTaskDiscipline(task.id, userId);

  return task;
}

async function refreshTouchDates(task: TaskActivity) {
  if (task.recordType !== "TOUCH") return;
  const touchedAt = task.completedAt ?? task.dueAt ?? new Date();

  await Promise.all([
    task.clientId
      ? prisma.client.update({
          where: { id: task.clientId },
          data: { lastContactAt: touchedAt }
        })
      : null,
    task.designerId
      ? prisma.designer.update({
          where: { id: task.designerId },
          data: { lastTouchAt: touchedAt }
        })
      : null
  ]);
}

export async function createTaskAction(_prevState: TaskActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const recordType = formData.get("recordType");
  if (recordType === "TOUCH" ? !canCreateTouch(user) : !canCreateTask(user)) {
    return { message: "Недостаточно прав для создания задачи или касания" };
  }

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const links = await resolveLinks(parsed.data);
  const document = toTaskDocument(parsed.data, links);
  const task = await prisma.taskActivity.create({
    data: {
      ...document,
      createdById: user.id
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: task.recordType === "TOUCH" ? "CREATE_TOUCH" : "CREATE_TASK",
    userId: user.id,
    after: toAuditValue(task)
  });

  await refreshTouchDates(task);
  await createNextStep(task, user.id);
  await syncTaskDiscipline(task.id, user.id);
  if (task.clientId) await syncClientDiscipline(task.clientId, user.id);
  if (task.designerId) await syncDesignerDiscipline(task.designerId, user.id);
  redirect(`/tasks/${task.id}?saved=1`);
}

export async function updateTaskAction(id: string, _prevState: TaskActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const before = await prisma.taskActivity.findUnique({ where: { id } });
  if (!before || !canEditRecord(user, before)) return { message: "Недостаточно прав для редактирования задачи" };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const links = await resolveLinks(parsed.data);
  const responsibleId = canChangeTaskResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  const document = toTaskDocument(parsed.data, links, responsibleId);

  const after = await prisma.taskActivity.update({
    where: { id },
    data: document
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: after.id,
    action: after.status === "DONE" && before.status !== "DONE" ? "CLOSE_TASK" : "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await refreshTouchDates(after);
  await createNextStep(after, user.id);
  await syncTaskDiscipline(after.id, user.id);
  if (after.clientId) await syncClientDiscipline(after.clientId, user.id);
  if (after.designerId) await syncDesignerDiscipline(after.designerId, user.id);
  redirect(`/tasks/${after.id}?saved=1`);
}

export async function cancelTaskAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const before = await prisma.taskActivity.findUnique({ where: { id } });
  if (!before || !canCancelTask(user, before)) return;

  const after = await prisma.taskActivity.update({
    where: { id },
    data: { status: "CANCELLED", archivedAt: new Date() }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: id,
    action: "CANCEL",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await expireViolationsForEntity("TASK", id, user.id);

  revalidatePath("/tasks");
  redirect("/tasks?cancelled=1");
}

async function createAutomaticTask(input: {
  title: string;
  responsibleId: string;
  createdById: string;
  dueAt: Date;
  autoRule: TaskAutoRule;
  clientId?: string | null;
  designerId?: string | null;
  objectId?: string | null;
  dealId?: string | null;
  proposalId?: string | null;
}) {
  const exists = await prisma.taskActivity.findFirst({
    where: {
      archivedAt: null,
      status: { notIn: ["DONE", "CANCELLED", "CLOSED"] },
      autoRule: input.autoRule,
      clientId: input.clientId ?? undefined,
      designerId: input.designerId ?? undefined,
      objectId: input.objectId ?? undefined,
      dealId: input.dealId ?? undefined,
      proposalId: input.proposalId ?? undefined
    },
    select: { id: true }
  });
  if (exists) return null;

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: input.title,
      responsibleId: input.responsibleId,
      createdById: input.createdById,
      dueAt: input.dueAt,
      status: "NEW",
      priority: "NORMAL",
      isAutoCreated: true,
      autoRule: input.autoRule,
      clientId: input.clientId ?? null,
      designerId: input.designerId ?? null,
      objectId: input.objectId ?? null,
      dealId: input.dealId ?? null,
      proposalId: input.proposalId ?? null
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: "CREATE_AUTO",
    userId: input.createdById,
    after: toAuditValue(task)
  });

  await syncTaskDiscipline(task.id, input.createdById);

  return task;
}

export async function ensureAutomaticTasks() {
  const user = await getCurrentUser();
  if (!user || !canCreateTask(user)) return;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const [designers, frozenObjects, deals, clients] = await Promise.all([
    prisma.designer.findMany({
      where: {
        relationshipStage: { not: "LOST_OR_IRRELEVANT" },
        archivedAt: null,
        OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sixtyDaysAgo } }]
      },
      select: { id: true, name: true, responsibleId: true }
    }),
    prisma.projectObject.findMany({
      where: { archivedAt: null, OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] },
      select: { id: true, title: true, clientId: true, designerId: true, responsibleId: true }
    }),
    prisma.deal.findMany({
      where: {
        archivedAt: null,
        stage: { notIn: ["LOST", "COMPLETED"] },
        OR: [{ nextActionAt: null }, { nextActionText: null }]
      },
      select: { id: true, title: true, clientId: true, objectId: true, designerId: true, responsibleId: true }
    }),
    prisma.client.findMany({
      where: { archivedAt: null, status: "ACTIVE", nextContactAt: null },
      select: { id: true, name: true, responsibleId: true }
    })
  ]);

  await Promise.all([
    ...designers.map((designer) =>
      createAutomaticTask({
        title: `Связаться с дизайнером ${designer.name} для реактивации контакта`,
        responsibleId: designer.responsibleId,
        createdById: user.id,
        dueAt: tomorrow,
        autoRule: "DESIGNER_REACTIVATION",
        designerId: designer.id
      })
    ),
    ...frozenObjects.map((object) =>
      createAutomaticTask({
        title: `Вернуться к объекту ${object.title}`,
        responsibleId: object.responsibleId,
        createdById: user.id,
        dueAt: inThirtyDays,
        autoRule: "FROZEN_OBJECT_RETURN",
        clientId: object.clientId,
        designerId: object.designerId,
        objectId: object.id
      })
    ),
    ...deals.map((deal) =>
      createAutomaticTask({
        title: `Запланировать следующий шаг по сделке ${deal.title}`,
        responsibleId: deal.responsibleId,
        createdById: user.id,
        dueAt: tomorrow,
        autoRule: "DEAL_WITHOUT_NEXT_STEP",
        clientId: deal.clientId,
        designerId: deal.designerId,
        objectId: deal.objectId,
        dealId: deal.id
      })
    ),
    ...clients.map((client) =>
      createAutomaticTask({
        title: `Запланировать следующий контакт с клиентом ${client.name}`,
        responsibleId: client.responsibleId,
        createdById: user.id,
        dueAt: tomorrow,
        autoRule: "CLIENT_WITHOUT_NEXT_CONTACT",
        clientId: client.id
      })
    )
  ]);
}
