import Link from "next/link";
import { StageForm } from "../stage-form";
import { FormBanner } from "@/components/admin/form";

export default async function NewStage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-6">
      <Link href="/admin/innhold/fremdrift" className="text-sea text-sm hover:underline">
        &larr; Tilbake til fremdrift
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Nytt steg</h1>
      <FormBanner error={error} />
      <StageForm />
    </div>
  );
}
