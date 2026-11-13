"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { followPlot, followState, unfollowPlot } from "@/lib/server/members";
import { useSession } from "@/lib/session-client";
import { loginPagePath } from "@/lib/member-paths";
import { readAddress } from "@/lib/pages";

/**
 * A "follow this plot" button's state for the plot pages in both designs. The pages are static, so the button asks
 * the server once whether a logged-in buyer follows the plot, and then follows or stops following it with the
 * shared actions (lib/server/members.ts). `who` says what to draw: "visitor" (a link to sign-up), "member" (the
 * button), "other" (a project account: nothing to follow with). A session that ran out on the way sends the person
 * to the login page of the design and language, and back here afterwards.
 */
export function useFollow(plotId: string) {
  const session = useSession();
  const router = useRouter();
  const path = usePathname() ?? "/";
  const who: "visitor" | "member" | "other" = !session ? "visitor" : session.kind === "member" ? "member" : "other";
  const [following, setFollowing] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (who !== "member") return;
    let live = true;
    followState(plotId).then((r) => { if (live && r.ok) setFollowing(r.following); }).catch(() => undefined);
    return () => { live = false; };
  }, [who, plotId]);
  const toggle = () =>
    start(async () => {
      setError(false);
      const r = following ? await unfollowPlot(plotId) : await followPlot(plotId);
      if (r.ok) setFollowing(r.following);
      else if (r.reason === "login") {
        const { design, lang } = readAddress(path);
        router.push(`${loginPagePath(design, lang)}?next=${encodeURIComponent(path)}`);
      } else setError(true);
    });
  return { who, following, pending, error, toggle };
}
