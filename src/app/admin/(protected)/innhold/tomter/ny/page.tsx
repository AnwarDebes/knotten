import Link from "next/link";
import { PlotForm } from "../plot-form";
import { FormBanner } from "@/components/admin/form";

export default async function NewPlot({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-6">
      <Link href="/admin/innhold/tomter" className="text-sea text-sm hover:underline">
        &larr; Tilbake til tomter
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Ny tomt</h1>
      <FormBanner error={error} />
      <PlotForm />
    </div>
  );
}
