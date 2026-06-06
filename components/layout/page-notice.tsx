import { cn } from "@/lib/utils";

export type PageNotice = {
  show: boolean;
  tone?: "success" | "destructive";
  message: string;
};

export function PageNoticeStack({ notices }: { notices: PageNotice[] }) {
  const visibleNotices = notices.filter((notice) => notice.show);

  if (visibleNotices.length === 0) return null;

  return (
    <>
      {visibleNotices.map((notice) => (
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
