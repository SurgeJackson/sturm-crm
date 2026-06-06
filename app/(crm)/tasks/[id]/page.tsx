import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { AuditLogCard, EntityInfoCard, EntityPageHeader, NoticeStack, TextBlock } from "@/components/crm/detail-page";
import { Detail, DetailGrid } from "@/components/crm/detail";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuditLogs } from "@/lib/audit-log";
import { taskActionTypeLabels, taskAutoRuleLabels, taskPriorityLabels, taskRecordTypeLabels, taskStatusLabels } from "@/lib/constants";
import { cancelTaskAction } from "@/modules/tasks/actions";
import { getTaskForUser } from "@/modules/tasks/queries";
import { canCancelTask, canEditRecord } from "@/permissions";
import { formatRussianDateTime } from "@/utils/date";

type TaskPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

function entityLinks(task: Awaited<ReturnType<typeof getTaskForUser>>) {
  const links = [
    task.client ? <Link key="client" className="hover:underline" href={`/clients/${task.client.id}`}>Клиент: {task.client.name}</Link> : null,
    task.designer ? <Link key="designer" className="hover:underline" href={`/designers/${task.designer.id}`}>Дизайнер: {task.designer.name}</Link> : null,
    task.projectObject ? <Link key="object" className="hover:underline" href={`/objects/${task.projectObject.id}`}>Объект: {task.projectObject.title}</Link> : null,
    task.deal ? <Link key="deal" className="hover:underline" href={`/deals/${task.deal.id}`}>Сделка: {task.deal.title}</Link> : null,
    task.proposal ? <Link key="proposal" className="hover:underline" href={`/proposals/${task.proposal.id}`}>КП: {task.proposal.proposalNumber}</Link> : null,
    task.objectParticipant ? <Link key="participant" className="hover:underline" href={`/objects/${task.objectParticipant.objectId}`}>Участник: {task.objectParticipant.fullName}</Link> : null
  ].filter(Boolean);

  return links.length ? links : ["Нет связанной сущности"];
}

export default async function TaskPage({ params, searchParams }: TaskPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [task, auditLogs] = await Promise.all([
    getTaskForUser(id, user),
    getAuditLogs("TASK", id)
  ]);
  const cancelAction = cancelTaskAction.bind(null, id);

  return (
    <div className="space-y-6">
      <EntityPageHeader
        title={task.title}
        badges={
          <>
            <Badge variant="outline">{taskRecordTypeLabels[task.recordType]}</Badge>
            <Badge variant="outline">{taskActionTypeLabels[task.actionType]}</Badge>
            <Badge variant={task.status === "DONE" || task.status === "RECORDED" ? "secondary" : "outline"}>{taskStatusLabels[task.status]}</Badge>
          </>
        }
        editHref={`/tasks/${id}/edit`}
        canEdit={canEditRecord(user, task)}
        actions={canCancelTask(user, task) && task.status !== "CANCELLED" ? (
            <form action={cancelAction}>
              <Button type="submit" variant="destructive">
                <Ban className="h-4 w-4" />
                Отменить
              </Button>
            </form>
        ) : null}
      />

      <NoticeStack notices={[{ show: Boolean(query.saved), message: "Запись сохранена." }]} />

      <CrmDisciplinePanel
        entityType="TASK"
        entityId={task.id}
        editHref={`/tasks/${id}/edit`}
        returnTo={`/tasks/${id}`}
        violations={task.crmViolations}
        user={user}
        bonusApplies={false}
      />

      <EntityInfoCard
        title="Основное"
        footer={
          <div className="grid gap-4 md:grid-cols-2">
            <TextBlock label="Связанные сущности">
              <div className="mt-2 flex flex-col gap-1 text-sm">{entityLinks(task)}</div>
            </TextBlock>
            <TextBlock label="Описание">{task.description || "Нет описания."}</TextBlock>
            <TextBlock label="Результат">{task.result || "Результат не указан."}</TextBlock>
            <TextBlock label="Следующий шаг">{task.nextStepText ? `${task.nextStepText} — ${formatRussianDateTime(task.nextStepAt)}` : "Не задан"}</TextBlock>
          </div>
        }
      >
          <DetailGrid>
            <Detail label="Ответственный" value={task.responsible.name} />
            <Detail label="Создал" value={task.createdBy.name} />
            <Detail label="Приоритет" value={taskPriorityLabels[task.priority]} />
            <Detail label="Срок / дата факта" value={formatRussianDateTime(task.dueAt)} />
            <Detail label="Выполнено" value={formatRussianDateTime(task.completedAt)} />
            <Detail label="Автоправило" value={task.autoRule ? taskAutoRuleLabels[task.autoRule] : null} />
          </DetailGrid>
      </EntityInfoCard>

      <AuditLogCard logs={auditLogs} formatDate={formatRussianDateTime} />
    </div>
  );
}
