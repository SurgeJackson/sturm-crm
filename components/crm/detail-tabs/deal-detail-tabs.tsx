import { detailDate, detailMoney, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard, TextBlock } from "@/components/crm/detail-page";
import { DealProposalsTable } from "@/components/crm/related";
import {
  dealLossReasonLabels,
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealSourceLabels
} from "@/lib/constants";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getDealForUser } from "@/modules/deals/queries";
import { formatRussianDate } from "@/utils/date";
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
  canCreateTasks
}: {
  deal: DealDetail;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
}) {
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
          content: <DealProposalsTable dealId={deal.id} proposals={deal.proposals} />
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
          value: "audit",
          label: "История изменений",
          content: <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        }
      ]}
    />
  );
}
