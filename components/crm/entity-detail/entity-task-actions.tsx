import Link from "next/link";
import type { ComponentProps } from "react";
import { MessageSquarePlus, Plus } from "lucide-react";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TaskQuickActions({
  taskHref,
  touchHref
}: {
  taskHref: string;
  touchHref: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={taskHref}>
          <Plus className="h-4 w-4" />
          Создать задачу
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={touchHref}>
          <MessageSquarePlus className="h-4 w-4" />
          Зафиксировать касание
        </Link>
      </Button>
    </div>
  );
}

export function EntityTasksCard({
  title = "Задачи / касания",
  items,
  emptyText = "По этой сущности пока нет задач",
  taskHref,
  touchHref,
  canCreate
}: {
  title?: string;
  items: ComponentProps<typeof TaskActivityTable>["items"];
  emptyText?: string;
  taskHref: string;
  touchHref: string;
  canCreate?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{title}</CardTitle>
        {canCreate ? <TaskQuickActions taskHref={taskHref} touchHref={touchHref} /> : null}
      </CardHeader>
      <CardContent className="p-0">
        <TaskActivityTable items={items} emptyText={emptyText} />
      </CardContent>
    </Card>
  );
}
