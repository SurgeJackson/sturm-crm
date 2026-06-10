"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimesheetError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Не удалось загрузить табель</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Повторите загрузку. Если ошибка сохранится, проверьте фильтры периода и доступность базы данных.</p>
        <Button type="button" onClick={reset}>Повторить</Button>
      </CardContent>
    </Card>
  );
}
