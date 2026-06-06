import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { commercialProposalStatusOptions } from "@/modules/crm/options";
import type { ProposalListSearchParams } from "@/modules/proposals/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

function currentUrl(params: ProposalListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/proposals?${next.toString()}`;
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
  return (
    <FilterBar className="lg:grid-cols-4">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по номеру, клиенту, объекту, сделке" />
      </div>
      <NativeSelect name="status" defaultValue={params.status ?? ""}>
        <option value="">Все статусы</option>
        {commercialProposalStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
        <option value="">Все ответственные</option>
        {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </NativeSelect>
      <NativeSelect name="clientId" defaultValue={params.clientId ?? ""}>
        <option value="">Все клиенты</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </NativeSelect>
      <NativeSelect name="objectId" defaultValue={params.objectId ?? ""}>
        <option value="">Все объекты</option>
        {objects.map((object) => <option key={object.id} value={object.id}>{object.title}</option>)}
      </NativeSelect>
      <NativeSelect name="dealId" defaultValue={params.dealId ?? ""}>
        <option value="">Все сделки</option>
        {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}
      </NativeSelect>
      <NativeSelect name="designerId" defaultValue={params.designerId ?? ""}>
        <option value="">Все дизайнеры</option>
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
        ))}
      </NativeSelect>
      <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
        <option value="">Сначала новые</option>
        <option value="proposalNumber">По номеру</option>
        <option value="amount">По сумме</option>
        <option value="nextTouchAt">По follow-up</option>
      </NativeSelect>
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/proposals">Сбросить</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { noFile: "1", page: undefined })}>Без файла</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { noFollowUp: "1", page: undefined })}>Без follow-up</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { overdueFollowUp: "1", page: undefined })}>Просроченный follow-up</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { thinking7: "1", page: undefined })}>Думает 7+ дней</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { internalReview: "1", page: undefined })}>На проверке</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { needsRecalculation: "1", page: undefined })}>Требуется пересчет</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { accepted: "1", page: undefined })}>Принятые</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { declined: "1", page: undefined })}>Отклоненные</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
