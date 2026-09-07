import { getCloudflareContext } from "@opennextjs/cloudflare";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type EmailSendResult = {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
};

function getEnv(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export function getEmailProviderState() {
  return {
    provider: "resend",
    configured: Boolean(getEnv("RESEND_API_KEY") && getEnv("ALERT_FROM_EMAIL")),
  };
}

export function getSiteUrl() {
  return getEnv("SITE_URL") || "https://sellcomply.com";
}

export async function sendEmail(input: SendEmailInput): Promise<EmailSendResult> {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("ALERT_FROM_EMAIL");

  if (!apiKey || !from) {
    return {
      ok: false,
      provider: "resend",
      error: "EMAIL_PROVIDER_NOT_CONFIGURED",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        provider: "resend",
        error: payload.message || payload.name || `HTTP_${response.status}`,
      };
    }

    return {
      ok: true,
      provider: "resend",
      messageId: payload.id,
    };
  } catch (error) {
    return {
      ok: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "EMAIL_SEND_FAILED",
    };
  }
}
