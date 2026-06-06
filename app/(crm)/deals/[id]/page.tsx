import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityPageHeader, NoticeStack, TaskQuickActions, TextBlock } from "@/components/crm/detail-page";
import { Detail, DetailGrid } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { DealLossDialog } from "@/components/deals/deal-loss-dialog";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditLogs } from "@/lib/audit-log";
import {
  dealLossReasonLabels,
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealSourceLabels,
  dealStageLabels,
  commercialProposalStatusLabels
} from "@/lib/constants";
import { archiveDealAction, closeDealAsLostAction } from "@/modules/deals/actions";
import { getDealForUser } from "@/modules/deals/queries";
import { canArchiveRecord, canCloseDealAsLost, canCreateTask, canEditRecord } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type DealPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; lost?: string; error?: string }>;
};

function formatMoney(value?: number | null) {
  return value ? `${value.toLocaleString("ru-RU")} ₽` : null;
}

function probabilityLabel(deal: { probability: keyof typeof dealProbabilityLabels | null }) {
  if (!deal.probability) return null;
  return `${dealProbabilityLabels[deal.probability]} · ${dealProbabilityPercent[deal.probability]}%`;
}

export default async function DealPage({ params, searchParams }: DealPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [deal, auditLogs] = await Promise.all([
    getDealForUser(id, user),
    getAuditLogs("DEAL", id)
  ]);
  const archiveAction = archiveDealAction.bind(null, id);
  const lossAction = closeDealAsLostAction.bind(null, id);

  return (
    <div className="space-y-6">
      <EntityPageHeader
        title={deal.title}
        badges={
          <>
            <Badge variant={deal.stage === "LOST" ? "warning" : "secondary"}>{dealStageLabels[deal.stage]}</Badge>
            {deal.probability ? <Badge variant="outline">{probabilityLabel(deal)}</Badge> : null}
            <Badge variant="outline">{dealSourceLabels[deal.source]}</Badge>
          </>
        }
        editHref={`/deals/${id}/edit`}
        canEdit={canEditRecord(user, deal)}
        extraActions={canEditRecord(user, deal) && deal.stage !== "LOST" && deal.stage !== "COMPLETED" && canCloseDealAsLost(user) ? (
            <DealLossDialog action={lossAction} />
        ) : null}
        archiveAction={archiveAction}
        canArchive={canArchiveRecord(user, deal) && !deal.archivedAt}
      />

      <NoticeStack notices={[
        { show: Boolean(query.saved), message: "Сделка сохранена." },
        { show: Boolean(query.archived), message: "Сделка архивирована." },
        { show: Boolean(query.lost), message: "Сделка закрыта как проигранная." },
        { show: query.error === "lossReason", tone: "destructive", message: "Укажите причину проигрыша сделки." },
        { show: Boolean(query.error && query.error !== "lossReason"), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]} />

      <CrmDisciplinePanel
        entityType="DEAL"
        entityId={deal.id}
        editHref={`/deals/${id}/edit`}
        returnTo={`/deals/${id}`}
        violations={deal.crmViolations}
        user={user}
      />

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="proposals">КП</TabsTrigger>
          <TabsTrigger value="tasks">Задачи / касания</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader><CardTitle>Данные сделки</CardTitle></CardHeader>
            <CardContent>
              <DetailGrid>
                <Detail label="Клиент" value={deal.client.name} />
                <Detail label="Объект" value={deal.projectObject.title} />
                <Detail label="Дизайнер" value={deal.designer?.name} />
                <Detail label="Ответственный" value={deal.responsible.name} />
                <Detail label="Создал" value={deal.createdBy.name} />
                <Detail label="Сумма" value={formatMoney(deal.potentialAmount)} />
                <Detail label="Вероятность" value={probabilityLabel(deal)} />
                <Detail label="Дата следующего действия" value={formatRussianDate(deal.nextActionAt)} />
                <Detail label="Следующий шаг" value={deal.nextActionText} />
                <Detail label="Источник" value={dealSourceLabels[deal.source]} />
                <Detail label="Закрыта" value={formatRussianDate(deal.closedAt)} />
                <Detail label="Причина проигрыша" value={deal.lossReason ? dealLossReasonLabels[deal.lossReason] : null} />
              </DetailGrid>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextBlock label="Комментарий">{deal.comment || "Комментариев пока нет."}</TextBlock>
                <TextBlock label="Комментарий к проигрышу">{deal.lossComment || "Нет данных"}</TextBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <TableCard
            title="КП"
            actions={
              <Button asChild size="sm">
                <Link href={`/proposals/new?dealId=${id}`}>Создать КП по сделке</Link>
              </Button>
            }
          >
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Версия</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Отправлено</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Файл</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deal.proposals.length === 0 ? (
                    <EmptyTableRow colSpan={8}>По сделке пока нет КП</EmptyTableRow>
                  ) : (
                    deal.proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
                        <TableCell>v{proposal.version}</TableCell>
                        <TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
                        <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
                        <TableCell>{formatRussianDate(proposal.sentAt)}</TableCell>
                        <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
                        <TableCell>{proposal.fileUrl ? <Link className="hover:underline" href={proposal.fileUrl}>Скачать</Link> : "Нет файла"}</TableCell>
                        <TableCell>{proposal.responsible.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </TableCard>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Задачи / касания</CardTitle>
              {canCreateTask(user) ? (
                <TaskQuickActions
                  taskHref={`/tasks/new?dealId=${deal.id}&clientId=${deal.clientId}&objectId=${deal.objectId}&responsibleId=${deal.responsibleId}${deal.designerId ? `&designerId=${deal.designerId}` : ""}`}
                  touchHref={`/tasks/new?recordType=TOUCH&dealId=${deal.id}&clientId=${deal.clientId}&objectId=${deal.objectId}&responsibleId=${deal.responsibleId}${deal.designerId ? `&designerId=${deal.designerId}` : ""}`}
                />
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={deal.tasks} emptyText="По этой сущности пока нет задач" />
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
