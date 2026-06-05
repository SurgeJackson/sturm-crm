import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Edit, Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditLogs } from "@/lib/audit-log";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
  dealProbabilityLabels,
  dealStageLabels,
  influenceLevelLabels,
  influenceTypeLabels,
  objectInterestCategoryLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels
} from "@/lib/constants";
import {
  archiveProjectObjectAction,
  archiveProjectObjectParticipantAction,
  moveDesignerToFirstObjectReceivedAction
} from "@/modules/objects/actions";
import { getProjectObjectForUser } from "@/modules/objects/queries";
import { canArchiveRecord, canEditRecord, canManageObjectParticipants } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type ObjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    archived?: string;
    participantSaved?: string;
    participantArchived?: string;
    designerStage?: string;
    error?: string;
  }>;
};

const designerStageOrder = [
  "NEW_CONTACT",
  "FIRST_CONTACT",
  "INTERESTED",
  "INVITED_TO_SHOWROOM",
  "MEETING_DONE",
  "PRESENTATION_DONE",
  "TERMS_DISCUSSING",
  "IN_DEVELOPMENT",
  "FIRST_OBJECT_RECEIVED",
  "ACTIVE_PARTNER",
  "KEY_PARTNER",
  "SLEEPING",
  "LOST_OR_IRRELEVANT"
] as const;

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Нет данных"}</dd>
    </div>
  );
}

function statusVariant(status: keyof typeof objectStatusLabels) {
  if (status === "LOST" || status === "ARCHIVED") return "warning" as const;
  if (status === "FROZEN") return "warning" as const;
  return "secondary" as const;
}

function shouldOfferDesignerStageUpdate(stage?: string) {
  if (!stage) return false;
  const current = designerStageOrder.indexOf(stage as never);
  const target = designerStageOrder.indexOf("FIRST_OBJECT_RECEIVED");
  return current >= 0 && current < target;
}

export default async function ObjectPage({ params, searchParams }: ObjectPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [projectObject, auditLogs] = await Promise.all([
    getProjectObjectForUser(id, user),
    getAuditLogs("OBJECT", id)
  ]);
  const archiveAction = archiveProjectObjectAction.bind(null, id);
  const moveDesignerStageAction = moveDesignerToFirstObjectReceivedAction.bind(null, id);
  const purchaseInfluencers = projectObject.participants.filter((participant) => participant.participantType === "PURCHASE_INFLUENCER");
  const implementationContacts = projectObject.participants.filter((participant) => participant.participantType === "IMPLEMENTATION_CONTACT");
  const canManageParticipants = canManageObjectParticipants(user, projectObject);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{projectObject.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{objectTypeLabels[projectObject.objectType]}</Badge>
            <Badge variant="outline">{objectStageLabels[projectObject.stage]}</Badge>
            <Badge variant={statusVariant(projectObject.status)}>{objectStatusLabels[projectObject.status]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditRecord(user, projectObject) ? (
            <Button asChild variant="outline">
              <Link href={`/objects/${id}/edit`}>
                <Edit className="h-4 w-4" />
                Редактировать
              </Link>
            </Button>
          ) : null}
          {canArchiveRecord(user, projectObject) && !projectObject.archivedAt ? (
            <form action={archiveAction}>
              <Button type="submit" variant="destructive">
                <Archive className="h-4 w-4" />
                Архивировать
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {query.saved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Объект сохранен.</div> : null}
      {query.archived ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Объект архивирован.</div> : null}
      {query.participantSaved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Участник сохранен.</div> : null}
      {query.participantArchived ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Участник архивирован.</div> : null}
      {query.designerStage ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Этап дизайнера обновлен.</div> : null}
      {query.error ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Действие недоступно или данные не найдены.</div> : null}

      {projectObject.designer && shouldOfferDesignerStageUpdate(projectObject.designer.relationshipStage) ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Этот дизайнер передал объект. Можно перевести его на этап “Первый объект получен”.
            </p>
            <form action={moveDesignerStageAction}>
              <Button type="submit" variant="secondary">Перевести этап</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="participants">Участники</TabsTrigger>
          <TabsTrigger value="deals">Сделки</TabsTrigger>
          <TabsTrigger value="proposals">КП</TabsTrigger>
          <TabsTrigger value="tasks">Задачи / касания</TabsTrigger>
          <TabsTrigger value="files">Файлы</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader><CardTitle>Данные объекта</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-5 md:grid-cols-3">
                <Detail label="Город" value={projectObject.city} />
                <Detail label="Регион" value={projectObject.region} />
                <Detail label="Адрес" value={projectObject.address} />
                <Detail label="Клиент" value={projectObject.client.name} />
                <Detail label="Дизайнер" value={projectObject.designer?.name} />
                <Detail label="Ответственный" value={projectObject.responsible.name} />
                <Detail label="Создал" value={projectObject.createdBy.name} />
                <Detail label="Начало реализации" value={formatRussianDate(projectObject.implementationStartAt)} />
                <Detail label="Завершение реализации" value={formatRussianDate(projectObject.implementationEndAt)} />
                <Detail label="Бюджет" value={projectObject.budget ? `${projectObject.budget.toLocaleString("ru-RU")} ₽` : null} />
                <Detail label="Количество санузлов" value={projectObject.bathroomsCount} />
                <Detail label="Создан" value={formatRussianDate(projectObject.createdAt)} />
              </dl>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Категории интереса</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {projectObject.interestCategories.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Не указаны</span>
                    ) : (
                      projectObject.interestCategories.map((category) => (
                        <Badge key={category} variant="outline">{objectInterestCategoryLabels[category]}</Badge>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Комментарий</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">{projectObject.comment || "Комментариев пока нет."}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Влияющие на закупку</CardTitle>
                {canManageParticipants ? (
                  <Button asChild size="sm">
                    <Link href={`/objects/${id}/participants/new?type=PURCHASE_INFLUENCER`}>
                      <Plus className="h-4 w-4" />
                      Добавить
                    </Link>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ФИО</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Уровень</TableHead>
                      <TableHead>Тип влияния</TableHead>
                      <TableHead>Отношение</TableHead>
                      <TableHead>Что важно</TableHead>
                      <TableHead>Ответственный</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseInfluencers.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">По объекту пока нет участников</TableCell></TableRow>
                    ) : (
                      purchaseInfluencers.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.fullName}</TableCell>
                          <TableCell>{participant.role}</TableCell>
                          <TableCell>{participant.company || "Нет данных"}</TableCell>
                          <TableCell>{participant.influenceLevel ? influenceLevelLabels[participant.influenceLevel] : "Нет данных"}</TableCell>
                          <TableCell>{participant.influenceType ? influenceTypeLabels[participant.influenceType] : "Нет данных"}</TableCell>
                          <TableCell>{participant.attitudeToSturm ? attitudeToSturmLabels[participant.attitudeToSturm] : "Нет данных"}</TableCell>
                          <TableCell>{participant.decisionFactors || "Нет данных"}</TableCell>
                          <TableCell>{participant.responsible?.name || "Не выбран"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button asChild variant="outline" size="sm"><Link href={`/objects/${id}/participants/${participant.id}/edit`}>Открыть</Link></Button>
                              {canManageParticipants ? (
                                <form action={archiveProjectObjectParticipantAction.bind(null, id, participant.id)}>
                                  <Button type="submit" variant="ghost" size="sm">Архив</Button>
                                </form>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Контактные лица реализации</CardTitle>
                {canManageParticipants ? (
                  <Button asChild size="sm">
                    <Link href={`/objects/${id}/participants/new?type=IMPLEMENTATION_CONTACT`}>
                      <Plus className="h-4 w-4" />
                      Добавить
                    </Link>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ФИО</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Зона</TableHead>
                      <TableHead>Согласует</TableHead>
                      <TableHead>Когда подключать</TableHead>
                      <TableHead>Ответственный</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {implementationContacts.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">По объекту пока нет участников</TableCell></TableRow>
                    ) : (
                      implementationContacts.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">{participant.fullName}</TableCell>
                          <TableCell>{participant.role}</TableCell>
                          <TableCell>{participant.company || "Нет данных"}</TableCell>
                          <TableCell>{participant.responsibilityZone || "Нет данных"}</TableCell>
                          <TableCell>{participant.canApproveChanges ? changeApprovalLabels[participant.canApproveChanges] : "Нет данных"}</TableCell>
                          <TableCell>{participant.whenToInvolve || "Нет данных"}</TableCell>
                          <TableCell>{participant.responsible?.name || "Не выбран"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button asChild variant="outline" size="sm"><Link href={`/objects/${id}/participants/${participant.id}/edit`}>Открыть</Link></Button>
                              {canManageParticipants ? (
                                <form action={archiveProjectObjectParticipantAction.bind(null, id, participant.id)}>
                                  <Button type="submit" variant="ghost" size="sm">Архив</Button>
                                </form>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Сделки</CardTitle>
              <Button asChild size="sm">
                <Link href={`/deals/new?objectId=${id}`}>Создать сделку по объекту</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сделка</TableHead>
                    <TableHead>Стадия</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Вероятность</TableHead>
                    <TableHead>Ответственный</TableHead>
                    <TableHead>Следующее действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectObject.deals.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">По объекту пока нет сделок</TableCell></TableRow>
                  ) : (
                    projectObject.deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell>
                        <TableCell><Badge variant="outline">{dealStageLabels[deal.stage]}</Badge></TableCell>
                        <TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Без суммы"}</TableCell>
                        <TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Не выбрана"}</TableCell>
                        <TableCell>{deal.responsible.name}</TableCell>
                        <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="proposals">
          <Card><CardContent className="pt-5 text-sm text-muted-foreground">{projectObject.proposals.length === 0 ? "По объекту пока нет КП" : "Связанные КП подготовлены к отображению."}</CardContent></Card>
        </TabsContent>
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Задачи / касания</CardTitle>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link href="/tasks">Создать задачу</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/tasks">Зафиксировать касание</Link></Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {projectObject.tasks.length === 0 ? "По объекту пока нет задач" : "Связанные задачи подготовлены к отображению."}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="files">
          <Card>
            <CardHeader><CardTitle>Файлы объекта</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {projectObject.files.length === 0 ? (
                <p className="text-muted-foreground">По объекту пока нет файлов</p>
              ) : (
                projectObject.files.map((file) => (
                  <div key={file} className="rounded-md border p-3">{file}</div>
                ))
              )}
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
