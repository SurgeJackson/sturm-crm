import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import type { CrmViolationView } from "@/components/crm/discipline/types";
import { TableCell } from "@/components/ui/table";

export function CrmDisciplineCell({ violations }: { violations: CrmViolationView[] }) {
  return (
    <TableCell>
      <CrmDisciplineBadge violations={violations} />
    </TableCell>
  );
}

export function BonusEligibilityCell({ violations }: { violations: CrmViolationView[] }) {
  return (
    <TableCell>
      <BonusEligibilityBadge violations={violations} />
    </TableCell>
  );
}
