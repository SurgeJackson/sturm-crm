import type { CrmViolationSeverity } from "@/generated/prisma/client";
import { crmDisciplineStatus, type BonusEligibilityStatus } from "@/modules/crm-discipline/service";

export const disciplineLabels = {
  correct: "Корректно",
  needs_fix: "Требует исправления",
  critical: "Критические нарушения"
};

export function disciplineVariant(status: ReturnType<typeof crmDisciplineStatus>) {
  if (status === "critical") return "warning" as const;
  if (status === "needs_fix") return "outline" as const;
  return "secondary" as const;
}

export function bonusVariant(status: BonusEligibilityStatus) {
  if (status === "NOT_ELIGIBLE") return "warning" as const;
  if (status === "NEEDS_FIX") return "outline" as const;
  if (status === "NOT_APPLICABLE") return "outline" as const;
  return "secondary" as const;
}

export function crmSeverityVariant(severity: CrmViolationSeverity | "critical" | "medium" | "light") {
  if (severity === "CRITICAL" || severity === "critical") return "warning" as const;
  return "outline" as const;
}
