import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, Edit, MessageSquarePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Notice = {
  show: boolean;
  tone?: "success" | "destructive";
  message: string;
};

type AuditLog = {
  id: string;
  action: string;
  createdAt: Date;
};

export function EntityPageHeader({
  title,
  badges,
  editHref,
  canEdit,
  archiveAction,
  canArchive,
  extraActions
}: {
  title: ReactNode;
  badges?: ReactNode;
  editHref?: string;
  canEdit?: boolean;
  archiveAction?: () => Promise<void>;
  canArchive?: boolean;
  extraActions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {badges ? <div className="mt-2 flex flex-wrap gap-2">{badges}</div> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit && editHref ? (
          <Button asChild variant="outline">
            <Link href={editHref}>
              <Edit className="h-4 w-4" />
              Редактировать
            </Link>
          </Button>
        ) : null}
        {extraActions}
        {canArchive && archiveAction ? (
          <form action={archiveAction}>
            <Button type="submit" variant="destructive">
              <Archive className="h-4 w-4" />
              Архивировать
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function NoticeStack({ notices }: { notices: Notice[] }) {
  return (
    <>
      {notices.filter((notice) => notice.show).map((notice) => (
        <div
          key={notice.message}
          className={cn(
            "rounded-md border p-3 text-sm",
            notice.tone === "destructive"
              ? "border-destructive text-destructive"
              : "border-primary text-primary"
          )}
        >
          {notice.message}
        </div>
      ))}
    </>
  );
}

export function TextBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{children}</div>
    </div>
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
            <div key={log.id} className="rounded-md border p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-medium">{log.action}</span>
                <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

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
