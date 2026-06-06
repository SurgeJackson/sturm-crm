import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ignoreCrmViolationAction } from "@/modules/crm-discipline/actions";
import { crmViolationSeverityLabels } from "@/modules/crm-discipline/service";
import { canIgnoreCrmViolation, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import type { CrmViolationView } from "./types";
import { crmSeverityVariant } from "./variants";

export function CrmViolationItem({
  violation,
  editHref,
  returnTo,
  user
}: {
  violation: CrmViolationView;
  editHref: string;
  returnTo: string;
  user: PermissionUser;
}) {
  const canIgnore = canIgnoreCrmViolation(user);

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="font-medium">{violation.message}</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={crmSeverityVariant(violation.severity)}>{crmViolationSeverityLabels[violation.severity]}</Badge>
            <Badge variant={violation.canAffectBonus ? "warning" : "outline"}>
              {violation.canAffectBonus ? "Влияет на премирование" : "Не влияет на премирование"}
            </Badge>
            <Badge variant="outline">{violation.violationCode}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Обнаружено: {formatRussianDate(violation.detectedAt)} · Ответственный: {violation.responsible?.name ?? "Не назначен"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={editHref}>Исправить</Link>
          </Button>
          {canIgnore ? (
            <form action={ignoreCrmViolationAction.bind(null, violation.id, returnTo)}>
              <Button type="submit" size="sm" variant="ghost">
                Игнорировать
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
