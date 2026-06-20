import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { enrollAction } from "../actions";
import { currentAuth } from "@/lib/admin/session-cookie";
import { startEnrollment } from "@/lib/admin/auth";
import { getDb } from "@/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Aktiver totrinns | Knotten admin" };

/** Format the secret in groups of four for easier manual entry. */
function grouped(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export default async function AdminEnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await currentAuth();
  if (!auth) redirect("/admin/login");
  if (auth.admin.totpEnabled) redirect("/admin");
  const db = await getDb();
  const enroll = await startEnrollment(db, auth.admin.id);
  if (!enroll) redirect("/admin");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        Aktiver totrinnsbekreftelse
      </h1>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Legg kontoen til i en autentiseringsapp (for eksempel Google Authenticator, 1Password eller
        Aegis). Skann lenken under, eller skriv inn den hemmelige noklen manuelt. Bekreft deretter
        med en engangskode for a fullfore.
      </p>

      <div className="border-border bg-card mt-6 rounded-lg border p-4">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">Hemmelig nokkel</p>
        <p
          className="text-foreground mt-1 font-mono text-lg break-all"
          aria-label="Hemmelig nokkel"
        >
          {grouped(enroll.secret)}
        </p>
        <p className="text-muted-foreground mt-3 text-xs break-all">
          <span className="font-medium">otpauth-lenke:</span> {enroll.uri}
        </p>
      </div>

      {error === "mfa" ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>Feil kode. Prov igjen med en fersk engangskode.</AlertDescription>
        </Alert>
      ) : null}

      <form action={enrollAction} className="mt-6 space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="code">Engangskode</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            placeholder="000000"
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Aktiver og fortsett
        </Button>
      </form>
    </main>
  );
}
