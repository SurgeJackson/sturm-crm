import Link from "next/link";
import { bonusVariant } from "@/components/crm/discipline/variants";
import { Badge } from "@/components/ui/badge";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  commercialProposalStatusLabels,
  dealProbabilityLabels,
  dealLossReasonLabels,
  dealSourceLabels,
  dealStageLabels,
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels,
  proposalDeclineReasonLabels,
  roleLabels
} from "@/lib/constants";
import { bonusEligibilityLabels } from "@/modules/crm-discipline/service";
import type {
  getBonusEligibilityReport,
  getDealsReport,
  getDesignersReport,
  getEmployeeActivityReport,
  getLossReasonsReport,
  getMyReport,
  getObjectsReport,
  getOverdueReport,
  getProposalsReport
} from "@/modules/reports/queries";
import { formatRussianDate, formatRussianDateTime } from "@/utils/date";

type DealsReport = Awaited<ReturnType<typeof getDealsReport>>;
type ProposalsReport = Awaited<ReturnType<typeof getProposalsReport>>;
type DesignersReport = Awaited<ReturnType<typeof getDesignersReport>>;
type ObjectsReport = Awaited<ReturnType<typeof getObjectsReport>>;
type ActivityReport = Awaited<ReturnType<typeof getEmployeeActivityReport>>;
type BonusEligibilityReport = Awaited<ReturnType<typeof getBonusEligibilityReport>>;
type LossReasonsReport = Awaited<ReturnType<typeof getLossReasonsReport>>;
type OverdueReport = Awaited<ReturnType<typeof getOverdueReport>>;
type MyReport = Awaited<ReturnType<typeof getMyReport>>;

export function DealsReportTable({ deals }: { deals: DealsReport["deals"] }) {
  return (
    <TableCard title="Сделки">
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Источник</TableHead>
          <TableHead>Вероятность</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующий шаг</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={7}>Сделки не найдены.</EmptyTableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <TableCell>
              <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link>
              <div className="text-xs text-muted-foreground">{deal.client.name} / {deal.projectObject.title}</div>
            </TableCell>
            <TableCell><Badge variant="outline">{dealStageLabels[deal.stage]}</Badge></TableCell>
            <TableCell>{dealSourceLabels[deal.source]}</TableCell>
            <TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Нет"}</TableCell>
            <TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Нет"}</TableCell>
            <TableCell>{deal.responsible.name}</TableCell>
            <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ProposalsReportTable({ proposals }: { proposals: ProposalsReport["proposals"] }) {
  return (
    <TableCard title="КП">
      <TableHeader>
        <TableRow>
          <TableHead>КП</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={7}>КП не найдены.</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <TableCell>
              <Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">{proposal.proposalNumber}</Link>
            </TableCell>
            <TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
            <TableCell>{proposal.client.name}</TableCell>
            <TableCell>{proposal.deal.title}</TableCell>
            <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
            <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function DesignersReportTable({ designers }: { designers: DesignersReport["designers"] }) {
  return (
    <TableCard title="Дизайнеры">
      <TableHeader>
        <TableRow>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Этап</TableHead>
          <TableHead>Потенциал</TableHead>
          <TableHead>Лояльность</TableHead>
          <TableHead>Объекты</TableHead>
          <TableHead>КП</TableHead>
          <TableHead>Последнее касание</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {designers.length === 0 ? (
          <EmptyTableRow colSpan={7}>Дизайнеры не найдены.</EmptyTableRow>
        ) : designers.map((designer) => (
          <TableRow key={designer.id}>
            <TableCell>
              <Link href={`/designers/${designer.id}`} className="font-medium hover:underline">{designer.name}</Link>
              <div className="text-xs text-muted-foreground">{designer.studio}</div>
            </TableCell>
            <TableCell><Badge variant="outline">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge></TableCell>
            <TableCell>{designerPotentialLabels[designer.potential]}</TableCell>
            <TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell>
            <TableCell>{designer.projectObjects.length}</TableCell>
            <TableCell>{designer.proposals.length}</TableCell>
            <TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ObjectsReportTable({ objects }: { objects: ObjectsReport["objects"] }) {
  return (
    <TableCard title="Объекты">
      <TableHeader>
        <TableRow>
          <TableHead>Объект</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Задачи</TableHead>
          <TableHead>Участники</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={8}>Объекты не найдены.</EmptyTableRow>
        ) : objects.map((object) => (
          <TableRow key={object.id}>
            <TableCell><Link href={`/objects/${object.id}`} className="font-medium hover:underline">{object.title}</Link></TableCell>
            <TableCell>{objectTypeLabels[object.objectType]}</TableCell>
            <TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell>
            <TableCell>{objectStatusLabels[object.status]}</TableCell>
            <TableCell>{object.client.name}</TableCell>
            <TableCell>{object.designer?.name ?? "Нет"}</TableCell>
            <TableCell>{object.tasks.length}</TableCell>
            <TableCell>{object.participants.length}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ActivityReportTable({ rows }: { rows: ActivityReport["rows"] }) {
  return (
    <TableCard title="Таблица активности">
      <TableHeader>
        <TableRow>
          <TableHead>Сотрудник</TableHead>
          <TableHead>Клиенты</TableHead>
          <TableHead>Дизайнеры</TableHead>
          <TableHead>Объекты</TableHead>
          <TableHead>Сделки</TableHead>
          <TableHead>КП</TableHead>
          <TableHead>Сумма КП</TableHead>
          <TableHead>Задачи</TableHead>
          <TableHead>Выполнено</TableHead>
          <TableHead>Просрочено</TableHead>
          <TableHead>Касания</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyTableRow colSpan={11}>Активности за период нет.</EmptyTableRow>
        ) : rows.map((row) => (
          <TableRow key={row.employee.id}>
            <TableCell>
              <Link className="font-medium hover:underline" href={`/reports/activity?responsibleId=${row.employee.id}`}>{row.employee.name}</Link>
              <div className="text-xs text-muted-foreground">{roleLabels[row.employee.role]}</div>
            </TableCell>
            <TableCell>{row.clients}</TableCell>
            <TableCell>{row.designers}</TableCell>
            <TableCell>{row.objects}</TableCell>
            <TableCell>{row.deals}</TableCell>
            <TableCell>{row.proposals}</TableCell>
            <TableCell>{row.proposalAmount.toLocaleString("ru-RU")} ₽</TableCell>
            <TableCell>{row.tasks}</TableCell>
            <TableCell>{row.doneTasks}</TableCell>
            <TableCell>{row.overdueTasks}</TableCell>
            <TableCell>{row.touches}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function LossReasonsReportTables({
  lostDeals,
  declinedProposals
}: {
  lostDeals: LossReasonsReport["lostDeals"];
  declinedProposals: LossReasonsReport["declinedProposals"];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <TableCard title="Проигранные сделки">
        <TableHeader>
          <TableRow>
            <TableHead>Сделка</TableHead>
            <TableHead>Причина</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lostDeals.length === 0 ? (
            <EmptyTableRow colSpan={4}>Нет проигранных сделок.</EmptyTableRow>
          ) : lostDeals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell>
              <TableCell>{deal.lossReason ? dealLossReasonLabels[deal.lossReason] : "Не указана"}</TableCell>
              <TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Нет"}</TableCell>
              <TableCell>{deal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>

      <TableCard title="Отклоненные КП">
        <TableHeader>
          <TableRow>
            <TableHead>КП</TableHead>
            <TableHead>Причина</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {declinedProposals.length === 0 ? (
            <EmptyTableRow colSpan={4}>Нет отклоненных КП.</EmptyTableRow>
          ) : declinedProposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
              <TableCell>{proposal.declineReason ? proposalDeclineReasonLabels[proposal.declineReason] : "Не указана"}</TableCell>
              <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
              <TableCell>{proposal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </div>
  );
}

export function OverdueReportTables({ report }: { report: OverdueReport }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <TableCard title="Просроченные задачи">
        <TableHeader>
          <TableRow>
            <TableHead>Задача</TableHead>
            <TableHead>Срок</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.tasks.length === 0 ? (
            <EmptyTableRow colSpan={3}>Просроченных задач нет.</EmptyTableRow>
          ) : report.tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/tasks/${task.id}`}>{task.title}</Link></TableCell>
              <TableCell>{formatRussianDateTime(task.dueAt)}</TableCell>
              <TableCell>{task.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>

      <TableCard title="Просроченный follow-up КП">
        <TableHeader>
          <TableRow>
            <TableHead>КП</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.proposalFollowUps.length === 0 ? (
            <EmptyTableRow colSpan={3}>Просроченных follow-up нет.</EmptyTableRow>
          ) : report.proposalFollowUps.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
              <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
              <TableCell>{proposal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>

      <TableCard title="Сделки с просроченным действием">
        <TableHeader>
          <TableRow>
            <TableHead>Сделка</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.deals.length === 0 ? (
            <EmptyTableRow colSpan={3}>Таких сделок нет.</EmptyTableRow>
          ) : report.deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell>
              <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
              <TableCell>{deal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>

      <TableCard title="Дизайнеры без касаний">
        <TableHeader>
          <TableRow>
            <TableHead>Дизайнер</TableHead>
            <TableHead>Последнее касание</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.designers.length === 0 ? (
            <EmptyTableRow colSpan={3}>Дизайнеров без касаний нет.</EmptyTableRow>
          ) : report.designers.map((designer) => (
            <TableRow key={designer.id}>
              <TableCell><Link className="font-medium hover:underline" href={`/designers/${designer.id}`}>{designer.name}</Link></TableCell>
              <TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell>
              <TableCell>{designer.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </div>
  );
}

export function MyDisciplineProblemsTable({ problems }: { problems: MyReport["discipline"]["problems"] }) {
  return (
    <TableCard title="Мои нарушения CRM-дисциплины">
      <TableHeader>
        <TableRow>
          <TableHead>Раздел</TableHead>
          <TableHead>Проблема</TableHead>
          <TableHead>Запись</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {problems.length === 0 ? (
          <EmptyTableRow colSpan={3}>Нарушений нет.</EmptyTableRow>
        ) : problems.map((problem) => (
          <TableRow key={`${problem.href}-${problem.issue}`}>
            <TableCell>{problem.area}</TableCell>
            <TableCell>{problem.issue}</TableCell>
            <TableCell><Link className="font-medium hover:underline" href={problem.href}>{problem.title}</Link></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function BonusEligibilityRowsTable({ rows }: { rows: BonusEligibilityReport["rows"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Сущность</TableHead>
          <TableHead>Название</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Статус учета</TableHead>
          <TableHead>Нарушения</TableHead>
          <TableHead>Влияет на премию</TableHead>
          <TableHead>Дата обнаружения</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyTableRow colSpan={7}>Записей нет.</EmptyTableRow>
        ) : rows.map((row) => (
          <TableRow key={`${row.entityType}-${row.href}`}>
            <TableCell>{row.entity}</TableCell>
            <TableCell><Link className="font-medium hover:underline" href={row.href}>{row.title}</Link></TableCell>
            <TableCell>{row.responsibleName}</TableCell>
            <TableCell><Badge variant={bonusVariant(row.status)}>{bonusEligibilityLabels[row.status]}</Badge></TableCell>
            <TableCell>{row.violations.length ? row.violations.join("; ") : "Нет активных нарушений"}</TableCell>
            <TableCell>{row.affectsBonus ? "Да" : "Нет"}</TableCell>
            <TableCell>{formatRussianDate(row.detectedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
