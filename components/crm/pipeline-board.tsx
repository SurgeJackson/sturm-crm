import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PipelineColumn<T> = {
  id: string;
  title: ReactNode;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => ReactNode;
  badgeVariant?: BadgeProps["variant"];
};

export function PipelineBoard<T>({ columns }: { columns: PipelineColumn<T>[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => (
        <Card key={column.id} className="min-h-52">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-sm">
              <span>{column.title}</span>
              <Badge variant={column.badgeVariant ?? "secondary"}>{column.items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {column.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{column.emptyText}</p>
            ) : (
              column.items.map(column.renderItem)
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
