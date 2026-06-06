import type { BadgeProps } from "@/components/ui/badge";
import type {
  commercialProposalStatusLabels,
  dealStageLabels,
  designerPotentialLabels,
  objectStatusLabels,
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
