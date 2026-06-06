import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientHeaderBadges } from "@/components/crm/detail-header-badges";
import { ClientDetailTabs } from "@/components/crm/detail-tabs/client-detail-tabs";
import { EntityDetailShell } from "@/components/crm/detail-page";
import { archiveClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { getAuditLogs } from "@/lib/audit-log";
import { canArchiveRecord, canCreateTask, canEditRecord } from "@/permissions";

type ClientPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; error?: string }>;
};

export default async function ClientPage({ params, searchParams }: ClientPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [client, auditLogs] = await Promise.all([
    getClientForUser(id, user),
    getAuditLogs("CLIENT", id)
  ]);
  const archiveAction = archiveClientAction.bind(null, id);

  return (
    <EntityDetailShell
      title={client.name}
      badges={<ClientHeaderBadges status={client.status} clientType={client.clientType} />}
      editHref={`/clients/${id}/edit`}
      canEdit={canEditRecord(user, client)}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, client) && !client.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "Клиент сохранен." },
        { show: Boolean(query.archived), message: "Клиент архивирован." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно для вашей роли." }
      ]}
      discipline={{
        entityType: "CLIENT",
        entityId: client.id,
        editHref: `/clients/${id}/edit`,
        returnTo: `/clients/${id}`,
        violations: client.crmViolations,
        user
      }}
    >

      <ClientDetailTabs client={client} auditLogs={auditLogs} canCreateTasks={canCreateTask(user)} />
    </EntityDetailShell>
  );
}
