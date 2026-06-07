import { bonusAccrualStatusVariant, bonusAgreementStatusVariant, bonusPayoutStatusVariant, paymentStatusVariant } from "@/components/crm/status-variants";
import { Button } from "@/components/ui/button";
import { BadgeCell, EmptyTableRow, MoneyCell, TableCard, TextCell, TextLinkCell } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  designerBonusAccrualStatusLabels,
  designerBonusAccrualTypeLabels,
  designerBonusAdjustmentTypeLabels,
  designerBonusAgreementStatusLabels,
  designerBonusAgreementTypeLabels,
  designerBonusAppliesToLabels,
  designerBonusCalculationBaseLabels,
  designerBonusPayoutMethodLabels,
  designerBonusPayoutStatusLabels,
  paymentStatusLabels,
  paymentTypeLabels
} from "@/lib/constants";
import type { getBonusAccruals, getBonusPayouts, getDesignerBonusSnapshot } from "@/modules/designer-bonuses/queries";
import { markDesignerBonusPayoutPaidAction } from "@/modules/designer-bonuses/actions";
import { formatRussianDate } from "@/utils/date";
import { paymentSignedAmount } from "@/utils/payments";

type Snapshot = Awaited<ReturnType<typeof getDesignerBonusSnapshot>>;
type AccrualRow = Awaited<ReturnType<typeof getBonusAccruals>>["items"][number];
type PayoutRow = Awaited<ReturnType<typeof getBonusPayouts>>["items"][number];

export function BonusAgreementsTable({ agreements, showAmounts }: { agreements: Snapshot["agreements"]; showAmounts: boolean }) {
  return (
    <TableCard title="Условия бонусов">
      <TableHeader>
        <TableRow>
          <TableHead>Тип</TableHead>
          <TableHead>Процент</TableHead>
          <TableHead>База</TableHead>
          <TableHead>Применение</TableHead>
          <TableHead>Период</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Комментарий</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agreements.length === 0 ? (
          <EmptyTableRow colSpan={7}>Условия бонусного сотрудничества не заданы</EmptyTableRow>
        ) : agreements.map((agreement) => (
          <TableRow key={agreement.id}>
            <TableCell label="Тип">{designerBonusAgreementTypeLabels[agreement.agreementType]}</TableCell>
            <TableCell label="Процент">{showAmounts && agreement.bonusPercent ? `${agreement.bonusPercent}%` : "Скрыто"}</TableCell>
            <TableCell label="База">{designerBonusCalculationBaseLabels[agreement.calculationBase]}</TableCell>
            <TableCell label="Применение">{designerBonusAppliesToLabels[agreement.appliesTo]}</TableCell>
            <TableCell label="Период">{formatRussianDate(agreement.validFrom)} - {formatRussianDate(agreement.validTo)}</TableCell>
            <BadgeCell cellLabel="Статус" variant={bonusAgreementStatusVariant(agreement.status)}>{designerBonusAgreementStatusLabels[agreement.status]}</BadgeCell>
            <TextCell cellLabel="Комментарий">{agreement.comment || "Нет"}</TextCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function BonusAccrualsTable({ accruals, showDesigner = false, showAmounts }: { accruals: AccrualRow[]; showDesigner?: boolean; showAmounts: boolean }) {
  const colSpan = showDesigner ? 8 : 7;
  return (
    <TableCard title="Начисления">
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          {showDesigner ? <TableHead>Дизайнер</TableHead> : null}
          <TableHead>Сделка</TableHead>
          <TableHead>Оплата</TableHead>
          <TableHead>База</TableHead>
          <TableHead>%</TableHead>
          <TableHead>Бонус</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accruals.length === 0 ? (
          <EmptyTableRow colSpan={colSpan}>Начисления пока отсутствуют</EmptyTableRow>
        ) : accruals.map((accrual) => (
          <TableRow key={accrual.id}>
            <TableCell label="Дата">{formatRussianDate(accrual.accrualDate)}</TableCell>
            {showDesigner ? <TextLinkCell cellLabel="Дизайнер" href={`/designers/${accrual.designerId}`}>{accrual.designer.name}</TextLinkCell> : null}
            <TextLinkCell cellLabel="Сделка" href={`/deals/${accrual.dealId}`}>{accrual.deal.title}</TextLinkCell>
            <TableCell label="Оплата">{accrual.payment ? formatRussianDate(accrual.payment.paymentDate) : designerBonusAccrualTypeLabels[accrual.accrualType]}</TableCell>
            <MoneyCell cellLabel="База" value={showAmounts ? accrual.baseAmount : null} emptyText="Скрыто" />
            <TableCell label="%">{showAmounts ? `${accrual.bonusPercent}%` : "Скрыто"}</TableCell>
            <MoneyCell cellLabel="Бонус" value={showAmounts ? accrual.bonusAmount : null} emptyText="Скрыто" />
            <BadgeCell cellLabel="Статус" variant={bonusAccrualStatusVariant(accrual.status)}>{designerBonusAccrualStatusLabels[accrual.status]}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function BonusPayoutsTable({
  payouts,
  showDesigner = false,
  showAmounts,
  canManage = false
}: {
  payouts: PayoutRow[];
  showDesigner?: boolean;
  showAmounts: boolean;
  canManage?: boolean;
}) {
  return (
    <TableCard title="Выплаты">
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          {showDesigner ? <TableHead>Дизайнер</TableHead> : null}
          <TableHead>Сумма</TableHead>
          <TableHead>Начисления</TableHead>
          <TableHead>Способ</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Комментарий</TableHead>
          {canManage ? <TableHead>Действия</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.length === 0 ? (
          <EmptyTableRow colSpan={(showDesigner ? 7 : 6) + (canManage ? 1 : 0)}>Выплаты пока отсутствуют</EmptyTableRow>
        ) : payouts.map((payout) => (
          <TableRow key={payout.id}>
            <TableCell label="Дата">{formatRussianDate(payout.payoutDate)}</TableCell>
            {showDesigner ? <TextLinkCell cellLabel="Дизайнер" href={`/designers/${payout.designerId}`}>{payout.designer.name}</TextLinkCell> : null}
            <MoneyCell cellLabel="Сумма" value={showAmounts ? payout.amount : null} emptyText="Скрыто" />
            <TableCell label="Начисления">{payout.linkedAccrualIds.length > 0 ? payout.linkedAccrualIds.length : "Не указаны"}</TableCell>
            <TableCell label="Способ">{designerBonusPayoutMethodLabels[payout.payoutMethod]}</TableCell>
            <BadgeCell cellLabel="Статус" variant={bonusPayoutStatusVariant(payout.status)}>{designerBonusPayoutStatusLabels[payout.status]}</BadgeCell>
            <TextCell cellLabel="Комментарий">{payout.comment || "Нет"}</TextCell>
            {canManage ? (
              <TableCell actions>
                {payout.status !== "PAID" && payout.status !== "CANCELLED" ? (
                  <form action={markDesignerBonusPayoutPaidAction.bind(null, payout.id)}>
                    <Button type="submit" size="sm" variant="secondary">Выплачено</Button>
                  </form>
                ) : null}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function BonusAdjustmentsTable({ adjustments, showAmounts }: { adjustments: Snapshot["adjustments"]; showAmounts: boolean }) {
  return (
    <TableCard title="Корректировки">
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Причина</TableHead>
          <TableHead>Автор</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adjustments.length === 0 ? (
          <EmptyTableRow colSpan={5}>Корректировки пока отсутствуют</EmptyTableRow>
        ) : adjustments.map((adjustment) => (
          <TableRow key={adjustment.id}>
            <TableCell label="Дата">{formatRussianDate(adjustment.createdAt)}</TableCell>
            <TableCell label="Тип">{designerBonusAdjustmentTypeLabels[adjustment.adjustmentType]}</TableCell>
            <MoneyCell cellLabel="Сумма" value={showAmounts ? adjustment.amount : null} emptyText="Скрыто" />
            <TableCell label="Причина">{adjustment.reason}</TableCell>
            <TableCell label="Автор">{adjustment.createdBy.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function DealBonusPaymentsTable({ payments, showAmounts }: { payments: Array<{ id: string; amount: number; paymentDate: Date; paymentType: keyof typeof paymentTypeLabels; status: keyof typeof paymentStatusLabels }>; showAmounts: boolean }) {
  return (
    <TableCard title="Оплаты по сделке">
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length === 0 ? (
          <EmptyTableRow colSpan={4}>Оплаты по сделке не заведены</EmptyTableRow>
        ) : payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell label="Дата">{formatRussianDate(payment.paymentDate)}</TableCell>
            <TableCell label="Тип">{paymentTypeLabels[payment.paymentType]}</TableCell>
            <MoneyCell cellLabel="Сумма" value={showAmounts ? paymentSignedAmount(payment) : null} emptyText="Скрыто" />
            <BadgeCell cellLabel="Статус" variant={paymentStatusVariant(payment.status)}>{paymentStatusLabels[payment.status]}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
