import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import type { CrmViolationView } from "@/components/crm/discipline/types";
import { TableCell } from "@/components/ui/table";

export function CrmDisciplineCell({ violations, cellLabel = "CRM-дисциплина" }: { violations: CrmViolationView[]; cellLabel?: string }) {
  return (
    <TableCell label={cellLabel}>
      <CrmDisciplineBadge violations={violations} />
    </TableCell>
  );
}

export function BonusEligibilityCell({ violations, cellLabel = "Учет в премии" }: { violations: CrmViolationView[]; cellLabel?: string }) {
  return (
    <TableCell label={cellLabel}>
      <BonusEligibilityBadge violations={violations} />
    </TableCell>
  );
}
