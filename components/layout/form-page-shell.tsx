import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FormPageShell({
  title,
  description,
  cardTitle,
  children
}: {
  title: string;
  description?: string;
  cardTitle: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader><CardTitle>{cardTitle}</CardTitle></CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
