import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  ActionPromptCard,
  AuditLogCard,
  EntityDetailShell,
  EntityDetailTabs,
  EntityTasksCard,
  TextBlock
} from "@/components/crm/detail-page";
import { EntityDetailsCard } from "@/components/crm/detail";
import { ProposalVersionsTable } from "@/components/crm/related";
import { proposalStatusVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuditLogs } from "@/lib/audit-log";
import {
  commercialProposalStatusLabels,
  proposalDeclineReasonLabels,
  recipientTypeLabels
} from "@/lib/constants";
import {
  archiveProposalAction,
  createProposalVersionAction,
  moveDealToInvoiceFromProposalAction
} from "@/modules/proposals/actions";
import { getProposalForUser, getProposalVersionGroup } from "@/modules/proposals/queries";
import { canArchiveRecord, canCreateTask, canEditRecord } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { buildTaskHref } from "@/utils/task-href";

type ProposalPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; dealStage?: string; error?: string }>;
};

export default async function ProposalPage({ params, searchParams }: ProposalPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [proposal, versions, auditLogs] = await Promise.all([
    getProposalForUser(id, user),
    getProposalVersionGroup(id),
    getAuditLogs("PROPOSAL", id)
  ]);
  const archiveAction = archiveProposalAction.bind(null, id);
  const createVersionAction = createProposalVersionAction.bind(null, id);
  const moveDealAction = moveDealToInvoiceFromProposalAction.bind(null, id);

  return (
    <EntityDetailShell
      title={proposal.proposalNumber}
      badges={
        <>
          <Badge variant={proposalStatusVariant(proposal.status)}>{commercialProposalStatusLabels[proposal.status]}</Badge>
          <Badge variant="outline">v{proposal.version}</Badge>
            <Badge variant="outline">{formatMoney(proposal.amount, "0 ₽")}</Badge>
        </>
      }
      editHref={`/proposals/${id}/edit`}
      canEdit={canEditRecord(user, proposal)}
      actions={canEditRecord(user, proposal) ? (
        <form action={createVersionAction}>
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4" />
            Новая версия
          </Button>
        </form>
      ) : null}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, proposal) && !proposal.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "КП сохранено." },
        { show: Boolean(query.archived), message: "КП архивировано." },
        { show: Boolean(query.dealStage), message: "Сделка переведена в стадию “Счет / заказ”." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно или данные не заполнены." }
      ]}
      discipline={{
        entityType: "PROPOSAL",
        entityId: proposal.id,
        editHref: `/proposals/${id}/edit`,
        returnTo: `/proposals/${id}`,
        violations: proposal.crmViolations,
        user
      }}
    >

      {proposal.status === "ACCEPTED" && proposal.deal.stage !== "INVOICE_OR_ORDER" ? (
        <ActionPromptCard
          message="КП принято. Перевести сделку в стадию “Счет / заказ”?"
          action={
            <form action={moveDealAction}>
              <Button type="submit" variant="secondary">Перевести сделку</Button>
            </form>
          }
        />
      ) : null}

      <EntityDetailTabs
        tabs={[
          {
            value: "main",
            label: "Основное",
            content: (
              <EntityDetailsCard
                title="Данные КП"
                fields={[
                  { label: "Сделка", value: proposal.deal.title },
                  { label: "Клиент", value: proposal.client.name },
                  { label: "Объект", value: proposal.projectObject.title },
                  { label: "Дизайнер", value: proposal.designer?.name },
                  { label: "Ответственный", value: proposal.responsible.name },
                  { label: "Создал", value: proposal.createdBy.name },
                  { label: "Сумма", value: formatMoney(proposal.amount, "0 ₽") },
                  { label: "Скидка, %", value: proposal.discountPercent },
                  { label: "Скидка, сумма", value: formatMoney(proposal.discountAmount, "0 ₽") },
                  { label: "Получатель", value: proposal.recipientName },
                  { label: "Тип получателя", value: proposal.recipientType ? recipientTypeLabels[proposal.recipientType] : null },
                  { label: "Контакт получателя", value: proposal.recipientContact },
                  { label: "Кто согласует", value: proposal.approvalRequiredFrom },
                  { label: "Дата отправки", value: formatRussianDate(proposal.sentAt) },
                  { label: "Следующее касание", value: formatRussianDate(proposal.nextTouchAt) },
                  { label: "Файл", value: proposal.fileName },
                  { label: "Загрузил", value: proposal.uploadedBy?.name },
                  { label: "Причина отклонения", value: proposal.declineReason ? proposalDeclineReasonLabels[proposal.declineReason] : null }
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
                canCreateVersion={canEditRecord(user, proposal)}
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
                canCreate={canCreateTask(user)}
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
    </EntityDetailShell>
  );
}
