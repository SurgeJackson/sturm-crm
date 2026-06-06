import { detailDate, detailMoney, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard, TextBlock } from "@/components/crm/detail-page";
import { ObjectFilesCard, ObjectInterestCategories } from "@/components/crm/object-detail-panels";
import { ObjectDealsTable, ObjectParticipantsTables, ObjectProposalsTable } from "@/components/crm/related";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getProjectObjectForUser } from "@/modules/objects/queries";
import { formatRussianDate } from "@/utils/date";
import { buildTaskHref } from "@/utils/task-href";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;
type AuditLogs = Awaited<ReturnType<typeof getAuditLogs>>;
type ArchiveParticipantAction = (participantId: string) => () => Promise<void>;

export function ObjectDetailTabs({
  objectId,
  projectObject,
  auditLogs,
  canCreateTasks,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  projectObject: ObjectDetail;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
}) {
  const purchaseInfluencers = projectObject.participants.filter((participant) => participant.participantType === "PURCHASE_INFLUENCER");
  const implementationContacts = projectObject.participants.filter((participant) => participant.participantType === "IMPLEMENTATION_CONTACT");

  return (
    <EntityDetailTabs
      tabs={[
        {
          value: "main",
          label: "Основное",
          content: (
            <EntityDetailsCard
              title="Данные объекта"
              fields={[
                detailText("Город", projectObject.city),
                detailText("Регион", projectObject.region),
                detailText("Адрес", projectObject.address),
                detailText("Клиент", projectObject.client.name),
                detailText("Дизайнер", projectObject.designer?.name),
                detailText("Ответственный", projectObject.responsible.name),
                detailText("Создал", projectObject.createdBy.name),
                detailDate("Начало реализации", projectObject.implementationStartAt),
                detailDate("Завершение реализации", projectObject.implementationEndAt),
                detailMoney("Бюджет", projectObject.budget, "Нет данных"),
                detailText("Количество санузлов", projectObject.bathroomsCount),
                detailDate("Создан", projectObject.createdAt)
              ]}
              footer={
                <div className="space-y-4">
                  <ObjectInterestCategories categories={projectObject.interestCategories} />
                  <TextBlock label="Комментарий">{projectObject.comment || "Комментариев пока нет."}</TextBlock>
                </div>
              }
            />
          )
        },
        {
          value: "participants",
          label: "Участники",
          content: (
            <ObjectParticipantsTables
              objectId={objectId}
              purchaseInfluencers={purchaseInfluencers}
              implementationContacts={implementationContacts}
              canManageParticipants={canManageParticipants}
              archiveParticipantAction={archiveParticipantAction}
            />
          )
        },
        {
          value: "deals",
          label: "Сделки",
          content: <ObjectDealsTable objectId={objectId} deals={projectObject.deals} />
        },
        {
          value: "proposals",
          label: "КП",
          content: <ObjectProposalsTable proposals={projectObject.proposals} />
        },
        {
          value: "tasks",
          label: "Задачи / касания",
          content: (
            <EntityTasksCard
              items={projectObject.tasks}
              canCreate={canCreateTasks}
              taskHref={buildTaskHref({ objectId: projectObject.id, clientId: projectObject.clientId, responsibleId: projectObject.responsibleId, designerId: projectObject.designerId })}
              touchHref={buildTaskHref({ recordType: "TOUCH", objectId: projectObject.id, clientId: projectObject.clientId, responsibleId: projectObject.responsibleId, designerId: projectObject.designerId })}
            />
          )
        },
        {
          value: "files",
          label: "Файлы",
          content: <ObjectFilesCard files={projectObject.files} />
        },
        {
          value: "audit",
          label: "История изменений",
          content: <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        }
      ]}
    />
  );
}
