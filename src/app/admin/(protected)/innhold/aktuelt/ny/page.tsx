import Link from "next/link";
import { NewsForm } from "../news-form";
import { FormBanner } from "@/components/admin/form";

export default async function NewNews({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-6">
      <Link href="/admin/innhold/aktuelt" className="text-sea text-sm hover:underline">
        &larr; Tilbake til aktuelt
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Ny sak</h1>
      <FormBanner error={error} />
      <NewsForm />
    </div>
  );
}
