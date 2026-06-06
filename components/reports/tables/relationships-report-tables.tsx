import {
  BadgeCell,
  CountCell,
  EntityLinkCell,
  EmptyTableRow,
  TableCard
} from "@/components/ui/data-table";
import { designerPotentialVariant, objectStatusVariant } from "@/components/crm/status-variants";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels
} from "@/lib/constants";
import type { getDesignersReport, getObjectsReport } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type DesignersReport = Awaited<ReturnType<typeof getDesignersReport>>;
type ObjectsReport = Awaited<ReturnType<typeof getObjectsReport>>;

export function DesignersReportTable({ designers }: { designers: DesignersReport["designers"] }) {
  return (
    <TableCard title="Дизайнеры">
      <TableHeader>
        <TableRow>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Этап</TableHead>
          <TableHead>Потенциал</TableHead>
          <TableHead>Лояльность</TableHead>
          <TableHead>Объекты</TableHead>
          <TableHead>КП</TableHead>
          <TableHead>Последнее касание</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {designers.length === 0 ? (
          <EmptyTableRow colSpan={7}>Дизайнеры не найдены.</EmptyTableRow>
        ) : designers.map((designer) => (
          <TableRow key={designer.id}>
            <EntityLinkCell
              href={`/designers/${designer.id}`}
              title={designer.name}
              description={designer.studio}
            />
            <BadgeCell>{designerRelationshipStageLabels[designer.relationshipStage]}</BadgeCell>
            <BadgeCell variant={designerPotentialVariant(designer.potential)}>
              {designerPotentialLabels[designer.potential]}
            </BadgeCell>
            <TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell>
            <CountCell value={designer.projectObjects.length} />
            <CountCell value={designer.proposals.length} />
            <TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ObjectsReportTable({ objects }: { objects: ObjectsReport["objects"] }) {
  return (
    <TableCard title="Объекты">
      <TableHeader>
        <TableRow>
          <TableHead>Объект</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Задачи</TableHead>
          <TableHead>Участники</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={8}>Объекты не найдены.</EmptyTableRow>
        ) : objects.map((object) => (
          <TableRow key={object.id}>
            <EntityLinkCell href={`/objects/${object.id}`} title={object.title} />
            <TableCell>{objectTypeLabels[object.objectType]}</TableCell>
            <BadgeCell>{objectStageLabels[object.stage]}</BadgeCell>
            <BadgeCell variant={objectStatusVariant(object.status)}>{objectStatusLabels[object.status]}</BadgeCell>
            <TableCell>{object.client.name}</TableCell>
            <TableCell>{object.designer?.name ?? "Нет"}</TableCell>
            <CountCell value={object.tasks.length} />
            <CountCell value={object.participants.length} />
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
