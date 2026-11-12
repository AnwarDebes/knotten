"use client";
import Link from "next/link";
import { plotNo } from "@/lib/format";
import { registerPath } from "@/lib/member-paths";
import { useFollow } from "@/components/members/useFollow";

const T = {
  no: { follow: "Følg tomten", following: "Du følger tomten", stop: "Slutt å følge", failed: "Det gikk ikke. Prøv igjen.", plot: "tomt" },
  en: { follow: "Follow the plot", following: "You follow the plot", stop: "Unfollow", failed: "That did not work. Try again.", plot: "plot" },
};

/**
 * "Følg tomten" in the Klassisk look, for the plot picker (or plot pages when Klassisk gets them): a visitor gets a
 * link to sign-up with the plot chosen; a logged-in buyer follows or stops following.
 * Usage: <KFollowPlotButton plotId="plot-07" locale="no" />
 */
export default function KFollowPlotButton({ plotId, locale }: { plotId: string; locale: "no" | "en" }) {
  const t = T[locale];
  const { who, following, pending, error, toggle } = useFollow(plotId);
  if (who === "other") return null;
  if (who === "visitor") return <Link className="btn sm ghost" href={`${registerPath("klassisk", locale)}?tomt=${plotNo(plotId)}`}>{t.follow}</Link>;
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: 10 }} lang={locale === "en" ? "en" : undefined}>
      <button type="button" className={`btn sm${following ? "" : " ghost"}`} onClick={toggle} disabled={pending || following === null} aria-pressed={!!following} aria-busy={pending}>
        {following ? t.following : t.follow}<span className="sr"> ({t.plot} {plotNo(plotId)})</span>
      </button>
      {following && <button type="button" className="linkish" onClick={toggle} disabled={pending}>{t.stop}</button>}
      <span role="status" className="small">{error ? t.failed : ""}</span>
    </span>
  );
}
