import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterSearchInput, FilterSelect, filterShortcutHref, type ActiveFilter } from "@/components/ui/filter-bar";
import { roleOptions } from "@/modules/crm/options";
import type { UserListSearchParams } from "@/modules/users/admin-queries";
import { roleLabels } from "@/lib/constants";

const statusOptions = [
  { value: "active", label: "Активные" },
  { value: "pending", label: "Ожидают" },
  { value: "deactivated", label: "Деактивированы" }
];

export function UsersFilters({ params }: { params: UserListSearchParams }) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: filterShortcutHref("/settings/users", params, { q: undefined, page: undefined }) } : null,
    params.role ? { key: "role", label: "Роль", value: roleLabels[params.role as keyof typeof roleLabels] ?? params.role, href: filterShortcutHref("/settings/users", params, { role: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: statusOptions.find((item) => item.value === params.status)?.label ?? params.status, href: filterShortcutHref("/settings/users", params, { status: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref="/settings/users">
      <FilterSearchInput name="q" placeholder="Имя или email" defaultValue={params.q} />
      <FilterSelect name="role" defaultValue={params.role} placeholder="Все роли" options={roleOptions} />
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={statusOptions} />
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Показать</Button>
        <Button asChild variant="outline"><Link href="/settings/users">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
