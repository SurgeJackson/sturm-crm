import type { ObjectInterestCategory } from "@/generated/prisma/client";
import { EntityInfoCard } from "@/components/crm/detail-page";
import { Badge } from "@/components/ui/badge";
import { objectInterestCategoryLabels } from "@/lib/constants";

export function ObjectInterestCategories({
  categories
}: {
  categories: ObjectInterestCategory[];
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">Категории интереса</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <span className="text-sm text-muted-foreground">Не указаны</span>
        ) : (
          categories.map((category) => (
            <Badge key={category} variant="outline">{objectInterestCategoryLabels[category]}</Badge>
          ))
        )}
      </div>
    </div>
  );
}

export function ObjectFilesCard({ files }: { files: string[] }) {
  return (
    <EntityInfoCard title="Файлы объекта">
      <div className="space-y-2 text-sm">
        {files.length === 0 ? (
          <p className="text-muted-foreground">По объекту пока нет файлов</p>
        ) : (
          files.map((file) => (
            <div key={file} className="rounded-md border p-3">{file}</div>
          ))
        )}
      </div>
    </EntityInfoCard>
  );
}
