import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerHeaderBadges } from "@/components/crm/detail-header-badges";
import { DesignerDetailTabs } from "@/components/crm/detail-tabs/designer-detail-tabs";
import { EntityDetailShell } from "@/components/crm/detail-page";
import { archiveDesignerAction } from "@/modules/designers/actions";
import { getDesignerForUser } from "@/modules/designers/queries";
import { getAuditLogs } from "@/lib/audit-log";
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
      title={designer.name}
      badges={<DesignerHeaderBadges relationshipStage={designer.relationshipStage} potential={designer.potential} loyalty={designer.loyalty} />}
      listHref="/designers"
      editHref={`/designers/${id}/edit`}
      canEdit={canEditRecord(user, designer)}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, designer) && !designer.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "Дизайнер сохранен." },
        { show: Boolean(query.archived), message: "Дизайнер архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]}
      discipline={{
        entityType: "DESIGNER",
        entityId: designer.id,
        editHref: `/designers/${id}/edit`,
        returnTo: `/designers/${id}`,
        violations: designer.crmViolations,
        user,
        bonusApplies: false
      }}
    >

      <DesignerDetailTabs designer={designer} auditLogs={auditLogs} canCreateTasks={canCreateTask(user)} />
    </EntityDetailShell>
  );
}
