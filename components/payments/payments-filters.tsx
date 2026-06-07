import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect, filterShortcutHref, type ActiveFilter } from "@/components/ui/filter-bar";
import { paymentStatusOptions, paymentTypeOptions } from "@/modules/crm/options";
import type { PaymentListSearchParams } from "@/modules/payments/queries";
import { paymentStatusLabels, paymentTypeLabels } from "@/lib/constants";

type Option = { id: string; name?: string; title?: string };

export function PaymentsFilters({
  params,
  deals,
  designers,
  clients
}: {
  params: PaymentListSearchParams;
  deals: Option[];
  designers: Option[];
  clients: Option[];
}) {
  const activeFilters: ActiveFilter[] = [
    params.dealId ? { key: "dealId", label: "Сделка", value: deals.find((deal) => deal.id === params.dealId)?.title ?? params.dealId, href: filterShortcutHref("/payments", params, { dealId: undefined, page: undefined }) } : null,
    params.designerId ? { key: "designerId", label: "Дизайнер", value: designers.find((designer) => designer.id === params.designerId)?.name ?? params.designerId, href: filterShortcutHref("/payments", params, { designerId: undefined, page: undefined }) } : null,
    params.clientId ? { key: "clientId", label: "Клиент", value: clients.find((client) => client.id === params.clientId)?.name ?? params.clientId, href: filterShortcutHref("/payments", params, { clientId: undefined, page: undefined }) } : null,
    params.status ? { key: "status", label: "Статус", value: paymentStatusLabels[params.status as keyof typeof paymentStatusLabels] ?? params.status, href: filterShortcutHref("/payments", params, { status: undefined, page: undefined }) } : null,
    params.paymentType ? { key: "paymentType", label: "Тип", value: paymentTypeLabels[params.paymentType as keyof typeof paymentTypeLabels] ?? params.paymentType, href: filterShortcutHref("/payments", params, { paymentType: undefined, page: undefined }) } : null,
    params.from ? { key: "from", label: "С", value: params.from, href: filterShortcutHref("/payments", params, { from: undefined, page: undefined }) } : null,
    params.to ? { key: "to", label: "По", value: params.to, href: filterShortcutHref("/payments", params, { to: undefined, page: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="lg:grid-cols-4" activeFilters={activeFilters} resetHref="/payments">
      <FilterSelect name="dealId" defaultValue={params.dealId} placeholder="Все сделки">
        {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
      </FilterSelect>
      <FilterSelect name="designerId" defaultValue={params.designerId} placeholder="Все дизайнеры">
        {designers.map((designer) => <option key={designer.id} value={designer.id}>{designer.name}</option>)}
      </FilterSelect>
      <FilterSelect name="clientId" defaultValue={params.clientId} placeholder="Все клиенты">
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </FilterSelect>
      <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы" options={paymentStatusOptions} />
      <FilterSelect name="paymentType" defaultValue={params.paymentType} placeholder="Все типы оплат" options={paymentTypeOptions} />
      <FilterDateInput name="from" label="Дата с" defaultValue={params.from} />
      <FilterDateInput name="to" label="Дата по" defaultValue={params.to} />
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Показать</Button>
        <Button asChild variant="outline"><Link href="/payments">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
