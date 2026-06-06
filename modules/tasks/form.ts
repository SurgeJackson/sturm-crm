import { z } from "zod";
import type { TaskActionType, TaskPriority, TaskRecordType, TaskStatus } from "@/generated/prisma/client";
import { compactString, optionalDateTime } from "@/modules/crm/form-utils";
import type { resolveTaskLinks } from "@/modules/tasks/link-resolver";

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

export const taskSchema = z
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

    if (value.recordType === "TASK" && !value.dueAt) ctx.addIssue({ code: "custom", message: "Укажите срок выполнения задачи", path: ["dueAt"] });
    if (value.recordType === "TASK" && value.status === "DONE" && !value.result) ctx.addIssue({ code: "custom", message: "Укажите результат выполнения задачи", path: ["result"] });

    if (value.recordType === "TOUCH") {
      if (!value.dueAt) ctx.addIssue({ code: "custom", message: "Укажите дату касания", path: ["dueAt"] });
      if (!value.result) ctx.addIssue({ code: "custom", message: "Укажите результат касания", path: ["result"] });
    }

    if ((value.nextStepText && !value.nextStepAt) || (!value.nextStepText && value.nextStepAt)) {
      ctx.addIssue({ code: "custom", message: "Заполните текст и дату следующего шага", path: ["nextStepText"] });
    }
  });

export type TaskFormData = z.infer<typeof taskSchema>;

export function parseTaskForm(formData: FormData) {
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

export function normalizeStatus(recordType: TaskRecordType, status: TaskStatus, result?: string | null): TaskStatus {
  if (recordType === "TOUCH") {
    if (status === "NEEDS_NEXT_STEP" || status === "CLOSED") return status;
    return result ? "RECORDED" : "NEEDS_NEXT_STEP";
  }
  return status;
}

export function toTaskDocument(data: TaskFormData, links: Awaited<ReturnType<typeof resolveTaskLinks>>, forceResponsibleId?: string) {
  const recordType = data.recordType as TaskRecordType;
  const status = normalizeStatus(recordType, data.status as TaskStatus, data.result);
  const dueAt = optionalDateTime(data.dueAt);
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
    nextStepAt: optionalDateTime(data.nextStepAt),
    notes: data.description || null
  };
}
