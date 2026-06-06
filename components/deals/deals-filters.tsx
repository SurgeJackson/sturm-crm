import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { dealProbabilityOptions, dealSourceOptions, dealStageOptions } from "@/modules/crm/options";
import type { DealListSearchParams } from "@/modules/deals/queries";

type Option = { id: string; name: string };
type DesignerOption = { id: string; name: string; studio: string | null };

function currentUrl(params: DealListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/deals?${next.toString()}`;
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
  return (
    <FilterBar className="lg:grid-cols-4">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по сделке, клиенту, объекту" />
      </div>
      <NativeSelect name="stage" defaultValue={params.stage ?? ""}>
        <option value="">Все стадии</option>
        {dealStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
      <NativeSelect name="designerId" defaultValue={params.designerId ?? ""}>
        <option value="">Все дизайнеры</option>
        {designers.map((designer) => (
          <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
        ))}
      </NativeSelect>
      <NativeSelect name="source" defaultValue={params.source ?? ""}>
        <option value="">Все источники</option>
        {dealSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="probability" defaultValue={params.probability ?? ""}>
        <option value="">Все вероятности</option>
        {dealProbabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
        <option value="">Сначала новые</option>
        <option value="title">По названию</option>
        <option value="nextActionAt">По следующему действию</option>
        <option value="potentialAmount">По сумме</option>
      </NativeSelect>
      <FilterActions className="lg:col-span-4">
        <Button type="submit" variant="secondary">Применить</Button>
        <Button asChild variant="outline"><Link href="/deals">Сбросить</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { noNextAction: "1", page: undefined })}>Без следующего шага</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { overdueNextAction: "1", page: undefined })}>Просроченные</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { stage: "WAITING_DECISION", page: undefined })}>Ожидание решения</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { stage: "NEGOTIATION", page: undefined })}>На согласовании</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { noAmount: "1", page: undefined })}>Без суммы</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { highProbability: "1", page: undefined })}>Высокая вероятность</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { lost: "1", page: undefined })}>Проигранные</Link></Button>
        <Button asChild variant="outline"><Link href={currentUrl(params, { active: "1", page: undefined })}>Активные</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
