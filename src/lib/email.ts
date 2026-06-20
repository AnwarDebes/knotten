export type EmailMessage = { to: string; subject: string; text: string };

/**
 * Send an email. In production it uses the EU/EEA email provider (a
 * Resend-compatible HTTP API) via EMAIL_API_KEY. Without a key (development and
 * tests) it does not send to anyone; it logs in dev so the confirmation link is
 * visible. Plain text only, no tracking pixels.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Knotten <ingen-svar@example.no>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email:dev] to=${msg.to} | ${msg.subject}\n${msg.text}\n`);
    }
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text }),
  });
  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status}`);
  }
}
