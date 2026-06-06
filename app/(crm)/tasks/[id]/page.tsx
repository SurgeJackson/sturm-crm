import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { TaskHeaderBadges } from "@/components/crm/detail-header-badges";
import { AuditLogCard, EntityDetailShell, TextBlock } from "@/components/crm/detail-page";
import { detailText, EntityDetailsCard } from "@/components/crm/detail";
import { Button } from "@/components/ui/button";
import { getAuditLogs } from "@/lib/audit-log";
import { taskAutoRuleLabels, taskPriorityLabels } from "@/lib/constants";
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
    <EntityDetailShell
      title={task.title}
      badges={<TaskHeaderBadges recordType={task.recordType} actionType={task.actionType} status={task.status} />}
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
      notices={[{ show: Boolean(query.saved), message: "Запись сохранена." }]}
      discipline={{
        entityType: "TASK",
        entityId: task.id,
        editHref: `/tasks/${id}/edit`,
        returnTo: `/tasks/${id}`,
        violations: task.crmViolations,
        user,
        bonusApplies: false
      }}
    >

      <EntityDetailsCard
        title="Основное"
        fields={[
          detailText("Ответственный", task.responsible.name),
          detailText("Создал", task.createdBy.name),
          detailText("Приоритет", taskPriorityLabels[task.priority]),
          detailText("Срок / дата факта", formatRussianDateTime(task.dueAt)),
          detailText("Выполнено", formatRussianDateTime(task.completedAt)),
          detailText("Автоправило", task.autoRule ? taskAutoRuleLabels[task.autoRule] : null)
        ]}
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
      />

      <AuditLogCard logs={auditLogs} formatDate={formatRussianDateTime} />
    </EntityDetailShell>
  );
}
