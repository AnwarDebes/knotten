"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CONSENT_TEXT, type ConsentLocale } from "@/lib/leads/consent";
import { trackGoal, GOALS } from "@/lib/analytics";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Status = "idle" | "sending" | "success" | "error";

export function InterestForm({ source }: { source?: string }) {
  const t = useTranslations("meldInteresse.skjema");
  const locale = useLocale() as ConsentLocale;
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<"errorGeneric" | "errorRate" | "errorValidation">(
    "errorGeneric",
  );

  useEffect(() => {
    if (!TURNSTILE_KEY) return;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    const turnstileToken = (data.get("cf-turnstile-response") as string | null) ?? undefined;
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      interest: String(data.get("interest") ?? ""),
      consent: data.get("consent") === "on",
      honeypot: String(data.get("company") ?? ""),
      locale,
      source,
      turnstileToken,
    };
    try {
      const res = await fetch("/api/interesse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // A privacy-safe goal: a count only, with no personal data attached.
        trackGoal(GOALS.interestComplete);
        setStatus("success");
        form.reset();
        return;
      }
      setErrorKey(
        res.status === 429 ? "errorRate" : res.status === 400 ? "errorValidation" : "errorGeneric",
      );
      setStatus("error");
    } catch {
      setErrorKey("errorGeneric");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Alert variant="success">
        <AlertDescription>{t("success")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required autoComplete="name" maxLength={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" maxLength={200} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">
          {t("phone")} <span className="text-muted-foreground font-normal">({t("optional")})</span>
        </Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="interest">
          {t("interest")}{" "}
          <span className="text-muted-foreground font-normal">({t("optional")})</span>
        </Label>
        <select
          id="interest"
          name="interest"
          defaultValue="generelt"
          className="border-input bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          <option value="generelt">{t("interestOptions.generelt")}</option>
          <option value="tomt">{t("interestOptions.tomt")}</option>
          <option value="bolig">{t("interestOptions.bolig")}</option>
        </select>
      </div>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="border-input accent-sea focus-visible:ring-ring mt-1 size-5 shrink-0 rounded focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
        />
        <Label htmlFor="consent" className="text-sm leading-6 font-normal">
          {CONSENT_TEXT[locale]}
        </Label>
      </div>
      <p className="text-sm">
        <Link href="/personvern" className="text-sea hover:underline">
          {t("privacyLinkText")}
        </Link>
      </p>

      {TURNSTILE_KEY ? <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} /> : null}

      {status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" disabled={status === "sending"}>
        {status === "sending" ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
