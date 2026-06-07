import Link from "next/link";
import { detailDate, detailMoney, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard, TextBlock } from "@/components/crm/detail-page";
import { ProposalVersionsTable } from "@/components/crm/related";
import { CompactMetricCard } from "@/components/crm/summary-card";
import { proposalDeclineReasonLabels, recipientTypeLabels } from "@/lib/constants";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getProposalForUser, getProposalVersionGroup } from "@/modules/proposals/queries";
import { canViewSensitiveFields, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
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
  createVersionAction,
  canViewBonusAmounts,
  bonusPercent,
  user
}: {
  proposal: ProposalDetail;
  versions: ProposalVersions;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
  canCreateVersion: boolean;
  createVersionAction: () => Promise<void>;
  canViewBonusAmounts: boolean;
  bonusPercent?: number | null;
  user: PermissionUser;
}) {
  const potentialBonus = bonusPercent ? proposal.amount * bonusPercent / 100 : null;
  const canViewSensitive = canViewSensitiveFields(user, proposal);

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
                canViewSensitive ? detailMoney("Сумма", proposal.amount, "0 ₽") : detailText("Сумма", "Скрыто"),
                canViewSensitive ? detailText("Скидка, %", proposal.discountPercent) : detailText("Скидка, %", "Скрыто"),
                canViewSensitive ? detailMoney("Скидка, сумма", proposal.discountAmount, "0 ₽") : detailText("Скидка, сумма", "Скрыто"),
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
                    {proposal.fileUrl ? <Link className="hover:underline" href={`/api/proposals/${proposal.id}/download`}>Скачать {proposal.fileName}</Link> : "Файл не прикреплен."}
                  </TextBlock>
                  <TextBlock label="Комментарий">{canViewSensitive ? proposal.comment || "Комментариев пока нет." : "Скрыто"}</TextBlock>
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
              user={user}
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
          value: "bonus",
          label: "Потенциальный бонус",
          content: (
            <div className="grid gap-4 md:grid-cols-3">
              <CompactMetricCard title="Дизайнер" value={proposal.designer?.name ?? "Нет"} />
              <CompactMetricCard title="Активная ставка" value={canViewBonusAmounts && bonusPercent ? `${bonusPercent}%` : "Скрыто"} />
              <CompactMetricCard title="Потенциальный бонус" value={canViewBonusAmounts && potentialBonus ? formatMoney(potentialBonus, "0 ₽") : "Скрыто"} />
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
