import { FormActions } from "@/components/crm/form-actions";
import { FormSection, SelectField } from "@/components/crm/form-fields";
import { CompactMetricCard } from "@/components/crm/summary-card";
import { InlineNotice } from "@/components/ui/bordered-list-item";
import { handoverUserAction } from "@/modules/users/handover-actions";
import type { getUserHandover } from "@/modules/users/handover";

type Handover = NonNullable<Awaited<ReturnType<typeof getUserHandover>>>;

export function UserHandoverForm({ handover }: { handover: Handover }) {
  const action = handoverUserAction.bind(null, handover.user.id);
  const total = Object.values(handover.counts).reduce((sum, value) => sum + value, 0);
  const hasTargets = handover.users.length > 0;

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <CompactMetricCard title="Клиенты" value={handover.counts.clients} />
        <CompactMetricCard title="Дизайнеры" value={handover.counts.designers} />
        <CompactMetricCard title="Объекты" value={handover.counts.objects} />
        <CompactMetricCard title="Сделки" value={handover.counts.deals} />
        <CompactMetricCard title="КП" value={handover.counts.proposals} />
        <CompactMetricCard title="Задачи / касания" value={handover.counts.tasks} />
      </div>
      <FormSection title="Новый ответственный">
        {hasTargets ? (
          <SelectField
            name="targetUserId"
            label="Передать дела"
            options={handover.users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` }))}
            required
          />
        ) : (
          <InlineNotice tone="destructive">Нет активных пользователей, которым можно передать дела.</InlineNotice>
        )}
      </FormSection>
      {hasTargets ? <FormActions isPending={false} submitLabel={`Передать ${total} записей`} cancelHref={`/settings/users/${handover.user.id}`} /> : null}
    </form>
  );
}
