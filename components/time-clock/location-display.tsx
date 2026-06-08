"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBrowserDeviceName, getOrCreateBrowserDeviceId } from "@/components/time-clock/device";

export function LocationDisplaySetup({ token }: { token: string }) {
  const [deviceName, setDeviceName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDeviceName(getBrowserDeviceName()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  async function submit() {
    setSubmitting(true);
    setMessage("");
    const deviceId = getOrCreateBrowserDeviceId("sturm-display-device-id");
    const fingerprintHash = await sha256(`${deviceId}:${navigator.userAgent}`);
    const response = await fetch("/api/location-display/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupToken: token, deviceId, deviceName, fingerprintHash })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "Не удалось подключить QR-экран");
      setSubmitting(false);
      return;
    }
    window.location.href = data.redirectTo ?? "/location-display";
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Подключение QR-экрана</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="Название устройства" />
        {message ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{message}</div> : null}
        <Button onClick={submit} disabled={!deviceName || isSubmitting} className="w-full">
          {isSubmitting ? "Подключаем..." : "Подключить экран"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LocationDisplayScreen() {
  const [deviceId, setDeviceId] = useState("");
  const [qr, setQr] = useState<{ checkUrl: string; expiresAt: string; locationName: string; displayDeviceName: string; riskFlags?: string[] } | null>(null);
  const [message, setMessage] = useState("Подключаемся к display-сессии...");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDeviceId(getOrCreateBrowserDeviceId("sturm-display-device-id")), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    let cancelled = false;

    async function loadQr() {
      const response = await fetch("/api/location-display/current-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      const data = await response.json();
      if (cancelled) return;
      if (!response.ok) {
        setMessage(data.message ?? "QR-экран недоступен");
        return;
      }
      setQr(data);
      setMessage("");
    }

    loadQr();
    const interval = setInterval(loadQr, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deviceId]);

  const secondsLeft = useMemo(() => qr ? Math.max(0, Math.ceil((new Date(qr.expiresAt).getTime() - now) / 1000)) : 0, [qr, now]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-3xl space-y-4 text-center">
        <div>
          <div className="text-sm text-muted-foreground">QR-экран рабочей точки</div>
          <h1 className="text-3xl font-semibold">{qr?.locationName ?? "STURM"}</h1>
          <p className="mt-1 text-muted-foreground">{qr?.displayDeviceName ?? "Проверяем подключение"}</p>
        </div>
        <div className="mx-auto flex aspect-square max-w-lg items-center justify-center rounded-lg border bg-white p-8">
          {qr?.checkUrl ? <QRCodeSVG value={qr.checkUrl} size={360} level="M" includeMargin /> : <div className="text-sm text-slate-700">{message}</div>}
        </div>
        {qr ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Status label="Обновление через" value={`${secondsLeft} сек.`} />
            <Status label="Состояние" value={message || "Подключено"} />
            <Status label="Риски" value={qr.riskFlags?.length ? qr.riskFlags.join(", ") : "Нет"} />
          </div>
        ) : (
          <div className="rounded-md border p-3 text-sm">{message}</div>
        )}
      </div>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
