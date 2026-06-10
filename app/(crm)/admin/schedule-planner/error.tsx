"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SchedulePlannerError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Не удалось загрузить плановый график</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Повторите загрузку. Если ошибка сохранится, проверьте параметры периода и доступность базы данных.</p>
        <Button type="button" onClick={reset}>Повторить</Button>
      </CardContent>
    </Card>
  );
}
