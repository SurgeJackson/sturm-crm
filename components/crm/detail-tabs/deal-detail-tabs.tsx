import { detailDate, detailMoney, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard, TextBlock } from "@/components/crm/detail-page";
import { DealBonusPaymentsTable } from "@/components/designer-bonuses/bonus-tables";
import { DealProposalsTable } from "@/components/crm/related";
import { CompactMetricCard } from "@/components/crm/summary-card";
import {
  dealLossReasonLabels,
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealSourceLabels
} from "@/lib/constants";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getDealForUser } from "@/modules/deals/queries";
import type { PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { paymentSignedAmount } from "@/utils/payments";
import { buildTaskHref } from "@/utils/task-href";

type DealDetail = Awaited<ReturnType<typeof getDealForUser>>;
type AuditLogs = Awaited<ReturnType<typeof getAuditLogs>>;

function probabilityLabel(deal: { probability: keyof typeof dealProbabilityLabels | null }) {
  if (!deal.probability) return null;
  return `${dealProbabilityLabels[deal.probability]} · ${dealProbabilityPercent[deal.probability]}%`;
}

export function DealDetailTabs({
  deal,
  auditLogs,
  canCreateTasks,
  canViewBonusAmounts,
  user
}: {
  deal: DealDetail;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
  canViewBonusAmounts: boolean;
  user: PermissionUser;
}) {
  const paid = deal.payments.filter((payment) => payment.status === "CONFIRMED").reduce((sum, payment) => sum + paymentSignedAmount(payment), 0);
  const accrued = deal.bonusAccruals.filter((accrual) => accrual.status !== "CANCELLED" && accrual.status !== "REVERSED").reduce((sum, accrual) => sum + accrual.bonusAmount, 0);

  return (
    <EntityDetailTabs
      tabs={[
        {
          value: "main",
          label: "Основное",
          content: (
            <EntityDetailsCard
              title="Данные сделки"
              fields={[
                detailText("Клиент", deal.client.name),
                detailText("Объект", deal.projectObject.title),
                detailText("Дизайнер", deal.designer?.name),
                detailText("Ответственный", deal.responsible.name),
                detailText("Создал", deal.createdBy.name),
                detailMoney("Сумма", deal.potentialAmount, "Нет данных"),
                detailText("Вероятность", probabilityLabel(deal)),
                detailDate("Дата следующего действия", deal.nextActionAt),
                detailText("Следующий шаг", deal.nextActionText),
                detailText("Источник", dealSourceLabels[deal.source]),
                detailDate("Закрыта", deal.closedAt),
                detailText("Причина проигрыша", deal.lossReason ? dealLossReasonLabels[deal.lossReason] : null)
              ]}
              footer={
                <div className="grid gap-4 md:grid-cols-2">
                  <TextBlock label="Комментарий">{deal.comment || "Комментариев пока нет."}</TextBlock>
                  <TextBlock label="Комментарий к проигрышу">{deal.lossComment || "Нет данных"}</TextBlock>
                </div>
              }
            />
          )
        },
        {
          value: "proposals",
          label: "КП",
          content: <DealProposalsTable dealId={deal.id} proposals={deal.proposals} user={user} />
        },
        {
          value: "tasks",
          label: "Задачи / касания",
          content: (
            <EntityTasksCard
              items={deal.tasks}
              canCreate={canCreateTasks}
              taskHref={buildTaskHref({ dealId: deal.id, clientId: deal.clientId, objectId: deal.objectId, responsibleId: deal.responsibleId, designerId: deal.designerId })}
              touchHref={buildTaskHref({ recordType: "TOUCH", dealId: deal.id, clientId: deal.clientId, objectId: deal.objectId, responsibleId: deal.responsibleId, designerId: deal.designerId })}
            />
          )
        },
        {
          value: "bonuses",
          label: "Бонусы дизайнера",
          content: (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <CompactMetricCard title="Дизайнер" value={deal.designer?.name ?? "Нет"} />
                <CompactMetricCard title="Оплачено" value={canViewBonusAmounts ? formatMoney(paid, "0 ₽") : "Скрыто"} />
                <CompactMetricCard title="Начислено бонусов" value={canViewBonusAmounts ? formatMoney(accrued, "0 ₽") : "Скрыто"} />
              </div>
              <DealBonusPaymentsTable payments={deal.payments} showAmounts={canViewBonusAmounts} />
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
