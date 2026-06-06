import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityInfoCard, EntityPageHeader, EntityTasksCard, NoticeStack } from "@/components/crm/detail-page";
import { Detail, DetailGrid } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { DesignerDealsTable, DesignerObjectsTable, DesignerProposalsTable } from "@/components/crm/related-tables";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <EntityPageHeader
        title={designer.name}
        badges={
          <>
            <Badge variant="secondary">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge>
            <Badge variant={designer.potential === "A" ? "warning" : "outline"}>{designerPotentialLabels[designer.potential]}</Badge>
            <Badge variant="outline">{designerLoyaltyLabels[designer.loyalty]}</Badge>
          </>
        }
        editHref={`/designers/${id}/edit`}
        canEdit={canEditRecord(user, designer)}
        archiveAction={archiveAction}
        canArchive={canArchiveRecord(user, designer) && !designer.archivedAt}
      />

      <NoticeStack notices={[
        { show: Boolean(query.saved), message: "Дизайнер сохранен." },
        { show: Boolean(query.archived), message: "Дизайнер архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]} />

      <CrmDisciplinePanel
        entityType="DESIGNER"
        entityId={designer.id}
        editHref={`/designers/${id}/edit`}
        returnTo={`/designers/${id}`}
        violations={designer.crmViolations}
        user={user}
        bonusApplies={false}
      />

      <Tabs defaultValue="main">
        <TabsList className="flex-wrap">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="pipeline">Воронка / отношения</TabsTrigger>
          <TabsTrigger value="touches">Касания и задачи</TabsTrigger>
          <TabsTrigger value="objects">Связанные объекты</TabsTrigger>
          <TabsTrigger value="deals">Связанные сделки</TabsTrigger>
          <TabsTrigger value="proposals">КП</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="audit">История изменений</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <EntityInfoCard title="Контакт">
              <DetailGrid>
                <Detail label="Студия" value={designer.studio} />
                <Detail label="Роль" value={designerRoleLabels[designer.role]} />
                <Detail label="Телефон" value={designer.phone} />
                <Detail label="Мессенджер" value={designer.messenger} />
                <Detail label="Email" value={designer.email} />
                <Detail label="Сайт" value={designer.website} />
                <Detail label="Город" value={designer.city} />
                <Detail label="Ответственный" value={designer.responsible.name} />
                <Detail label="Создал" value={designer.createdBy.name} />
              </DetailGrid>
          </EntityInfoCard>
        </TabsContent>
        <TabsContent value="pipeline">
          <EntityInfoCard title="Отношения">
              <DetailGrid>
                <Detail label="Этап" value={designerRelationshipStageLabels[designer.relationshipStage]} />
                <Detail label="Потенциал" value={designerPotentialLabels[designer.potential]} />
                <Detail label="Лояльность" value={designerLoyaltyLabels[designer.loyalty]} />
                <Detail label="Первый контакт" value={formatRussianDate(designer.firstContactAt)} />
                <Detail label="Последнее касание" value={formatRussianDate(designer.lastTouchAt)} />
                <Detail label="Следующий шаг" value={`${formatRussianDate(designer.nextStepAt)}: ${designer.nextStepText ?? ""}`} />
              </DetailGrid>
          </EntityInfoCard>
        </TabsContent>
        <TabsContent value="touches">
          <EntityTasksCard
            title="Касания и задачи"
            items={designer.tasks}
            canCreate={canCreateTask(user)}
            taskHref={`/tasks/new?designerId=${designer.id}&responsibleId=${designer.responsibleId}`}
            touchHref={`/tasks/new?recordType=TOUCH&designerId=${designer.id}&responsibleId=${designer.responsibleId}`}
          />
        </TabsContent>
        <TabsContent value="objects">
          <DesignerObjectsTable objects={designer.projectObjects} />
        </TabsContent>
        <TabsContent value="deals">
          <DesignerDealsTable deals={designer.deals} />
        </TabsContent>
        <TabsContent value="proposals">
          <DesignerProposalsTable proposals={designer.proposals} />
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
          <AuditLogCard logs={auditLogs} formatDate={formatRussianDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
