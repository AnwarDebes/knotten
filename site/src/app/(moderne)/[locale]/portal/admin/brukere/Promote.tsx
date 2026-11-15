"use client";
import { createContext, useActionState, useContext, useEffect, useRef, useState } from "react";
import { keepValues } from "@/components/keepValues";
import { promoteMember, type PromoteState } from "../actions";

/**
 * "Gjør til beboer" on the users page. When it succeeds, the account leaves the list of buyer accounts for the list
 * of project accounts, and the row with its form is gone. So the answer is kept here, around the list, and not in
 * the row: the confirmation stands at the top of the buyer accounts and says where the account went. It takes the
 * keyboard focus the vanished button had, so it is read out and the next Tab goes on into the list. It stays only
 * while it is true: change or delete the account afterwards and it goes away.
 */
type Promote = { state: PromoteState; run: (fd: FormData) => void; sent: string | null; busy: boolean; send: (id: string) => void };
const PromoteContext = createContext<Promote | null>(null);

/** Around the buyer accounts. `residents` lists the project accounts that are residents today, each as "id:plot". */
export function Promotions({ residents, children }: { residents: string[]; children: React.ReactNode }) {
  const [state, run, busy] = useActionState(promoteMember, undefined);
  // the row whose form was sent last: its button waits while the answer is on its way
  const [sent, setSent] = useState<string | null>(null);
  const done = state?.ok && residents.includes(`${state.id}:${state.plot}`) ? state.ok : "";
  const note = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (done) note.current?.focus();
  }, [done]);
  return (
    <PromoteContext.Provider value={{ state, run, sent, busy, send: setSent }}>
      {/* on the page from the start and empty until there is something to say, so a screen reader hears it arrive */}
      <p ref={note} role="status" tabIndex={-1} className={done ? "rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] bg-[rgba(79,113,86,.12)] text-[#2f4f38]" : "sr-only"}>{done}</p>
      {children}
    </PromoteContext.Provider>
  );
}

/** The form in a buyer's row: the plot that becomes the home (the fields come from the page), a refusal, the button. */
export function PromoteForm({ id, submit, children }: { id: string; submit: string; children: React.ReactNode }) {
  const c = useContext(PromoteContext);
  if (!c) throw new Error("PromoteForm must stand inside Promotions");
  const busy = c.busy && c.sent === id;
  const error = !busy && c.state?.id === id ? c.state.error : undefined;
  return (
    <form action={c.run} onSubmit={(e) => { c.send(id); keepValues(c.run)(e); }} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      {children}
      {error && <div role="alert" className="rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] bg-[rgba(226,162,59,.16)] text-[#6b4710]">{error}</div>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-sm justify-self-start" disabled={busy} aria-busy={busy}>{busy ? `${submit} …` : submit}</button>
      </div>
    </form>
  );
}
