import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect, filterShortcutHref, type ActiveFilter } from "@/components/ui/filter-bar";
import { designerBonusAccrualStatusOptions, designerBonusPayoutStatusOptions } from "@/modules/crm/options";
import type { BonusListSearchParams } from "@/modules/designer-bonuses/queries";
import { designerBonusAccrualStatusLabels, designerBonusPayoutStatusLabels } from "@/lib/constants";

type Option = { id: string; name?: string; title?: string };

export function BonusFilters({
  params,
  designers,
  deals,
  objects,
  basePath,
  type
}: {
  params: BonusListSearchParams;
  designers: Option[];
  deals?: Option[];
  objects?: Option[];
  basePath: string;
  type: "accruals" | "payouts" | "report";
}) {
  const activeFilters: ActiveFilter[] = [
    params.designerId ? { key: "designerId", label: "Дизайнер", value: designers.find((item) => item.id === params.designerId)?.name ?? params.designerId, href: filterShortcutHref(basePath, params, { designerId: undefined, page: undefined }) } : null,
    params.dealId ? { key: "dealId", label: "Сделка", value: deals?.find((item) => item.id === params.dealId)?.title ?? params.dealId, href: filterShortcutHref(basePath, params, { dealId: undefined, page: undefined }) } : null,
    params.objectId ? { key: "objectId", label: "Объект", value: objects?.find((item) => item.id === params.objectId)?.title ?? params.objectId, href: filterShortcutHref(basePath, params, { objectId: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: type === "payouts" ? designerBonusPayoutStatusLabels[params.status as keyof typeof designerBonusPayoutStatusLabels] ?? params.status : designerBonusAccrualStatusLabels[params.status as keyof typeof designerBonusAccrualStatusLabels] ?? params.status, href: filterShortcutHref(basePath, params, { status: undefined, page: undefined }) } : null,
    params.from ? { key: "from", label: "С", value: params.from, href: filterShortcutHref(basePath, params, { from: undefined, page: undefined }) } : null,
    params.to ? { key: "to", label: "По", value: params.to, href: filterShortcutHref(basePath, params, { to: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref={basePath}>
      <FilterSelect name="designerId" defaultValue={params.designerId} placeholder="Все дизайнеры">
        {designers.map((designer) => <option key={designer.id} value={designer.id}>{designer.name}</option>)}
      </FilterSelect>
      {type !== "payouts" ? (
        <>
          <FilterSelect name="dealId" defaultValue={params.dealId} placeholder="Все сделки">
            {deals?.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
          </FilterSelect>
          <FilterSelect name="objectId" defaultValue={params.objectId} placeholder="Все объекты">
            {objects?.map((object) => <option key={object.id} value={object.id}>{object.title}</option>)}
          </FilterSelect>
        </>
      ) : null}
      {type === "accruals" ? <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={designerBonusAccrualStatusOptions} /> : null}
      {type === "payouts" ? <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={designerBonusPayoutStatusOptions} /> : null}
      <FilterDateInput name="from" label="Дата с" defaultValue={params.from} />
      <FilterDateInput name="to" label="Дата по" defaultValue={params.to} />
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Показать</Button>
        <Button asChild variant="outline"><Link href={basePath}>Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
