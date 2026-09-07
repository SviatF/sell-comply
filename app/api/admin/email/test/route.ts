import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getEmailProviderState, sendEmail } from "@/lib/email-provider";

function getSecret(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function POST(request: Request) {
  const expected = getSecret("ADMIN_TOKEN");
  const supplied = request.headers.get("x-admin-token") || "";

  if (!expected || supplied !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
  }

  const provider = getEmailProviderState();
  if (!provider.configured) {
    return NextResponse.json(
      { ok: false, error: "EMAIL_PROVIDER_NOT_CONFIGURED", emailProvider: provider },
      { status: 503 }
    );
  }

  const result = await sendEmail({
    to: email,
    subject: "SellComply alert delivery test",
    text: "SellComply email alerts are configured correctly. This is a delivery test.",
    html: `
      <div style="font-family:Arial,sans-serif;background:#08080a;color:#f5f5f7;padding:32px">
        <div style="max-width:600px;margin:auto">
          <div style="font-size:12px;letter-spacing:.12em;color:#ff72b4;font-weight:700">SELLCOMPLY</div>
          <h1 style="font-size:30px;margin:16px 0 8px">Alert delivery is live.</h1>
          <p style="color:#aaaab2;line-height:1.6">SellComply email alerts are configured correctly. This is a delivery test.</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json(
    { ok: result.ok, ...result },
    { status: result.ok ? 200 : 502 }
  );
}
