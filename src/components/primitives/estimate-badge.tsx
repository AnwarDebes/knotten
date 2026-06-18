import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Marks a figure as an indicative estimate. Pair with a source so the reader
 * can see where the number comes from (the honesty rule in the master brief).
 */
function EstimateBadge({
  label = "Indikativt estimat",
  source,
  className,
}: {
  label?: string;
  source?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Badge variant="outline" title={source ? `Kilde: ${source}` : undefined}>
        {label}
      </Badge>
      {source ? <span className="text-muted-foreground text-xs">Kilde: {source}</span> : null}
    </span>
  );
}

export { EstimateBadge };
