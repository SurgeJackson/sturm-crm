import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FilterActions,
  FilterBar,
  FilterCheckbox,
  FilterSearchInput,
  FilterSelect,
  filterShortcutHref,
  type ActiveFilter
} from "@/components/ui/filter-bar";
import { clientSourceOptions, clientStatusOptions, clientTypeOptions } from "@/modules/crm/options";
import type { ClientListSearchParams } from "@/modules/clients/queries";

type UserOption = { id: string; name: string };

const sortLabels: Record<string, string> = {
  name: "По названию",
  nextContactAt: "По следующему контакту"
};

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ClientsFilters({ params, users }: { params: ClientListSearchParams; users: UserOption[] }) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: filterShortcutHref("/clients", params, { q: undefined, page: undefined }) } : null,
    params.clientType ? { key: "clientType", label: "Тип", value: optionLabel(clientTypeOptions, params.clientType), href: filterShortcutHref("/clients", params, { clientType: undefined, page: undefined }) } : null,
    params.source ? { key: "source", label: "Источник", value: optionLabel(clientSourceOptions, params.source), href: filterShortcutHref("/clients", params, { source: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: optionLabel(clientStatusOptions, params.status), href: filterShortcutHref("/clients", params, { status: undefined, page: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: filterShortcutHref("/clients", params, { responsibleId: undefined, page: undefined }) } : null,
    params.sort ? { key: "sort", label: "Сортировка", value: sortLabels[params.sort] ?? params.sort, href: filterShortcutHref("/clients", params, { sort: undefined, page: undefined }) } : null,
    params.noNextContact === "1" ? { key: "noNextContact", label: "Контакт", value: "Без следующего контакта", href: filterShortcutHref("/clients", params, { noNextContact: undefined, page: undefined }) } : null,
    params.archived === "1" ? { key: "archived", label: "Архив", value: "Архивные", href: filterShortcutHref("/clients", params, { archived: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="md:grid-cols-3 xl:grid-cols-6" activeFilters={activeFilters} resetHref="/clients">
      <FilterSearchInput defaultValue={params.q} />
      <FilterSelect name="clientType" defaultValue={params.clientType} placeholder="Все типы" options={clientTypeOptions} />
      <FilterSelect name="source" defaultValue={params.source} placeholder="Все источники" options={clientSourceOptions} />
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={clientStatusOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
      </FilterSelect>
      <FilterSelect name="sort" defaultValue={params.sort} placeholder="Сначала новые">
        <option value="name">По названию</option>
        <option value="nextContactAt">По следующему контакту</option>
      </FilterSelect>
      <FilterCheckbox name="noNextContact" defaultChecked={params.noNextContact === "1"}>
        Без следующего контакта
      </FilterCheckbox>
      <FilterCheckbox name="archived" defaultChecked={params.archived === "1"}>Архивные</FilterCheckbox>
      <FilterActions className="md:col-span-2 xl:col-span-5">
        <Button type="submit">Применить</Button>
        <Button asChild variant="outline"><Link href="/clients">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
