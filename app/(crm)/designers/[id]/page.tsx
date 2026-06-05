import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Edit } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { archiveDesignerAction } from "@/modules/designers/actions";
import { getDesignerForUser } from "@/modules/designers/queries";
import { getAuditLogs } from "@/lib/audit-log";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  designerRoleLabels
} from "@/lib/constants";
import { formatRussianDate } from "@/utils/date";
import { canArchiveRecord, canEditRecord } from "@/permissions";

type DesignerPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; error?: string }>;
};

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Нет данных"}</dd>
    </div>
  );
}

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{designer.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge>
            <Badge variant={designer.potential === "A" ? "warning" : "outline"}>{designerPotentialLabels[designer.potential]}</Badge>
            <Badge variant="outline">{designerLoyaltyLabels[designer.loyalty]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditRecord(user, designer) ? (
            <Button asChild variant="outline">
              <Link href={`/designers/${id}/edit`}>
                <Edit className="h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          ) : null}
          {canArchiveRecord(user, designer) && !designer.archivedAt ? (
            <form action={archiveAction}>
              <Button type="submit" variant="destructive">
                <Archive className="h-4 w-4" />
                Архивировать
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {query.saved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Дизайнер сохранен.</div> : null}
      {query.archived ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Дизайнер архивирован.</div> : null}
      {query.error ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Действие недоступно для вашей роли.</div> : null}

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="pipeline">Воронка / отношения</TabsTrigger>
          <TabsTrigger value="touches">Касания и задачи</TabsTrigger>
          <TabsTrigger value="objects">Связанные объекты</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <Card>
            <CardHeader><CardTitle>Контакт</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-5 md:grid-cols-3">
                <Detail label="Студия" value={designer.studio} />
                <Detail label="Роль" value={designerRoleLabels[designer.role]} />
                <Detail label="Телефон" value={designer.phone} />
                <Detail label="Мессенджер" value={designer.messenger} />
                <Detail label="Email" value={designer.email} />
                <Detail label="Сайт" value={designer.website} />
                <Detail label="Город" value={designer.city} />
                <Detail label="Ответственный" value={designer.responsible.name} />
                <Detail label="Создал" value={designer.createdBy.name} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pipeline">
          <Card>
            <CardHeader><CardTitle>Отношения</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-5 md:grid-cols-3">
                <Detail label="Этап" value={designerRelationshipStageLabels[designer.relationshipStage]} />
                <Detail label="Потенциал" value={designerPotentialLabels[designer.potential]} />
                <Detail label="Лояльность" value={designerLoyaltyLabels[designer.loyalty]} />
                <Detail label="Первый контакт" value={formatRussianDate(designer.firstContactAt)} />
                <Detail label="Последнее касание" value={formatRussianDate(designer.lastTouchAt)} />
                <Detail label="Следующий шаг" value={`${formatRussianDate(designer.nextStepAt)}: ${designer.nextStepText ?? ""}`} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="touches">
          <Card><CardContent className="pt-5 text-sm text-muted-foreground">Касания и задачи будут связаны на следующих этапах.</CardContent></Card>
        </TabsContent>
        <TabsContent value="objects">
          <Card><CardContent className="pt-5 text-sm text-muted-foreground">Связанные объекты появятся после реализации объектов.</CardContent></Card>
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
