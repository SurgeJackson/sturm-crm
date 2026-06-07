import { createDesignerBonusAdjustmentAction, saveDesignerBonusAgreementAction } from "@/modules/designer-bonuses/actions";
import { BonusAgreementForm } from "@/components/designer-bonuses/bonus-agreement-form";
import { BonusAdjustmentForm } from "@/components/designer-bonuses/bonus-adjustment-form";
import { BonusAccrualsTable, BonusAdjustmentsTable, BonusAgreementsTable, BonusPayoutsTable } from "@/components/designer-bonuses/bonus-tables";
import { CompactMetricCard } from "@/components/crm/summary-card";
import type { getDesignerBonusSnapshot } from "@/modules/designer-bonuses/queries";
import { formatMoney } from "@/utils/money";

type Snapshot = Awaited<ReturnType<typeof getDesignerBonusSnapshot>>;

export function DesignerBonusPanel({
  designerId,
  snapshot,
  canManage,
  showAmounts,
  deals = []
}: {
  designerId: string;
  snapshot: Snapshot;
  canManage: boolean;
  showAmounts: boolean;
  deals?: Array<{ id: string; title: string }>;
}) {
  const editableAgreement = snapshot.agreements.find((agreement) => agreement.status === "ACTIVE") ?? snapshot.agreements[0] ?? null;
  const action = saveDesignerBonusAgreementAction.bind(null, editableAgreement?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <CompactMetricCard title="Начислено" value={showAmounts ? formatMoney(snapshot.balance.accruedTotal, "0 ₽") : "Скрыто"} />
        <CompactMetricCard title="Выплачено" value={showAmounts ? formatMoney(snapshot.balance.paidTotal, "0 ₽") : "Скрыто"} />
        <CompactMetricCard title="Корректировки" value={showAmounts ? formatMoney(snapshot.balance.adjustmentTotal, "0 ₽") : "Скрыто"} />
        <CompactMetricCard title="Баланс к выплате" value={showAmounts ? formatMoney(snapshot.balance.balance, "0 ₽") : "Скрыто"} />
        <CompactMetricCard title="Ожидает" value={showAmounts ? formatMoney(snapshot.balance.pendingTotal, "0 ₽") : "Скрыто"} />
      </div>
      <BonusAgreementForm action={action} designerId={designerId} canManage={canManage} deals={deals} agreement={editableAgreement} />
      <BonusAdjustmentForm action={createDesignerBonusAdjustmentAction} designerId={designerId} canManage={canManage} />
      <BonusAgreementsTable agreements={snapshot.agreements} showAmounts={showAmounts} />
      <BonusAccrualsTable accruals={snapshot.accruals} showAmounts={showAmounts} />
      <BonusPayoutsTable payouts={snapshot.payouts} showAmounts={showAmounts} />
      <BonusAdjustmentsTable adjustments={snapshot.adjustments} showAmounts={showAmounts} />
    </div>
  );
}
