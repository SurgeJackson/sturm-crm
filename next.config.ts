import os from "os";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins()
};

function getAllowedDevOrigins() {
  const origins = new Set<string>();
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const details of interfaces ?? []) {
      if (details.family !== "IPv4" || details.internal || !isPrivateIpv4(details.address)) continue;
      origins.add(details.address);
    }
  }
  return [...origins];
}

function isPrivateIpv4(address: string) {
  return /^10\./.test(address) ||
    /^192\.168\./.test(address) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
}

export default nextConfig;
