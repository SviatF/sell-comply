"use client";

import { FormEvent, useState } from "react";

const topics = [
  "General question",
  "Correction / regulatory issue",
  "Product / market coverage",
  "Privacy / data request",
  "Partnership / business",
];

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      topic: String(form.get("topic") || "").trim(),
      message: String(form.get("message") || "").trim(),
      page: window.location.pathname,
    };

    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "CONTACT_SAVE_FAILED");
      }

      formElement.reset();
      setStatus("sent");
    } catch {
      setError("We could not submit your message right now. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-grid">
        <label>
          <span>Name <small>optional</small></span>
          <input name="name" type="text" maxLength={120} autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" maxLength={254} autoComplete="email" required />
        </label>
      </div>

      <label>
        <span>Topic</span>
        <select name="topic" defaultValue={topics[0]} required>
          {topics.map((topic) => <option value={topic} key={topic}>{topic}</option>)}
        </select>
      </label>

      <label>
        <span>Message</span>
        <textarea
          name="message"
          minLength={20}
          maxLength={5000}
          rows={8}
          placeholder="Include the affected product, market, page URL or official source when relevant."
          required
        />
      </label>

      <div className="contact-form-footer">
        <p>Do not submit passwords, private credentials or sensitive third-party personal data.</p>
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message →"}
        </button>
      </div>

      {status === "sent" && <div className="contact-form-success">Message received. Thank you.</div>}
      {status === "error" && <div className="contact-form-error">{error}</div>}
    </form>
  );
}
