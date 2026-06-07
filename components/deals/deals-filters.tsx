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
import { dealProbabilityOptions, dealSourceOptions, dealStageOptions } from "@/modules/crm/options";
import type { DealListSearchParams } from "@/modules/deals/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

const sortLabels: Record<string, string> = {
  title: "По названию",
  nextActionAt: "По следующему действию",
  potentialAmount: "По сумме"
};

const shortcutLabels: Record<string, string> = {
  noNextAction: "Без следующего шага",
  overdueNextAction: "Просроченные",
  noAmount: "Без суммы",
  highProbability: "Высокая вероятность",
  lost: "Проигранные",
  active: "Активные",
  archived: "Архивные"
};

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function DealsFilters({
  params,
  users,
  clients,
  objects,
  designers
}: {
  params: DealListSearchParams;
  users: Option[];
  clients: Option[];
  objects: Array<{ id: string; title: string }>;
  designers: DesignerOption[];
}) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: filterShortcutHref("/deals", params, { q: undefined, page: undefined }) } : null,
    params.stage ? { key: "stage", label: "Стадия", value: optionLabel(dealStageOptions, params.stage), href: filterShortcutHref("/deals", params, { stage: undefined, page: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: filterShortcutHref("/deals", params, { responsibleId: undefined, page: undefined }) } : null,
    params.clientId ? { key: "clientId", label: "Клиент", value: clients.find((client) => client.id === params.clientId)?.name ?? params.clientId, href: filterShortcutHref("/deals", params, { clientId: undefined, page: undefined }) } : null,
    params.objectId ? { key: "objectId", label: "Объект", value: objects.find((object) => object.id === params.objectId)?.title ?? params.objectId, href: filterShortcutHref("/deals", params, { objectId: undefined, page: undefined }) } : null,
    params.designerId ? { key: "designerId", label: "Дизайнер", value: designers.find((designer) => designer.id === params.designerId)?.name ?? params.designerId, href: filterShortcutHref("/deals", params, { designerId: undefined, page: undefined }) } : null,
    params.source ? { key: "source", label: "Источник", value: optionLabel(dealSourceOptions, params.source), href: filterShortcutHref("/deals", params, { source: undefined, page: undefined }) } : null,
    params.probability ? { key: "probability", label: "Вероятность", value: optionLabel(dealProbabilityOptions, params.probability), href: filterShortcutHref("/deals", params, { probability: undefined, page: undefined }) } : null,
    params.sort ? { key: "sort", label: "Сортировка", value: sortLabels[params.sort] ?? params.sort, href: filterShortcutHref("/deals", params, { sort: undefined, page: undefined }) } : null,
    ...Object.entries(shortcutLabels).map(([key, label]) =>
      params[key as keyof DealListSearchParams] === "1"
        ? { key, label: "Быстрый фильтр", value: label, href: filterShortcutHref("/deals", params, { [key]: undefined, page: undefined }) }
        : null
    )
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref="/deals">
      <FilterSearchInput className="lg:col-span-2" defaultValue={params.q} placeholder="Поиск по сделке, клиенту, объекту" />
      <FilterSelect name="stage" defaultValue={params.stage} placeholder="Все стадии" options={dealStageOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
      <FilterSelect name="clientId" defaultValue={params.clientId} placeholder="Все клиенты">
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </FilterSelect>
      <FilterSelect name="objectId" defaultValue={params.objectId} placeholder="Все объекты">
        {objects.map((object) => <option key={object.id} value={object.id}>{object.title}</option>)}
      </FilterSelect>
      <FilterSelect name="designerId" defaultValue={params.designerId} placeholder="Все дизайнеры">
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
        ))}
      </FilterSelect>
      <FilterSelect name="source" defaultValue={params.source} placeholder="Все источники" options={dealSourceOptions} />
      <FilterSelect name="probability" defaultValue={params.probability} placeholder="Все вероятности" options={dealProbabilityOptions} />
      <FilterSelect name="sort" defaultValue={params.sort} placeholder="Сначала новые">
        <option value="title">По названию</option>
        <option value="nextActionAt">По следующему действию</option>
        <option value="potentialAmount">По сумме</option>
      </FilterSelect>
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/deals">Сбросить</Link></Button>
        <FilterShortcutButtons
          basePath="/deals"
          params={params}
          shortcuts={[
            { label: "Без следующего шага", patch: { noNextAction: "1", page: undefined } },
            { label: "Просроченные", patch: { overdueNextAction: "1", page: undefined } },
            { label: "Ожидание решения", patch: { stage: "WAITING_DECISION", page: undefined } },
            { label: "На согласовании", patch: { stage: "NEGOTIATION", page: undefined } },
            { label: "Без суммы", patch: { noAmount: "1", page: undefined } },
            { label: "Высокая вероятность", patch: { highProbability: "1", page: undefined } },
            { label: "Проигранные", patch: { lost: "1", page: undefined } },
            { label: "Активные", patch: { active: "1", page: undefined } },
            { label: "Архивные", patch: { archived: "1", page: undefined } }
          ]}
        />
      </FilterActions>
    </FilterBar>
  );
}
