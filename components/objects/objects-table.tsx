import Link from "next/link";
import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import { Badge } from "@/components/ui/badge";
import { EmptyTableRow, EntityLinkCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { objectStageLabels, objectStatusLabels, objectTypeLabels } from "@/lib/constants";
import type { getProjectObjects } from "@/modules/objects/queries";

type ObjectItem = Awaited<ReturnType<typeof getProjectObjects>>["items"][number];

function statusVariant(status: keyof typeof objectStatusLabels) {
  if (status === "LOST" || status === "ARCHIVED") return "warning" as const;
  if (status === "FROZEN") return "warning" as const;
  return "secondary" as const;
}

export function ObjectsTable({ objects }: { objects: ObjectItem[] }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>Объект</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>CRM-дисциплина</TableHead>
          <TableHead>Учет в премии</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={9}>Объекты не найдены.</EmptyTableRow>
        ) : (
          objects.map((object) => (
            <TableRow key={object.id}>
              <EntityLinkCell
                href={`/objects/${object.id}`}
                title={object.title}
                description={[object.city, object.address].filter(Boolean).join(", ")}
              />
              <TableCell>{objectTypeLabels[object.objectType]}</TableCell>
              <TableCell><Link className="hover:underline" href={`/clients/${object.client.id}`}>{object.client.name}</Link></TableCell>
              <TableCell>
                {object.designer ? (
                  <Link className="hover:underline" href={`/designers/${object.designer.id}`}>{object.designer.name}</Link>
                ) : (
                  <span className="text-muted-foreground">Не выбран</span>
                )}
              </TableCell>
              <TableCell>{object.responsible.name}</TableCell>
              <TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell>
              <TableCell><Badge variant={statusVariant(object.status)}>{objectStatusLabels[object.status]}</Badge></TableCell>
              <TableCell><CrmDisciplineBadge violations={object.crmViolations} /></TableCell>
              <TableCell><BonusEligibilityBadge violations={object.crmViolations} /></TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
