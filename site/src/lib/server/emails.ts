import "server-only";
import { CONTACT } from "@/lib/facts";

/**
 * The account emails, in Norwegian and English. Plain text, short, and nothing a visitor typed except the name an
 * administrator gave the account, so they cannot be used to send someone else's words.
 */
type L = "no" | "en";
export type Mail = { subject: string; text: string };

const first = (name: string) => name.trim().split(/\s+/)[0] || "";
const when = (lang: L, d = new Date()) =>
  d.toLocaleString(lang === "no" ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** "Forgot password": the link for a new password. */
export function resetMail(lang: L, name: string, url: string, hours: number): Mail {
  return lang === "en"
    ? { subject: "New password for the Knotten portal", text: `Hi ${first(name)},\n\nSomeone (hopefully you) asked for a new password for the Knotten portal. The link below lasts ${hours} hours and works once:\n\n${url}\n\nIf it was not you, you can ignore this email. Your password stays as it is.\n` }
    : { subject: "Nytt passord til Knotten-portalen", text: `Hei ${first(name)},\n\nNoen (forhåpentlig du) ba om nytt passord til portalen for Knotten. Lenken under gjelder i ${hours} timer og kan brukes én gang:\n\n${url}\n\nHvis det ikke var deg, kan du se bort fra denne e-posten. Passordet ditt er som før.\n` };
}

/** An administrator invites someone, or makes a new invitation or password link for them. */
export function linkMail(lang: L, kind: "invite" | "reset", name: string, url: string, hours: number, from?: string): Mail {
  const days = Math.round(hours / 24);
  const valid = hours >= 48 ? (lang === "en" ? `${days} days` : `${days} dager`) : lang === "en" ? `${hours} hours` : `${hours} timer`;
  if (kind === "invite") {
    return lang === "en"
      ? { subject: "Invitation to the Knotten portal", text: `Hi ${first(name)},\n\n${from ? `${from} has given you` : "You have been given"} access to the Knotten project portal.\n\nChoose a password here (the link lasts ${valid}):\n${url}\n\nKind regards\nKnotten\n` }
      : { subject: "Invitasjon til Knotten-portalen", text: `Hei ${first(name)},\n\n${from ? `${from} har gitt deg` : "Du har fått"} tilgang til prosjektportalen for Knotten.\n\nVelg passord her (lenken gjelder i ${valid}):\n${url}\n\nVennlig hilsen\nKnotten\n` };
  }
  return lang === "en"
    ? { subject: "New password for the Knotten portal", text: `Hi ${first(name)},\n\nChoose a new password here (the link lasts ${valid}):\n${url}\n\nKnotten\n` }
    : { subject: "Nytt passord i Knotten-portalen", text: `Hei ${first(name)},\n\nVelg nytt passord her (lenken gjelder i ${valid}):\n${url}\n\nKnotten\n` };
}

/** Sent after every password change, so a change the person did not make is noticed. */
export function passwordChangedMail(lang: L, name: string): Mail {
  return lang === "en"
    ? { subject: "Your Knotten password was changed", text: `Hi ${first(name)},\n\nThe password for your account in the Knotten portal was changed ${when("en")} (Norwegian time). Other sessions on the account were logged out.\n\nIf you did not do this, ask for a new password on the login page at once, and tell ${CONTACT.company} (${CONTACT.email}).\n` }
    : { subject: "Passordet ditt til Knotten er endret", text: `Hei ${first(name)},\n\nPassordet til kontoen din i Knotten-portalen ble endret ${when("no")}. Andre innlogginger på kontoen ble logget ut.\n\nHvis det ikke var deg, be om nytt passord på innloggingssiden med en gang, og si fra til ${CONTACT.company} (${CONTACT.email}).\n` };
}

// ------------------------------------------------------------------ buyers' own accounts (Min side)
/*
 * Emails to buyers carry no name and nothing else a visitor typed. The sign-up form is public, so anyone can type
 * any address into it; these emails must never carry someone else's words to that address. Only the site's own
 * links and the project's contact details go in.
 */
const SIGN = { no: `Vennlig hilsen\nKnotten, ${CONTACT.company}`, en: `Kind regards\nKnotten, ${CONTACT.company}` };

/** A buyer confirms the address: with a password to choose (signed up while email was on), or only a click. */
export function verifyMail(lang: L, url: string, hours: number, choosePassword: boolean): Mail {
  return lang === "en"
    ? { subject: "Confirm your email address for Knotten", text: `Hello,\n\nThank you for following Knotten. ${choosePassword ? "Confirm the address and choose a password here" : "Confirm the address here"} (the link lasts ${hours} hours and works once):\n\n${url}\n\nIf you did not create an account, you can ignore this email.${choosePassword ? " The account is then deleted by itself after seven days." : ""}\n\n${SIGN.en}\n` }
    : { subject: "Bekreft e-postadressen din hos Knotten", text: `Hei,\n\nTakk for at du vil følge Knotten. ${choosePassword ? "Bekreft adressen og velg passord her" : "Bekreft adressen her"} (lenken gjelder i ${hours} timer og kan brukes én gang):\n\n${url}\n\nHar du ikke opprettet noen konto, kan du se bort fra denne e-posten.${choosePassword ? " Kontoen slettes da av seg selv etter sju dager." : ""}\n\n${SIGN.no}\n` };
}

/** Someone signed up with an address that already has an account: nothing changes, and the owner is told how to get in. */
export function alreadyMail(lang: L, loginUrl: string): Mail {
  return lang === "en"
    ? { subject: "You already have a Knotten account", text: `Hello,\n\nSomeone, hopefully you, tried to create a Knotten account with this email address. The address already has an account, so nothing has changed.\n\nLog in here:\n${loginUrl}\n\nIf you have forgotten the password, choose "Forgot your password?" on the login page.\n\nIf it was not you, you can ignore this email.\n\n${SIGN.en}\n` }
    : { subject: "Du har allerede en konto hos Knotten", text: `Hei,\n\nNoen, forhåpentlig du, prøvde å opprette en konto hos Knotten med denne e-postadressen. Adressen har allerede en konto, så ingenting er endret.\n\nLogg inn her:\n${loginUrl}\n\nHar du glemt passordet, velg «Glemt passord?» på innloggingssiden.\n\nVar det ikke deg, kan du se bort fra denne e-posten.\n\n${SIGN.no}\n` };
}

/** The address is confirmed: the account is ready, with the way to Min side. */
export function welcomeMail(lang: L, minSideUrl: string): Mail {
  return lang === "en"
    ? { subject: "Welcome to Knotten", text: `Hello,\n\nYour email address is confirmed, and your Knotten account is ready. On My page you follow the plots, find the houses you have saved and decide what we may send you:\n\n${minSideUrl}\n\nThere you can also download or delete your data whenever you like.\n\n${SIGN.en}\n` }
    : { subject: "Velkommen til Knotten", text: `Hei,\n\nE-postadressen din er bekreftet, og kontoen din hos Knotten er klar. På Min side følger du tomtene, finner husene du har lagret og bestemmer hva vi kan sende deg:\n\n${minSideUrl}\n\nDer kan du også laste ned eller slette dataene dine når du vil.\n\n${SIGN.no}\n` };
}

/** To the new address: the link that makes it the account's address. */
export function emailChangeMail(lang: L, url: string, hours: number): Mail {
  return lang === "en"
    ? { subject: "Confirm your new email address for Knotten", text: `Hello,\n\nThis address has been given as the new address for a Knotten account. Confirm it here (the link lasts ${hours} hours and works once):\n\n${url}\n\nIf it was not you, you can ignore this email. Then nothing changes.\n\n${SIGN.en}\n` }
    : { subject: "Bekreft den nye e-postadressen din hos Knotten", text: `Hei,\n\nDenne adressen er oppgitt som ny adresse for en konto hos Knotten. Bekreft her (lenken gjelder i ${hours} timer og kan brukes én gang):\n\n${url}\n\nVar det ikke deg, kan du se bort fra denne e-posten. Da endres ingenting.\n\n${SIGN.no}\n` };
}

/** To the old address once the new one is confirmed, so a change the owner did not make is noticed. */
export function emailChangedMail(lang: L, maskedNew: string): Mail {
  return lang === "en"
    ? { subject: "The email address of your Knotten account was changed", text: `Hello,\n\nThe email address of your Knotten account was changed to ${maskedNew} on ${when("en")} (Norwegian time). Emails from us go there from now on.\n\nIf you did not do this, tell ${CONTACT.company} at ${CONTACT.email} at once.\n\n${SIGN.en}\n` }
    : { subject: "E-postadressen for kontoen din hos Knotten er endret", text: `Hei,\n\nE-postadressen for kontoen din hos Knotten ble endret til ${maskedNew} ${when("no")}. E-post fra oss går dit fra nå av.\n\nVar det ikke deg, si fra til ${CONTACT.company} på ${CONTACT.email} med en gang.\n\n${SIGN.no}\n` };
}

/** After a buyer changed the password (the portal's own notice names the portal and the person). */
export function memberPasswordChangedMail(lang: L): Mail {
  return lang === "en"
    ? { subject: "Your Knotten password was changed", text: `Hello,\n\nThe password for your Knotten account was changed on ${when("en")} (Norwegian time). Other sessions on the account were logged out.\n\nIf you did not do this, ask for a new password on the login page at once, and tell ${CONTACT.company} at ${CONTACT.email}.\n\n${SIGN.en}\n` }
    : { subject: "Passordet ditt hos Knotten er endret", text: `Hei,\n\nPassordet til kontoen din hos Knotten ble endret ${when("no")}. Andre innlogginger på kontoen ble logget ut.\n\nVar det ikke deg, be om nytt passord på innloggingssiden med en gang, og si fra til ${CONTACT.company} på ${CONTACT.email}.\n\n${SIGN.no}\n` };
}

/** "Forgot password" for a buyer's account: the same link as for the portal, without the name. */
export function memberResetMail(lang: L, url: string, hours: number): Mail {
  return lang === "en"
    ? { subject: "New password for your Knotten account", text: `Hello,\n\nSomeone, hopefully you, asked for a new password for your Knotten account. The link below lasts ${hours} hours and works once:\n\n${url}\n\nIf it was not you, you can ignore this email. Your password stays as it is.\n\n${SIGN.en}\n` }
    : { subject: "Nytt passord til kontoen din hos Knotten", text: `Hei,\n\nNoen, forhåpentlig du, ba om nytt passord til kontoen din hos Knotten. Lenken under gjelder i ${hours} timer og kan brukes én gang:\n\n${url}\n\nVar det ikke deg, kan du se bort fra denne e-posten. Passordet ditt er som før.\n\n${SIGN.no}\n` };
}

/** The account is gone; says what happened to the interest registration ("none": there was none). */
export function accountDeletedMail(lang: L, lead: "deleted" | "kept" | "none"): Mail {
  const en = { deleted: " Your interest registration has been deleted too.", kept: ` Your interest registration has been kept, as you chose. To have it deleted as well, write to ${CONTACT.email}.`, none: "" }[lead];
  const no = { deleted: " Interessemeldingen din er også slettet.", kept: ` Interessemeldingen din er beholdt, slik du valgte. Vil du at også den skal slettes, skriv til ${CONTACT.email}.`, none: "" }[lead];
  return lang === "en"
    ? { subject: "Your Knotten account has been deleted", text: `Hello,\n\nYour Knotten account was deleted on ${when("en")} (Norwegian time), together with the plots you followed, your consents and the houses you had saved.${en}\n\nThank you for your interest in Knotten.\n\n${SIGN.en}\n` }
    : { subject: "Kontoen din hos Knotten er slettet", text: `Hei,\n\nKontoen din hos Knotten ble slettet ${when("no")}, sammen med tomtene du fulgte, samtykkene dine og husene du hadde lagret.${no}\n\nTakk for interessen for Knotten.\n\n${SIGN.no}\n` };
}
