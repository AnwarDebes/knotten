import { saveNewsAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField } from "@/components/admin/form";
import { PUBLISH_STATUSES } from "@/lib/content/validation";
import type { NewsPost } from "@/db/schema";

/** Create/edit form for an Aktuelt (news) post. */
export function NewsForm({ post }: { post?: NewsPost }) {
  return (
    <form action={saveNewsAction} className="max-w-xl space-y-5">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <TextField
        name="slug"
        label="URL-navn (slug)"
        defaultValue={post?.slug}
        required
        hint="Sma bokstaver, tall og bindestrek"
      />
      <TextField name="titleNo" label="Tittel (NO)" defaultValue={post?.titleNo} required />
      <TextField name="titleEn" label="Tittel (EN)" defaultValue={post?.titleEn} required />
      <TextAreaField
        name="bodyNo"
        label="Brodtekst (NO)"
        defaultValue={post?.bodyNo}
        required
        rows={8}
      />
      <TextAreaField
        name="bodyEn"
        label="Brodtekst (EN)"
        defaultValue={post?.bodyEn}
        required
        rows={8}
      />
      <SelectField
        name="status"
        label="Status"
        defaultValue={post?.status}
        options={PUBLISH_STATUSES.map((s) => ({ value: s, label: s }))}
      />
      <Button type="submit" size="lg">
        {post ? "Lagre endringer" : "Opprett sak"}
      </Button>
    </form>
  );
}
