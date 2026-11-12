"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePreview } from "@/components/portal/PreviewContext";
import { problemOf, STORAGE_MESSAGE } from "@/lib/errors";
import { endPreview } from "./actions";

/**
 * When a portal page fails (a service that does not answer, a change without the right access, no storage): say so
 * and offer a way on. The reason is read from the error's digest, which production keeps (the message it hides).
 */
export default function PortalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { locale } = useParams<{ locale: string }>();
  const no = locale !== "en";
  const preview = usePreview();
  const problem = problemOf(error);
  const forbidden = problem === "forbidden";
  const storage = problem === "storage";
  if (preview || problem === "preview") {
    return (
      <div className="panel p-7 md:p-9 max-w-[62ch] grid gap-4">
        <h1 className="display text-[28px]">{no ? "Endringer er slått av i forhåndsvisningen" : "Changes are switched off in the preview"}</h1>
        <p className="text-[15.5px] text-ink-2">{no ? "Du ser portalen som en annen, så ingenting lagres i deres navn. Avslutt forhåndsvisningen for å gjøre endringer som deg selv." : "You are viewing the portal as someone else, so nothing is saved in their name. End the preview to make changes as yourself."}</p>
        <form action={endPreview}><input type="hidden" name="lang" value={no ? "no" : "en"} /><button className="btn btn-sm">{no ? "Avslutt forhåndsvisningen" : "End the preview"}</button></form>
      </div>
    );
  }
  return (
    <div className="panel p-7 md:p-9 max-w-[62ch] grid gap-4">
      <h1 className="display text-[28px]">{forbidden ? (no ? "Du har ikke tilgang til å gjøre dette" : "You do not have access to do this") : storage ? (no ? "Endringen ble ikke lagret" : "The change was not saved") : (no ? "Noe gikk galt" : "Something went wrong")}</h1>
      <p className="text-[15.5px] text-ink-2">
        {forbidden
          ? (no ? "Kontoen din har ikke rettighetene som trengs for denne handlingen. Spør en administrator om du mener du skal ha det." : "Your account lacks the rights this action needs. Ask an administrator if you think you should have them.")
          : storage
            ? STORAGE_MESSAGE[no ? "no" : "en"]
            : (no ? "Siden kunne ikke vises akkurat nå. Prøv igjen; hvis det fortsetter, si fra til prosjektet." : "The page could not be shown right now. Try again; if it keeps happening, tell the project.")}
      </p>
      {error.digest && !problem && <p className="text-[12.5px] text-muted">{no ? "Feilkode" : "Error code"}: {error.digest}</p>}
      <div className="flex flex-wrap gap-2">
        {!forbidden && !storage && <button type="button" className="btn btn-sm" onClick={() => retry()}>{no ? "Prøv igjen" : "Try again"}</button>}
        <Link className="btn btn-sm btn-ghost btn-plain no-underline" href={`/${no ? "no" : "en"}/portal`}>{no ? "Til portalens forside" : "To the portal home"}</Link>
      </div>
    </div>
  );
}
