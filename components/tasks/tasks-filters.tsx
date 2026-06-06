import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { taskPriorityOptions, taskRecordTypeOptions, taskStatusOptions } from "@/modules/crm/options";
import type { TaskListSearchParams } from "@/modules/tasks/queries";

type UserOption = { id: string; name: string };

function currentUrl(params: TaskListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/tasks?${next.toString()}`;
}

export function TasksFilters({ params, users }: { params: TaskListSearchParams; users: UserOption[] }) {
  return (
    <FilterBar className="lg:grid-cols-4">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по названию, описанию, результату" />
      </div>
      <NativeSelect name="recordType" defaultValue={params.recordType ?? ""}>
        <option value="">Все записи</option>
        {taskRecordTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
        <option value="">Все ответственные</option>
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </NativeSelect>
      <NativeSelect name="status" defaultValue={params.status ?? ""}>
        <option value="">Все статусы</option>
        {taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="priority" defaultValue={params.priority ?? ""}>
        <option value="">Все приоритеты</option>
        {taskPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <Input name="due" type="date" defaultValue={params.due ?? ""} />
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
