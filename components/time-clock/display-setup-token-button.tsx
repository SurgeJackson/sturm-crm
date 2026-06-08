"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DisplaySetupTokenButton({ locationId }: { locationId: string }) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createToken() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/location-display/setup-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.message ?? "Не удалось создать ссылку");
      return;
    }
    setUrl(data.setupUrl);
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={createToken} disabled={loading}>
        {loading ? "Создаем..." : "Ссылка QR-экрана"}
      </Button>
      {url ? <Input readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="text-xs" /> : null}
      {message ? <div className="text-xs text-destructive">{message}</div> : null}
    </div>
  );
}
