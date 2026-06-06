import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterSelect, FilterShortcutButtons } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { commercialProposalStatusOptions } from "@/modules/crm/options";
import type { ProposalListSearchParams } from "@/modules/proposals/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

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
