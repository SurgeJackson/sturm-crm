import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityPageHeader, NoticeStack, TaskQuickActions } from "@/components/crm/detail-page";
import { Detail, DetailGrid } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { archiveDesignerAction } from "@/modules/designers/actions";
import { getDesignerForUser } from "@/modules/designers/queries";
import { getAuditLogs } from "@/lib/audit-log";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  designerRoleLabels,
  dealStageLabels,
  commercialProposalStatusLabels,
  objectStageLabels,
  objectStatusLabels
} from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { canArchiveRecord, canCreateTask, canEditRecord } from "@/permissions";

type DesignerPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; error?: string }>;
};

export default async function DesignerPage({ params, searchParams }: DesignerPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [designer, auditLogs] = await Promise.all([
    getDesignerForUser(id, user),
    getAuditLogs("DESIGNER", id)
  ]);
  const archiveAction = archiveDesignerAction.bind(null, id);

  return (
    <div className="space-y-6">
      <EntityPageHeader
        title={designer.name}
        badges={
          <>
            <Badge variant="secondary">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge>
            <Badge variant={designer.potential === "A" ? "warning" : "outline"}>{designerPotentialLabels[designer.potential]}</Badge>
            <Badge variant="outline">{designerLoyaltyLabels[designer.loyalty]}</Badge>
          </>
        }
        editHref={`/designers/${id}/edit`}
        canEdit={canEditRecord(user, designer)}
        archiveAction={archiveAction}
        canArchive={canArchiveRecord(user, designer) && !designer.archivedAt}
      />

      <NoticeStack notices={[
        { show: Boolean(query.saved), message: "Дизайнер сохранен." },
        { show: Boolean(query.archived), message: "Дизайнер архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]} />

      <CrmDisciplinePanel
        entityType="DESIGNER"
        entityId={designer.id}
        editHref={`/designers/${id}/edit`}
        returnTo={`/designers/${id}`}
        violations={designer.crmViolations}
        user={user}
        bonusApplies={false}
      />

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="pipeline">Воронка / отношения</TabsTrigger>
          <TabsTrigger value="touches">Касания и задачи</TabsTrigger>
          <TabsTrigger value="objects">Связанные объекты</TabsTrigger>
          <TabsTrigger value="deals">Связанные сделки</TabsTrigger>
          <TabsTrigger value="proposals">КП</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <Card>
            <CardHeader><CardTitle>Контакт</CardTitle></CardHeader>
            <CardContent>
              <DetailGrid>
                <Detail label="Студия" value={designer.studio} />
                <Detail label="Роль" value={designerRoleLabels[designer.role]} />
                <Detail label="Телефон" value={designer.phone} />
                <Detail label="Мессенджер" value={designer.messenger} />
                <Detail label="Email" value={designer.email} />
                <Detail label="Сайт" value={designer.website} />
                <Detail label="Город" value={designer.city} />
                <Detail label="Ответственный" value={designer.responsible.name} />
                <Detail label="Создал" value={designer.createdBy.name} />
              </DetailGrid>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pipeline">
          <Card>
            <CardHeader><CardTitle>Отношения</CardTitle></CardHeader>
            <CardContent>
              <DetailGrid>
                <Detail label="Этап" value={designerRelationshipStageLabels[designer.relationshipStage]} />
                <Detail label="Потенциал" value={designerPotentialLabels[designer.potential]} />
                <Detail label="Лояльность" value={designerLoyaltyLabels[designer.loyalty]} />
                <Detail label="Первый контакт" value={formatRussianDate(designer.firstContactAt)} />
                <Detail label="Последнее касание" value={formatRussianDate(designer.lastTouchAt)} />
                <Detail label="Следующий шаг" value={`${formatRussianDate(designer.nextStepAt)}: ${designer.nextStepText ?? ""}`} />
              </DetailGrid>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="touches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Касания и задачи</CardTitle>
              {canCreateTask(user) ? (
                <TaskQuickActions
                  taskHref={`/tasks/new?designerId=${designer.id}&responsibleId=${designer.responsibleId}`}
                  touchHref={`/tasks/new?recordType=TOUCH&designerId=${designer.id}&responsibleId=${designer.responsibleId}`}
                />
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={designer.tasks} emptyText="По этой сущности пока нет задач" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="objects">
          <TableCard title="Переданные объекты">
                <TableHeader>
                  <TableRow>
                    <TableHead>Объект</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Ответственный</TableHead>
                    <TableHead>Стадия</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designer.projectObjects.length === 0 ? (
                    <EmptyTableRow colSpan={5}>Дизайнер пока не передал объекты.</EmptyTableRow>
                  ) : (
                    designer.projectObjects.map((object) => (
                      <TableRow key={object.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/objects/${object.id}`}>{object.title}</Link></TableCell>
                        <TableCell><Link className="hover:underline" href={`/clients/${object.client.id}`}>{object.client.name}</Link></TableCell>
                        <TableCell>{object.responsible.name}</TableCell>
                        <TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{objectStatusLabels[object.status]}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </TableCard>
        </TabsContent>
        <TabsContent value="deals">
          <TableCard title="Связанные сделки">
                <TableHeader>
                  <TableRow>
                    <TableHead>Сделка</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>Стадия</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designer.deals.length === 0 ? (
                    <EmptyTableRow colSpan={5}>У дизайнера пока нет связанных сделок.</EmptyTableRow>
                  ) : (
                    designer.deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell>
                        <TableCell><Link className="hover:underline" href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</Link></TableCell>
                        <TableCell><Badge variant="outline">{dealStageLabels[deal.stage]}</Badge></TableCell>
                        <TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Без суммы"}</TableCell>
                        <TableCell>{deal.responsible.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </TableCard>
        </TabsContent>
        <TabsContent value="proposals">
          <TableCard title="КП по объектам дизайнера">
                <TableHeader>
                  <TableRow>
                    <TableHead>КП</TableHead>
                    <TableHead>Сделка</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designer.proposals.length === 0 ? (
                    <EmptyTableRow colSpan={6}>По дизайнеру пока нет КП</EmptyTableRow>
                  ) : (
                    designer.proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
                        <TableCell><Link className="hover:underline" href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</Link></TableCell>
                        <TableCell><Link className="hover:underline" href={`/objects/${proposal.projectObject.id}`}>{proposal.projectObject.title}</Link></TableCell>
                        <TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
                        <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
                        <TableCell>{proposal.responsible.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </TableCard>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle>Передано объектов</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.transferredObjectsCount}</CardContent></Card>
            <Card><CardHeader><CardTitle>Активные объекты</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.activeObjectsCount}</CardContent></Card>
            <Card><CardHeader><CardTitle>Сумма КП</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.proposalsTotalAmount}</CardContent></Card>
            <Card><CardHeader><CardTitle>Сумма оплат</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.paymentsTotalAmount}</CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
