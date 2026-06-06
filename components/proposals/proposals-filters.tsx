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
import { commercialProposalStatusOptions } from "@/modules/crm/options";
import type { ProposalListSearchParams } from "@/modules/proposals/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

const sortLabels: Record<string, string> = {
  proposalNumber: "По номеру",
  amount: "По сумме",
  nextTouchAt: "По follow-up"
};

const shortcutLabels: Record<string, string> = {
  noFile: "Без файла",
  noFollowUp: "Без follow-up",
  overdueFollowUp: "Просроченный follow-up",
  thinking7: "Думает 7+ дней",
  internalReview: "На проверке",
  needsRecalculation: "Требуется пересчет",
  accepted: "Принятые",
  declined: "Отклоненные"
};

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function ProposalsFilters({
  params,
  users,
  clients,
  objects,
  deals,
  designers
}: {
  params: ProposalListSearchParams;
  users: Option[];
  clients: Option[];
  objects: Array<{ id: string; title: string }>;
  deals: Array<{ id: string; title: string }>;
  designers: DesignerOption[];
}) {
  const activeFilters: ActiveFilter[] = [
    params.q ? { key: "q", label: "Поиск", value: params.q, href: filterShortcutHref("/proposals", params, { q: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: optionLabel(commercialProposalStatusOptions, params.status), href: filterShortcutHref("/proposals", params, { status: undefined, page: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: filterShortcutHref("/proposals", params, { responsibleId: undefined, page: undefined }) } : null,
    params.clientId ? { key: "clientId", label: "Клиент", value: clients.find((client) => client.id === params.clientId)?.name ?? params.clientId, href: filterShortcutHref("/proposals", params, { clientId: undefined, page: undefined }) } : null,
    params.objectId ? { key: "objectId", label: "Объект", value: objects.find((object) => object.id === params.objectId)?.title ?? params.objectId, href: filterShortcutHref("/proposals", params, { objectId: undefined, page: undefined }) } : null,
    params.dealId ? { key: "dealId", label: "Сделка", value: deals.find((deal) => deal.id === params.dealId)?.title ?? params.dealId, href: filterShortcutHref("/proposals", params, { dealId: undefined, page: undefined }) } : null,
    params.designerId ? { key: "designerId", label: "Дизайнер", value: designers.find((designer) => designer.id === params.designerId)?.name ?? params.designerId, href: filterShortcutHref("/proposals", params, { designerId: undefined, page: undefined }) } : null,
    params.sort ? { key: "sort", label: "Сортировка", value: sortLabels[params.sort] ?? params.sort, href: filterShortcutHref("/proposals", params, { sort: undefined, page: undefined }) } : null,
    ...Object.entries(shortcutLabels).map(([key, label]) =>
      params[key as keyof ProposalListSearchParams] === "1"
        ? { key, label: "Быстрый фильтр", value: label, href: filterShortcutHref("/proposals", params, { [key]: undefined, page: undefined }) }
        : null
    )
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref="/proposals">
      <FilterSearchInput className="lg:col-span-2" defaultValue={params.q} placeholder="Поиск по номеру, клиенту, объекту, сделке" />
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={commercialProposalStatusOptions} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
      <FilterSelect name="clientId" defaultValue={params.clientId} placeholder="Все клиенты">
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </FilterSelect>
      <FilterSelect name="objectId" defaultValue={params.objectId} placeholder="Все объекты">
        {objects.map((object) => <option key={object.id} value={object.id}>{object.title}</option>)}
      </FilterSelect>
      <FilterSelect name="dealId" defaultValue={params.dealId} placeholder="Все сделки">
        {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
      </FilterSelect>
      <FilterSelect name="designerId" defaultValue={params.designerId} placeholder="Все дизайнеры">
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
        ))}
      </FilterSelect>
      <FilterSelect name="sort" defaultValue={params.sort} placeholder="Сначала новые">
        <option value="proposalNumber">По номеру</option>
        <option value="amount">По сумме</option>
        <option value="nextTouchAt">По follow-up</option>
      </FilterSelect>
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/proposals">Сбросить</Link></Button>
        <FilterShortcutButtons
          basePath="/proposals"
          params={params}
          shortcuts={[
            { label: "Без файла", patch: { noFile: "1", page: undefined } },
            { label: "Без follow-up", patch: { noFollowUp: "1", page: undefined } },
            { label: "Просроченный follow-up", patch: { overdueFollowUp: "1", page: undefined } },
            { label: "Думает 7+ дней", patch: { thinking7: "1", page: undefined } },
            { label: "На проверке", patch: { internalReview: "1", page: undefined } },
            { label: "Требуется пересчет", patch: { needsRecalculation: "1", page: undefined } },
            { label: "Принятые", patch: { accepted: "1", page: undefined } },
            { label: "Отклоненные", patch: { declined: "1", page: undefined } }
          ]}
        />
      </FilterActions>
    </FilterBar>
  );
}
