import { cn } from "@/lib/utils";

/**
 * Placeholder Knotten wordmark with a coastal emblem (hill, sea, sun). It is a
 * marked placeholder until the developer supplies the final brand assets; the
 * emblem uses currentColor so it inherits the surrounding text colour.
 */
function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn("text-primary inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-7 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="22" cy="9" r="3" />
        <path d="M3 22l7-9 5 6 4-5 8 8" />
        <path d="M3 27h26" />
      </svg>
      {withText ? (
        <span className="text-lg font-semibold tracking-tight">
          Knotten
          <span className="sr-only">, Sjøutsikt i Rødberg</span>
        </span>
      ) : (
        <span className="sr-only">Knotten, Sjøutsikt i Rødberg</span>
      )}
    </span>
  );
}

export { Logo };
