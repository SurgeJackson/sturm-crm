import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityDetailShell, EntityDetailTabs, EntityPageHeader, EntityTasksCard, NoticeStack } from "@/components/crm/detail-page";
import { EntityDetailsCard } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { DesignerDealsTable, DesignerObjectsTable, DesignerProposalsTable } from "@/components/crm/related";
import { designerPotentialVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { canArchiveRecord, canCreateTask, canEditRecord } from "@/permissions";

type DesignerPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; error?: string }>;
};

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
    <EntityDetailShell
      header={(
        <EntityPageHeader
        title={designer.name}
        badges={
          <>
            <Badge variant="secondary">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge>
            <Badge variant={designerPotentialVariant(designer.potential)}>{designerPotentialLabels[designer.potential]}</Badge>
            <Badge variant="outline">{designerLoyaltyLabels[designer.loyalty]}</Badge>
          </>
        }
        editHref={`/designers/${id}/edit`}
        canEdit={canEditRecord(user, designer)}
        archiveAction={archiveAction}
        canArchive={canArchiveRecord(user, designer) && !designer.archivedAt}
        />
      )}
      notices={(
        <NoticeStack notices={[
        { show: Boolean(query.saved), message: "Дизайнер сохранен." },
        { show: Boolean(query.archived), message: "Дизайнер архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
        ]} />
      )}
      discipline={(
        <CrmDisciplinePanel
        entityType="DESIGNER"
        entityId={designer.id}
        editHref={`/designers/${id}/edit`}
        returnTo={`/designers/${id}`}
        violations={designer.crmViolations}
        user={user}
        bonusApplies={false}
        />
      )}
    >

      <EntityDetailTabs
        tabs={[
          {
            value: "main",
            label: "Основное",
            content: (
              <EntityDetailsCard
                title="Контакт"
                fields={[
                  { label: "Студия", value: designer.studio },
                  { label: "Роль", value: designerRoleLabels[designer.role] },
                  { label: "Телефон", value: designer.phone },
                  { label: "Мессенджер", value: designer.messenger },
                  { label: "Email", value: designer.email },
                  { label: "Сайт", value: designer.website },
                  { label: "Город", value: designer.city },
                  { label: "Ответственный", value: designer.responsible.name },
                  { label: "Создал", value: designer.createdBy.name }
                ]}
              />
            )
          },
          {
            value: "pipeline",
            label: "Воронка / отношения",
            content: (
              <EntityDetailsCard
                title="Отношения"
                fields={[
                  { label: "Этап", value: designerRelationshipStageLabels[designer.relationshipStage] },
                  { label: "Потенциал", value: designerPotentialLabels[designer.potential] },
                  { label: "Лояльность", value: designerLoyaltyLabels[designer.loyalty] },
                  { label: "Первый контакт", value: formatRussianDate(designer.firstContactAt) },
                  { label: "Последнее касание", value: formatRussianDate(designer.lastTouchAt) },
                  { label: "Следующий шаг", value: `${formatRussianDate(designer.nextStepAt)}: ${designer.nextStepText ?? ""}` }
                ]}
              />
            )
          },
          {
            value: "touches",
            label: "Касания и задачи",
            content: (
              <EntityTasksCard
                title="Касания и задачи"
                items={designer.tasks}
                canCreate={canCreateTask(user)}
                taskHref={`/tasks/new?designerId=${designer.id}&responsibleId=${designer.responsibleId}`}
                touchHref={`/tasks/new?recordType=TOUCH&designerId=${designer.id}&responsibleId=${designer.responsibleId}`}
              />
            )
          },
          {
            value: "objects",
            label: "Связанные объекты",
            content: <DesignerObjectsTable objects={designer.projectObjects} />
          },
          {
            value: "deals",
            label: "Связанные сделки",
            content: <DesignerDealsTable deals={designer.deals} />
          },
          {
            value: "proposals",
            label: "КП",
            content: <DesignerProposalsTable proposals={designer.proposals} />
          },
          {
            value: "analytics",
            label: "Аналитика",
            content: (
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardHeader><CardTitle>Передано объектов</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.transferredObjectsCount}</CardContent></Card>
                <Card><CardHeader><CardTitle>Активные объекты</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.activeObjectsCount}</CardContent></Card>
                <Card><CardHeader><CardTitle>Сумма КП</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.proposalsTotalAmount}</CardContent></Card>
                <Card><CardHeader><CardTitle>Сумма оплат</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{designer.paymentsTotalAmount}</CardContent></Card>
              </div>
            )
          },
          {
            value: "audit",
            label: "История изменений",
            content: <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
          }
        ]}
      />
    </EntityDetailShell>
  );
}
