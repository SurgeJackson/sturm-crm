import Link from "next/link";
import { detailDate, detailMoney, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard, TextBlock } from "@/components/crm/detail-page";
import { ProposalVersionsTable } from "@/components/crm/related";
import { proposalDeclineReasonLabels, recipientTypeLabels } from "@/lib/constants";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getProposalForUser, getProposalVersionGroup } from "@/modules/proposals/queries";
import { formatRussianDate } from "@/utils/date";
import { buildTaskHref } from "@/utils/task-href";

type ProposalDetail = Awaited<ReturnType<typeof getProposalForUser>>;
type ProposalVersions = Awaited<ReturnType<typeof getProposalVersionGroup>>;
type AuditLogs = Awaited<ReturnType<typeof getAuditLogs>>;

export function ProposalDetailTabs({
  proposal,
  versions,
  auditLogs,
  canCreateTasks,
  canCreateVersion,
  createVersionAction
}: {
  proposal: ProposalDetail;
  versions: ProposalVersions;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
  canCreateVersion: boolean;
  createVersionAction: () => Promise<void>;
}) {
  return (
    <EntityDetailTabs
      tabs={[
        {
          value: "main",
          label: "Основное",
          content: (
            <EntityDetailsCard
              title="Данные КП"
              fields={[
                detailText("Сделка", proposal.deal.title),
                detailText("Клиент", proposal.client.name),
                detailText("Объект", proposal.projectObject.title),
                detailText("Дизайнер", proposal.designer?.name),
                detailText("Ответственный", proposal.responsible.name),
                detailText("Создал", proposal.createdBy.name),
                detailMoney("Сумма", proposal.amount, "0 ₽"),
                detailText("Скидка, %", proposal.discountPercent),
                detailMoney("Скидка, сумма", proposal.discountAmount, "0 ₽"),
                detailText("Получатель", proposal.recipientName),
                detailText("Тип получателя", proposal.recipientType ? recipientTypeLabels[proposal.recipientType] : null),
                detailText("Контакт получателя", proposal.recipientContact),
                detailText("Кто согласует", proposal.approvalRequiredFrom),
                detailDate("Дата отправки", proposal.sentAt),
                detailDate("Следующее касание", proposal.nextTouchAt),
                detailText("Файл", proposal.fileName),
                detailText("Загрузил", proposal.uploadedBy?.name),
                detailText("Причина отклонения", proposal.declineReason ? proposalDeclineReasonLabels[proposal.declineReason] : null)
              ]}
              footer={
                <div className="grid gap-4 md:grid-cols-2">
                  <TextBlock label="Файл КП">
                    {proposal.fileUrl ? <Link className="hover:underline" href={proposal.fileUrl}>Скачать {proposal.fileName}</Link> : "Файл не прикреплен."}
                  </TextBlock>
                  <TextBlock label="Комментарий">{proposal.comment || "Комментариев пока нет."}</TextBlock>
                </div>
              }
            />
          )
        },
        {
          value: "versions",
          label: "Версии",
          content: (
            <ProposalVersionsTable
              versions={versions}
              canCreateVersion={canCreateVersion}
              createVersionAction={createVersionAction}
            />
          )
        },
        {
          value: "tasks",
          label: "Задачи / касания",
          content: (
            <EntityTasksCard
              items={proposal.tasks}
              canCreate={canCreateTasks}
              taskHref={buildTaskHref({ proposalId: proposal.id, dealId: proposal.dealId, clientId: proposal.clientId, objectId: proposal.objectId, responsibleId: proposal.responsibleId, designerId: proposal.designerId })}
              touchHref={buildTaskHref({ recordType: "TOUCH", proposalId: proposal.id, dealId: proposal.dealId, clientId: proposal.clientId, objectId: proposal.objectId, responsibleId: proposal.responsibleId, designerId: proposal.designerId })}
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
