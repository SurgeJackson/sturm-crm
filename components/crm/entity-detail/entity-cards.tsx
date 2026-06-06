import type { ReactNode } from "react";
import { TimelineListItem } from "@/components/ui/bordered-list-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditLog = {
  id: string;
  action: string;
  createdAt: Date;
};

export function TextBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{children}</div>
    </div>
  );
}

export function EntityInfoCard({
  title,
  children,
  footer
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {children}
        {footer ? <div className="mt-6">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

export function ActionPromptCard({
  message,
  action
}: {
  message: ReactNode;
  action: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">{message}</div>
        {action}
      </CardContent>
    </Card>
  );
}

export function AuditLogCard({
  logs,
  formatDate
}: {
  logs: AuditLog[];
  formatDate: (date: Date) => string;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>История изменений</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">История пока пустая.</p>
        ) : (
          logs.map((log) => (
            <TimelineListItem key={log.id} title={log.action} meta={formatDate(log.createdAt)} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
