import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { getLead, PIPELINE_STATUSES } from "@/lib/admin/leads-admin";
import { requireAuth } from "@/lib/admin/session-cookie";
import { setStatusAction, eraseAction } from "../../../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STATUS_LABELS: Record<string, string> = {
  pending: "Avventer dobbel bekreftelse",
  confirmed: "Bekreftet (dobbel opt-in)",
  unsubscribed: "Avmeldt",
};

function fmt(d: Date | null): string {
  return d
    ? new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeStyle: "short" }).format(d)
    : "-";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[12rem_1fr] gap-2 py-2">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground text-sm">{value || "-"}</dd>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const { updated, error } = await searchParams;
  const auth = await requireAuth();
  const db = await getDb();
  const lead = await getLead(db, id);
  if (!lead) notFound();
  const isOwner = auth.admin.role === "owner";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/admin" className="text-sea text-sm hover:underline">
          &larr; Tilbake til registreringer
        </Link>
        <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight">{lead.name}</h1>
        <p className="text-muted-foreground text-sm">{lead.email}</p>
      </div>

      {updated === "1" ? (
        <Alert variant="success">
          <AlertDescription>Status er oppdatert.</AlertDescription>
        </Alert>
      ) : null}
      {error === "reauth" ? (
        <Alert variant="destructive">
          <AlertDescription>Bekreftelsen mislyktes. Sjekk passord og engangskode.</AlertDescription>
        </Alert>
      ) : null}

      <section>
        <h2 className="text-foreground mb-1 text-sm font-semibold">Kontakt</h2>
        <dl className="border-border divide-border divide-y rounded-lg border px-4">
          <Row label="Navn" value={lead.name} />
          <Row label="E-post" value={lead.email} />
          <Row label="Telefon" value={lead.phone} />
          <Row label="Interesse" value={lead.interest} />
          <Row label="Kilde" value={lead.source} />
          <Row label="Registrert" value={fmt(lead.createdAt)} />
        </dl>
      </section>

      <section>
        <h2 className="text-foreground mb-1 text-sm font-semibold">Samtykke (GDPR)</h2>
        <dl className="border-border divide-border divide-y rounded-lg border px-4">
          <Row label="Samtykketekst" value={lead.consentText} />
          <Row label="Versjon" value={lead.consentVersion} />
          <Row label="Samtykket" value={fmt(lead.consentAt)} />
          <Row label="Bekreftelsesstatus" value={STATUS_LABELS[lead.status] ?? lead.status} />
          <Row label="Bekreftet" value={fmt(lead.confirmedAt)} />
          <Row label="Avmeldt" value={fmt(lead.withdrawnAt)} />
        </dl>
      </section>

      <section>
        <h2 className="text-foreground mb-2 text-sm font-semibold">Salgsstatus</h2>
        <form action={setStatusAction} className="flex items-end gap-3">
          <input type="hidden" name="leadId" value={lead.id} />
          <div className="grid gap-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={lead.pipelineStatus}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              {PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Lagre status</Button>
        </form>
      </section>

      <section>
        <h2 className="text-foreground mb-2 text-sm font-semibold">Dataportabilitet (DSAR)</h2>
        <a
          href={`/admin/leads/${lead.id}/export`}
          className="border-border text-foreground hover:bg-secondary/40 inline-block rounded-md border px-4 py-2 text-sm font-medium"
        >
          Last ned personens data (JSON)
        </a>
      </section>

      {isOwner ? (
        <section className="border-destructive/40 rounded-lg border border-dashed p-4">
          <h2 className="text-destructive mb-1 text-sm font-semibold">
            Slett (retten til a bli glemt)
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">
            Sletting er endelig og kan ikke angres. Bekreft med passordet ditt
            {auth.admin.totpEnabled ? " og en engangskode" : ""} for a fortsette.
          </p>
          <form action={eraseAction} className="space-y-3">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="grid max-w-xs gap-1">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {auth.admin.totpEnabled ? (
              <div className="grid max-w-xs gap-1">
                <Label htmlFor="code">Engangskode</Label>
                <Input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  placeholder="000000"
                />
              </div>
            ) : null}
            <Button type="submit" variant="destructive">
              Slett registreringen permanent
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
