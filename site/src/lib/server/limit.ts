import "server-only";
import { getDel, incr, ttl } from "./kv";
import { sha256 } from "./crypto";

/**
 * Brakes for logins, password resets and public forms. Each attempt is counted before the work is done, with one
 * atomic increment per key that forgets itself when its window ends, so a burst of requests in parallel cannot
 * slip past the limit (they all count, and the ones over it are refused). Addresses and emails are kept only as
 * one-way codes, and only for the length of the window. Every kind of brake has its own key prefix, so one can
 * never lock another.
 */
export type Rule = { key: string; max: number; windowSec: number };
export type Verdict = { ok: true } | { ok: false; retryAfterSec: number };

/** A one-way code for an address or an email, so the counters never hold either. */
export const limitId = (s: string) => sha256(`limit|${s.trim().toLowerCase()}`).slice(0, 24);

/** Count this attempt under every rule; refused (with the wait) when any rule is over its limit. */
export async function take(rules: Rule[]): Promise<Verdict> {
  const counts = await Promise.all(rules.map((r) => incr(`rl:${r.key}`, r.windowSec)));
  const over = rules.filter((r, i) => counts[i] > r.max);
  if (!over.length) return { ok: true };
  const waits = await Promise.all(over.map((r) => ttl(`rl:${r.key}`).catch(() => r.windowSec)));
  return { ok: false, retryAfterSec: Math.max(1, ...waits.map((w, i) => (w > 0 ? w : over[i].windowSec))) };
}

/** Forget the attempts counted under these keys (after a correct password, for example). */
export async function forget(keys: string[]) {
  await Promise.all(keys.map((k) => getDel(`rl:${k}`).catch(() => null)));
}

/** Take back one attempt (it succeeded and should not count against a shared network). */
export async function giveBack(rules: Rule[]) {
  await Promise.all(rules.map((r) => incr(`rl:${r.key}`, r.windowSec, -1).catch(() => 0)));
}

/** Minutes to tell the person, rounded up. */
export const minutes = (sec: number) => Math.max(1, Math.ceil(sec / 60));

/**
 * A simple brake for public forms: at most `max` actions per `windowMin` minutes from one address. Kept for the
 * callers that use it as it was (true when allowed).
 */
export async function allow(bucket: string, ip: string, max: number, windowMin: number) {
  const v = await take([{ key: `${bucket.replace(/[^a-z0-9_-]/gi, "")}:i:${limitId(ip)}`, max, windowSec: windowMin * 60 }]);
  return v.ok;
}
