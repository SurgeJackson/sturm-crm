import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterCheckbox } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { clientSourceOptions, clientStatusOptions, clientTypeOptions } from "@/modules/crm/options";
import type { ClientListSearchParams } from "@/modules/clients/queries";

type UserOption = { id: string; name: string };

export function ClientsFilters({ params, users }: { params: ClientListSearchParams; users: UserOption[] }) {
  return (
    <FilterBar className="md:grid-cols-3 xl:grid-cols-6">
      <Input name="q" placeholder="Поиск" defaultValue={params.q ?? ""} />
      <NativeSelect name="clientType" defaultValue={params.clientType ?? ""}>
        <option value="">Все типы</option>
        {clientTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="source" defaultValue={params.source ?? ""}>
        <option value="">Все источники</option>
        {clientSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="status" defaultValue={params.status ?? ""}>
        <option value="">Все статусы</option>
        {clientStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
        <option value="">Все ответственные</option>
        {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
      </NativeSelect>
      <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
        <option value="">Сначала новые</option>
        <option value="name">По названию</option>
        <option value="nextContactAt">По следующему контакту</option>
      </NativeSelect>
      <FilterCheckbox name="noNextContact" defaultChecked={params.noNextContact === "1"}>
        Без следующего контакта
      </FilterCheckbox>
      <FilterActions className="md:col-span-2 xl:col-span-5">
        <Button type="submit">Применить</Button>
        <Button asChild variant="outline"><Link href="/clients">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
