import { Card, CardContent } from "@/components/ui/card";

export default function TimesheetLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-md border bg-muted/40" />)}
      </div>
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          <div className="grid gap-2 md:grid-cols-8">
            {Array.from({ length: 32 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-md bg-muted" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
