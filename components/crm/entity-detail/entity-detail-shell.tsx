import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Archive, Edit } from "lucide-react";
import { CrmDisciplinePanel } from "@/components/crm/discipline/panel";
import { PageNoticeStack, type PageNotice } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";

export function EntityPageHeader({
  title,
  badges,
  editHref,
  canEdit,
  archiveAction,
  canArchive,
  actions
}: {
  title: ReactNode;
  badges?: ReactNode;
  editHref?: string;
  canEdit?: boolean;
  archiveAction?: () => Promise<void>;
  canArchive?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {badges ? <div className="mt-2 flex flex-wrap gap-2">{badges}</div> : null}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {canEdit && editHref ? (
          <Button asChild variant="outline">
            <Link href={editHref}>
              <Edit className="h-4 w-4" />
              Редактировать
            </Link>
          </Button>
        ) : null}
        {actions}
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

export function EntityDetailShell({
  title,
  badges,
  editHref,
  canEdit,
  archiveAction,
  canArchive,
  actions,
  notices,
  discipline,
  children
}: {
  title: ReactNode;
  badges?: ReactNode;
  editHref?: string;
  canEdit?: boolean;
  archiveAction?: () => Promise<void>;
  canArchive?: boolean;
  actions?: ReactNode;
  notices?: PageNotice[];
  discipline?: ComponentProps<typeof CrmDisciplinePanel>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <EntityPageHeader
        title={title}
        badges={badges}
        editHref={editHref}
        canEdit={canEdit}
        archiveAction={archiveAction}
        canArchive={canArchive}
        actions={actions}
      />
      {notices ? <PageNoticeStack notices={notices} /> : null}
      {discipline ? <CrmDisciplinePanel {...discipline} /> : null}
      {children}
    </div>
  );
}
