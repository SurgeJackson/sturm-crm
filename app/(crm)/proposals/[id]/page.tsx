import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProposalHeaderBadges } from "@/components/crm/detail-header-badges";
import { ProposalDetailTabs } from "@/components/crm/detail-tabs/proposal-detail-tabs";
import {
  ActionPromptCard,
  EntityDetailShell
} from "@/components/crm/detail-page";
import { Button } from "@/components/ui/button";
import { getAuditLogs } from "@/lib/audit-log";
import {
  archiveProposalAction,
  createProposalVersionAction,
  moveDealToInvoiceFromProposalAction
} from "@/modules/proposals/actions";
import { getProposalForUser, getProposalVersionGroup } from "@/modules/proposals/queries";
import { canArchiveRecord, canCreateTask, canEditRecord } from "@/permissions";

type ProposalPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; dealStage?: string; error?: string }>;
};

export default async function ProposalPage({ params, searchParams }: ProposalPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [proposal, versions, auditLogs] = await Promise.all([
    getProposalForUser(id, user),
    getProposalVersionGroup(id),
    getAuditLogs("PROPOSAL", id)
  ]);
  const archiveAction = archiveProposalAction.bind(null, id);
  const createVersionAction = createProposalVersionAction.bind(null, id);
  const moveDealAction = moveDealToInvoiceFromProposalAction.bind(null, id);

  return (
    <EntityDetailShell
      title={proposal.proposalNumber}
      badges={<ProposalHeaderBadges status={proposal.status} version={proposal.version} amount={proposal.amount} />}
      editHref={`/proposals/${id}/edit`}
      canEdit={canEditRecord(user, proposal)}
      actions={canEditRecord(user, proposal) ? (
        <form action={createVersionAction}>
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4" />
            Новая версия
          </Button>
        </form>
      ) : null}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, proposal) && !proposal.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "КП сохранено." },
        { show: Boolean(query.archived), message: "КП архивировано." },
        { show: Boolean(query.dealStage), message: "Сделка переведена в стадию “Счет / заказ”." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно или данные не заполнены." }
      ]}
      discipline={{
        entityType: "PROPOSAL",
        entityId: proposal.id,
        editHref: `/proposals/${id}/edit`,
        returnTo: `/proposals/${id}`,
        violations: proposal.crmViolations,
        user
      }}
    >

      {proposal.status === "ACCEPTED" && proposal.deal.stage !== "INVOICE_OR_ORDER" ? (
        <ActionPromptCard
          message="КП принято. Перевести сделку в стадию “Счет / заказ”?"
          action={
            <form action={moveDealAction}>
              <Button type="submit" variant="secondary">Перевести сделку</Button>
            </form>
          }
        />
      ) : null}

      <ProposalDetailTabs
        proposal={proposal}
        versions={versions}
        auditLogs={auditLogs}
        canCreateTasks={canCreateTask(user)}
        canCreateVersion={canEditRecord(user, proposal)}
        createVersionAction={createVersionAction}
      />
    </EntityDetailShell>
  );
}
