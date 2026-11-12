import { promises as fs } from "fs";
import path from "path";
import { PROBLEM_DIGEST } from "../errors";

/**
 * Where the site keeps its working records (CRM, accounts, workspace, documents, statistics).
 *
 * - "kv": a Redis database over HTTPS (Upstash, or Vercel's Redis/KV integration). Used as soon as one complete pair
 *   is set: KV_REST_API_URL and KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. This is
 *   the storage to use on Vercel, where the project folder is read-only.
 * - "file": JSON files under site/data, for running the site on a computer or on one normal server process.
 * - "temp": on Vercel without a database. Nothing can be kept there (/tmp is emptied when the server sleeps and is
 *   not shared between servers), so the site fails closed: reads give each record set's starting point, so the
 *   public pages still render, and every write throws StorageUnavailableError, which forms and actions turn into
 *   "storage is not set up yet".
 *
 * Every record set is one JSON document under one key, changed through `mutate`. In Redis each document has a
 * version beside it; `mutate` reads both, applies the change and writes back only if the version is unchanged
 * (a compare-and-set in one Lua script), and otherwise reads again and retries. Upstash's REST API runs Lua
 * through EVAL; it has no WATCH. Small values with an expiry (attempt counters, one-time codes) use `incr`,
 * `setNX`, `getDel`, `getValue` and `ttl`, which are single atomic commands.
 */

// ------------------------------------------------------------------ which storage
const pair = (url?: string, token?: string) => (url && token ? { url: url.trim().replace(/\/+$/, ""), token: token.trim() } : null);
const REDIS = pair(process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN) ?? pair(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN);
export const STORAGE: "kv" | "file" | "temp" = REDIS ? "kv" : process.env.VERCEL ? "temp" : "file";

/** Every Redis key starts with this. Preview deployments get their own by default, so they never share production's records. */
export const KV_PREFIX = (process.env.KV_PREFIX ?? "").trim().replace(/[^a-z0-9_.-]/gi, "") || (process.env.VERCEL_ENV === "preview" ? "knotten-preview" : "knotten");

const ROOT = STORAGE === "temp" ? "/tmp/knotten" : path.join(process.cwd(), "data");
/** The CRM file predates this module and stays where it was; everything newer lives in data/private (not in git). */
export function fileFor(key: string) {
  return key === "crm" && STORAGE === "file" ? path.join(ROOT, "crm.json") : path.join(ROOT, "private", `${key.replace(/[^a-z0-9._-]/gi, "_")}.json`);
}
export const PRIVATE_DIR = path.join(ROOT, "private");

// ------------------------------------------------------------------ errors
/** A write while the hosting has no storage (Vercel without a database). Forms show STORAGE_MESSAGE from lib/errors. */
export class StorageUnavailableError extends Error {
  readonly code = "storage_unavailable";
  readonly digest = PROBLEM_DIGEST.storage;
  constructor(key = "") {
    super(`Storage is not set up: nothing can be saved${key ? ` (${key})` : ""}`);
    this.name = "StorageUnavailableError";
  }
}
export const isStorageUnavailable = (e: unknown): e is StorageUnavailableError =>
  e instanceof StorageUnavailableError || (!!e && typeof e === "object" && (e as { code?: unknown }).code === "storage_unavailable");

/** Many writers changed the same record set at once and this change could not get in; nothing was written. */
export class StorageBusyError extends Error {
  constructor(key: string) {
    super(`The record set "${key}" was changed by others too often to save this change; nothing was written`);
    this.name = "StorageBusyError";
  }
}

// ------------------------------------------------------------------ Redis over HTTPS
const TIMEOUT_MS = 5000;
const dataKey = (key: string) => `${KV_PREFIX}:${key}`;
const versionKey = (key: string) => `${KV_PREFIX}:ver:${key}`;
const valueKey = (key: string) => `${KV_PREFIX}:x:${key}`;

async function post<T>(body: unknown, suffix = ""): Promise<T> {
  const res = await fetch(`${REDIS!.url}${suffix}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS!.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as T | null;
  if (!res.ok || json === null) {
    const error = (json as { error?: string } | null)?.error;
    throw new Error(`kv request failed: ${error ?? res.status}`);
  }
  return json;
}

async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const json = await post<{ result?: T; error?: string }>(command);
  if (json.error) throw new Error(`kv ${command[0]} failed: ${json.error}`);
  return json.result as T;
}

async function pipeline<T = unknown>(commands: (string | number)[][]): Promise<T[]> {
  const out = await post<{ result?: T; error?: string }[]>(commands, "/pipeline");
  const bad = out.find((r) => r.error);
  if (bad) throw new Error(`kv pipeline failed: ${bad.error}`);
  return out.map((r) => r.result as T);
}

/**
 * The Lua scripts, each one atomic step in Redis. The first line names the script (a test double can recognise
 * them by it). Missing keys read as false in Lua, so a record set that was never saved has version "0".
 */
export const LUA = {
  /** Save the record set only if its version is still the one that was read, and count the version up. */
  cas: `-- knotten:cas
local v = redis.call('GET', KEYS[2])
if (v or '0') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('INCR', KEYS[2])
return 1`,
  /** Save the record set whatever it holds, and count the version up (so changes in progress notice). */
  put: `-- knotten:put
redis.call('SET', KEYS[1], ARGV[1])
return redis.call('INCR', KEYS[2])`,
  /** Save the record set only if it does not exist yet: the first seed wins. */
  create: `-- knotten:create
if redis.call('SET', KEYS[1], ARGV[1], 'NX') then
  redis.call('INCR', KEYS[2])
  return 1
end
return 0`,
  /** Count, and start the window with the first count. */
  incr: `-- knotten:incr
local n = redis.call('INCRBY', KEYS[1], ARGV[2])
if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return n`,
} as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ files
const isMissing = (e: unknown) => (e as NodeJS.ErrnoException | null)?.code === "ENOENT";
/** Windows: antivirus and indexers hold files open for a moment; these errors pass if we wait. */
const isBusy = (e: unknown) => ["EPERM", "EBUSY", "EACCES"].includes((e as NodeJS.ErrnoException | null)?.code ?? "");

async function retryBusy<T>(run: () => Promise<T>, tries = 8): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (e) {
      if (!isBusy(e) || i >= tries) throw e;
      await sleep(15 * 2 ** i * (0.5 + Math.random()));
    }
  }
}

/** The file's JSON, or null only when the file does not exist. Any other failure (a damaged file, no access) is thrown. */
async function readFileJSON<T>(file: string): Promise<T | null> {
  let text: string;
  try {
    text = await retryBusy(() => fs.readFile(file, "utf-8"), 4);
  } catch (e) {
    if (isMissing(e)) return null;
    throw e;
  }
  return JSON.parse(text) as T;
}

let tmpSeq = 0;
async function writeFileJSON(key: string, value: unknown, exclusive = false): Promise<boolean> {
  const file = fileFor(key);
  const text = key === "crm" ? JSON.stringify(value, null, 1) : JSON.stringify(value);
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (exclusive) {
    // created only if nobody has made it yet, never written over existing records (callers hold the key's queue)
    try {
      await fs.access(file);
      return false;
    } catch (e) {
      if (!isMissing(e)) throw e;
    }
  }
  // write to a side file and rename, so a crash never leaves half a file behind
  const tmp = `${file}.${process.pid}.${++tmpSeq}.tmp`;
  await fs.writeFile(tmp, text, "utf-8");
  try {
    await retryBusy(() => fs.rename(tmp, file));
  } catch (e) {
    await fs.unlink(tmp).catch(() => undefined);
    throw e;
  }
  return true;
}

// ------------------------------------------------------------------ one change per key at a time in this process
const queues = new Map<string, Promise<unknown>>();
function queue<R>(key: string, run: () => Promise<R>): Promise<R> {
  const next = (queues.get(key) ?? Promise.resolve()).then(run, run);
  const settled = next.catch(() => undefined);
  queues.set(key, settled);
  // forget the queue once it is empty, so the map does not grow with every key ever used
  void settled.then(() => { if (queues.get(key) === settled) queues.delete(key); });
  return next;
}

// ------------------------------------------------------------------ record sets (JSON documents)
export async function readJSON<T>(key: string): Promise<T | null> {
  if (STORAGE === "kv") {
    const raw = await redis<string | null>(["GET", dataKey(key)]);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  // nothing is ever saved in temp mode: every reader starts from its seed
  if (STORAGE === "temp") return null;
  return readFileJSON<T>(fileFor(key));
}

/** Replace the record set. Prefer `mutate`, which keeps changes made by others at the same time. */
export async function writeJSON(key: string, value: unknown) {
  if (STORAGE === "temp") throw new StorageUnavailableError(key);
  if (STORAGE === "kv") {
    await redis(["EVAL", LUA.put, 2, dataKey(key), versionKey(key), JSON.stringify(value)]);
    return;
  }
  await queue(key, () => writeFileJSON(key, value));
}

/** Save the record set only if it does not exist yet (SET NX): true when this call created it. */
export async function createJSON(key: string, value: unknown): Promise<boolean> {
  if (STORAGE === "temp") throw new StorageUnavailableError(key);
  if (STORAGE === "kv") return Number(await redis(["EVAL", LUA.create, 2, dataKey(key), versionKey(key), JSON.stringify(value)])) === 1;
  return queue(key, () => writeFileJSON(key, value, true));
}

const MAX_ATTEMPTS = 16;
const BUDGET_MS = 8000;
/** Compare-and-set conflicts seen by this process (for the health check and tests). */
export const kvStats = { conflicts: 0, retries: 0 };

/**
 * Read the record set, let `fn` change it, write it back, without losing a change someone else made meanwhile.
 * `fn` may run more than once (after a conflict it runs again on the fresh record set), so it must only change
 * the value it is given. `seed` is the starting point when nothing is stored yet.
 */
export async function mutate<T, R>(key: string, seed: () => T | Promise<T>, fn: (value: T) => R | Promise<R>): Promise<R> {
  if (STORAGE === "temp") throw new StorageUnavailableError(key);
  if (STORAGE === "file") {
    return queue(key, async () => {
      const value = (await readFileJSON<T>(fileFor(key))) ?? (await seed());
      const out = await fn(value);
      await writeFileJSON(key, value);
      return out;
    });
  }
  // changes from this process wait for each other first, so only other servers can conflict
  return queue(key, async () => {
    const started = Date.now();
    for (let attempt = 1; ; attempt++) {
      const [raw, version] = await redis<[string | null, string | null]>(["MGET", dataKey(key), versionKey(key)]);
      const value = raw ? (JSON.parse(raw) as T) : await seed();
      const out = await fn(value);
      const saved = await redis<number>(["EVAL", LUA.cas, 2, dataKey(key), versionKey(key), version ?? "0", JSON.stringify(value)]);
      if (Number(saved) === 1) return out;
      kvStats.conflicts++;
      if (attempt >= MAX_ATTEMPTS || Date.now() - started > BUDGET_MS) throw new StorageBusyError(key);
      kvStats.retries++;
      // full jitter: writers that collided spread out instead of colliding again
      await sleep(Math.random() * Math.min(400, 10 * 2 ** attempt));
    }
  });
}

// ------------------------------------------------------------------ small values with an expiry
/**
 * Counters, flags and one-time values. In Redis each is its own key with an expiry. On a computer they live in
 * one record set (data/private/kv-keys.json); in temp mode in this process's memory, which is all a counter
 * needs there (it can only make limits stricter per server, never save a record).
 */
type Local = { v: string; exp?: number };
const memory = new Map<string, Local>();
const LOCAL_KEY = "kv-keys";

async function local<R>(key: string, change: (cur: Local | undefined, now: number) => { next?: Local | null; out: R }): Promise<R> {
  const now = Date.now();
  const live = (x: Local | undefined) => (x && (!x.exp || x.exp > now) ? x : undefined);
  if (STORAGE === "temp") {
    const { next, out } = change(live(memory.get(key)), now);
    if (next === null) memory.delete(key);
    else if (next) memory.set(key, next);
    return out;
  }
  return mutate<Record<string, Local>, R>(LOCAL_KEY, () => ({}), (all) => {
    for (const [k, x] of Object.entries(all)) if (!live(x)) delete all[k];
    const { next, out } = change(all[key], now);
    if (next === null) delete all[key];
    else if (next) all[key] = next;
    return out;
  });
}

/** Count up (or down with a negative `by`) and return the new count. The count forgets itself `ttlSec` after the first one. */
export async function incr(key: string, ttlSec: number, by = 1): Promise<number> {
  if (STORAGE === "kv") return Number(await redis(["EVAL", LUA.incr, 1, valueKey(key), Math.max(1, Math.ceil(ttlSec)), by]));
  return local(key, (cur, now) => {
    const n = Number(cur?.v ?? 0) + by;
    return { next: { v: String(n), exp: cur?.exp ?? now + ttlSec * 1000 }, out: n };
  });
}

/** Store the value only if the key is free; true when this call stored it. */
export async function setNX(key: string, value: string, ttlSec?: number): Promise<boolean> {
  if (STORAGE === "kv") {
    const cmd: (string | number)[] = ["SET", valueKey(key), value, "NX"];
    if (ttlSec) cmd.push("EX", Math.max(1, Math.ceil(ttlSec)));
    return (await redis<string | null>(cmd)) === "OK";
  }
  return local(key, (cur, now) => (cur ? { out: false } : { next: { v: value, exp: ttlSec ? now + ttlSec * 1000 : undefined }, out: true }));
}

/** The value, and the key is gone: a one-time value can be used only once. */
export async function getDel(key: string): Promise<string | null> {
  if (STORAGE === "kv") return redis<string | null>(["GETDEL", valueKey(key)]);
  return local(key, (cur) => ({ next: cur ? null : undefined, out: cur?.v ?? null }));
}

/** The value, without using it up. */
export async function getValue(key: string): Promise<string | null> {
  if (STORAGE === "kv") return redis<string | null>(["GET", valueKey(key)]);
  if (STORAGE === "temp") return local(key, (cur) => ({ out: cur?.v ?? null }));
  const all = (await readFileJSON<Record<string, Local>>(fileFor(LOCAL_KEY))) ?? {};
  const x = all[key];
  return x && (!x.exp || x.exp > Date.now()) ? x.v : null;
}

/** Seconds until the key forgets itself: -1 without an expiry, -2 when it does not exist. */
export async function ttl(key: string): Promise<number> {
  if (STORAGE === "kv") return Number(await redis(["TTL", valueKey(key)]));
  const now = Date.now();
  const x = STORAGE === "temp" ? memory.get(key) : ((await readFileJSON<Record<string, Local>>(fileFor(LOCAL_KEY))) ?? {})[key];
  if (!x || (x.exp && x.exp <= now)) return -2;
  return x.exp ? Math.ceil((x.exp - now) / 1000) : -1;
}

/** True when the database answers (always true for files). */
export async function kvPing(): Promise<boolean> {
  if (STORAGE !== "kv") return STORAGE === "file";
  try {
    return (await redis<string>(["PING"])) === "PONG";
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ visitor statistics
/** Counters for the visitor statistics: atomic in Redis, in the JSON file otherwise. */
export async function incrementMany(key: string, fields: Record<string, number>, seed: () => Record<string, number>) {
  if (STORAGE === "temp") throw new StorageUnavailableError(key);
  if (STORAGE === "kv") {
    await pipeline(Object.entries(fields).map(([f, n]) => ["HINCRBY", dataKey(key), f, n]));
    return;
  }
  await mutate<Record<string, number>, void>(key, seed, (v) => {
    for (const [f, n] of Object.entries(fields)) v[f] = (v[f] ?? 0) + n;
  });
}

const fromFlat = (flat: string[] | null | undefined) => {
  const o: Record<string, number> = {};
  const list = flat ?? [];
  for (let i = 0; i + 1 < list.length; i += 2) o[list[i]] = Number(list[i + 1]) || 0;
  return o;
};

/** Many counter sets at once: one request to Redis however many days are asked for. */
export async function readCountersMany(keys: string[]): Promise<Record<string, number>[]> {
  if (STORAGE !== "kv" || keys.length === 0) return Promise.all(keys.map((k) => readCounters(k).catch(() => ({}))));
  const out = await pipeline<string[] | null>(keys.map((k) => ["HGETALL", dataKey(k)]));
  return out.map(fromFlat);
}

export async function readCounters(key: string): Promise<Record<string, number>> {
  if (STORAGE === "kv") return fromFlat(await redis<string[] | null>(["HGETALL", dataKey(key)]));
  return (await readJSON<Record<string, number>>(key)) ?? {};
}

/** Add a member to a set that forgets itself after `ttlSec`; true when the member was new. */
export async function addUnique(key: string, member: string, ttlSec: number): Promise<boolean> {
  if (STORAGE === "temp") throw new StorageUnavailableError(key);
  if (STORAGE === "kv") {
    const [added] = await pipeline<number>([["SADD", dataKey(key), member], ["EXPIRE", dataKey(key), ttlSec]]);
    return Number(added) === 1;
  }
  return mutate<{ until: number; members: string[] }, boolean>(key, () => ({ until: Date.now() + ttlSec * 1000, members: [] }), (v) => {
    if (v.until < Date.now()) { v.until = Date.now() + ttlSec * 1000; v.members = []; }
    if (v.members.includes(member)) return false;
    v.members.push(member);
    return true;
  });
}
