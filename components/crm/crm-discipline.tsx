import Link from "next/link";
import type { AuditEntityType, CrmViolationSeverity, CrmViolationStatus } from "@/generated/prisma/client";
import { ignoreCrmViolationAction } from "@/modules/crm-discipline/actions";
import {
  bonusEligibilityLabels,
  computeBonusEligibilityStatus,
  crmDisciplineStatus,
  crmEntityHref,
  crmViolationSeverityLabels,
  type BonusEligibilityStatus
} from "@/modules/crm-discipline/service";
import { canIgnoreCrmViolation, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CrmViolationView = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  violationCode: string;
  severity: CrmViolationSeverity;
  message: string;
  responsibleId: string | null;
  detectedAt: Date;
  status: CrmViolationStatus;
  canAffectBonus: boolean;
  responsible?: { id: string; name: string; email?: string | null } | null;
};

const disciplineLabels = {
  correct: "Корректно",
  needs_fix: "Требует исправления",
  critical: "Критические нарушения"
};

function disciplineVariant(status: ReturnType<typeof crmDisciplineStatus>) {
  if (status === "critical") return "warning" as const;
  if (status === "needs_fix") return "outline" as const;
  return "secondary" as const;
}

function bonusVariant(status: BonusEligibilityStatus) {
  if (status === "NOT_ELIGIBLE") return "warning" as const;
  if (status === "NEEDS_FIX") return "outline" as const;
  if (status === "NOT_APPLICABLE") return "outline" as const;
  return "secondary" as const;
}

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

export function CrmDisciplinePanel({
  entityType,
  entityId,
  editHref,
  returnTo,
  violations,
  user,
  bonusApplies = true
}: {
  entityType: AuditEntityType;
  entityId: string;
  editHref: string;
  returnTo: string;
  violations: CrmViolationView[];
  user: PermissionUser;
  bonusApplies?: boolean;
}) {
  const discipline = crmDisciplineStatus(violations);
  const bonusStatus = computeBonusEligibilityStatus(violations, bonusApplies);
  const canIgnore = canIgnoreCrmViolation(user);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          CRM-дисциплина
          <Badge variant={disciplineVariant(discipline)}>{disciplineLabels[discipline]}</Badge>
          <Badge variant={bonusVariant(bonusStatus)}>{bonusEligibilityLabels[bonusStatus]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bonusStatus === "NOT_ELIGIBLE" ? (
          <div className="rounded-md border border-accent bg-accent/15 p-3 text-sm">
            Эта запись не учитывается в премировании до устранения критических нарушений.
          </div>
        ) : bonusStatus === "NEEDS_FIX" ? (
          <div className="rounded-md border p-3 text-sm">
            Запись требует исправления для корректного учета.
          </div>
        ) : null}

        {violations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Активных нарушений CRM-дисциплины нет.</p>
        ) : (
          <div className="space-y-3">
            {violations.map((violation) => (
              <div key={violation.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="font-medium">{violation.message}</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={violation.severity === "CRITICAL" ? "warning" : "outline"}>{crmViolationSeverityLabels[violation.severity]}</Badge>
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
                        <Button type="submit" size="sm" variant="ghost">Игнорировать</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Правило компании: некорректно оформленные записи не считаются готовыми к управленческому учету и премированию.
          <Link className="ml-2 underline-offset-4 hover:underline" href={`/reports/bonus-eligibility?entity=${entityType}&status=${bonusStatus}`}>
            Открыть отчет
          </Link>
          <Link className="ml-2 underline-offset-4 hover:underline" href={crmEntityHref(entityType, entityId)}>
            Открыть запись
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
