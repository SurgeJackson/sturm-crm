import { headers } from "next/headers";

export type RequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function getRequestContext(): Promise<RequestContext> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || realIp,
    userAgent: headerStore.get("user-agent")
  };
}
