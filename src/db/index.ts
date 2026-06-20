import * as schema from "./schema";

/**
 * Database client. With DATABASE_URL set (production) it uses the hosted EU
 * PostgreSQL via postgres-js. Without it (development and tests) it uses PGlite,
 * an in-process PostgreSQL, so the real schema, migrations and queries run with
 * no external server. The same schema deploys to the hosted database unchanged.
 */
export type DB = Awaited<ReturnType<typeof init>>;

async function init() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    return drizzle(postgres(url, { prepare: false }), { schema });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(process.env.PGLITE_PATH ?? "./.pglite");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db;
}

let cached: Promise<DB> | null = null;

export function getDb(): Promise<DB> {
  if (!cached) cached = init();
  return cached;
}
