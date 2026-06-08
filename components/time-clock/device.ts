"use client";

export function getOrCreateBrowserDeviceId(prefix = "sturm-device-id") {
  const existing = localStorage.getItem(prefix);
  if (existing) return existing;
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(prefix, id);
  return id;
}

export function getBrowserDeviceName() {
  const platform = navigator.platform || "Web";
  return `${platform} / ${navigator.userAgent.slice(0, 60)}`;
}
