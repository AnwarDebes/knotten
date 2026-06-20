import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { listFaq } from "@/lib/content/service";
import { FaqForm } from "../faq-form";
import { FormBanner } from "@/components/admin/form";

export default async function EditFaq({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const db = await getDb();
  const entry = (await listFaq(db)).find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/innhold/faq" className="text-sea text-sm hover:underline">
        &larr; Tilbake til FAQ
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Rediger sporsmal</h1>
      <FormBanner error={error} />
      <FaqForm entry={entry} />
    </div>
  );
}
