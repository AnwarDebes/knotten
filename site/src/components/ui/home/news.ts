import type { NewsItem } from "@/lib/store";
import { loadNews } from "@/lib/data";

/**
 * The newest published news for the front pages of both designs: the same cached read as the news pages
 * (lib/server/publicRecords.ts), so the front pages stay static and the administrator's news actions refresh the
 * teasers together with the news pages. Server only.
 */
export async function latestNews(n = 2): Promise<NewsItem[]> {
  return (await loadNews()).slice(0, n);
}
