import { incrementMany, readCounters } from "./kv";
import { osloDay } from "./stats";

/**
 * A daily budget for Knotten AI's calls to the language model, so a flood of questions cannot run up the bill.
 * KNOTTEN_AI_DAILY_LIMIT sets it (calls per day, Norwegian time; 200 if unset). The count is an atomic counter in
 * the database (HINCRBY in Redis): every call adds one first, then reads the total, so two questions at the same
 * moment can never both take the last call. Over the budget, and whenever the counter cannot be reached, Knotten AI
 * answers from the project's data only.
 */
export const DAILY_LIMIT = Math.max(0, Number(process.env.KNOTTEN_AI_DAILY_LIMIT ?? 200) || 0);

const key = (day = osloDay()) => `ai-budget-${day}`;

/** Take one call from today's budget; false when the budget is spent. */
export async function takeModelCall(): Promise<boolean> {
  if (DAILY_LIMIT === 0) return false;
  try {
    const k = key();
    await incrementMany(k, { calls: 1 }, () => ({}));
    const { calls = 0 } = await readCounters(k);
    return calls <= DAILY_LIMIT;
  } catch {
    return false;
  }
}

/** Calls used today, for the administrator's overview. */
export async function modelCallsToday(): Promise<number> {
  try {
    return (await readCounters(key())).calls ?? 0;
  } catch {
    return 0;
  }
}
