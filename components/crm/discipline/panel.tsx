import Link from "next/link";
import type { AuditEntityType } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { InlineNotice } from "@/components/ui/bordered-list-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  bonusEligibilityLabels,
  computeBonusEligibilityStatus,
  crmDisciplineStatus,
  crmEntityHref
} from "@/modules/crm-discipline/bonus";
import type { PermissionUser } from "@/permissions";
import type { CrmViolationView } from "./types";
import { CrmViolationItem } from "./violation-item";
import { bonusVariant, disciplineLabels, disciplineVariant } from "./variants";

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
          <InlineNotice tone="accent">
            Эта запись не учитывается в премировании до устранения критических нарушений.
          </InlineNotice>
        ) : bonusStatus === "NEEDS_FIX" ? (
          <InlineNotice>
            Запись требует исправления для корректного учета.
          </InlineNotice>
        ) : null}

        {violations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Активных нарушений CRM-дисциплины нет.</p>
        ) : (
          <div className="space-y-3">
            {violations.map((violation) => (
              <CrmViolationItem
                key={violation.id}
                violation={violation}
                editHref={editHref}
                returnTo={returnTo}
                user={user}
              />
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
