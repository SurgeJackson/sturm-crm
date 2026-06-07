import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerHeaderBadges } from "@/components/crm/detail-header-badges";
import { DesignerDetailTabs } from "@/components/crm/detail-tabs/designer-detail-tabs";
import { EntityDetailShell } from "@/components/crm/detail-page";
import { archiveEntityAction, restoreEntityAction } from "@/modules/security/entity-actions";
import { getDesignerForUser } from "@/modules/designers/queries";
import { getDesignerBonusSnapshot } from "@/modules/designer-bonuses/queries";
import { getAuditLogs } from "@/lib/audit-log";
import { writeSecurityLog } from "@/lib/security-log";
import { recordEntityView } from "@/modules/security/activity";
import { canArchiveEntity, canCreateTask, canEditRecord, canManageDesignerBonusAgreement, canRestoreEntity, canViewDesignerBonus, canViewDesignerBonusAmounts } from "@/permissions";

type DesignerPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; restored?: string; error?: string }>;
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
  const bonusSnapshot = canViewDesignerBonus(user, designer) ? await getDesignerBonusSnapshot(id) : null;
  const canViewBonusAmounts = canViewDesignerBonusAmounts(user, designer);
  if (bonusSnapshot) {
    await writeSecurityLog({
      action: "VIEW_DESIGNER_BONUS_DETAIL",
      userId: user.id,
      entityType: "DESIGNER",
      entityId: id,
      metadata: { designerId: id, showAmounts: canViewBonusAmounts }
    });
  }
  const archiveAction = archiveEntityAction.bind(null, "DESIGNER", id);
  const restoreAction = restoreEntityAction.bind(null, "DESIGNER", id);
  await recordEntityView(user.id, "DESIGNER", id);

  return (
    <EntityDetailShell
      title={designer.name}
      badges={<DesignerHeaderBadges relationshipStage={designer.relationshipStage} potential={designer.potential} loyalty={designer.loyalty} />}
      listHref="/designers"
      editHref={`/designers/${id}/edit`}
      canEdit={canEditRecord(user, designer)}
      archiveAction={archiveAction}
      canArchive={canArchiveEntity(user, designer) && !designer.archivedAt}
      restoreAction={restoreAction}
      canRestore={canRestoreEntity(user, designer)}
      notices={[
        { show: Boolean(query.saved), message: "Дизайнер сохранен." },
        { show: Boolean(query.archived), message: "Дизайнер архивирован." },
        { show: Boolean(query.restored), message: "Дизайнер восстановлен." },
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

      <DesignerDetailTabs
        designer={designer}
        auditLogs={auditLogs}
        canCreateTasks={canCreateTask(user)}
        bonusSnapshot={bonusSnapshot}
        canManageBonus={canManageDesignerBonusAgreement(user, designer)}
        canViewBonusAmounts={canViewBonusAmounts}
        user={user}
      />
    </EntityDetailShell>
  );
}
