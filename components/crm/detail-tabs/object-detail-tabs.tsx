import { detailDate, detailMoney, detailText, EntityDetailsCard } from "@/components/crm/detail";
import { AuditLogCard, EntityDetailTabs, EntityTasksCard, TextBlock } from "@/components/crm/detail-page";
import { ObjectFilesCard, ObjectInterestCategories } from "@/components/crm/object-detail-panels";
import { ObjectDealsTable, ObjectParticipantsTables, ObjectProposalsTable } from "@/components/crm/related";
import { CompactMetricCard } from "@/components/crm/summary-card";
import type { getAuditLogs } from "@/lib/audit-log";
import type { getProjectObjectForUser } from "@/modules/objects/queries";
import type { PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { paymentSignedAmount } from "@/utils/payments";
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
  archiveParticipantAction,
  canViewBonusAmounts,
  user
}: {
  objectId: string;
  projectObject: ObjectDetail;
  auditLogs: AuditLogs;
  canCreateTasks: boolean;
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
  canViewBonusAmounts: boolean;
  user: PermissionUser;
}) {
  const purchaseInfluencers = projectObject.participants.filter((participant) => participant.participantType === "PURCHASE_INFLUENCER");
  const implementationContacts = projectObject.participants.filter((participant) => participant.participantType === "IMPLEMENTATION_CONTACT");
  const objectPaid = projectObject.deals.flatMap((deal) => deal.payments).filter((payment) => payment.status === "CONFIRMED").reduce((sum, payment) => sum + paymentSignedAmount(payment), 0);
  const objectAccrued = projectObject.deals.flatMap((deal) => deal.bonusAccruals).filter((accrual) => accrual.status !== "CANCELLED" && accrual.status !== "REVERSED").reduce((sum, accrual) => sum + accrual.bonusAmount, 0);

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
          value: "bonuses",
          label: "Бонусы",
          content: (
            <div className="grid gap-4 md:grid-cols-4">
              <CompactMetricCard title="Дизайнер" value={projectObject.designer?.name ?? "Нет"} />
              <CompactMetricCard title="Сделок" value={projectObject.deals.length} />
              <CompactMetricCard title="Оплачено" value={canViewBonusAmounts ? formatMoney(objectPaid, "0 ₽") : "Скрыто"} />
              <CompactMetricCard title="Начислено" value={canViewBonusAmounts ? formatMoney(objectAccrued, "0 ₽") : "Скрыто"} />
            </div>
          )
        },
        {
          value: "proposals",
          label: "КП",
          content: <ObjectProposalsTable proposals={projectObject.proposals} user={user} />
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
