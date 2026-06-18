import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Honesty primitives. Every public estimate, simulation or financial figure
 * must be labelled and disclaimed (see the master brief, section 3.5). These
 * standard Norwegian strings keep the wording consistent everywhere.
 */
export const DISCLAIMERS = {
  estimate: "Indikativt estimat. Endelige tall kan avvike.",
  notOffer: "Dette er ikke et tilbud.",
  needsVerification: "Krever profesjonell verifikasjon.",
  notFinancialAdvice: "Indikativt, ikke finansiell rådgivning. Snakk med bank eller rådgiver.",
  simulation: "Illustrasjon, ikke sanntidsdata.",
} as const;

function Disclaimer({
  children,
  icon = true,
  className,
  ...props
}: React.ComponentProps<"p"> & { icon?: boolean }) {
  return (
    <p
      data-slot="disclaimer"
      className={cn(
        "text-muted-foreground flex items-start gap-1.5 text-xs leading-relaxed",
        className,
      )}
      {...props}
    >
      {icon ? <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" /> : null}
      <span>{children}</span>
    </p>
  );
}

export { Disclaimer };
