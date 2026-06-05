import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Edit } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { archiveClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { getAuditLogs } from "@/lib/audit-log";
import { clientSourceLabels, clientStatusLabels, clientTypeLabels, dealStageLabels, objectStageLabels, objectStatusLabels } from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { canArchiveRecord, canEditRecord } from "@/permissions";

type ClientPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; error?: string }>;
};

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Нет данных"}</dd>
    </div>
  );
}

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={client.status === "ARCHIVED" ? "outline" : "secondary"}>{clientStatusLabels[client.status]}</Badge>
            <Badge variant="outline">{clientTypeLabels[client.clientType]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditRecord(user, client) ? (
            <Button asChild variant="outline">
              <Link href={`/clients/${id}/edit`}>
                <Edit className="h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          ) : null}
          {canArchiveRecord(user, client) && !client.archivedAt ? (
            <form action={archiveAction}>
              <Button type="submit" variant="destructive">
                <Archive className="h-4 w-4" />
                Архивировать
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {query.saved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Клиент сохранен.</div> : null}
      {query.archived ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Клиент архивирован.</div> : null}
      {query.error ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Действие недоступно для вашей роли.</div> : null}

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="links">Связи</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <Card>
            <CardHeader><CardTitle>Данные клиента</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-5 md:grid-cols-3">
                <Detail label="Телефон" value={client.phone} />
                <Detail label="Мессенджер" value={client.messenger} />
                <Detail label="Email" value={client.email} />
                <Detail label="Город" value={client.city} />
                <Detail label="Источник" value={clientSourceLabels[client.source]} />
                <Detail label="Ответственный" value={client.responsible.name} />
                <Detail label="Создал" value={client.createdBy.name} />
                <Detail label="Последний контакт" value={formatRussianDate(client.lastContactAt)} />
                <Detail label="Следующий контакт" value={formatRussianDate(client.nextContactAt)} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments">
          <Card>
            <CardHeader><CardTitle>Комментарии</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{client.comment || "Комментариев пока нет."}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="links">
          <div className="grid gap-4">
            <Card>
              <CardHeader><CardTitle>Связанные объекты</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
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
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                          У клиента пока нет связанных объектов.
                        </TableCell>
                      </TableRow>
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
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Связанные сделки</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
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
                      <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">У клиента пока нет связанных сделок.</TableCell></TableRow>
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
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Связанные КП</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">Будет реализовано на следующем этапе.</CardContent>
            </Card>
          </div>
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
