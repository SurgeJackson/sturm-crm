import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FilterActions,
  FilterBar,
  FilterSearchInput,
  FilterSelect,
  FilterShortcutButtons,
  filterShortcutHref,
  type ActiveFilter
} from "@/components/ui/filter-bar";
import { objectStageOptions, objectStatusOptions, objectTypeOptions } from "@/modules/crm/options";
import type { ObjectListSearchParams } from "@/modules/objects/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

const sortLabels: Record<string, string> = {
  title: "По названию",
  implementationStartAt: "По сроку реализации"
};

const shortcutLabels: Record<string, string> = {
  noDesigner: "Без дизайнера",
  noParticipants: "Без участников",
  noTasks: "Без задач",
  frozen: "Замороженные",
  lost: "Потерянные",
  archived: "Архивные"
};

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ObjectsFilters({
  params,
  users,
  clients,
  designers
}: {
  params: ObjectListSearchParams;
  users: Option[];
  clients: Option[];
  designers: DesignerOption[];
}) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: filterShortcutHref("/objects", params, { q: undefined, page: undefined }) } : null,
    params.objectType ? { key: "objectType", label: "Тип", value: optionLabel(objectTypeOptions, params.objectType), href: filterShortcutHref("/objects", params, { objectType: undefined, page: undefined }) } : null,
    params.stage ? { key: "stage", label: "Стадия", value: optionLabel(objectStageOptions, params.stage), href: filterShortcutHref("/objects", params, { stage: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: optionLabel(objectStatusOptions, params.status), href: filterShortcutHref("/objects", params, { status: undefined, page: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: filterShortcutHref("/objects", params, { responsibleId: undefined, page: undefined }) } : null,
    params.clientId ? { key: "clientId", label: "Клиент", value: clients.find((client) => client.id === params.clientId)?.name ?? params.clientId, href: filterShortcutHref("/objects", params, { clientId: undefined, page: undefined }) } : null,
    params.designerId ? { key: "designerId", label: "Дизайнер", value: designers.find((designer) => designer.id === params.designerId)?.name ?? params.designerId, href: filterShortcutHref("/objects", params, { designerId: undefined, page: undefined }) } : null,
    params.sort ? { key: "sort", label: "Сортировка", value: sortLabels[params.sort] ?? params.sort, href: filterShortcutHref("/objects", params, { sort: undefined, page: undefined }) } : null,
    ...Object.entries(shortcutLabels).map(([key, label]) =>
      params[key as keyof ObjectListSearchParams] === "1"
        ? { key, label: "Быстрый фильтр", value: label, href: filterShortcutHref("/objects", params, { [key]: undefined, page: undefined }) }
        : null
    )
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref="/objects">
      <FilterSearchInput className="lg:col-span-2" defaultValue={params.q} placeholder="Поиск по названию, адресу, городу" />
      <FilterSelect name="objectType" defaultValue={params.objectType} placeholder="Все типы" options={objectTypeOptions} />
      <FilterSelect name="stage" defaultValue={params.stage} placeholder="Все стадии" options={objectStageOptions} />
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={objectStatusOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
      <FilterSelect name="clientId" defaultValue={params.clientId} placeholder="Все клиенты">
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </FilterSelect>
      <FilterSelect name="designerId" defaultValue={params.designerId} placeholder="Все дизайнеры">
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
        ))}
      </FilterSelect>
      <FilterSelect name="sort" defaultValue={params.sort} placeholder="Сначала новые">
        <option value="title">По названию</option>
        <option value="implementationStartAt">По сроку реализации</option>
      </FilterSelect>
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/objects">Сбросить</Link></Button>
        <FilterShortcutButtons
          basePath="/objects"
          params={params}
          shortcuts={[
            { label: "Без дизайнера", patch: { noDesigner: "1", page: undefined } },
            { label: "Без участников", patch: { noParticipants: "1", page: undefined } },
            { label: "Без задач", patch: { noTasks: "1", page: undefined } },
            { label: "В расчете", patch: { stage: "CALCULATION", page: undefined } },
            { label: "В согласовании", patch: { stage: "APPROVAL", page: undefined } },
            { label: "Замороженные", patch: { frozen: "1", page: undefined } },
            { label: "Потерянные", patch: { lost: "1", page: undefined } }
            ,{ label: "Архивные", patch: { archived: "1", page: undefined } }
          ]}
        />
      </FilterActions>
    </FilterBar>
  );
}
