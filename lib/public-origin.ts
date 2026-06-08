import os from "os";
import type { NextRequest } from "next/server";

export function getPublicRequestOrigin(request: NextRequest) {
  const configured = process.env.APP_URL;
  if (configured && !isLocalhostUrl(configured)) return configured.replace(/\/$/, "");

  const origin = request.nextUrl.origin;
  if (!isLocalhostUrl(origin)) return origin;

  const lanAddress = getLanAddress();
  if (!lanAddress) return configured?.replace(/\/$/, "") || origin;

  const url = new URL(origin);
  url.hostname = lanAddress;
  return url.origin;
}

function isLocalhostUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function getLanAddress() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const details of interfaces ?? []) {
      if (details.family === "IPv4" && !details.internal && isPrivateIpv4(details.address)) {
        return details.address;
      }
    }
  }
  return null;
}

function isPrivateIpv4(address: string) {
  return /^10\./.test(address) ||
    /^192\.168\./.test(address) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
}
