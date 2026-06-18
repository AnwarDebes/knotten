import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation helpers. Use these Link/redirect/usePathname/useRouter
// instead of the next/navigation equivalents so locale prefixes are handled.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
