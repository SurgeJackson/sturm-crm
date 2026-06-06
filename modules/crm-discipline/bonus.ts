import type { AuditEntityType, CrmViolation, CrmViolationSeverity } from "@/generated/prisma/client";
import type { CrmViolationDraft } from "@/modules/crm-discipline/rules";

export type BonusEligibilityStatus = "ELIGIBLE" | "NEEDS_FIX" | "NOT_ELIGIBLE" | "NOT_APPLICABLE";

export const crmViolationSeverityLabels: Record<CrmViolationSeverity, string> = {
  CRITICAL: "Критическое",
  MEDIUM: "Среднее",
  LOW: "Легкое"
};

export const bonusEligibilityLabels: Record<BonusEligibilityStatus, string> = {
  ELIGIBLE: "Учитывается",
  NEEDS_FIX: "Требует исправления",
  NOT_ELIGIBLE: "Не учитывается",
  NOT_APPLICABLE: "Не применяется"
};

export const bonusEntityTypes = new Set<AuditEntityType>(["CLIENT", "OBJECT", "DEAL", "PROPOSAL"]);

export function computeBonusEligibilityStatus(
  violations: Array<Pick<CrmViolation, "severity" | "canAffectBonus" | "status">> | CrmViolationDraft[],
  applies = true
): BonusEligibilityStatus {
  if (!applies) return "NOT_APPLICABLE";

  const activeBonusViolations = violations.filter((violation) => {
    const status = "status" in violation ? violation.status : "ACTIVE";
    return status === "ACTIVE" && violation.canAffectBonus;
  });

  if (activeBonusViolations.some((violation) => violation.severity === "CRITICAL" || violation.severity === "critical")) return "NOT_ELIGIBLE";
  if (activeBonusViolations.some((violation) => violation.severity === "MEDIUM" || violation.severity === "medium")) return "NEEDS_FIX";
  return "ELIGIBLE";
}

export function crmDisciplineStatus(violations: Array<Pick<CrmViolation, "severity" | "status">>) {
  const active = violations.filter((violation) => violation.status === "ACTIVE");
  if (active.some((violation) => violation.severity === "CRITICAL")) return "critical" as const;
  if (active.length > 0) return "needs_fix" as const;
  return "correct" as const;
}

export function crmEntityHref(entityType: AuditEntityType, entityId: string) {
  const prefixes: Partial<Record<AuditEntityType, string>> = {
    CLIENT: "/clients",
    DESIGNER: "/designers",
    OBJECT: "/objects",
    DEAL: "/deals",
    PROPOSAL: "/proposals",
    TASK: "/tasks"
  };
  return `${prefixes[entityType] ?? "/reports/crm-discipline"}/${entityId}`;
}
