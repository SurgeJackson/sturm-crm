import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityInfoCard, EntityPageHeader, EntityTasksCard, NoticeStack } from "@/components/crm/detail-page";
import { Detail, DetailSection } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { ClientRelatedTables } from "@/components/crm/related-tables";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { archiveClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { getAuditLogs } from "@/lib/audit-log";
import {
  clientSourceLabels,
  clientStatusLabels,
  clientTypeLabels
} from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
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
    <div className="space-y-6">
      <EntityPageHeader
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
      />

      <NoticeStack notices={[
        { show: Boolean(query.saved), message: "Клиент сохранен." },
        { show: Boolean(query.archived), message: "Клиент архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]} />

      <CrmDisciplinePanel
        entityType="CLIENT"
        entityId={client.id}
        editHref={`/clients/${id}/edit`}
        returnTo={`/clients/${id}`}
        violations={client.crmViolations}
        user={user}
      />

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="links">Связи</TabsTrigger>
          <TabsTrigger value="tasks">Задачи / касания</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <DetailSection title="Данные клиента">
                <Detail label="Телефон" value={client.phone} />
                <Detail label="Мессенджер" value={client.messenger} />
                <Detail label="Email" value={client.email} />
                <Detail label="Город" value={client.city} />
                <Detail label="Источник" value={clientSourceLabels[client.source]} />
                <Detail label="Ответственный" value={client.responsible.name} />
                <Detail label="Создал" value={client.createdBy.name} />
                <Detail label="Последний контакт" value={formatRussianDate(client.lastContactAt)} />
                <Detail label="Следующий контакт" value={formatRussianDate(client.nextContactAt)} />
          </DetailSection>
        </TabsContent>
        <TabsContent value="comments">
          <EntityInfoCard title="Комментарии">
            <div className="whitespace-pre-wrap text-sm">{client.comment || "Комментариев пока нет."}</div>
          </EntityInfoCard>
        </TabsContent>
        <TabsContent value="links">
          <ClientRelatedTables client={client} />
        </TabsContent>
        <TabsContent value="tasks">
          <EntityTasksCard
            items={client.tasks}
            canCreate={canCreateTask(user)}
            taskHref={`/tasks/new?clientId=${client.id}&responsibleId=${client.responsibleId}`}
            touchHref={`/tasks/new?recordType=TOUCH&clientId=${client.id}&responsibleId=${client.responsibleId}`}
          />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
