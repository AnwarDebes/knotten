"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActionForm } from "./forms";

type State = { error?: string; ok?: string } | undefined;

/**
 * A portal form that uploads a file: the same look and answer as ActionForm, but it posts to a route handler
 * (/api/files, /api/energy/readings) that has its own size limit, so the server actions keep Next's small default.
 * The page's data is refreshed after a successful upload.
 */
export function RouteForm({ endpoint, locale, children, submit, pending, className }: {
  endpoint: string;
  locale: "no" | "en";
  children: React.ReactNode;
  submit: string;
  pending?: string;
  className?: string;
}) {
  const router = useRouter();
  const no = locale !== "en";
  const action = useCallback(async (_: State, fd: FormData): Promise<State> => {
    let res: Response;
    try {
      res = await fetch(`${endpoint}?lang=${no ? "no" : "en"}`, { method: "POST", body: fd, credentials: "same-origin" });
    } catch {
      return { error: no ? "Fikk ikke kontakt med nettstedet. Sjekk nettet og prøv igjen." : "Could not reach the site. Check the connection and try again." };
    }
    const body = (await res.json().catch(() => null)) as State | null;
    if (res.ok && body?.ok) {
      router.refresh();
      return { ok: body.ok };
    }
    if (body?.error) return { error: body.error };
    // the host itself may refuse a large request before the site sees it
    if (res.status === 413) return { error: no ? "Filen er for stor." : "The file is too large." };
    return { error: no ? "Opplastingen feilet. Prøv igjen om litt." : "The upload failed. Try again shortly." };
  }, [endpoint, no, router]);
  return <ActionForm action={action} submit={submit} pending={pending} className={className}>{children}</ActionForm>;
}
