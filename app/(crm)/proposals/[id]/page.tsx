import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Edit, MessageSquarePlus, Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Detail } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/crm-discipline";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ProposalPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; dealStage?: string; error?: string }>;
};

function formatMoney(value?: number | null) {
  return value ? `${value.toLocaleString("ru-RU")} ₽` : "0 ₽";
}

function statusVariant(status: keyof typeof commercialProposalStatusLabels) {
  if (status === "DECLINED" || status === "ARCHIVED") return "warning" as const;
  if (status === "ACCEPTED" || status === "SENT") return "secondary" as const;
  return "outline" as const;
}

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{proposal.proposalNumber}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={statusVariant(proposal.status)}>{commercialProposalStatusLabels[proposal.status]}</Badge>
            <Badge variant="outline">v{proposal.version}</Badge>
            <Badge variant="outline">{formatMoney(proposal.amount)}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditRecord(user, proposal) ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/proposals/${id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Редактировать
                </Link>
              </Button>
              <form action={createVersionAction}>
                <Button type="submit" variant="secondary">
                  <Plus className="h-4 w-4" />
                  Новая версия
                </Button>
              </form>
            </>
          ) : null}
          {canArchiveRecord(user, proposal) && !proposal.archivedAt ? (
            <form action={archiveAction}>
              <Button type="submit" variant="destructive">
                <Archive className="h-4 w-4" />
                Архивировать
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {query.saved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">КП сохранено.</div> : null}
      {query.archived ? <div className="rounded-md border border-primary p-3 text-sm text-primary">КП архивировано.</div> : null}
      {query.dealStage ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Сделка переведена в стадию “Счет / заказ”.</div> : null}
      {query.error ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Действие недоступно или данные не заполнены.</div> : null}

      <CrmDisciplinePanel
        entityType="PROPOSAL"
        entityId={proposal.id}
        editHref={`/proposals/${id}/edit`}
        returnTo={`/proposals/${id}`}
        violations={proposal.crmViolations}
        user={user}
      />

      {proposal.status === "ACCEPTED" && proposal.deal.stage !== "INVOICE_OR_ORDER" ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">КП принято. Перевести сделку в стадию “Счет / заказ”?</p>
            <form action={moveDealAction}>
              <Button type="submit" variant="secondary">Перевести сделку</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="versions">Версии</TabsTrigger>
          <TabsTrigger value="tasks">Задачи / касания</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader><CardTitle>Данные КП</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-5 md:grid-cols-3">
                <Detail label="Сделка" value={proposal.deal.title} />
                <Detail label="Клиент" value={proposal.client.name} />
                <Detail label="Объект" value={proposal.projectObject.title} />
                <Detail label="Дизайнер" value={proposal.designer?.name} />
                <Detail label="Ответственный" value={proposal.responsible.name} />
                <Detail label="Создал" value={proposal.createdBy.name} />
                <Detail label="Сумма" value={formatMoney(proposal.amount)} />
                <Detail label="Скидка, %" value={proposal.discountPercent} />
                <Detail label="Скидка, сумма" value={formatMoney(proposal.discountAmount)} />
                <Detail label="Получатель" value={proposal.recipientName} />
                <Detail label="Тип получателя" value={proposal.recipientType ? recipientTypeLabels[proposal.recipientType] : null} />
                <Detail label="Контакт получателя" value={proposal.recipientContact} />
                <Detail label="Кто согласует" value={proposal.approvalRequiredFrom} />
                <Detail label="Дата отправки" value={formatRussianDate(proposal.sentAt)} />
                <Detail label="Следующее касание" value={formatRussianDate(proposal.nextTouchAt)} />
                <Detail label="Файл" value={proposal.fileName} />
                <Detail label="Загрузил" value={proposal.uploadedBy?.name} />
                <Detail label="Причина отклонения" value={proposal.declineReason ? proposalDeclineReasonLabels[proposal.declineReason] : null} />
              </dl>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Файл КП</div>
                  <div className="mt-1 text-sm">
                    {proposal.fileUrl ? <Link className="hover:underline" href={proposal.fileUrl}>Скачать {proposal.fileName}</Link> : "Файл не прикреплен."}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Комментарий</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{proposal.comment || "Комментариев пока нет."}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Версии КП</CardTitle>
              {canEditRecord(user, proposal) ? (
                <form action={createVersionAction}>
                  <Button type="submit" size="sm">Создать новую версию</Button>
                </form>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Версия</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Файл</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">Версий КП пока нет</TableCell></TableRow>
                  ) : (
                    versions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/proposals/${item.id}`}>{item.proposalNumber}</Link></TableCell>
                        <TableCell>v{item.version}</TableCell>
                        <TableCell>{formatRussianDate(item.createdAt)}</TableCell>
                        <TableCell>{formatMoney(item.amount)}</TableCell>
                        <TableCell><Badge variant={statusVariant(item.status)}>{commercialProposalStatusLabels[item.status]}</Badge></TableCell>
                        <TableCell>{item.fileUrl ? <Link className="hover:underline" href={item.fileUrl}>Скачать</Link> : "Нет файла"}</TableCell>
                        <TableCell>{item.responsible.name}</TableCell>
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
                    <Link href={`/tasks/new?proposalId=${proposal.id}&dealId=${proposal.dealId}&clientId=${proposal.clientId}&objectId=${proposal.objectId}&responsibleId=${proposal.responsibleId}${proposal.designerId ? `&designerId=${proposal.designerId}` : ""}`}>
                      <Plus className="h-4 w-4" />
                      Создать задачу
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tasks/new?recordType=TOUCH&proposalId=${proposal.id}&dealId=${proposal.dealId}&clientId=${proposal.clientId}&objectId=${proposal.objectId}&responsibleId=${proposal.responsibleId}${proposal.designerId ? `&designerId=${proposal.designerId}` : ""}`}>
                      <MessageSquarePlus className="h-4 w-4" />
                      Зафиксировать касание
                    </Link>
                  </Button>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={proposal.tasks} emptyText="По этой сущности пока нет задач" />
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
