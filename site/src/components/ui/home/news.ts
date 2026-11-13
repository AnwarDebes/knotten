import { unstable_cache } from "next/cache";
import { readStore, type NewsItem } from "@/lib/store";

/**
 * The newest published news for the front pages of both designs. Kept in Next's data cache like the public
 * settings (lib/server/siteSettings.ts), so the front pages stay static: the administrator's news actions refresh
 * every page (revalidatePath("/", "layout")), which marks this entry stale as well. Server only (the store reads
 * files or Redis).
 */
export const HOME_NEWS_TAG = "home-news";

const cached = unstable_cache(
  async (): Promise<NewsItem[]> => {
    const { news } = await readStore();
    return news.filter((n) => n.published).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  },
  ["home-news-v1"],
  { tags: [HOME_NEWS_TAG] },
);

/** The `n` newest published items, newest first; none when the store cannot be read (the section is then left out). */
export async function latestNews(n = 2): Promise<NewsItem[]> {
  try {
    return (await cached()).slice(0, n);
  } catch {
    return [];
  }
}
