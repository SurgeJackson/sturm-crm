import Link from "next/link";
import type { TaskActivity } from "@/generated/prisma/client";
import { CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import type { CrmViolationView } from "@/components/crm/discipline/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { taskActionTypeLabels, taskPriorityLabels, taskRecordTypeLabels, taskStatusLabels } from "@/lib/constants";
import { formatRussianDateTime } from "@/utils/date";

type TaskRow = TaskActivity & {
  responsible: { id: string; name: string };
  client?: { id: string; name: string } | null;
  designer?: { id: string; name: string; studio?: string | null } | null;
  projectObject?: { id: string; title: string } | null;
  deal?: { id: string; title: string } | null;
  proposal?: { id: string; proposalNumber: string } | null;
  objectParticipant?: { id: string; fullName: string; objectId: string } | null;
  crmViolations?: CrmViolationView[];
};

type TaskActivityTableProps = {
  items: TaskRow[];
  emptyText: string;
  compact?: boolean;
};

function isOverdue(task: TaskRow) {
  return task.recordType === "TASK" && task.dueAt && task.dueAt < new Date() && !["DONE", "CANCELLED", "CLOSED"].includes(task.status);
}

function statusVariant(task: TaskRow) {
  if (isOverdue(task) || task.status === "OVERDUE") return "warning" as const;
  if (task.status === "DONE" || task.status === "RECORDED" || task.status === "CLOSED") return "secondary" as const;
  return "outline" as const;
}

function linkedEntity(task: TaskRow) {
  if (task.proposal) return <Link className="hover:underline" href={`/proposals/${task.proposal.id}`}>{task.proposal.proposalNumber}</Link>;
  if (task.deal) return <Link className="hover:underline" href={`/deals/${task.deal.id}`}>{task.deal.title}</Link>;
  if (task.projectObject) return <Link className="hover:underline" href={`/objects/${task.projectObject.id}`}>{task.projectObject.title}</Link>;
  if (task.designer) return <Link className="hover:underline" href={`/designers/${task.designer.id}`}>{task.designer.name}</Link>;
  if (task.client) return <Link className="hover:underline" href={`/clients/${task.client.id}`}>{task.client.name}</Link>;
  if (task.objectParticipant) return <Link className="hover:underline" href={`/objects/${task.objectParticipant.objectId}`}>{task.objectParticipant.fullName}</Link>;
  return "Нет связи";
}

export function TaskActivityTable({ items, emptyText, compact = false }: TaskActivityTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Запись</TableHead>
          <TableHead>Действие</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Срок / факт</TableHead>
          {!compact ? <TableHead>Связь</TableHead> : null}
          <TableHead>Статус</TableHead>
          <TableHead>CRM-дисциплина</TableHead>
          {!compact ? <TableHead>Приоритет</TableHead> : null}
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={compact ? 7 : 9} className="h-24 text-center text-sm text-muted-foreground">{emptyText}</TableCell>
          </TableRow>
        ) : (
          items.map((task) => (
            <TableRow key={task.id} className={isOverdue(task) ? "bg-warning/10" : undefined}>
              <TableCell>
                <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">{task.title}</Link>
                <div className="text-xs text-muted-foreground">{taskRecordTypeLabels[task.recordType]}</div>
              </TableCell>
              <TableCell>{taskActionTypeLabels[task.actionType]}</TableCell>
              <TableCell>{task.responsible.name}</TableCell>
              <TableCell className={isOverdue(task) ? "text-warning" : undefined}>{formatRussianDateTime(task.dueAt)}</TableCell>
              {!compact ? <TableCell>{linkedEntity(task)}</TableCell> : null}
              <TableCell><Badge variant={statusVariant(task)}>{taskStatusLabels[task.status]}</Badge></TableCell>
              <TableCell><CrmDisciplineBadge violations={task.crmViolations ?? []} /></TableCell>
              {!compact ? <TableCell>{taskPriorityLabels[task.priority]}</TableCell> : null}
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/tasks/${task.id}`}>Открыть</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
