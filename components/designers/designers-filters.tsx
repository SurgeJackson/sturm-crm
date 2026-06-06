import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterCheckbox } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  designerLoyaltyOptions,
  designerPotentialOptions,
  designerRelationshipStageOptions,
  designerRoleOptions
} from "@/modules/crm/options";
import type { DesignerListSearchParams } from "@/modules/designers/queries";

type UserOption = { id: string; name: string };

export function DesignersFilters({ params, users }: { params: DesignerListSearchParams; users: UserOption[] }) {
  return (
    <FilterBar className="md:grid-cols-3 xl:grid-cols-6">
      <Input name="q" placeholder="Поиск" defaultValue={params.q ?? ""} />
      <NativeSelect name="role" defaultValue={params.role ?? ""}>
        <option value="">Все роли</option>
        {designerRoleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="relationshipStage" defaultValue={params.relationshipStage ?? ""}>
        <option value="">Все этапы</option>
        {designerRelationshipStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="potential" defaultValue={params.potential ?? ""}>
        <option value="">Любой потенциал</option>
        {designerPotentialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="loyalty" defaultValue={params.loyalty ?? ""}>
        <option value="">Любая лояльность</option>
        {designerLoyaltyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </NativeSelect>
      <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
        <option value="">Все ответственные</option>
        {users.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
      </NativeSelect>
      <FilterCheckbox name="noNextStep" defaultChecked={params.noNextStep === "1"}>
        Без следующего шага
      </FilterCheckbox>
      <FilterCheckbox name="noTouch60" defaultChecked={params.noTouch60 === "1"}>
        Без касаний 60+ дней
      </FilterCheckbox>
      <NativeSelect name="sort" defaultValue={params.sort ?? ""}>
        <option value="">Сначала новые</option>
        <option value="name">По имени</option>
        <option value="nextStepAt">По следующему шагу</option>
      </NativeSelect>
      <FilterActions className="md:col-span-3">
        <Button type="submit">Применить</Button>
        <Button asChild variant="outline"><Link href="/designers">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}
