import { getDb } from "@/db";
import { getDashboard } from "@/lib/content/service";
import { saveDashboardAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { TextAreaField, SelectField, FormBanner } from "@/components/admin/form";

export default async function DashboardEditor({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const row = await getDashboard(db);

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">
        Dashbord (illustrative verdier)
      </h1>
      <p className="text-muted-foreground max-w-xl text-sm">
        Verdiene her er kun illustrative og skal vises som indikativt estimat, ikke faktisk
        telemetri. Bruk dem til a vise hvordan dashbordet kan se ut, med tydelig forbehold.
      </p>
      <FormBanner saved={sp.saved === "1"} error={sp.error} />

      <form action={saveDashboardAction} className="max-w-xl space-y-5">
        <SelectField
          name="mode"
          label="Modus"
          defaultValue={row?.mode}
          options={[
            { value: "illustrative", label: "Illustrativ" },
            { value: "live", label: "Live (fremtidig)" },
          ]}
        />
        <div className="grid gap-1.5">
          <TextAreaField
            name="values"
            label="Verdier (JSON)"
            rows={8}
            defaultValue={row?.values ?? "{}"}
          />
          <p className="text-muted-foreground text-xs">Ma vaere gyldig JSON.</p>
        </div>
        <Button type="submit" size="lg">
          Lagre
        </Button>
      </form>
    </div>
  );
}
