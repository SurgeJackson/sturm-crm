import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealHeaderBadges } from "@/components/crm/detail-header-badges";
import { DealDetailTabs } from "@/components/crm/detail-tabs/deal-detail-tabs";
import { EntityDetailShell } from "@/components/crm/detail-page";
import { DealLossDialog } from "@/components/deals/deal-loss-dialog";
import { getAuditLogs } from "@/lib/audit-log";
import { archiveDealAction, closeDealAsLostAction } from "@/modules/deals/actions";
import { getDealForUser } from "@/modules/deals/queries";
import { canArchiveRecord, canCloseDealAsLost, canCreateTask, canEditRecord } from "@/permissions";

type DealPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; lost?: string; error?: string }>;
};

export default async function DealPage({ params, searchParams }: DealPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [deal, auditLogs] = await Promise.all([
    getDealForUser(id, user),
    getAuditLogs("DEAL", id)
  ]);
  const archiveAction = archiveDealAction.bind(null, id);
  const lossAction = closeDealAsLostAction.bind(null, id);

  return (
    <EntityDetailShell
      title={deal.title}
      badges={<DealHeaderBadges stage={deal.stage} probability={deal.probability} source={deal.source} />}
      listHref="/deals"
      editHref={`/deals/${id}/edit`}
      canEdit={canEditRecord(user, deal)}
      actions={canEditRecord(user, deal) && deal.stage !== "LOST" && deal.stage !== "COMPLETED" && canCloseDealAsLost(user) ? (
        <DealLossDialog action={lossAction} />
      ) : null}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, deal) && !deal.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "Сделка сохранена." },
        { show: Boolean(query.archived), message: "Сделка архивирована." },
        { show: Boolean(query.lost), message: "Сделка закрыта как проигранная." },
        { show: query.error === "lossReason", tone: "destructive", message: "Укажите причину проигрыша сделки." },
        { show: Boolean(query.error && query.error !== "lossReason"), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]}
      discipline={{
        entityType: "DEAL",
        entityId: deal.id,
        editHref: `/deals/${id}/edit`,
        returnTo: `/deals/${id}`,
        violations: deal.crmViolations,
        user
      }}
    >

      <DealDetailTabs deal={deal} auditLogs={auditLogs} canCreateTasks={canCreateTask(user)} />
    </EntityDetailShell>
  );
}
