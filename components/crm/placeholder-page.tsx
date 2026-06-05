import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
};

export function PlaceholderPage({ title, description, icon: Icon, actionLabel }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {actionLabel ? <Button disabled>{actionLabel}</Button> : null}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Раздел подготовлен</CardTitle>
              <CardDescription>Полный CRUD будет добавлен на следующих этапах.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Stage 1</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
