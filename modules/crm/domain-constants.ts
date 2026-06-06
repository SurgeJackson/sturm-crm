import type { CommercialProposalStatus, DealStage, TaskStatus } from "@/generated/prisma/client";

export const closedDealStages: DealStage[] = ["LOST", "COMPLETED"];

export const activeDealStages: DealStage[] = [
  "NEW_REQUEST",
  "QUALIFICATION",
  "SELECTION",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_SENT",
  "WAITING_DECISION",
  "NEGOTIATION",
  "INVOICE_OR_ORDER",
  "PAID",
  "IN_DELIVERY"
];

export const closedProposalStatuses: CommercialProposalStatus[] = ["ACCEPTED", "DECLINED", "ARCHIVED"];

export const closedTaskStatuses: TaskStatus[] = ["DONE", "CANCELLED", "CLOSED"];
export const closedActivityStatuses: TaskStatus[] = [...closedTaskStatuses, "RECORDED"];
