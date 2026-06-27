import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Shared vocabulary for the "measured coast" system. Server components, no
 * client JavaScript. The eyebrow carries the single Rødberg tick; section heads
 * are set in the display serif so the identity holds across every section.
 */

/**
 * Section eyebrow. Its marker is the recurring datum: when an elevation is
 * given, the label is preceded by a true elevation tick and tabular figure, and
 * those figures climb section by section from the sea (0 m at the hero) to the
 * summit (176 m), so the page reads as an ascent of the real landform. Without
 * an elevation it falls back to a quiet tick (used on inner pages).
 */
export function Eyebrow({
  children,
  className,
  tone = "light",
  elevation,
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
  elevation?: number;
}) {
  const dark = tone === "dark";
  const accent = dark ? "bg-rodberg-on-dark" : "bg-rodberg";
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[0.72rem] font-medium tracking-[0.2em] uppercase",
        dark ? "text-[#a4c5c6]" : "text-sea",
        className,
      )}
    >
      {elevation != null ? (
        <span className="flex items-center gap-2">
          <span aria-hidden className={cn("h-2.5 w-px shrink-0", accent)} />
          <span className="tracking-[0.08em] tabular-nums">{elevation} m</span>
          <span
            aria-hidden
            className={cn("h-px w-5 shrink-0", dark ? "bg-[#3c545b]" : "bg-border")}
          />
        </span>
      ) : (
        <span aria-hidden className={cn("h-[2px] w-7 shrink-0", accent)} />
      )}
      <span>{children}</span>
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lead,
  tone = "light",
  elevation,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "light" | "dark";
  elevation?: number;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Eyebrow tone={tone} elevation={elevation}>
        {eyebrow}
      </Eyebrow>
      <h2
        className={cn(
          "font-display mt-5 text-[clamp(1.9rem,3.4vw,2.85rem)] leading-[1.08] font-normal tracking-[-0.018em] text-balance",
          tone === "dark" ? "text-[#f1f5f1]" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={cn(
            "mt-5 text-lg leading-8",
            tone === "dark" ? "text-[rgba(225,234,230,0.82)]" : "text-muted-foreground",
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export function ArrowLink({
  href,
  children,
  tone = "light",
  className,
}: {
  href: StaticPathname;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group focus-visible:ring-ring inline-flex items-center gap-2 text-sm font-medium transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        tone === "dark" ? "text-[#d7e4e1] hover:text-white" : "text-sea hover:text-rodberg",
        className,
      )}
    >
      <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-current">
        {children}
      </span>
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        &rarr;
      </span>
    </Link>
  );
}
