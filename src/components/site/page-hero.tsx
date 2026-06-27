import type { ReactNode } from "react";
import { Eyebrow } from "@/components/site/primitives";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { cn } from "@/lib/utils";

/**
 * Shared inner-page hero. Carries the identity to every page: the eyebrow with
 * its Rødberg tick, the display-serif title, the lead, and an optional
 * disclaimer. A hairline base instead of a filled band keeps it quiet. Server
 * rendered, no client JavaScript.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  note,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-border/70 bg-card/40 border-b", className)}>
      <div className="mx-auto w-full max-w-5xl px-6 pt-16 pb-12 md:pt-20 md:pb-16">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1
          className={cn(
            "font-display text-foreground max-w-[20ch] text-[clamp(2rem,4.4vw,3.3rem)] leading-[1.05] font-normal tracking-[-0.02em] text-balance",
            eyebrow && "mt-5",
          )}
        >
          {title}
        </h1>
        {lead ? (
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-8">{lead}</p>
        ) : null}
        {note ? <Disclaimer className="mt-6">{note}</Disclaimer> : null}
        {children}
      </div>
    </section>
  );
}
