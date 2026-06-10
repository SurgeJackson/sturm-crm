import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulePlannerLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <Card>
        <CardHeader><CardTitle>Период планирования</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1.5fr)_minmax(140px,0.7fr)_minmax(120px,0.6fr)_auto]">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-8 w-72 max-w-full animate-pulse rounded bg-muted" />
          <div className="grid gap-2 md:grid-cols-6">
            {Array.from({ length: 18 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
