import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  FilterActions,
  FilterBar,
  FilterDateInput,
  FilterSelect,
  filterShortcutHref,
  type ActiveFilter
} from "@/components/ui/filter-bar";
import type { ReportSearchParams } from "@/modules/reports/queries";

type Option = { id: string; name: string; email?: string; role?: string };

const reportFilterLabels: Record<string, string> = {
  from: "С",
  to: "По",
  responsibleId: "Ответственный",
  stage: "Стадия",
  status: "Статус",
  source: "Источник",
  probability: "Вероятность",
  type: "Тип",
  entity: "Сущность",
  bonusStatus: "Премия",
  severity: "Серьезность",
  actionType: "Действие",
  violationCode: "Код"
};

export function ReportPeriodFilter({
  params,
  users,
  children,
  actionPath
}: {
  params: ReportSearchParams;
  users: Option[];
  children?: ReactNode;
  actionPath: string;
}) {
  const activeFilters: ActiveFilter[] = Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      key,
      label: reportFilterLabels[key] ?? key,
      value: key === "responsibleId" ? users.find((user) => user.id === value)?.name ?? value : value,
      href: filterShortcutHref(actionPath, params, { [key]: undefined })
    }));

  return (
    <FilterBar activeFilters={activeFilters} resetHref={actionPath}>
      <FilterDateInput name="from" label="Дата с" defaultValue={params.from} />
      <FilterDateInput name="to" label="Дата по" defaultValue={params.to} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </FilterSelect>
      {children}
      <FilterActions>
        <Button type="submit" variant="secondary">
          Показать
        </Button>
        <Button asChild variant="outline">
          <Link href={actionPath}>Сбросить</Link>
        </Button>
      </FilterActions>
    </FilterBar>
  );
}

export function ReportFilterSelect({
  name,
  value,
  placeholder,
  options
}: {
  name: string;
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <FilterSelect name={name} defaultValue={value} placeholder={placeholder} options={options} />
  );
}
