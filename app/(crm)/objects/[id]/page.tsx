import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  ActionPromptCard,
  AuditLogCard,
  EntityInfoCard,
  EntityPageHeader,
  EntityTasksCard,
  NoticeStack,
  TextBlock
} from "@/components/crm/detail-page";
import { Detail, DetailGrid } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { ObjectDealsTable, ObjectParticipantsTables, ObjectProposalsTable } from "@/components/crm/related-tables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditLogs } from "@/lib/audit-log";
import {
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
  const archiveParticipantAction = (participantId: string) => archiveProjectObjectParticipantAction.bind(null, id, participantId);
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
        <ActionPromptCard
          message={
            <>
              Этот дизайнер передал объект. Можно перевести его на этап “Первый объект получен”.
            </>
          }
          action={
            <form action={moveDesignerStageAction}>
              <Button type="submit" variant="secondary">Перевести этап</Button>
            </form>
          }
        />
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
          <EntityInfoCard
            title="Данные объекта"
            footer={
              <div className="space-y-4">
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
            }
          >
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
          </EntityInfoCard>
        </TabsContent>

        <TabsContent value="participants">
          <ObjectParticipantsTables
            objectId={id}
            purchaseInfluencers={purchaseInfluencers}
            implementationContacts={implementationContacts}
            canManageParticipants={canManageParticipants}
            archiveParticipantAction={archiveParticipantAction}
          />
        </TabsContent>

        <TabsContent value="deals">
          <ObjectDealsTable objectId={id} deals={projectObject.deals} />
        </TabsContent>
        <TabsContent value="proposals">
          <ObjectProposalsTable proposals={projectObject.proposals} />
        </TabsContent>
        <TabsContent value="tasks">
          <EntityTasksCard
            items={projectObject.tasks}
            canCreate={canCreateTask(user)}
            taskHref={`/tasks/new?objectId=${projectObject.id}&clientId=${projectObject.clientId}&responsibleId=${projectObject.responsibleId}${projectObject.designerId ? `&designerId=${projectObject.designerId}` : ""}`}
            touchHref={`/tasks/new?recordType=TOUCH&objectId=${projectObject.id}&clientId=${projectObject.clientId}&responsibleId=${projectObject.responsibleId}${projectObject.designerId ? `&designerId=${projectObject.designerId}` : ""}`}
          />
        </TabsContent>
        <TabsContent value="files">
          <EntityInfoCard title="Файлы объекта">
            <div className="space-y-2 text-sm">
              {projectObject.files.length === 0 ? (
                <p className="text-muted-foreground">По объекту пока нет файлов</p>
              ) : (
                projectObject.files.map((file) => (
                  <div key={file} className="rounded-md border p-3">{file}</div>
                ))
              )}
            </div>
          </EntityInfoCard>
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
