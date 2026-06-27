"use client";

import type { ComponentProps } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LinkHref = ComponentProps<typeof Link>["href"];

/**
 * Switches locale while staying on the same page, including dynamic routes. The
 * pathname can be a route template (for example /tomt/[code]), so the current
 * params are passed alongside it; without them next-intl cannot build the
 * localised path and throws on pages like /tomt/A1.
 */
function LocaleSwitcher({ labels }: { labels: Record<string, string> }) {
  const pathname = usePathname();
  const params = useParams();
  const active = useLocale();

  return (
    <div className="inline-flex items-center gap-1 text-sm" role="group" aria-label={labels.label}>
      {routing.locales.map((locale, i) => (
        <span key={locale} className="inline-flex items-center">
          {i > 0 ? <span className="text-muted-foreground px-1">/</span> : null}
          <Link
            href={{ pathname, params } as LinkHref}
            locale={locale}
            aria-current={locale === active ? "true" : undefined}
            className={cn(
              "hover:text-sea focus-visible:ring-ring rounded px-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              locale === active ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            {labels[locale] ?? locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}

export { LocaleSwitcher };
