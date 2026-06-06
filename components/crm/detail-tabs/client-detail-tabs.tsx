import { detailDate, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityInfoCard, EntityTasksCard } from "@/components/crm/detail-page";
import { ClientRelatedTables } from "@/components/crm/related";
import { clientSourceLabels } from "@/lib/constants";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getClientForUser } from "@/modules/clients/queries";
import { formatRussianDate } from "@/utils/date";
import { buildTaskHref } from "@/utils/task-href";

type ClientDetail = Awaited<ReturnType<typeof getClientForUser>>;
type AuditLogs = Awaited<ReturnType<typeof getAuditLogs>>;

export function ClientDetailTabs({
  client,
  auditLogs,
  canCreateTasks
}: {
  client: ClientDetail;
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
              title="Данные клиента"
              fields={[
                detailText("Телефон", client.phone),
                detailText("Мессенджер", client.messenger),
                detailText("Email", client.email),
                detailText("Город", client.city),
                detailText("Источник", clientSourceLabels[client.source]),
                detailText("Ответственный", client.responsible.name),
                detailText("Создал", client.createdBy.name),
                detailDate("Последний контакт", client.lastContactAt),
                detailDate("Следующий контакт", client.nextContactAt)
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
              canCreate={canCreateTasks}
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
  );
}
