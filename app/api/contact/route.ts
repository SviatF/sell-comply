import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";

const allowedTopics = new Set([
  "General question",
  "Correction / regulatory issue",
  "Product / market coverage",
  "Privacy / data request",
  "Partnership / business",
]);

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    topic?: string;
    message?: string;
    page?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 120);
  const email = (body.email || "").trim().toLowerCase();
  const topic = (body.topic || "").trim();
  const message = (body.message || "").trim();
  const page = (body.page || "").trim().slice(0, 500);

  if (!validEmail(email) || !allowedTopics.has(topic) || message.length < 20 || message.length > 5000) {
    return NextResponse.json({ ok: false, error: "INVALID_CONTACT_PAYLOAD" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "CONTACT_STORAGE_UNAVAILABLE" }, { status: 503 });
  }

  try {
    await ensureDatabaseSchema(db);
    const id = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO contact_messages (
          id, name, email, topic, message, page, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'new')`
      )
      .bind(id, name || null, email, topic, message, page || null)
      .run();

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: "CONTACT_SAVE_FAILED" }, { status: 500 });
  }
}
