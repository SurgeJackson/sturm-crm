import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterSelect } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import type { ReportSearchParams } from "@/modules/reports/queries";

type Option = { id: string; name: string; email?: string; role?: string };

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
  return (
    <FilterBar>
      <Input name="from" type="date" defaultValue={params.from ?? ""} aria-label="Дата с" />
      <Input name="to" type="date" defaultValue={params.to ?? ""} aria-label="Дата по" />
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
