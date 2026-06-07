import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/request-context";
import { resendVerification } from "@/modules/auth/service";

const emailSchema = z.string().email();

async function emailFromRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      return String(body.email ?? "");
    }
    const formData = await request.formData();
    return String(formData.get("email") ?? "");
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const email = await emailFromRequest(request);
  if (!emailSchema.safeParse(email).success) {
    return NextResponse.json({ ok: false, message: "Укажите корректный email." }, { status: 400 });
  }

  const result = await resendVerification(email, await getRequestContext());
  return NextResponse.json({
    ok: true,
    message: result.status === "verified" ? "Email уже подтвержден." : "Если такой email зарегистрирован, письмо будет отправлено."
  });
}
