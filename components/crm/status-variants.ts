import type { BadgeProps } from "@/components/ui/badge";
import type {
  commercialProposalStatusLabels,
  dealStageLabels,
  designerBonusAccrualStatusLabels,
  designerBonusAgreementStatusLabels,
  designerBonusPayoutStatusLabels,
  designerPotentialLabels,
  objectStatusLabels,
  paymentStatusLabels,
  taskStatusLabels
} from "@/lib/constants";

type BadgeVariant = BadgeProps["variant"];

export function dealStageVariant(stage: keyof typeof dealStageLabels): BadgeVariant {
  return stage === "LOST" ? "warning" : "secondary";
}

export function proposalStatusVariant(status: keyof typeof commercialProposalStatusLabels): BadgeVariant {
  if (status === "DECLINED" || status === "ARCHIVED") return "warning";
  if (status === "ACCEPTED" || status === "SENT") return "secondary";
  return "outline";
}

export function objectStatusVariant(status: keyof typeof objectStatusLabels): BadgeVariant {
  if (status === "LOST" || status === "ARCHIVED" || status === "FROZEN") return "warning";
  return "secondary";
}

export function designerPotentialVariant(potential: keyof typeof designerPotentialLabels): BadgeVariant {
  return potential === "A" ? "warning" : "outline";
}

export function taskStatusVariant(status: keyof typeof taskStatusLabels): BadgeVariant {
  return status === "DONE" || status === "RECORDED" || status === "CLOSED" ? "secondary" : "outline";
}

export function paymentStatusVariant(status: keyof typeof paymentStatusLabels): BadgeVariant {
  if (status === "CANCELLED") return "warning";
  if (status === "CONFIRMED") return "secondary";
  return "outline";
}

export function bonusAgreementStatusVariant(status: keyof typeof designerBonusAgreementStatusLabels): BadgeVariant {
  if (status === "ACTIVE") return "secondary";
  if (status === "PAUSED") return "warning";
  return "outline";
}

export function bonusAccrualStatusVariant(status: keyof typeof designerBonusAccrualStatusLabels): BadgeVariant {
  if (status === "CANCELLED" || status === "REVERSED") return "warning";
  if (status === "ACCRUED" || status === "APPROVED" || status === "PAID") return "secondary";
  return "outline";
}

export function bonusPayoutStatusVariant(status: keyof typeof designerBonusPayoutStatusLabels): BadgeVariant {
  if (status === "CANCELLED") return "warning";
  if (status === "APPROVED" || status === "PAID") return "secondary";
  return "outline";
}
