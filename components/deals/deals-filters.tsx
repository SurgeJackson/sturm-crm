import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterSelect, FilterShortcutButtons } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { dealProbabilityOptions, dealSourceOptions, dealStageOptions } from "@/modules/crm/options";
import type { DealListSearchParams } from "@/modules/deals/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

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
  return (
    <FilterBar className="lg:grid-cols-4">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по сделке, клиенту, объекту" />
      </div>
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
            { label: "Активные", patch: { active: "1", page: undefined } }
          ]}
        />
      </FilterActions>
    </FilterBar>
  );
}
