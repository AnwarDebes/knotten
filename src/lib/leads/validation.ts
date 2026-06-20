import { z } from "zod";

// No control characters or line breaks, so values can never be injected into
// an email header.
const singleLine = z.string().regex(/^[^\r\n\t]*$/, "invalid");

/**
 * Server-side validation for the interest form. Data is minimised: only name
 * and email are required. Consent must be explicit (literal true). The honeypot
 * is checked separately so a bot is not told why it failed.
 */
export const interestSchema = z.object({
  name: singleLine.trim().min(2).max(100),
  email: z.email().max(200),
  phone: singleLine.trim().max(30).optional(),
  interest: singleLine.trim().max(100).optional(),
  consent: z.literal(true),
  honeypot: z.string().optional(),
  locale: z.enum(["no", "en"]).catch("no"),
  source: singleLine.trim().max(120).optional(),
  turnstileToken: z.string().max(4000).optional(),
});

export type InterestInput = z.infer<typeof interestSchema>;
