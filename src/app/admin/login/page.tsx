import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "../actions";
import { currentAuth } from "@/lib/admin/session-cookie";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Logg inn | Knotten admin" };

const ERRORS: Record<string, string> = {
  credentials: "Feil e-post eller passord.",
  mfa: "Feil eller manglende engangskode.",
  locked: "Kontoen er midlertidig sperret etter for mange forsok. Prov igjen om litt.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // An already-signed-in operator skips the form.
  const auth = await currentAuth();
  if (auth) redirect(auth.admin.totpEnabled ? "/admin" : "/admin/enroll");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Knotten admin</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Logg inn for a administrere registreringer.
      </p>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{ERRORS[error] ?? "Innlogging mislyktes."}</AlertDescription>
        </Alert>
      ) : null}

      <form action={loginAction} className="mt-6 space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="email">E-post</Label>
          <Input id="email" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Passord</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">
            Engangskode{" "}
            <span className="text-muted-foreground font-normal">(fra autentiseringsappen)</span>
          </Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Logg inn
        </Button>
      </form>
    </main>
  );
}
