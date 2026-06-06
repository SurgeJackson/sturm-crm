import { Badge } from "@/components/ui/badge";
import { bonusEligibilityLabels, computeBonusEligibilityStatus, crmDisciplineStatus } from "@/modules/crm-discipline/service";
import type { CrmViolationView } from "./types";
import { bonusVariant, disciplineLabels, disciplineVariant } from "./variants";

export function CrmDisciplineBadges({
  violations,
  bonusApplies = true
}: {
  violations: CrmViolationView[];
  bonusApplies?: boolean;
}) {
  const discipline = crmDisciplineStatus(violations);
  const bonusStatus = computeBonusEligibilityStatus(violations, bonusApplies);

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={disciplineVariant(discipline)}>{disciplineLabels[discipline]}</Badge>
      <Badge variant={bonusVariant(bonusStatus)}>{bonusEligibilityLabels[bonusStatus]}</Badge>
    </div>
  );
}

export function CrmDisciplineBadge({ violations }: { violations: CrmViolationView[] }) {
  const discipline = crmDisciplineStatus(violations);
  return <Badge variant={disciplineVariant(discipline)}>{disciplineLabels[discipline]}</Badge>;
}

export function BonusEligibilityBadge({
  violations,
  bonusApplies = true
}: {
  violations: CrmViolationView[];
  bonusApplies?: boolean;
}) {
  const bonusStatus = computeBonusEligibilityStatus(violations, bonusApplies);
  return <Badge variant={bonusVariant(bonusStatus)}>{bonusEligibilityLabels[bonusStatus]}</Badge>;
}
