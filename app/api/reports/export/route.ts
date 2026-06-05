import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { writeAuditLog } from "@/lib/audit-log";
import {
  getBonusEligibilityReport,
  getCrmDisciplineReport,
  getDealsReport,
  getDesignersReport,
  getEmployeeActivityReport,
  getLossReasonsReport,
  getManagerDashboardReport,
  getObjectsReport,
  getOverdueReport,
  getProposalsReport,
  rowsToCsv,
  type ReportSearchParams
} from "@/modules/reports/queries";

function paramsFromUrl(url: URL): ReportSearchParams {
  return Object.fromEntries(url.searchParams.entries()) as ReportSearchParams;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const report = url.searchParams.get("report") ?? "activity";
  const params = paramsFromUrl(url);
  const user = session.user;
  let csv = "";

  if (report === "manager-dashboard") {
    const data = await getManagerDashboardReport(params, user);
    csv = rowsToCsv(["Метрика", "Значение"], data.metrics.map((metric) => [metric.title, metric.value]));
  } else if (report === "activity") {
    const data = await getEmployeeActivityReport(params, user);
    csv = rowsToCsv(
      ["Сотрудник", "Клиенты", "Дизайнеры", "Объекты", "Сделки", "КП", "Сумма КП", "Задачи", "Выполнено", "Просрочено", "Касания"],
      data.rows.map((row) => [row.employee.name, row.clients, row.designers, row.objects, row.deals, row.proposals, row.proposalAmount, row.tasks, row.doneTasks, row.overdueTasks, row.touches])
    );
  } else if (report === "crm-discipline") {
    const data = await getCrmDisciplineReport(params, user);
    csv = rowsToCsv(["Раздел", "Проблема", "Серьезность", "Ответственный", "Код", "Влияет на премию", "Запись"], data.problems.map((row) => [row.area, row.issue, row.severity, row.responsibleName, row.violationCode, row.canAffectBonus ? "Да" : "Нет", row.title]));
  } else if (report === "bonus-eligibility") {
    const data = await getBonusEligibilityReport(params, user);
    csv = rowsToCsv(["Сущность", "Название", "Ответственный", "Статус учета", "Нарушения", "Влияет на премию", "Дата обнаружения"], data.rows.map((row) => [row.entity, row.title, row.responsibleName, row.status, row.violations.join("; "), row.affectsBonus ? "Да" : "Нет", row.detectedAt?.toISOString()]));
  } else if (report === "deals") {
    const data = await getDealsReport(params, user);
    csv = rowsToCsv(["Сделка", "Стадия", "Сумма", "Ответственный"], data.deals.map((deal) => [deal.title, deal.stage, deal.potentialAmount, deal.responsible.name]));
  } else if (report === "proposals") {
    const data = await getProposalsReport(params, user);
    csv = rowsToCsv(["КП", "Статус", "Сумма", "Клиент", "Ответственный"], data.proposals.map((proposal) => [proposal.proposalNumber, proposal.status, proposal.amount, proposal.client.name, proposal.responsible.name]));
  } else if (report === "designers") {
    const data = await getDesignersReport(params, user);
    csv = rowsToCsv(
      ["Дизайнер", "Этап", "Потенциал", "Лояльность", "Объекты", "КП", "Ответственный"],
      data.designers.map((designer) => [designer.name, designer.relationshipStage, designer.potential, designer.loyalty, designer.projectObjects.length, designer.proposals.length, designer.responsible.name])
    );
  } else if (report === "objects") {
    const data = await getObjectsReport(params, user);
    csv = rowsToCsv(["Объект", "Стадия", "Статус", "Клиент", "Ответственный"], data.objects.map((object) => [object.title, object.stage, object.status, object.client.name, object.responsible.name]));
  } else if (report === "loss-reasons") {
    const data = await getLossReasonsReport(params, user);
    csv = rowsToCsv(["Тип", "Запись", "Причина", "Сумма", "Ответственный"], [
      ...data.lostDeals.map((deal) => ["Сделка", deal.title, deal.lossReason, deal.potentialAmount, deal.responsible.name]),
      ...data.declinedProposals.map((proposal) => ["КП", proposal.proposalNumber, proposal.declineReason, proposal.amount, proposal.responsible.name])
    ]);
  } else if (report === "overdue") {
    const data = await getOverdueReport(params, user);
    csv = rowsToCsv(["Тип", "Запись", "Ответственный"], [
      ...data.tasks.map((task) => ["Задача", task.title, task.responsible.name]),
      ...data.proposalFollowUps.map((proposal) => ["КП follow-up", proposal.proposalNumber, proposal.responsible.name]),
      ...data.deals.map((deal) => ["Сделка", deal.title, deal.responsible.name]),
      ...data.designers.map((designer) => ["Дизайнер", designer.name, designer.responsible.name])
    ]);
  } else {
    csv = rowsToCsv(["Отчет"], [[report]]);
  }

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "REPORT_EXPORT",
    userId: user.id,
    after: { report, params }
  });

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${report}.csv"`
    }
  });
}
