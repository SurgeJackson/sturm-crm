import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityDetailShell, EntityDetailTabs, EntityInfoCard, EntityTasksCard } from "@/components/crm/detail-page";
import { EntityDetailsCard } from "@/components/crm/detail";
import { ClientRelatedTables } from "@/components/crm/related";
import { Badge } from "@/components/ui/badge";
import { archiveClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { getAuditLogs } from "@/lib/audit-log";
import {
  clientSourceLabels,
  clientStatusLabels,
  clientTypeLabels
} from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { buildTaskHref } from "@/utils/task-href";
import { canArchiveRecord, canCreateTask, canEditRecord } from "@/permissions";

type ClientPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; error?: string }>;
};

export default async function ClientPage({ params, searchParams }: ClientPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [client, auditLogs] = await Promise.all([
    getClientForUser(id, user),
    getAuditLogs("CLIENT", id)
  ]);
  const archiveAction = archiveClientAction.bind(null, id);

  return (
    <EntityDetailShell
      title={client.name}
      badges={
        <>
          <Badge variant={client.status === "ARCHIVED" ? "outline" : "secondary"}>{clientStatusLabels[client.status]}</Badge>
          <Badge variant="outline">{clientTypeLabels[client.clientType]}</Badge>
        </>
      }
      editHref={`/clients/${id}/edit`}
      canEdit={canEditRecord(user, client)}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, client) && !client.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "Клиент сохранен." },
        { show: Boolean(query.archived), message: "Клиент архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]}
      discipline={{
        entityType: "CLIENT",
        entityId: client.id,
        editHref: `/clients/${id}/edit`,
        returnTo: `/clients/${id}`,
        violations: client.crmViolations,
        user
      }}
    >

      <EntityDetailTabs
        tabs={[
          {
            value: "main",
            label: "Основное",
            content: (
              <EntityDetailsCard
                title="Данные клиента"
                fields={[
                  { label: "Телефон", value: client.phone },
                  { label: "Мессенджер", value: client.messenger },
                  { label: "Email", value: client.email },
                  { label: "Город", value: client.city },
                  { label: "Источник", value: clientSourceLabels[client.source] },
                  { label: "Ответственный", value: client.responsible.name },
                  { label: "Создал", value: client.createdBy.name },
                  { label: "Последний контакт", value: formatRussianDate(client.lastContactAt) },
                  { label: "Следующий контакт", value: formatRussianDate(client.nextContactAt) }
                ]}
              />
            )
          },
          {
            value: "comments",
            label: "Комментарии",
            content: (
              <EntityInfoCard title="Комментарии">
                <div className="whitespace-pre-wrap text-sm">{client.comment || "Комментариев пока нет."}</div>
              </EntityInfoCard>
            )
          },
          {
            value: "links",
            label: "Связи",
            content: <ClientRelatedTables client={client} />
          },
          {
            value: "tasks",
            label: "Задачи / касания",
            content: (
              <EntityTasksCard
                items={client.tasks}
                canCreate={canCreateTask(user)}
                taskHref={buildTaskHref({ clientId: client.id, responsibleId: client.responsibleId })}
                touchHref={buildTaskHref({ recordType: "TOUCH", clientId: client.id, responsibleId: client.responsibleId })}
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
