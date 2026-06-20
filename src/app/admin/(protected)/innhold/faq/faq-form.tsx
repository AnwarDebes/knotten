import { saveFaqAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField } from "@/components/admin/form";
import { PUBLISH_STATUSES } from "@/lib/content/validation";
import type { FaqEntry } from "@/db/schema";

/** Create/edit form for an FAQ entry. */
export function FaqForm({ entry }: { entry?: FaqEntry }) {
  return (
    <form action={saveFaqAction} className="max-w-xl space-y-5">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <TextField
        name="questionNo"
        label="Sporsmal (NO)"
        defaultValue={entry?.questionNo}
        required
      />
      <TextField
        name="questionEn"
        label="Sporsmal (EN)"
        defaultValue={entry?.questionEn}
        required
      />
      <TextAreaField name="answerNo" label="Svar (NO)" defaultValue={entry?.answerNo} required />
      <TextAreaField name="answerEn" label="Svar (EN)" defaultValue={entry?.answerEn} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="status"
          label="Status"
          defaultValue={entry?.status}
          options={PUBLISH_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <TextField
          name="sortOrder"
          label="Rekkefolge"
          type="number"
          defaultValue={entry?.sortOrder ?? 0}
        />
      </div>
      <Button type="submit" size="lg">
        {entry ? "Lagre endringer" : "Opprett sporsmal"}
      </Button>
    </form>
  );
}
