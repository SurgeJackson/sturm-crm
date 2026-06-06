import type { AuditEntityType, CrmViolationSeverity } from "@/generated/prisma/client";

export type CrmViolationDraft = {
  code: string;
  severity: Lowercase<CrmViolationSeverity>;
  message: string;
  entityType: AuditEntityType;
  entityId: string;
  responsibleId?: string | null;
  canAffectBonus: boolean;
  createdAt: Date;
};

type ClientForDiscipline = {
  id: string;
  phone?: string | null;
  messenger?: string | null;
  source?: string | null;
  responsibleId?: string | null;
  status?: string | null;
  nextContactAt?: Date | null;
};

type DesignerForDiscipline = {
  id: string;
  phone?: string | null;
  messenger?: string | null;
  responsibleId?: string | null;
  nextStepAt?: Date | null;
  nextStepText?: string | null;
  potential?: string | null;
  loyalty?: string | null;
  lastTouchAt?: Date | null;
  relationshipStage?: string | null;
  firstContactAt?: Date | null;
  createdAt?: Date | null;
};

type ObjectForDiscipline = {
  id: string;
  clientId?: string | null;
  responsibleId?: string | null;
  status?: string | null;
  stage?: string | null;
  comment?: string | null;
  tasks?: Array<{ archivedAt?: Date | null; status?: string | null; autoRule?: string | null }>;
};

type DealForDiscipline = {
  id: string;
  clientId?: string | null;
  objectId?: string | null;
  responsibleId?: string | null;
  stage?: string | null;
  nextActionAt?: Date | null;
  nextActionText?: string | null;
  potentialAmount?: number | null;
  lossReason?: string | null;
};

type ProposalForDiscipline = {
  id: string;
  dealId?: string | null;
  responsibleId?: string | null;
  status?: string | null;
  amount?: number | null;
  fileUrl?: string | null;
  nextTouchAt?: Date | null;
  sentAt?: Date | null;
  declineReason?: string | null;
};

type TaskForDiscipline = {
  id: string;
  recordType?: string | null;
  responsibleId?: string | null;
  dueAt?: Date | null;
  status?: string | null;
  result?: string | null;
};

const activeDealStages = new Set(["NEW_REQUEST", "QUALIFICATION", "SELECTION", "PROPOSAL_IN_PROGRESS", "PROPOSAL_SENT", "WAITING_DECISION", "NEGOTIATION", "INVOICE_OR_ORDER", "PAID", "IN_DELIVERY"]);
const closedTaskStatuses = new Set(["DONE", "CANCELLED", "CLOSED", "RECORDED"]);

export type DisciplineRuleOptions = {
  now?: Date;
};

function ruleNow(options?: DisciplineRuleOptions) {
  return options?.now ?? new Date();
}

function daysAgo(days: number, now: Date) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function violation(input: Omit<CrmViolationDraft, "createdAt">, now: Date): CrmViolationDraft {
  return { ...input, createdAt: now };
}

function hasNoContact(record: { phone?: string | null; messenger?: string | null }) {
  return !record.phone && !record.messenger;
}

export function validateClientForDiscipline(client: ClientForDiscipline, options?: DisciplineRuleOptions): CrmViolationDraft[] {
  const result: CrmViolationDraft[] = [];
  const base = { entityType: "CLIENT" as const, entityId: client.id, responsibleId: client.responsibleId };
  const now = ruleNow(options);
  const issue = (input: Omit<CrmViolationDraft, "createdAt">) => violation(input, now);

  if (hasNoContact(client)) result.push(issue({ ...base, code: "CLIENT_NO_CONTACT", severity: "critical", message: "У клиента нет телефона или мессенджера.", canAffectBonus: true }));
  if (!client.responsibleId) result.push(issue({ ...base, code: "CLIENT_NO_RESPONSIBLE", severity: "critical", message: "У клиента не назначен ответственный.", canAffectBonus: true }));
  if (!client.source) result.push(issue({ ...base, code: "CLIENT_NO_SOURCE", severity: "medium", message: "У клиента не указан источник.", canAffectBonus: true }));
  if (client.status === "ACTIVE" && !client.nextContactAt) result.push(issue({ ...base, code: "CLIENT_ACTIVE_NO_NEXT_CONTACT", severity: "medium", message: "Активный клиент без следующего контакта.", canAffectBonus: true }));
  if (!client.status) result.push(issue({ ...base, code: "CLIENT_NO_STATUS", severity: "medium", message: "У клиента не указан статус.", canAffectBonus: false }));

  return result;
}

export function validateDesignerForDiscipline(designer: DesignerForDiscipline, options?: DisciplineRuleOptions): CrmViolationDraft[] {
  const result: CrmViolationDraft[] = [];
  const base = { entityType: "DESIGNER" as const, entityId: designer.id, responsibleId: designer.responsibleId };
  const now = ruleNow(options);
  const issue = (input: Omit<CrmViolationDraft, "createdAt">) => violation(input, now);

  if (hasNoContact(designer)) result.push(issue({ ...base, code: "DESIGNER_NO_CONTACT", severity: "critical", message: "У дизайнера нет телефона или мессенджера.", canAffectBonus: true }));
  if (!designer.responsibleId) result.push(issue({ ...base, code: "DESIGNER_NO_RESPONSIBLE", severity: "critical", message: "У дизайнера не назначен ответственный.", canAffectBonus: true }));
  if (!designer.nextStepAt || !designer.nextStepText) result.push(issue({ ...base, code: "DESIGNER_NO_NEXT_STEP", severity: "medium", message: "У дизайнера не указан следующий шаг.", canAffectBonus: true }));
  if (!designer.potential) result.push(issue({ ...base, code: "DESIGNER_NO_POTENTIAL", severity: "medium", message: "У дизайнера не указан потенциал.", canAffectBonus: false }));
  if (!designer.loyalty) result.push(issue({ ...base, code: "DESIGNER_NO_LOYALTY", severity: "low", message: "У дизайнера не указана лояльность.", canAffectBonus: false }));
  if (!designer.lastTouchAt || designer.lastTouchAt < daysAgo(60, now)) result.push(issue({ ...base, code: "DESIGNER_NO_TOUCH_60_DAYS", severity: "medium", message: "По дизайнеру нет касаний более 60 дней.", canAffectBonus: true }));
  if (designer.relationshipStage === "NEW_CONTACT" && (designer.firstContactAt ?? designer.createdAt ?? now) < daysAgo(14, now)) {
    result.push(issue({ ...base, code: "DESIGNER_NEW_TOO_LONG", severity: "low", message: "Дизайнер находится на этапе нового контакта более 14 дней.", canAffectBonus: false }));
  }

  return result;
}

export function validateObjectForDiscipline(object: ObjectForDiscipline, options?: DisciplineRuleOptions): CrmViolationDraft[] {
  const result: CrmViolationDraft[] = [];
  const base = { entityType: "OBJECT" as const, entityId: object.id, responsibleId: object.responsibleId };
  const now = ruleNow(options);
  const issue = (input: Omit<CrmViolationDraft, "createdAt">) => violation(input, now);
  const hasActiveTask = object.tasks?.some((task) => !task.archivedAt && !closedTaskStatuses.has(task.status ?? ""));
  const hasFrozenReturnTask = object.tasks?.some((task) => !task.archivedAt && !closedTaskStatuses.has(task.status ?? "") && task.autoRule === "FROZEN_OBJECT_RETURN");

  if (!object.clientId) result.push(issue({ ...base, code: "OBJECT_NO_CLIENT", severity: "critical", message: "У объекта не указан клиент.", canAffectBonus: true }));
  if (!object.responsibleId) result.push(issue({ ...base, code: "OBJECT_NO_RESPONSIBLE", severity: "critical", message: "У объекта не назначен ответственный.", canAffectBonus: true }));
  if (object.status === "ACTIVE" && !hasActiveTask) result.push(issue({ ...base, code: "OBJECT_ACTIVE_NO_TASK", severity: "medium", message: "Активный объект без задачи.", canAffectBonus: true }));
  if ((object.status === "FROZEN" || object.stage === "FROZEN") && !hasFrozenReturnTask) result.push(issue({ ...base, code: "OBJECT_FROZEN_NO_RETURN_DATE", severity: "medium", message: "Замороженный объект без запланированной даты возврата.", canAffectBonus: false }));
  if ((object.status === "LOST" || object.stage === "LOST") && !object.comment) result.push(issue({ ...base, code: "OBJECT_LOST_NO_REASON", severity: "medium", message: "Потерянный объект без причины в комментарии.", canAffectBonus: false }));
  if (!object.stage) result.push(issue({ ...base, code: "OBJECT_NO_STAGE", severity: "medium", message: "У объекта не указана стадия.", canAffectBonus: false }));

  return result;
}

export function validateDealForDiscipline(deal: DealForDiscipline, options?: DisciplineRuleOptions): CrmViolationDraft[] {
  const result: CrmViolationDraft[] = [];
  const base = { entityType: "DEAL" as const, entityId: deal.id, responsibleId: deal.responsibleId };
  const now = ruleNow(options);
  const issue = (input: Omit<CrmViolationDraft, "createdAt">) => violation(input, now);
  const isActive = activeDealStages.has(deal.stage ?? "");

  if (!deal.clientId) result.push(issue({ ...base, code: "DEAL_NO_CLIENT", severity: "critical", message: "У сделки не указан клиент.", canAffectBonus: true }));
  if (!deal.objectId) result.push(issue({ ...base, code: "DEAL_NO_OBJECT", severity: "critical", message: "У сделки не указан объект.", canAffectBonus: true }));
  if (!deal.responsibleId) result.push(issue({ ...base, code: "DEAL_NO_RESPONSIBLE", severity: "critical", message: "У сделки не назначен ответственный.", canAffectBonus: true }));
  if (isActive && !deal.nextActionText) result.push(issue({ ...base, code: "DEAL_NO_NEXT_STEP", severity: "critical", message: "Активная сделка без следующего шага.", canAffectBonus: true }));
  if (isActive && !deal.nextActionAt) result.push(issue({ ...base, code: "DEAL_NO_NEXT_ACTION_DATE", severity: "critical", message: "Активная сделка без даты следующего действия.", canAffectBonus: true }));
  if (isActive && deal.nextActionAt && deal.nextActionAt < now) result.push(issue({ ...base, code: "DEAL_OVERDUE_NEXT_ACTION", severity: "medium", message: "Следующее действие по сделке просрочено.", canAffectBonus: true }));
  if (!deal.potentialAmount || deal.potentialAmount <= 0) result.push(issue({ ...base, code: "DEAL_NO_AMOUNT", severity: "medium", message: "У сделки не указана сумма.", canAffectBonus: false }));
  if (deal.stage === "LOST" && !deal.lossReason) result.push(issue({ ...base, code: "DEAL_LOST_NO_REASON", severity: "medium", message: "Проигранная сделка без причины.", canAffectBonus: false }));

  return result;
}

export function validateProposalForDiscipline(proposal: ProposalForDiscipline, options?: DisciplineRuleOptions): CrmViolationDraft[] {
  const result: CrmViolationDraft[] = [];
  const base = { entityType: "PROPOSAL" as const, entityId: proposal.id, responsibleId: proposal.responsibleId };
  const now = ruleNow(options);
  const issue = (input: Omit<CrmViolationDraft, "createdAt">) => violation(input, now);

  if (!proposal.dealId) result.push(issue({ ...base, code: "PROPOSAL_NO_DEAL", severity: "critical", message: "КП не связано со сделкой.", canAffectBonus: true }));
  if (proposal.status === "SENT" && !proposal.fileUrl) result.push(issue({ ...base, code: "PROPOSAL_NO_FILE_SENT", severity: "critical", message: "КП отправлено, но файл не прикреплен.", canAffectBonus: true }));
  if (!proposal.amount || proposal.amount <= 0) result.push(issue({ ...base, code: "PROPOSAL_NO_AMOUNT", severity: "critical", message: "В КП не указана сумма.", canAffectBonus: true }));
  if (proposal.status === "SENT" && !proposal.nextTouchAt) result.push(issue({ ...base, code: "PROPOSAL_NO_FOLLOW_UP", severity: "critical", message: "КП отправлено, но follow-up не назначен.", canAffectBonus: true }));
  if (proposal.nextTouchAt && proposal.nextTouchAt < now && !["ACCEPTED", "DECLINED", "ARCHIVED"].includes(proposal.status ?? "")) result.push(issue({ ...base, code: "PROPOSAL_OVERDUE_FOLLOW_UP", severity: "medium", message: "Follow-up по КП просрочен.", canAffectBonus: true }));
  if (proposal.status === "CLIENT_THINKING" && (proposal.sentAt ?? now) < daysAgo(7, now)) result.push(issue({ ...base, code: "PROPOSAL_CLIENT_THINKING_7_DAYS", severity: "medium", message: "Клиент думает по КП более 7 дней.", canAffectBonus: true }));
  if (proposal.status === "DECLINED" && !proposal.declineReason) result.push(issue({ ...base, code: "PROPOSAL_DECLINED_NO_REASON", severity: "medium", message: "Отклоненное КП без причины.", canAffectBonus: false }));

  return result;
}

export function validateTaskForDiscipline(task: TaskForDiscipline, options?: DisciplineRuleOptions): CrmViolationDraft[] {
  const result: CrmViolationDraft[] = [];
  const base = { entityType: "TASK" as const, entityId: task.id, responsibleId: task.responsibleId };
  const now = ruleNow(options);
  const issue = (input: Omit<CrmViolationDraft, "createdAt">) => violation(input, now);
  const isClosed = closedTaskStatuses.has(task.status ?? "");

  if (!task.responsibleId) result.push(issue({ ...base, code: "TASK_NO_RESPONSIBLE", severity: "critical", message: "У задачи не назначен ответственный.", canAffectBonus: false }));
  if (task.recordType === "TASK" && !task.dueAt) result.push(issue({ ...base, code: "TASK_NO_DUE_DATE", severity: "medium", message: "У задачи не указан срок.", canAffectBonus: false }));
  if (task.recordType === "TASK" && task.dueAt && task.dueAt < now && !isClosed) result.push(issue({ ...base, code: "TASK_OVERDUE", severity: "medium", message: "Задача просрочена.", canAffectBonus: true }));
  if (task.recordType === "TASK" && task.status === "DONE" && !task.result) result.push(issue({ ...base, code: "TASK_DONE_NO_RESULT", severity: "medium", message: "Задача закрыта без результата.", canAffectBonus: true }));
  if (task.recordType === "TOUCH" && !task.result) result.push(issue({ ...base, code: "TOUCH_NO_RESULT", severity: "medium", message: "Касание зафиксировано без результата.", canAffectBonus: true }));

  return result;
}
