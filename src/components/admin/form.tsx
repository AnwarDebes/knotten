import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Small server-rendered form primitives shared by the content editors, so every
 * editor looks and behaves the same with no client JavaScript. Each field is a
 * labelled native control.
 */

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

export function TextField({
  name,
  label,
  defaultValue,
  required,
  type = "text",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
      />
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  required,
  rows = 5,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="border-input bg-background text-foreground focus-visible:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
      />
    </div>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
        className={selectClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="border-input accent-sea size-5 rounded"
      />
      <Label htmlFor={name} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

/** Success/error banner driven by a redirect query param. */
export function FormBanner({
  saved,
  deleted,
  restored,
  error,
}: {
  saved?: boolean;
  deleted?: boolean;
  restored?: boolean;
  error?: string;
}) {
  if (error) {
    const msg =
      error === "validation"
        ? "Noe mangler eller er ugyldig. Sjekk feltene og prov igjen."
        : error === "too-large"
          ? "Bildet er for stort (maks 5 MB)."
          : error === "type"
            ? "Filtypen stottes ikke. Bruk JPG, PNG eller WebP."
            : "Handlingen mislyktes.";
    return (
      <Alert variant="destructive">
        <AlertDescription>{msg}</AlertDescription>
      </Alert>
    );
  }
  if (saved || deleted || restored) {
    return (
      <Alert variant="success">
        <AlertDescription>
          {deleted ? "Slettet." : restored ? "Gjenopprettet fra tidligere versjon." : "Lagret."}
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}
