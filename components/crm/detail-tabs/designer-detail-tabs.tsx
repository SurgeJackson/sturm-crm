import { detailDate, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard } from "@/components/crm/detail-page";
import { DesignerDealsTable, DesignerObjectsTable, DesignerProposalsTable } from "@/components/crm/related";
import { DesignerBonusPanel } from "@/components/designer-bonuses/designer-bonus-panel";
import { CompactMetricCard } from "@/components/crm/summary-card";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  designerRoleLabels
} from "@/lib/constants";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getDesignerBonusSnapshot } from "@/modules/designer-bonuses/queries";
import type { getDesignerForUser } from "@/modules/designers/queries";
import { canViewSensitiveFields, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { buildTaskHref } from "@/utils/task-href";

type DesignerDetail = Awaited<ReturnType<typeof getDesignerForUser>>;
type AuditLogs = Awaited<ReturnType<typeof getAuditLogs>>;
type BonusSnapshot = Awaited<ReturnType<typeof getDesignerBonusSnapshot>>;

export function DesignerDetailTabs({
  designer,
  auditLogs,
  canCreateTasks,
  bonusSnapshot,
  canManageBonus,
  canViewBonusAmounts,
  user
}: {
  designer: DesignerDetail;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
  bonusSnapshot: BonusSnapshot | null;
  canManageBonus: boolean;
  canViewBonusAmounts: boolean;
  user: PermissionUser;
}) {
  const bonusTab = bonusSnapshot ? [{
    value: "bonuses",
    label: "Бонусы и взаиморасчеты",
    content: (
      <DesignerBonusPanel
        designerId={designer.id}
        snapshot={bonusSnapshot}
        canManage={canManageBonus}
        showAmounts={canViewBonusAmounts}
        deals={designer.deals}
      />
    )
  }] : [];

  return (
    <EntityDetailTabs
      tabs={[
        {
          value: "main",
          label: "Основное",
          content: (
            <EntityDetailsCard
              title="Контакт"
              fields={[
                detailText("Студия", designer.studio),
                detailText("Роль", designerRoleLabels[designer.role]),
                detailText("Телефон", designer.phone),
                detailText("Мессенджер", designer.messenger),
                detailText("Email", designer.email),
                detailText("Сайт", designer.website),
                detailText("Город", designer.city),
                detailText("Ответственный", designer.responsible.name),
                detailText("Создал", designer.createdBy.name)
              ]}
            />
          )
        },
        {
          value: "pipeline",
          label: "Воронка / отношения",
          content: (
            <EntityDetailsCard
              title="Отношения"
              fields={[
                detailText("Этап", designerRelationshipStageLabels[designer.relationshipStage]),
                detailText("Потенциал", designerPotentialLabels[designer.potential]),
                detailText("Лояльность", designerLoyaltyLabels[designer.loyalty]),
                detailDate("Первый контакт", designer.firstContactAt),
                detailDate("Последнее касание", designer.lastTouchAt),
                detailText("Следующий шаг", `${formatRussianDate(designer.nextStepAt)}: ${designer.nextStepText ?? ""}`)
              ]}
            />
          )
        },
        {
          value: "touches",
          label: "Касания и задачи",
          content: (
            <EntityTasksCard
              title="Касания и задачи"
              items={designer.tasks}
              canCreate={canCreateTasks}
              taskHref={buildTaskHref({ designerId: designer.id, responsibleId: designer.responsibleId })}
              touchHref={buildTaskHref({ recordType: "TOUCH", designerId: designer.id, responsibleId: designer.responsibleId })}
            />
          )
        },
        {
          value: "objects",
          label: "Связанные объекты",
          content: <DesignerObjectsTable objects={designer.projectObjects} />
        },
        {
          value: "deals",
          label: "Связанные сделки",
          content: <DesignerDealsTable deals={designer.deals} />
        },
        {
          value: "proposals",
          label: "КП",
          content: <DesignerProposalsTable proposals={designer.proposals} user={user} />
        },
        ...bonusTab,
        {
          value: "analytics",
          label: "Аналитика",
          content: (
            <div className="grid gap-4 md:grid-cols-4">
              <CompactMetricCard title="Передано объектов" value={designer.transferredObjectsCount} />
              <CompactMetricCard title="Активные объекты" value={designer.activeObjectsCount} />
              <CompactMetricCard title="Сумма КП" value={canViewSensitiveFields(user, designer) ? formatMoney(designer.proposalsTotalAmount, "0 ₽") : "Скрыто"} />
              <CompactMetricCard title="Сумма оплат" value={canViewBonusAmounts ? formatMoney(designer.paymentsTotalAmount, "0 ₽") : "Скрыто"} />
            </div>
          )
        },
        {
          value: "audit",
          label: "История изменений",
          content: <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        }
      ]}
    />
  );
}
