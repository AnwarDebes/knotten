import { cn } from "@/lib/utils";

/**
 * Keyboard skip link. Hidden until focused, then jumps to the main content.
 * The target element must carry id="main-content".
 */
function SkipLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      href="#main-content"
      data-slot="skip-link"
      className={cn(
        "focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md",
        className,
      )}
      {...props}
    >
      Hopp til hovedinnhold
    </a>
  );
}

export { SkipLink };
