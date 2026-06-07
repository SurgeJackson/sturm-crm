import Link from "next/link";
import { paymentStatusVariant } from "@/components/crm/status-variants";
import { Button } from "@/components/ui/button";
import { BadgeCell, EmptyTableRow, MoneyCell, TableCard, TextLinkCell } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paymentStatusLabels, paymentTypeLabels } from "@/lib/constants";
import { confirmPaymentAction, cancelPaymentAction } from "@/modules/payments/actions";
import type { getPayments } from "@/modules/payments/queries";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { paymentSignedAmount } from "@/utils/payments";

type PaymentRow = Awaited<ReturnType<typeof getPayments>>["items"][number];

export function PaymentsTable({ payments, canManage }: { payments: PaymentRow[]; canManage: boolean }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Бонус</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length === 0 ? (
          <EmptyTableRow colSpan={9}>Оплаты пока не созданы</EmptyTableRow>
        ) : payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell label="Дата">{formatRussianDate(payment.paymentDate)}</TableCell>
            <TextLinkCell cellLabel="Сделка" href={`/deals/${payment.dealId}`}>{payment.deal.title}</TextLinkCell>
            <TextLinkCell cellLabel="Клиент" href={`/clients/${payment.clientId}`}>{payment.client.name}</TextLinkCell>
            <TableCell label="Дизайнер">
              {payment.designer ? <Link className="hover:underline" href={`/designers/${payment.designerId}`}>{payment.designer.name}</Link> : "Нет"}
            </TableCell>
            <TableCell label="Тип">{paymentTypeLabels[payment.paymentType]}</TableCell>
            <MoneyCell cellLabel="Сумма" value={paymentSignedAmount(payment)} />
            <TableCell label="Бонус">{formatMoney(payment.accruals.reduce((sum, accrual) => sum + accrual.bonusAmount, 0), "0 ₽")}</TableCell>
            <BadgeCell cellLabel="Статус" variant={paymentStatusVariant(payment.status)}>{paymentStatusLabels[payment.status]}</BadgeCell>
            <TableCell actions>
              {canManage && payment.status === "DRAFT" ? (
                <div className="flex gap-2">
                  <form action={confirmPaymentAction.bind(null, payment.id)}>
                    <Button type="submit" size="sm" variant="secondary">Подтвердить</Button>
                  </form>
                  <form action={cancelPaymentAction.bind(null, payment.id)}>
                    <Button type="submit" size="sm" variant="ghost">Отменить</Button>
                  </form>
                </div>
              ) : payment.status === "CONFIRMED" && canManage ? (
                <form action={cancelPaymentAction.bind(null, payment.id)}>
                  <Button type="submit" size="sm" variant="ghost">Отменить</Button>
                </form>
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
