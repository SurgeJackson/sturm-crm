import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FilterActions,
  FilterBar,
  FilterDateInput,
  FilterSearchInput,
  FilterSelect,
  filterShortcutHref,
  type ActiveFilter
} from "@/components/ui/filter-bar";
import { taskPriorityOptions, taskRecordTypeOptions, taskStatusOptions } from "@/modules/crm/options";
import type { TaskListSearchParams } from "@/modules/tasks/queries";

type UserOption = { id: string; name: string };

function currentUrl(params: TaskListSearchParams, patch: Record<string, string | undefined>) {
  return filterShortcutHref("/tasks", params, patch);
}

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function TasksFilters({ params, users }: { params: TaskListSearchParams; users: UserOption[] }) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: currentUrl(params, { q: undefined, page: undefined }) } : null,
    params.recordType ? { key: "recordType", label: "Тип", value: optionLabel(taskRecordTypeOptions, params.recordType), href: currentUrl(params, { recordType: undefined, page: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: currentUrl(params, { responsibleId: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: optionLabel(taskStatusOptions, params.status), href: currentUrl(params, { status: undefined, page: undefined }) } : null,
    params.priority ? { key: "priority", label: "Приоритет", value: optionLabel(taskPriorityOptions, params.priority), href: currentUrl(params, { priority: undefined, page: undefined }) } : null,
    params.due ? { key: "due", label: "Дата", value: params.due, href: currentUrl(params, { due: undefined, page: undefined }) } : null,
    params.today === "1" ? { key: "today", label: "Период", value: "На сегодня", href: currentUrl(params, { today: undefined, page: undefined }) } : null,
    params.overdue === "1" ? { key: "overdue", label: "Срок", value: "Просроченные", href: currentUrl(params, { overdue: undefined, page: undefined }) } : null,
    params.noResult === "1" ? { key: "noResult", label: "Результат", value: "Без результата", href: currentUrl(params, { noResult: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref="/tasks">
      <FilterSearchInput className="lg:col-span-2" defaultValue={params.q} placeholder="Поиск по названию, описанию, результату" />
      <FilterSelect name="recordType" defaultValue={params.recordType} placeholder="Все записи" options={taskRecordTypeOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={taskStatusOptions} />
      <FilterSelect name="priority" defaultValue={params.priority} placeholder="Все приоритеты" options={taskPriorityOptions} />
      <FilterDateInput name="due" label="Дата срока" defaultValue={params.due} />
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/tasks">Сбросить</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { today: "1", overdue: undefined, page: undefined })}>На сегодня</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { overdue: "1", today: undefined, page: undefined })}>Просроченные</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { noResult: "1", page: undefined })}>Без результата</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { recordType: "TASK", page: undefined })}>Только задачи</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { recordType: "TOUCH", page: undefined })}>Только касания</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
