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
import { getActiveBonusAgreement } from "@/modules/designer-bonuses/service";
import {
  createProposalVersionAction,
  moveDealToInvoiceFromProposalAction
} from "@/modules/proposals/actions";
import { getProposalForUser, getProposalVersionGroup } from "@/modules/proposals/queries";
import { archiveEntityAction, restoreEntityAction } from "@/modules/security/entity-actions";
import { recordEntityView } from "@/modules/security/activity";
import { canArchiveEntity, canCreateTask, canEditRecord, canRestoreEntity, canViewDesignerBonusAmounts, canViewSensitiveFields } from "@/permissions";

type ProposalPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; archived?: string; restored?: string; dealStage?: string; error?: string }>;
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
  const archiveAction = archiveEntityAction.bind(null, "PROPOSAL", id);
  const restoreAction = restoreEntityAction.bind(null, "PROPOSAL", id);
  await recordEntityView(user.id, "PROPOSAL", id);
  const activeAgreement = proposal.designerId ? await getActiveBonusAgreement(proposal.designerId, new Date(), proposal.dealId) : null;
  const createVersionAction = createProposalVersionAction.bind(null, id);
  const moveDealAction = moveDealToInvoiceFromProposalAction.bind(null, id);
  const canViewSensitive = canViewSensitiveFields(user, proposal);

  return (
    <EntityDetailShell
      title={proposal.proposalNumber}
      badges={<ProposalHeaderBadges status={proposal.status} version={proposal.version} amount={proposal.amount} canViewAmount={canViewSensitive} />}
      listHref="/proposals"
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
      canArchive={canArchiveEntity(user, proposal) && !proposal.archivedAt}
      restoreAction={restoreAction}
      canRestore={canRestoreEntity(user, proposal)}
      notices={[
        { show: Boolean(query.saved), message: "КП сохранено." },
        { show: Boolean(query.archived), message: "КП архивировано." },
        { show: Boolean(query.restored), message: "КП восстановлено." },
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
        canViewBonusAmounts={canViewDesignerBonusAmounts(user, proposal.designer)}
        bonusPercent={activeAgreement?.bonusPercent ?? null}
        user={user}
      />
    </EntityDetailShell>
  );
}
