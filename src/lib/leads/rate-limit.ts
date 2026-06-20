import { sql } from "drizzle-orm";
import { rateLimit } from "@/db/schema";
import type { DB } from "@/db";

/**
 * Fixed-window rate limit backed by the database (works on serverless without
 * an extra processor). The check-and-increment is a single atomic upsert, so it
 * is not subject to a check-then-update race under concurrency. Returns true
 * when the action is allowed.
 */
export async function consume(
  db: DB,
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + windowMs);
  const result = await db
    .insert(rateLimit)
    .values({ key, count: 1, expiresAt })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.expiresAt} < now() then 1 else ${rateLimit.count} + 1 end`,
        expiresAt: sql`case when ${rateLimit.expiresAt} < now() then ${expiresAt} else ${rateLimit.expiresAt} end`,
      },
    })
    .returning();
  const count = result[0]?.count ?? 1;
  return count <= max;
}
