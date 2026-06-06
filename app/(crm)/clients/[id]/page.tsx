import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityPageHeader, NoticeStack, TaskQuickActions } from "@/components/crm/detail-page";
import { Detail, DetailSection } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { archiveClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { getAuditLogs } from "@/lib/audit-log";
import {
  clientSourceLabels,
  clientStatusLabels,
  clientTypeLabels,
  commercialProposalStatusLabels,
  dealStageLabels,
  objectStageLabels,
  objectStatusLabels
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
          <Card>
            <CardHeader><CardTitle>Комментарии</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{client.comment || "Комментариев пока нет."}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="links">
          <div className="grid gap-4">
            <TableCard title="Связанные объекты">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Объект</TableHead>
                      <TableHead>Дизайнер</TableHead>
                      <TableHead>Ответственный</TableHead>
                      <TableHead>Стадия</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.projectObjects.length === 0 ? (
                      <EmptyTableRow colSpan={5}>У клиента пока нет связанных объектов.</EmptyTableRow>
                    ) : (
                      client.projectObjects.map((object) => (
                        <TableRow key={object.id}>
                          <TableCell><Link className="font-medium hover:underline" href={`/objects/${object.id}`}>{object.title}</Link></TableCell>
                          <TableCell>{object.designer?.name || "Не выбран"}</TableCell>
                          <TableCell>{object.responsible.name}</TableCell>
                          <TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{objectStatusLabels[object.status]}</Badge></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
            </TableCard>
            <TableCard title="Связанные сделки">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сделка</TableHead>
                      <TableHead>Объект</TableHead>
                      <TableHead>Стадия</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Ответственный</TableHead>
                      <TableHead>Следующее действие</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.deals.length === 0 ? (
                      <EmptyTableRow colSpan={6}>У клиента пока нет связанных сделок.</EmptyTableRow>
                    ) : (
                      client.deals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell>
                          <TableCell><Link className="hover:underline" href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</Link></TableCell>
                          <TableCell><Badge variant="outline">{dealStageLabels[deal.stage]}</Badge></TableCell>
                          <TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Без суммы"}</TableCell>
                          <TableCell>{deal.responsible.name}</TableCell>
                          <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
            </TableCard>
            <TableCard title="Связанные КП">
                  <TableHeader>
                    <TableRow>
                      <TableHead>КП</TableHead>
                      <TableHead>Сделка</TableHead>
                      <TableHead>Объект</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Follow-up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.proposals.length === 0 ? (
                      <EmptyTableRow colSpan={6}>По клиенту пока нет КП</EmptyTableRow>
                    ) : (
                      client.proposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
                          <TableCell><Link className="hover:underline" href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</Link></TableCell>
                          <TableCell><Link className="hover:underline" href={`/objects/${proposal.projectObject.id}`}>{proposal.projectObject.title}</Link></TableCell>
                          <TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
                          <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
                          <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
            </TableCard>
          </div>
        </TabsContent>
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Задачи / касания</CardTitle>
              {canCreateTask(user) ? (
                <TaskQuickActions
                  taskHref={`/tasks/new?clientId=${client.id}&responsibleId=${client.responsibleId}`}
                  touchHref={`/tasks/new?recordType=TOUCH&clientId=${client.id}&responsibleId=${client.responsibleId}`}
                />
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={client.tasks} emptyText="По этой сущности пока нет задач" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
