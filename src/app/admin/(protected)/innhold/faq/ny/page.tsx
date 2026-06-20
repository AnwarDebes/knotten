import Link from "next/link";
import { FaqForm } from "../faq-form";
import { FormBanner } from "@/components/admin/form";

export default async function NewFaq({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-6">
      <Link href="/admin/innhold/faq" className="text-sea text-sm hover:underline">
        &larr; Tilbake til FAQ
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Nytt sporsmal</h1>
      <FormBanner error={error} />
      <FaqForm />
    </div>
  );
}
