import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names, resolving Tailwind conflicts so the last class wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
