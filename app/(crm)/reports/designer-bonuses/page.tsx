import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BonusFilters } from "@/components/designer-bonuses/bonus-filters";
import { BonusAccrualsTable, BonusPayoutsTable } from "@/components/designer-bonuses/bonus-tables";
import { ReportPageHeader } from "@/components/reports/layout";
import { EmptyTableRow, MoneyCell, TableCard, TextLinkCell } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { writeSecurityLog } from "@/lib/security-log";
import { getBonusFormContext, getDesignerBonusReports, type DesignerBonusReportParams } from "@/modules/designer-bonuses/queries";
import { canExportDesignerBonusReports, canViewDesignerBonusAmounts, canViewDesignerBonusReports } from "@/permissions";
import { formatMoney } from "@/utils/money";
import { paymentSignedAmount } from "@/utils/payments";

type DesignerBonusReportPageProps = {
  searchParams: Promise<DesignerBonusReportParams>;
};

export default async function DesignerBonusReportPage({ searchParams }: DesignerBonusReportPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewDesignerBonusReports(user)) redirect("/reports");

  const params = await searchParams;
  const [report, context] = await Promise.all([
    getDesignerBonusReports(params, user),
    getBonusFormContext(user)
  ]);
  const showAmounts = canViewDesignerBonusAmounts(user);
  const canExport = canExportDesignerBonusReports(user);
  await writeSecurityLog({
    action: "VIEW_DESIGNER_BONUS_REPORT",
    userId: user.id,
    entityType: "DESIGNER_BONUS_ACCRUAL",
    metadata: { params, showAmounts }
  });

  return (
    <div className="space-y-6">
      <ReportPageHeader title="Отчет по бонусам дизайнеров" description="Балансы, задолженность, начисления, выплаты и сделки с бонусами." report={canExport ? "designer-bonuses" : undefined} params={params} />
      <BonusFilters params={params} designers={context.designers} deals={context.deals} objects={context.objects} basePath="/reports/designer-bonuses" type="report" />
      <TableCard title="Балансы дизайнеров">
        <TableHeader>
          <TableRow>
            <TableHead>Дизайнер</TableHead>
            <TableHead>Начислено</TableHead>
            <TableHead>Выплачено</TableHead>
            <TableHead>Корректировки</TableHead>
            <TableHead>Баланс</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.balances.length === 0 ? (
            <EmptyTableRow colSpan={5}>Нет данных по балансам</EmptyTableRow>
          ) : report.balances.map((row) => (
            <TableRow key={row.designer.id}>
              <TextLinkCell cellLabel="Дизайнер" href={`/designers/${row.designer.id}`}>{row.designer.name}</TextLinkCell>
              <MoneyCell cellLabel="Начислено" value={showAmounts ? row.balance.accruedTotal : null} emptyText="Скрыто" />
              <MoneyCell cellLabel="Выплачено" value={showAmounts ? row.balance.paidTotal : null} emptyText="Скрыто" />
              <MoneyCell cellLabel="Корректировки" value={showAmounts ? row.balance.adjustmentTotal : null} emptyText="Скрыто" />
              <TableCell label="Баланс">{showAmounts ? `${formatMoney(row.balance.balance, "0 ₽")} к выплате` : "Скрыто"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
      <TableCard title="Задолженность перед дизайнерами">
        <TableHeader>
          <TableRow>
            <TableHead>Дизайнер</TableHead>
            <TableHead>Баланс</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.debtors.length === 0 ? (
            <EmptyTableRow colSpan={2}>Положительной задолженности нет</EmptyTableRow>
          ) : report.debtors.map((row) => (
            <TableRow key={row.designer.id}>
              <TextLinkCell cellLabel="Дизайнер" href={`/designers/${row.designer.id}`}>{row.designer.name}</TextLinkCell>
              <MoneyCell cellLabel="Баланс" value={showAmounts ? row.balance.balance : null} emptyText="Скрыто" />
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
      <BonusAccrualsTable accruals={report.accruals} showDesigner showAmounts={showAmounts} />
      <BonusPayoutsTable payouts={report.payouts} showDesigner showAmounts={showAmounts} />
      <TableCard title="Бонусы по сделкам">
        <TableHeader>
          <TableRow>
            <TableHead>Сделка</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Объект</TableHead>
            <TableHead>Дизайнер</TableHead>
            <TableHead>Оплачено</TableHead>
            <TableHead>Начислено</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.deals.length === 0 ? (
            <EmptyTableRow colSpan={6}>Сделок с бонусами нет</EmptyTableRow>
          ) : report.deals.map((deal) => (
            <TableRow key={deal.id}>
              <TextLinkCell cellLabel="Сделка" href={`/deals/${deal.id}`}>{deal.title}</TextLinkCell>
              <TextLinkCell cellLabel="Клиент" href={`/clients/${deal.client.id}`}>{deal.client.name}</TextLinkCell>
              <TextLinkCell cellLabel="Объект" href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</TextLinkCell>
              <TableCell label="Дизайнер">{deal.designer?.name ?? "Нет"}</TableCell>
              <MoneyCell cellLabel="Оплачено" value={showAmounts ? deal.payments.reduce((sum, payment) => sum + paymentSignedAmount(payment), 0) : null} emptyText="Скрыто" />
              <MoneyCell cellLabel="Начислено" value={showAmounts ? deal.bonusAccruals.reduce((sum, accrual) => sum + accrual.bonusAmount, 0) : null} emptyText="Скрыто" />
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </div>
  );
}
