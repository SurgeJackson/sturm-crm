import { InlineNotice } from "@/components/ui/bordered-list-item";

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
        <InlineNotice
          key={notice.message}
          tone={notice.tone === "destructive" ? "destructive" : "primary"}
        >
          {notice.message}
        </InlineNotice>
      ))}
    </>
  );
}
