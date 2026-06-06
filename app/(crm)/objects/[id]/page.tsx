import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityPageHeader, NoticeStack, TaskQuickActions, TextBlock } from "@/components/crm/detail-page";
import { Detail, DetailGrid } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditLogs } from "@/lib/audit-log";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
  dealProbabilityLabels,
  dealStageLabels,
  commercialProposalStatusLabels,
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
import { canArchiveRecord, canCreateTask, canEditRecord, canManageObjectParticipants } from "@/permissions";
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
      <EntityPageHeader
        title={projectObject.title}
        badges={
          <>
            <Badge variant="outline">{objectTypeLabels[projectObject.objectType]}</Badge>
            <Badge variant="outline">{objectStageLabels[projectObject.stage]}</Badge>
            <Badge variant={statusVariant(projectObject.status)}>{objectStatusLabels[projectObject.status]}</Badge>
          </>
        }
        editHref={`/objects/${id}/edit`}
        canEdit={canEditRecord(user, projectObject)}
        archiveAction={archiveAction}
        canArchive={canArchiveRecord(user, projectObject) && !projectObject.archivedAt}
      />

      <NoticeStack notices={[
        { show: Boolean(query.saved), message: "Объект сохранен." },
        { show: Boolean(query.archived), message: "Объект архивирован." },
        { show: Boolean(query.participantSaved), message: "Участник сохранен." },
        { show: Boolean(query.participantArchived), message: "Участник архивирован." },
        { show: Boolean(query.designerStage), message: "Этап дизайнера обновлен." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно или данные не найдены." }
      ]} />

      <CrmDisciplinePanel
        entityType="OBJECT"
        entityId={projectObject.id}
        editHref={`/objects/${id}/edit`}
        returnTo={`/objects/${id}`}
        violations={projectObject.crmViolations}
        user={user}
      />

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
              <DetailGrid>
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
              </DetailGrid>
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
                <TextBlock label="Комментарий">{projectObject.comment || "Комментариев пока нет."}</TextBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <div className="space-y-4">
            <TableCard
              title="Влияющие на закупку"
              actions={canManageParticipants ? (
                <Button asChild size="sm">
                  <Link href={`/objects/${id}/participants/new?type=PURCHASE_INFLUENCER`}>
                    <Plus className="h-4 w-4" />
                    Добавить
                  </Link>
                </Button>
              ) : null}
            >
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
                      <EmptyTableRow colSpan={9}>По объекту пока нет участников</EmptyTableRow>
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
            </TableCard>

            <TableCard
              title="Контактные лица реализации"
              actions={canManageParticipants ? (
                <Button asChild size="sm">
                  <Link href={`/objects/${id}/participants/new?type=IMPLEMENTATION_CONTACT`}>
                    <Plus className="h-4 w-4" />
                    Добавить
                  </Link>
                </Button>
              ) : null}
            >
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
                      <EmptyTableRow colSpan={8}>По объекту пока нет участников</EmptyTableRow>
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
            </TableCard>
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <TableCard
            title="Сделки"
            actions={
              <Button asChild size="sm">
                <Link href={`/deals/new?objectId=${id}`}>Создать сделку по объекту</Link>
              </Button>
            }
          >
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
                    <EmptyTableRow colSpan={6}>По объекту пока нет сделок</EmptyTableRow>
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
          </TableCard>
        </TabsContent>
        <TabsContent value="proposals">
          <TableCard title="КП">
                <TableHeader>
                  <TableRow>
                    <TableHead>КП</TableHead>
                    <TableHead>Сделка</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Версия</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Ответственный</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectObject.proposals.length === 0 ? (
                    <EmptyTableRow colSpan={7}>По объекту пока нет КП</EmptyTableRow>
                  ) : (
                    projectObject.proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
                        <TableCell><Link className="hover:underline" href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</Link></TableCell>
                        <TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
                        <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
                        <TableCell>v{proposal.version}</TableCell>
                        <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
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
                  taskHref={`/tasks/new?objectId=${projectObject.id}&clientId=${projectObject.clientId}&responsibleId=${projectObject.responsibleId}${projectObject.designerId ? `&designerId=${projectObject.designerId}` : ""}`}
                  touchHref={`/tasks/new?recordType=TOUCH&objectId=${projectObject.id}&clientId=${projectObject.clientId}&responsibleId=${projectObject.responsibleId}${projectObject.designerId ? `&designerId=${projectObject.designerId}` : ""}`}
                />
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={projectObject.tasks} emptyText="По этой сущности пока нет задач" />
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
          <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
