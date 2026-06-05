import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Edit, MessageSquarePlus, Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { CrmDisciplinePanel } from "@/components/crm/crm-discipline";
import { DealLossDialog } from "@/components/deals/deal-loss-dialog";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Нет данных"}</dd>
    </div>
  );
}

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{deal.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={deal.stage === "LOST" ? "warning" : "secondary"}>{dealStageLabels[deal.stage]}</Badge>
            {deal.probability ? <Badge variant="outline">{probabilityLabel(deal)}</Badge> : null}
            <Badge variant="outline">{dealSourceLabels[deal.source]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditRecord(user, deal) ? (
            <Button asChild variant="outline">
              <Link href={`/deals/${id}/edit`}>
                <Edit className="h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          ) : null}
          {canEditRecord(user, deal) && deal.stage !== "LOST" && deal.stage !== "COMPLETED" && canCloseDealAsLost(user) ? (
            <DealLossDialog action={lossAction} />
          ) : null}
          {canArchiveRecord(user, deal) && !deal.archivedAt ? (
            <form action={archiveAction}>
              <Button type="submit" variant="destructive">
                <Archive className="h-4 w-4" />
                Архивировать
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {query.saved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Сделка сохранена.</div> : null}
      {query.archived ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Сделка архивирована.</div> : null}
      {query.lost ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Сделка закрыта как проигранная.</div> : null}
      {query.error === "lossReason" ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Укажите причину проигрыша сделки.</div> : null}
      {query.error && query.error !== "lossReason" ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Действие недоступно для вашей роли.</div> : null}

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
              <dl className="grid gap-5 md:grid-cols-3">
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
              </dl>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Комментарий</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{deal.comment || "Комментариев пока нет."}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Комментарий к проигрышу</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{deal.lossComment || "Нет данных"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>КП</CardTitle>
              <Button asChild size="sm">
                <Link href={`/proposals/new?dealId=${id}`}>Создать КП по сделке</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
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
                    <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">По сделке пока нет КП</TableCell></TableRow>
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
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Задачи / касания</CardTitle>
              {canCreateTask(user) ? (
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tasks/new?dealId=${deal.id}&clientId=${deal.clientId}&objectId=${deal.objectId}&responsibleId=${deal.responsibleId}${deal.designerId ? `&designerId=${deal.designerId}` : ""}`}>
                      <Plus className="h-4 w-4" />
                      Создать задачу
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tasks/new?recordType=TOUCH&dealId=${deal.id}&clientId=${deal.clientId}&objectId=${deal.objectId}&responsibleId=${deal.responsibleId}${deal.designerId ? `&designerId=${deal.designerId}` : ""}`}>
                      <MessageSquarePlus className="h-4 w-4" />
                      Зафиксировать касание
                    </Link>
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={deal.tasks} emptyText="По этой сущности пока нет задач" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle>История изменений</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">История пока пустая.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground">{formatRussianDate(log.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
