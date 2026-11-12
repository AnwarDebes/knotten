/**
 * The activity and login logs are written in Norwegian when something happens. The English pages
 * show the same lines in English; a line that matches none of these is shown as it was written.
 */
const RULES: [RegExp, string][] = [
  // logins and accounts (lib/server/accounts.ts, the login and admin actions)
  [/^logget inn$/, "logged in"],
  [/^mislykket innlogging$/, "failed login"],
  [/^logget ut$/, "logged out"],
  [/^logget ut på alle enheter$/, "logged out on all devices"],
  [/^endret passord$/, "changed password"],
  [/^ba om nytt passord$/, "asked for a new password"],
  [/^tok imot invitasjonen og valgte passord$/, "accepted the invitation and chose a password"],
  [/^valgte nytt passord med lenke$/, "chose a new password with a link"],
  [/^første oppsett: superadministrator opprettet$/, "first-time setup: super administrator created"],
  [/^invitasjon laget for (.+)$/, "invitation created for $1"],
  [/^lenke for nytt passord laget for (.+)$/, "password link created for $1"],
  [/^invitasjon fornyet for (.+)$/, "invitation renewed for $1"],
  [/^inviterte (\S+) som (.+)$/, "invited $1 as $2"],
  [/^endret (\S+): beboer på tomt (\d+)$/, "changed $1: resident of plot $2"],
  [/^endret (\S+): (.+)$/, "changed $1: $2"],
  // buyers' own accounts (lib/server/members.ts, lib/server/member-store.ts)
  [/^opprettet kjøperkonto \(venter på bekreftelse\)$/, "created a buyer account (awaiting confirmation)"],
  [/^opprettet kjøperkonto \(e-posten er ikke bekreftet\)$/, "created a buyer account (email not confirmed)"],
  [/^bekreftelseslenke laget for (.+)$/, "confirmation link created for $1"],
  [/^lenke for ny e-postadresse laget for (.+)$/, "link for a new email address created for $1"],
  [/^bekreftet e-postadressen og valgte passord$/, "confirmed the email address and chose a password"],
  [/^bekreftet e-postadressen$/, "confirmed the email address"],
  [/^endret e-postadressen med lenke$/, "changed the email address with a link"],
  [/^endret e-postadressen \(ikke bekreftet\)$/, "changed the email address (not confirmed)"],
  [/^kjøperkontoen ble slettet av eieren$/, "the buyer account was deleted by its owner"],
  [/^lastet ned egne data$/, "downloaded own data"],
  [/^(.+) endret valg på Min side$/, "$1 changed choices on My page"],
  [/^en interessent slettet seg selv$/, "a lead deleted their own registration"],
  [/^deaktiverte (.+)$/, "disabled $1"],
  [/^aktiverte (.+) igjen$/, "enabled $1 again"],
  [/^slettet kontoen til (.+)$/, "deleted the account of $1"],
  [/^avviste forespørsel om nytt passord fra (.+)$/, "declined the password request from $1"],
  [/^lastet ned sikkerhetskopi$/, "downloaded a backup"],
  // the administration (lib/store.ts activity)
  [/^(.+) registrerte interesse$/, "$1 registered interest"],
  [/^la inn interessent (.+)$/, "added lead $1"],
  [/^slettet interessent (.+)$/, "deleted lead $1"],
  [/^interessent (\S+): telles\/telles ikke$/, "lead $1: counted or not counted"],
  [/^interessent (\S+): (.+)$/, "lead $1: $2"],
  [/^notat på (.+)$/, "note on $1"],
  [/^eksempelinteressenter fjernet$/, "example leads removed"],
  [/^alle tomter: (.+)$/, "all plots: $1"],
  [/^tomt (\S+): (.+)$/, "plot $1: $2"],
  [/^nyhet: (.+)$/, "news: $1"],
  [/^nyhet vist\/skjult (.+)$/, "news item shown or hidden: $1"],
  [/^nyhet slettet (.+)$/, "news item deleted: $1"],
  [/^nyhet tatt ned: (.+)$/, "news item taken down: $1"],
  [/^milepæl publisert: (.+)$/, "milestone published: $1"],
  [/^innstillinger lagret$/, "settings saved"],
  [/^mål for nøkkeltall lagret$/, "key figure targets saved"],
];
/** Words inside the lines above: who did it, and a few values. */
const WORDS: [RegExp, string][] = [
  [/\bingen områder\b/g, "no areas"],
  [/^slettet konto (\w+)$/, "deleted account $1"],
  [/^registrering$/, "sign-up"],
  [/^Min side$/, "My page"],
  [/^glemt passord$/, "forgotten password"],
  [/^Nettsiden$/, "The website"],
];

export function logText(text: string, locale: "no" | "en"): string {
  if (locale === "no") return text;
  let out = text;
  for (const [re, en] of RULES) {
    if (re.test(out)) { out = out.replace(re, en); break; }
  }
  for (const [re, en] of WORDS) out = out.replace(re, en);
  return out;
}
