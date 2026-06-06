import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
      <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
        <option value="">Все ответственные</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </NativeSelect>
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
    <NativeSelect name={name} defaultValue={value ?? ""} aria-label={placeholder}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}
