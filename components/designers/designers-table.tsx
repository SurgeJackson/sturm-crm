import { CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import { designerPotentialVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import { DateCell, EmptyTableRow, EntityLinkCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  designerRoleLabels
} from "@/lib/constants";
import type { getDesigners } from "@/modules/designers/queries";
import { formatRussianDate } from "@/utils/date";

type DesignerItem = Awaited<ReturnType<typeof getDesigners>>["items"][number];

function isOverdue(date?: Date | null) {
  return Boolean(date && new Date(date).getTime() < Date.now());
}

export function DesignersTable({ designers }: { designers: DesignerItem[] }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Этап</TableHead>
          <TableHead>Потенциал</TableHead>
          <TableHead>Лояльность</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующий шаг</TableHead>
          <TableHead>CRM-дисциплина</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {designers.length === 0 ? (
          <EmptyTableRow colSpan={8}>Дизайнеры не найдены.</EmptyTableRow>
        ) : (
          designers.map((designer) => (
            <TableRow key={designer.id}>
              <EntityLinkCell href={`/designers/${designer.id}`} title={designer.name} description={designer.studio ?? designer.city ?? "Нет студии"} />
              <TableCell>{designerRoleLabels[designer.role]}</TableCell>
              <TableCell><Badge variant="secondary">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge></TableCell>
              <TableCell><Badge variant={designerPotentialVariant(designer.potential)}>{designerPotentialLabels[designer.potential]}</Badge></TableCell>
              <TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell>
              <TableCell>{designer.responsible.name}</TableCell>
              <DateCell warning={isOverdue(designer.nextStepAt)} muted={designer.nextStepText ?? "Не указан"}>
                {formatRussianDate(designer.nextStepAt)}
              </DateCell>
              <TableCell><CrmDisciplineBadge violations={designer.crmViolations} /></TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
