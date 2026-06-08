"use client";

import { useActionState, useEffect, useState } from "react";
import type { TimeEventStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createAdjustmentRequestAction, type TimeClockActionState } from "@/modules/time-clock/actions";
import { employeeDeviceStatusLabels, timeEventStatusLabels, timeEventTypeLabels, timesheetDayStatusLabels } from "@/lib/constants";
import { getBrowserDeviceName, getOrCreateBrowserDeviceId } from "@/components/time-clock/device";

type MyDayData = {
  date: string;
  shift?: {
    startsAt: string | Date;
    endsAt: string | Date;
    location: { name: string; address: string };
  } | null;
  timesheetDay?: { status: string; workedMinutes: number; hasPendingEvents: boolean } | null;
  lastEvent?: { type: string; status: TimeEventStatus; occurredAt: string | Date } | null;
  nextSuggestedAction: "check_in" | "check_out" | "none";
  employeeDeviceStatus: string;
};

export function EmployeeTimeClock({ initialDay }: { initialDay: MyDayData }) {
  const [day, setDay] = useState(initialDay);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [state, formAction] = useActionState<TimeClockActionState, FormData>(createAdjustmentRequestAction, {});

  useEffect(() => {
    const timeout = window.setTimeout(() => setDeviceId(getOrCreateBrowserDeviceId()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    fetch(`/api/time-clock/my-day?deviceId=${encodeURIComponent(deviceId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data) setDay(data);
      })
      .catch(() => undefined);
  }, [deviceId]);

  const nextActionText = day.nextSuggestedAction === "check_in"
    ? "Следующая отметка: приход"
    : day.nextSuggestedAction === "check_out"
      ? "Следующая отметка: уход"
      : "Рабочий день закрыт";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Сегодня</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Дата" value={day.date} />
            <Info label="Статус дня" value={day.timesheetDay ? timesheetDayStatusLabels[day.timesheetDay.status as keyof typeof timesheetDayStatusLabels] : "Смена не назначена"} />
            <Info label="Смена" value={day.shift ? `${formatTime(day.shift.startsAt)} - ${formatTime(day.shift.endsAt)}` : "Смена не назначена"} />
            <Info label="Точка" value={day.shift ? `${day.shift.location.name}, ${day.shift.location.address}` : "Не назначена"} />
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Последняя отметка</div>
            <div className="mt-1 font-medium">
              {day.lastEvent
                ? `${timeEventTypeLabels[day.lastEvent.type as keyof typeof timeEventTypeLabels]} в ${formatTime(day.lastEvent.occurredAt)}`
                : "Отметок сегодня еще нет"}
            </div>
            {day.lastEvent ? <Badge className="mt-2" variant="outline">{timeEventStatusLabels[day.lastEvent.status]}</Badge> : null}
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Доверенное устройство</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={day.employeeDeviceStatus === "TRUSTED" ? "default" : day.employeeDeviceStatus === "BLOCKED" ? "warning" : "secondary"}>
                {employeeDeviceStatusLabels[day.employeeDeviceStatus as keyof typeof employeeDeviceStatusLabels] ?? "Не определено"}
              </Badge>
              <span className="text-xs text-muted-foreground">{deviceId ? "Устройство зарегистрировано в браузере" : "Проверяем устройство"}</span>
            </div>
            {day.employeeDeviceStatus !== "TRUSTED" ? (
              <p className="mt-2 text-sm text-accent-foreground">Это устройство не подтверждено. Отметка может уйти на проверку руководителю.</p>
            ) : null}
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Отметка времени</div>
            <div className="mt-1 font-medium">{nextActionText}</div>
            <p className="mt-2 text-sm text-muted-foreground">Для отметки отсканируйте динамический QR-код на экране рабочей точки.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Запросить корректировку</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-3">
            <Input name="date" type="date" defaultValue={day.date} aria-label="Дата" />
            <NativeSelect name="eventType" defaultValue="CHECK_IN" aria-label="Тип отметки">
              <option value="CHECK_IN">Приход</option>
              <option value="CHECK_OUT">Уход</option>
            </NativeSelect>
            <Input name="requestedOccurredAt" type="time" aria-label="Желаемое время" />
            <Textarea name="comment" placeholder="Почему нужна корректировка" />
            {state.message ? <div className="text-sm text-destructive">{state.message}</div> : null}
            {state.errors ? <div className="text-sm text-destructive">Проверьте дату, время и комментарий.</div> : null}
            <Button type="submit" className="w-full">Отправить заявку</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ScanTimeClock({ token, suggestedAction }: { token: string; suggestedAction: "check_in" | "check_out" | "none" }) {
  const [deviceId, setDeviceId] = useState("");
  const [geo, setGeo] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [result, setResult] = useState<{ status: TimeEventStatus; message: string; riskFlags: string[] } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDeviceId(getOrCreateBrowserDeviceId()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      const timeout = window.setTimeout(() => {
        setGeoError("Геолокация недоступна в этом браузере. Отметка будет отправлена на проверку руководителю.");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => setGeoError("Браузер не дал доступ к геолокации. Отметка будет отправлена на проверку руководителю."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    );
  }, []);

  async function submit() {
    if (!deviceId || suggestedAction === "none") return;
    setSubmitting(true);
    const geoPayload = geo ? {
      latitude: geo.latitude,
      longitude: geo.longitude,
      accuracy: geo.accuracy
    } : {};
    const response = await fetch("/api/time-clock/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        type: suggestedAction,
        ...geoPayload,
        clientTime: new Date().toISOString(),
        deviceId,
        deviceName: getBrowserDeviceName()
      })
    });
    const data = await response.json();
    setResult(data);
    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Подтверждение отметки</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3">
          <div className="text-sm text-muted-foreground">Действие</div>
          <div className="mt-1 text-lg font-semibold">
            {suggestedAction === "check_in" ? "Отметить приход" : suggestedAction === "check_out" ? "Отметить уход" : "Рабочий день уже закрыт"}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-sm text-muted-foreground">Геолокация</div>
          {geo ? (
            <div className="mt-1">Получена, точность примерно {Math.round(geo.accuracy)} м</div>
          ) : (
            <div className="mt-1 text-accent-foreground">{geoError || "Запрашиваем геолокацию..."}</div>
          )}
        </div>
        {result ? (
          <div className={result.status === "ACCEPTED" ? "rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3" : result.status === "REJECTED" ? "rounded-md border border-destructive/40 bg-destructive/10 p-3" : "rounded-md border border-accent bg-accent/20 p-3"}>
            <div className="font-medium">{result.message}</div>
            {result.riskFlags?.length ? <div className="mt-1 text-sm text-muted-foreground">Флаги риска: {result.riskFlags.join(", ")}</div> : null}
          </div>
        ) : null}
        <Button onClick={submit} disabled={!deviceId || suggestedAction === "none" || isSubmitting} className="w-full">
          {isSubmitting ? "Отправляем..." : deviceId ? "Подтвердить отметку" : "Готовим устройство..."}
        </Button>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
