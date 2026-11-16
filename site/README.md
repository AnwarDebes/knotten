# Knotten: the website and the project portal (site)

Next.js 16.4, React 19, three.js with react-three-fiber, Tailwind 4, TypeScript.
The public site in two designs and two languages, buyer accounts with Min side, a house configurator, and the project portal behind a login: data room, resident portal, energy dashboard with smart control and energy sharing, project room, documents, municipality and research rooms, and the administration with the key figures the project owner asked for.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000  (Klassisk at / and /english, Moderne at /no and /en)
npm run build && npm run start
npm run lint
```

Node.js 20.9 or newer. Copy `.env.example` to `.env.local` if you need any variable; empty values are fine for a first local run (records go to `data/`, email is off).

## Two designs, one site

The site carries two designs with the same content, and the visitor chooses with the strip above the header ("Utseende: Klassisk | Moderne").

| | Klassisk (default) | Moderne |
|---|---|---|
| Addresses | Norwegian at `/`, `/tomtene`, `/prosjektet`, ...; English under `/english/...` with the same path names | `/no/...`, `/en/...` |
| Code | `src/app/(klassisk)`, `src/app/(klassisk-en)`, `src/components/klassisk`, `src/lib/klassisk`, `public/img` | `src/app/(moderne)`, `src/components/ui`, `scene`, `charts`, `portal` |
| Styles | `src/app/(klassisk)/globals.css`, plain CSS | `src/app/(moderne)/globals.css`, Tailwind 4 |

- Each design is its own root layout (a route group), so their stylesheets never meet: switching is a full page load. English Klassisk has its own root layout in `src/app/(klassisk-en)`. Moderne's root layout is `src/app/(moderne)/[locale]/layout.tsx`, once per language.
- Both designs are in Norwegian and English: the pages, page titles and link previews (`src/lib/meta.ts` for Moderne), the emails people receive and the weekly summary (its language is a setting). The portal is in both languages too. A new Moderne page needs `export const generateMetadata = pageMeta(...)` and the line `if (!isLocale(l)) notFound();` after it reads its locale.
- **The page registry, `src/lib/pages.ts`,** lists every page once: its address in each design, its name and a line about it in both languages, where each design's header, menu and footer link to it, and how search engines and the visitor statistics treat it. The design switch (`src/lib/design.ts`), the headers, menus and footers of both designs, the sitemap, robots.txt and the statistics are built from it. Add a new page there; a page that exists in only one design names the closest page in the other (`twin`).
- The switch (`src/components/DesignSwitch.tsx`) remembers the choice in a cookie. `src/proxy.ts` sends a visitor who chose Moderne from `/` to `/no` and from `/english` to `/en`, and a visitor without a login cookie from the portal or Min side to the login page of their design and language. Links to a specific page always open that page. The proxy is a shortcut only: every portal page and Min side check the signed session themselves.
- Shared by both: the content (`src/lib/content`, below), the facts (`src/lib/facts`), the interest form (`/api/leads`, the source says which design), the visitor statistics (`/api/collect`), the login actions, the configurator's logic, Knotten AI and the project portal, which has one look (Moderne) for both. `src/app/global-not-found.tsx` is the 404 for unknown addresses (Klassisk look, with its own small stylesheet: every route carries this page, so anything it imports, such as Klassisk's fonts, would otherwise be preloaded on the Moderne pages too); `src/app/(moderne)/[locale]/not-found.tsx` covers missing Moderne pages in the visitor's language.
- If one design is chosen later: remove `DesignSwitch`, `design.ts`, the design half of `proxy.ts` and the other design's pages and components. The leads API, `src/lib` (store, auth) and the portal stay either way. Dropping Klassisk also means moving the front page back to `/` (or redirecting `/` to `/no`) and replacing `global-not-found.tsx`.

## What is where

The Klassisk column gives the Norwegian address; the English page is the same path after `/english`. The Moderne column gives the path after `/no` or `/en`.

| Page | Klassisk | Moderne |
|---|---|---|
| Front page, with the 3D journey and the weather and power price right now (`/api/now`) | `/` | (front page) |
| Plot picker and a page per plot | `/tomtene`, `/tomtene/[nr]` | `/tomter`, `/tomter/[id]` (`plot-NN`) |
| The view | (opens `/galleri`) | `/utsikt` |
| The area, maps and photos | `/kart`, `/galleri` | `/omradet` (sections `#kart`, `#bilder`) |
| Energy; the buildings that stand today, with measured history once the owner loads and publishes it in the portal | `/energi`, `/eksisterende-bygg` | `/energi`, `/energi/eksisterende` |
| The project, status and questions, news | `/prosjektet`, `/status`, `/nyheter` | `/prosjektet`, `/status`, `/nyheter` |
| Team, and a page per person | `/teamet`, `/teamet/[slug]` | `/team`, `/team/[slug]` |
| Investors, document bank, sources | `/investorer`, `/dokumentbank`, `/kilder` | `/investor`, `/dokumenter`, `/kilder` |
| House configurator | `/konfigurator` | `/konfigurator` |
| Contact and the interest form (posts to `/api/leads`) | `/kontakt` (both) | `/kontakt`, `/interesse` |
| Privacy | `/personvern` | `/personvern` |
| Login, first-time setup, invitation and new-password links | `/logg-inn`, `/logg-inn/passord` | `/login`, `/login/passord` |
| Sign-up and Min side | `/registrer`, `/min-side` | `/registrer`, `/min-side` |
| The project portal, see below | (uses Moderne's) | `/portal/...` |

Shared content: `src/lib/content` holds what both designs say, written once per subject in both languages (`home.ts`, `plots.ts`, `energy.ts`, `buildings.ts`, `project.ts`, `status.ts`, `faq.ts`, `investors.ts`, `documents.ts`, `sources.ts`, `contact.ts`, `company.ts`, `privacy.ts`, `maps.ts`, `photos.ts`, `credits.ts`, `jsonld.ts`). Each design keeps its own markup and look. Numbers, dates and contact details come from `src/lib/facts` (see "Data and assumptions").

Public pages and the database: plot status and price, the status line and company facts, published news, the configurator's price list and the published meter readings are read through a tagged cache (`src/lib/server/publicRecords.ts`). The action or route that changes one of them names its tag, and the next page load reads storage again; the cache also asks storage again once an hour. When the database does not answer, a page still renders with the cached value, else the last value the server read, else the starting point in the code, and such a page is made again after a minute.

## The house configurator

`/konfigurator` in both designs and both languages. The steps are plot, house, facade and roof, energy, interior and outdoors (`src/lib/configurator/catalog.ts`); the house is the model's example house, an illustration, and the choices are wishes passed on to the project owner, not an offer. `state.ts` keeps the configuration in the address, so a link reopens the same house, and a draft is kept in the browser. Each design has its own page components (`src/components/configurator/klassisk` and `moderne`) on shared logic (`useConfigurator.ts`).

- Prices: the catalogue has none. An administrator sets the price list in the portal (`/no/portal/admin/konfigurator`, "Husvalg og priser"); until then a choice says "Pris på forespørsel". Pages read the list through `/api/configurator/prices` and the public cache.
- Saved houses: a logged-in buyer saves configurations to Min side (`/api/configurator/saved`).
- "Send the setup": `/api/configurator/send` creates or updates a lead and stores the configuration with the lead's id only (`src/lib/server/configurations.ts`). Every configuration is cleaned before it is stored: unknown options are dropped and a choice the plot cannot take falls back to the standard.

## The project portal

One login for everyone who works with the project. Three roles, as the project owner asked: **user**, **administrator** and **super administrator**. A user opens only the areas given to them; administrators open everything and run the administration; super administrators also manage administrators and see the security log.

| Area (`/no/portal/...`) | What |
|---|---|
| (overview) | greeting, readiness checklist for the owner, the person's areas, new documents, milestones or news, open questions |
| `investor` | data room: saving, running costs, scalability, innovation and ESG from the energy budget; scenario explorer; documents; questions and answers |
| `resident` | "Mitt hjem": the resident's plot, energy now, documents for the home, consents, requests |
| `energy` | live NO2 power price (hvakosterstrommen.no) and MET weather at the plot, solar forecast, the year in balance, the borehole field |
| `energy/optimering` | smart control: the cheapest plan for battery, hot water and car on today's and tomorrow's real prices (exact optimisation in the browser) |
| `energy/deling` | energy sharing between the 30 homes, the office building, a shared battery and the shared solar plant, as a yearly estimate |
| `energy/eksisterende` | meter import (Elhub or supplier CSV), upgrades with before and after, publish to the public pages |
| `energy/smarthjem`, `twin` | the equipment and its interfaces (placeholder until there are homes); the 3D twin with `/api/energy/frame` |
| `project` | task board, decision log, milestones (a reached milestone is published to the news page with one click), documents, discussion |
| `dokumenter` | every document shared with the person; uploads, versions, download log; the checklist of the working documents the public document bank refers to (`src/lib/docRegister.ts`), uploaded under their titles |
| `municipality` | printable regulation basis (`municipality/rapport`), GeoJSON in EPSG:25832 or WGS84 (`/api/geo`), road grades, questions and remarks |
| `research` | the datasets with fields, licence and citation, counted downloads (`/api/datasett/...`) |
| `admin` | key figures (registrations, conversion, investor interest, website engagement, stakeholder participation, reply time) with targets; leads; website visits and Knotten AI questions; plots and prices; the configurator's price list; news; users and access; settings, service status, the weekly summary and the backup download; features and status (the owner's six feedback points, with live state) |
| `konto` | profile, password, log out everywhere |

How it is built:

- Accounts and sessions: `src/lib/server/accounts.ts`, `src/lib/auth.ts`. Passwords are scrypt hashes; the session cookie is httpOnly and signed (HMAC); a changed password or "log out everywhere" ends all older sessions; attempts are counted before the password is checked (5 per address and network, 20 per address and 30 per network in 15 minutes); the password list refuses a few thousand common passwords in Norwegian and English. Invitations last 7 days and password links 24 hours; only their hashes are stored.
- Every portal page checks access itself (`src/lib/server/portal.ts`), and every server action checks the acting person (`actor()` in `src/lib/auth.ts`). The sidebar is not a lock.
- Records: `src/lib/store.ts` (leads, plots, news, settings), `src/lib/server/records.ts` (documents, questions, workspace, consents, meters), all through `src/lib/server/kv.ts`.
- Files: `src/lib/server/files.ts`; downloads go only through `/api/files/[id]`, which checks access and logs.
- Visitor statistics: `src/components/Track.tsx` and `/api/collect`, counted in `src/lib/server/stats.ts` without cookies or stored addresses; logged-in people, robots and Do Not Track are not counted.
- "Se som" (view as): an administrator sees the portal as an investor, the municipality, a researcher, the project group or a resident. A cookie narrows the administrator's own session (`getSession` in `src/lib/auth.ts`); it can never widen anyone's access, and changes are switched off while it is on.
- Knotten AI (the chat on the pages of both designs, `src/components/ui/Chat.tsx`): `/api/ask` and `src/lib/server/assistant.ts` answer from the project's own data, including the NO2 power price and MET weather right now. With a language model configured (`ANTHROPIC_API_KEY` and `KNOTTEN_AI_MODEL`), questions the data does not cover go to it with the same facts, up to a daily number of calls (`KNOTTEN_AI_DAILY_LIMIT`, `src/lib/server/aiBudget.ts`); over that number it answers from the data only. Topics are counted and unanswered questions kept (without emails or numbers) for the owner under Website visits.
- Weekly summary: `src/lib/server/digest.ts`, sent by Vercel Cron (`vercel.json`, Mondays 06:00 UTC) through `/api/cron/digest` when switched on in Settings. Settings shows a preview and can send a test.
- Backup: `/api/backup` gives administrators everything stored as one JSON file (accounts without passwords; document files are listed, not included).
- The public document bank (both designs) links its internal documents to `/no/portal/dokumenter?dok=key`, through the login.

## Buyer accounts and Min side

Buyers make their own accounts. These are "members" (`kind: "member"` on the account; a missing `kind` means a project stakeholder invited into the portal). A member has no areas and never enters the portal: `portalPage()` and the portal layout send them to Min side, `can()` is false for them on every area, `actor()` and the portal's own actions refuse them, and the document audience "all" means every stakeholder, never a member (`canSeeDoc` in `src/lib/server/records.ts`).

| Page | Klassisk | Moderne |
|---|---|---|
| Sign-up | `/registrer`, `/english/registrer` (`?tomt=7` or `?plot=plot-07` chooses plots) | `/no/registrer`, `/en/registrer` |
| Min side | `/min-side`, `/english/min-side` | `/no/min-side`, `/en/min-side` |
| Data export | `/api/min-side/eksport` (JSON, own session, refused when another site sends the browser) | same |

The Klassisk components (`src/components/klassisk/members`) take a `locale` prop and carry both languages. The Moderne ones are in `src/components/members`. Both post to the same server actions in `src/lib/server/members.ts`; the records behind them are in `src/lib/server/member-store.ts` (record set `members`: followed plots, the consent log, the purpose from sign-up, the link to the person's own lead). Addresses for both designs come from `src/lib/member-paths.ts`, the words from `src/lib/member-text.ts`.

**How sign-up works depends on email.** `signupByEmail()` in `src/lib/server/member-store.ts` decides it, and the page and the action always agree:

- **With email** (`MAIL_FROM` with Resend or SMTP, and the site's address, `SITE_URL` in production): a self-invitation. The form asks for no password. A pending account is made with the consents that were ticked, and a link (kind `verify`, 48 hours) is emailed. The link opens the password page in the design and language of the sign-up; opening it changes nothing (mail scanners may open links), choosing the password confirms the address, activates the account, writes the sign-up to the leads (`recordLead`, source `registrering`, `verified`) and sends a welcome email. The answer on the form is always "Sjekk e-posten din", whatever the address's state, and the work is done after the answer, so neither the words nor the timing tell whether an address has an account: an address with an account gets "you already have an account" by email instead, a pending sign-up gets its link again (3 sign-ups per address a day, 5 per network an hour), an invited stakeholder gets the invitation again. Unconfirmed sign-ups are deleted after 7 days by `/api/cron/cleanup`, with what they kept.
- **Without email (the fallback, and the owner's choice for now):** the form also asks for a password, the account is active at once and the person is logged in. The address is *not* confirmed (`email_verified_at` stays unset) and Min side says "E-posten din er ikke bekreftet ennå". The choices (plots, news, plot alerts) are stored on the account, but the lead gets the consents only once the address is confirmed, and nothing at all is emailed to an unconfirmed address (`mayEmail()`); any future newsletter or plot alert must check the same. Without email the site cannot keep secret whether an address has an account, so a taken address is refused in plain words. When email is switched on later, Min side offers "Send bekreftelseslenke" to confirm the address; an administrator's password link confirms it too.
- **Without storage** (Vercel without a database) every form and action answers with the storage message, and the sign-up page shows it instead of the form.

Logging in sends a member to Min side in the design and language of the login page (or to the page they came for), and a stakeholder to the portal. A pending member who types the right password gets a fresh link. The greeting cookie carries `kind: "member"`, so a header can link to Min side instead of the portal.

Min side, in both designs: **Mine tomter** (followed plots with the status and price set in the admin's Plots and prices; a follow is also written to the person's lead with source `min side`), **Lagrede hus** (saved configurations, each opening the configurator with its state), **Varsler** (news and plot alerts; every switch appends a consent event with the text id and the privacy version), **Profil** (name, phone, the language and design for emails and links; a new email address gets a link and the old address a notice, and the person's own lead moves to the new address), **Passord og innlogging** (change password, log out everywhere), **Mine data** (the JSON export) and **Slett konto** (confirmed with the password: the account, its links, saved houses, follows and consent log go; the person's own lead goes too unless they untick it; the security log loses the address; a confirmation email goes to a confirmed address).

Emails to buyers (`src/lib/server/emails.ts`) are plain text in Norwegian and English and carry nothing a visitor typed, not even the name: confirmation, "you already have an account", welcome, new address (to the new one), address changed (to the old one), password changed, new password, account deleted.

For plot pages: `followPlot(plotId)`, `unfollowPlot(plotId)` and `followState(plotId)` in `src/lib/server/members.ts`, and ready buttons `src/components/members/FollowPlotButton.tsx` (Moderne) and `src/components/klassisk/members/FollowPlotButton.tsx` (Klassisk). A visitor gets a link to sign-up with the plot chosen.

In the admin, Users and access lists project accounts and buyer accounts apart. A buyer account can be disabled, deleted (with its saved houses and follows; the lead stays) or made a resident of a plot, which turns it into a project account with the My home area.

## Where data is kept

`src/lib/server/kv.ts` chooses the storage when the server starts:

| Mode | When | Records | Files |
|---|---|---|---|
| kv | one complete pair is set: `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Vercel's Redis/Upstash integration sets them) | Redis over HTTPS, keys `<KV_PREFIX>:*` | Vercel Blob, private (`BLOB_READ_WRITE_TOKEN`, or `BLOB_STORE_ID` with the deployment's OIDC token) |
| file | no database and not on Vercel: a computer or one normal server process | `data/crm.json` (leads, plots, news, settings) and `data/private/*.json` | `data/private/files/` |
| temp | on Vercel without a database | nothing is kept: the site fails closed (below) | none |

How it stays correct:

- **No lost changes.** Every record set is one JSON document with a version beside it (`<prefix>:ver:<key>`). `mutate()` reads both, applies the change and saves only if the version is unchanged, in one Lua script (Upstash's REST API runs `EVAL`; it has no `WATCH`). If another server got there first, it reads again and retries (up to 16 times within 8 seconds, with random waits). Changes from the same server wait for each other first. The change function can therefore run more than once and must only change the value it is given.
- **Small atomic keys** (`<prefix>:x:*`) for what changes with every attempt: `incr(key, ttlSec)` (an `INCRBY` that starts its expiry with the first count), `setNX(key, value, ttlSec?)`, `getDel(key)`, `getValue(key)` and `ttl(key)`. Login, setup, password-reset and form limits count each attempt this way *before* a password or code is checked (`src/lib/server/limit.ts`), so a burst in parallel cannot slip past a limit.
- **The first seed wins.** The accounts' record set (with the session secret) is created with `SET NX`, so every server signs sessions with the same secret even when several start at once.
- **A failed read never wipes data.** In file mode only a missing file counts as empty; any other failure (a damaged file, no access) is an error and nothing is written. On Windows, a file held open by an indexer or antivirus is retried before giving up.
- **Fail closed without a database on Vercel (temp mode).** Reads give each record set's starting point, so the public pages render. Every write throws `StorageUnavailableError`; the forms and actions answer "Lagring er ikke satt opp ennå. Prøv igjen senere eller send en e-post." (English on English pages), the login pages say so instead of showing a setup that cannot be saved, and Settings shows storage in red.
- **Previews never touch production.** `KV_PREFIX` (default `knotten`, or `knotten-preview` when `VERCEL_ENV` is `preview`) starts every key. Give preview deployments their own database as well if you can.

Accounts stay in one record set (`auth`) changed by compare-and-set, rather than one key per account: every page that lists accounts keeps working unchanged, and logins no longer rewrite it for failed attempts (those are the atomic counters above). Account records already carry `kind` (missing means a project stakeholder), the status `pending` and `email_verified_at` for buyers' own accounts.

Leads keep an append-only consent log (`consent_log`, events from `src/lib/consent.ts`); the three yes/no flags are read from it. Leads saved before the log are given one when read: each flag that was on becomes an event with the text and privacy version `legacy`, source `admin` and the lead's creation time. A registration with an address that is already known changes nothing on that lead (anyone can type someone else's email); the new details are kept as a note.

Retention: `/api/cron/cleanup` (daily, `vercel.json`, with the `CRON_SECRET` bearer like the weekly summary) deletes leads 24 months after the last contact, accounts still `pending` after 7 days, and expired links.

`data/private/` holds password hashes, the session secret, uploaded files, counters and, in tests, the email outbox. It is in `.gitignore` and must never be committed.

`/api/health` tells anyone only whether the site is up and can keep records: `{ ok, storage }`, with `storage` `"ok"` or `"unavailable"`, and 503 when records cannot be kept (for an uptime monitor). A logged-in administrator also gets what the deployment runs on: `{ ok, storage, files, mail, siteUrl, turnstile, model, region, version, authSecret, cron, env }`, where `storage` is `kv`, `kv-unreachable`, `file` or `temp` and `files` is `blob`, `file` or `off`. Names and states only, never a key, a token or anyone's address. Use it after every deployment, logged in.

To test the Redis path without a database: run a small HTTP server that answers Upstash's REST commands (`GET`, `SET` with `NX`/`EX`, `MGET`, `INCRBY`, `EXPIRE`, `TTL`, `GETDEL`, `PING`, the statistics' `HINCRBY`/`HGETALL`/`SADD`, and `EVAL` of the four scripts in `kv.ts`, which name themselves on their first line) and point `KV_REST_API_URL` at it.

## Deploying (Vercel)

1. Import the repository in Vercel with `site` as the root directory. `vercel.json` puts the functions in Frankfurt (`fra1`); create the database in the same region.
2. Storage: add a Redis database (Upstash) from the Vercel marketplace with the environment variable prefix `KV`, and a private Blob store, and connect both to the project. Their variables are set automatically (the Blob store works through `BLOB_STORE_ID`, or `BLOB_READ_WRITE_TOKEN` on older stores). Without the database the site runs, but nothing can be saved (temp mode above).
3. Scheduled jobs: `vercel.json` has two, the weekly summary (`/api/cron/digest`, Mondays 06:00 UTC) and the cleanup (`/api/cron/cleanup`, daily 02:30 UTC). Both need `CRON_SECRET`; without it they do not run.
4. Security headers are set for every response in `next.config.ts`: a content security policy (everything from the site itself, plus Cloudflare Turnstile), no framing by other sites, no MIME sniffing, a referrer policy, a permissions policy and HTTPS only (HSTS). A new outside script, frame or font must be added there.
5. Environment variables. `.env.example` lists every one the app reads, with the same names as this table:

| Variable | Needed | What |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | yes | the Redis database's REST address and token; set by Vercel when the Upstash database is connected with the prefix `KV` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | instead of the KV pair | the same pair under Upstash's own names, read when the KV pair is not complete |
| `KV_PREFIX` | no | the start of every Redis key; default `knotten`, and `knotten-preview` on preview deployments |
| `BLOB_READ_WRITE_TOKEN` or `BLOB_STORE_ID` | for documents | set by Vercel when a Blob store is connected to the project: older stores get the token, newer ones the store id (the deployment then signs in with its own OIDC token, which Vercel provides). Either one switches uploads on; without both they are off, except on a computer without Redis, where files go to `data/private/files` |
| `AUTH_SECRET` | yes | at least 32 random characters that sign the login sessions (`openssl rand -base64 48`). A shorter value is ignored, and Settings says so. Without it the site signs with a key it makes itself and keeps with the accounts. Setting or changing it ends every session |
| `SITE_URL` | yes, with a custom domain | the public address, e.g. `https://knotten.no`: links in emails, link previews, robots.txt and the sitemap. Without it Vercel's production domain is used; the address a request claims is never used. Build again after changing it |
| `KNOTTEN_SETUP_CODE` | optional | a code of your own for the first-time setup; otherwise one is made, shared by all servers, and written to the server log. Remove it after the setup |
| `MAIL_FROM` | for email | the sender, e.g. `Knotten <post@knotten.no>`; needs `RESEND_API_KEY` or `SMTP_URL` |
| `RESEND_API_KEY` | for email | Resend API key (the sender's domain must be verified at Resend) |
| `SMTP_URL` | for email | any SMTP server instead of Resend, e.g. `smtps://user:password@smtp.example.com:465` |
| `MAIL_DEV_OUTBOX` | tests only | `1` writes every email as an `.eml` file to `data/private/outbox` instead of sending it; for a computer only |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | recommended | Cloudflare Turnstile on the public forms (the interest form, sign-up and the configurator's "send the setup"), in both designs; both or neither. The server checks each answer. The site key is read when the site is built: build again after changing it. Without them the forms rely on the hidden field, the time check and the limits per network and address |
| `CRON_SECRET` | yes | a long random text that Vercel Cron sends as a bearer token to the two scheduled jobs, so nobody else can start them |
| `ANTHROPIC_API_KEY` | optional | API key for the language model provider behind Knotten AI. Without the key and the model's name, Knotten AI answers from the data only |
| `KNOTTEN_AI_MODEL` | optional | the model's name; it is kept here and nowhere in the code |
| `ANTHROPIC_MODEL` | optional | older name for the same, read when `KNOTTEN_AI_MODEL` is empty |
| `KNOTTEN_AI_DAILY_LIMIT` | optional | most answers a day from the language model (Norwegian time): 200 when the variable is not set at all; `0` or an empty value switches the language model off |

   Set by the platform and read by the site; never set these yourself: `VERCEL` (without a database it switches storage to temp), `VERCEL_ENV` (preview deployments get their own `KV_PREFIX`), `VERCEL_PROJECT_PRODUCTION_URL` (the address when `SITE_URL` is empty), `VERCEL_REGION` and `VERCEL_GIT_COMMIT_SHA` (shown by `/api/health`), `npm_package_version` (the version `/api/health` shows when there is no commit) and `NODE_ENV`.

   Email without a provider: the portal shows invitation and password links to copy and queues password requests for the administrators; a failed send is queued the same way and shown in Settings.

6. Deploy, open `/logg-inn` (or `/no/login`) and complete the first-time setup with the setup code. The first account is the super administrator (the project owner's email is suggested). Everyone else is invited from Users and access.
7. Open `/api/health` while logged in as an administrator (see "Where data is kept") and Settings in the portal: they show which services are in place. On Vercel the site accepts documents up to 4 MB each (Vercel takes at most 4.5 MB in one request); on a normal server up to 25 MB.

On a normal server: `npm run build && npm run start`, set the same variables except KV and Blob, and keep `data/` on persistent disk with a backup. File mode is for one server process; run several processes only with the Redis variables set. Behind your own proxy, make sure it overwrites `X-Forwarded-For`: the limits per network read its first entry.

## The 3D model (`src/components/Stage.tsx`, `src/components/scene/*`, data in `public/twin`)

A digital twin of Knotten and its surroundings, built from measured data (`../pipeline/twin_*.py`, see the README one level up):

- **Terrain:** Kartverket's terrain model (NHM, 1 m near the field) in five nested rings out to 105 km (`ring_r0..r4`: heights in PNG, the aerial photo in WebP, masks in lossless WebP), meshed in a Web Worker without seams. Beyond 1.3 km the rings are laid out by true distance and direction and bend down with the earth's curvature (less refraction), so far ridges, the inland mountains and the sea's horizon stand where they do; the open sea runs on to 220 km. Beyond the 3D trees the woods are the canopy of Kartverket's surface model. Water is drawn by the terrain shader where the mask says water, so there is no second surface to flicker against (the old blinking sea); over the sea the nautical chart's depths (`ring_r2_d`, `ring_r3_d`) let the bottom show through the shallows as the aerial photo has it, and the Audna's brown water spreads at its mouth. For the built states the plan's pads, roads and gardens are graded into the inner ring (`ring_r0b_*`).
- **Buildings:** every building within 1.3 km with a surveyed outline, its roof shape and height fitted to the laser data (`buildings.glb`), and every other registered building out to 5.1 km that the laser data shows (`buildings_far.glb`, from Kartverket's building register: Vigeland, Snig, Lonestrand, the farms and cabins, Valle kirke with its tower; 16-bit positions to keep the file small).
- **Roads:** Statens vegvesen's road database (NVDB): every road out to 5.3 km painted into the ground at its recorded width, with its surface and the markings NVDB records (`ring_r*_r.png`, signed distance per texel, so the edges stay sharp), the bridges as 3D decks with railings (`roads.glb`), the guardrails of each recorded type, the guard stones and the street lights, lit at night (`road_objects.json`).
- **The 30 homes, outside** (`scene/house/exterior.ts`, drawn by `twin/TwinHouses.tsx`): the model's example house (`src/lib/house/plan.ts`, an illustration: the project has no house design yet) in the box `plots.json` gives every plot (11 x 8.5 m, eaves 3.2 m, ridge 5.6 m), fitted to its ground by `houses.json`: board-on-board cladding on a 0.35 m wall, real window openings with reveals, frames, sashes and sills, the front door with a canopy and a lamp, standing-seam steel roof with gutters, downpipes, snow guards, the ventilation hood and the solar modules on rails, the terrace on posts with a glass railing and a stair, and where the ground falls far enough a lower floor opening onto a patio on a dry-stone wall. One draw call per material for all 30 houses; behind the other houses' windows a room is drawn in the glass shader, lit at night.
- **Inside a house, on foot** (`scene/house/interior.ts`, `furniture.ts`, `lighting.ts`, `interiorMaterials.ts`, `HouseInterior.tsx`, `walk.ts`, `WalkRig.tsx`; the page's side in `src/components/walk`): every house can be walked into from the plots pages ("Gå inn i huset") and the journey's last stop. The rooms are built when the visitor comes to a house: entrance hall with the stair down, open kitchen and living room under a vaulted ceiling with a glulam ridge beam, bathroom, bedroom, the plant room with the ground-source heat pump and its hot water tank, the balanced ventilation unit and its ducts, the 14 kWh battery and the inverter, the fuse box with the meter's HAN reader and the floor heating manifold, and on the lower floor a family room, two bedrooms, a second bathroom and storage. Dimensions follow TEK17 (rooms 2.4 m, doors 0.86 m free width, stairs 2R+G = 0.62 m, railings 1.0 m). The light is worked out per vertex: the exact form factor of each window, the light bounced round the room, the lamps and contact shadows; the sun comes in only through the openings (followed through the reveals, past the eaves, the terrace and the inner walls, and over the plot's measured horizon). The screens in the house (energy screen, heat pump, inverter, meter) and the battery's charge bar show that house's own figures from the energy simulation at the dial's hour. Walking: WASD or arrows and drag to look on a computer, a stick and drag on a phone, a click or tap on a floor to walk there (A* over a 20 cm grid through doors and down stairs; a click on a wall walks to its foot, and a long way is walked briskly); doors open as the visitor comes; walking up to another house makes it the visited one. Hotspots on the installations explain each measure with the energy track's verdict and its source. For the frame rate on a laptop or a phone: indoors the rooms are drawn before the landscape and the forest outside the windows is lighter (detailed trees to about 25 m, 3D trees to about 140 m), the rooms' shaders are compiled while the camera flies in, the way-finding grid is filled a few milliseconds per frame, and the screens are redrawn only when their figures change.
- **Trees:** 101 900 treetops measured in the laser data within 1.28 km (`trees.bin`), species from NIBIO SR16 and AR5 and the aerial photo, leaf colour from the aerial photo at each tree. Detailed models within 70 m of the camera, simpler ones to 260 m, painted cards beyond. The seasons follow the coast of Agder: leaf out in May, autumn colour, bare birch and oak in winter (oaks keep a few dry leaves), and the summer photo's fields and broadleaf woods turned to winter straw and bare twigs (the masks' blue channel holds the broadleaf share of the trees).
- **Sky and light:** the real sun (NOAA, `src/lib/solar.ts`), a clear-sky model, a cloud deck that follows the weather (it closes into grey stratus on an overcast day and then lights the scene), haze, and a camera's longer exposure on a grey day and around sunset.
- **Names and lines:** place names from Kartverket's register (`names.json`; the wide views add the settlements, fjords, larger lakes and highest hills within 5 km, Spangereid, Lenefjorden, Mandal and Lindesnes fyr; a name the ground hides from the camera is not shown), and NVE's overhead power lines with every mast at its recorded point and height (`power.json`: wooden poles for 22 and 24 kV, H-frames for 110 kV).
- **Energy:** the living field and the energy simulator show each hour of the simulation in `src/lib/sim` (below): panels lit by their own production, the hub, the sharing and the batteries.
- **Checked against a photograph:** the landing page's photo slider puts Sigve's winter photo beside the model seen from the same spot. The spot was found by fitting the photo's skyline and the five Raudberg buildings in it to the terrain model (camera 1.9 m above the ground at local (52.6, -67.3), towards 176 degrees, field of view 59.4 degrees; buildings within about 11 px of 1440, skyline within about 3 px of 360).
- **Debug:** `?twindebug` in the address exposes `window.__twin` (`date(month, hour, clouds)`, `view(pos, target, fov)`, `still({ w, h, state })`, `walk(plotId, "door" | "terrace" | "living")` and `walkState`), used for the stills, the photo match and the fly-in (`../pipeline/twin_flyin.js`).
- If the GPU drops the WebGL context, the stage offers lite mode (fewer trees, no shadows, no guardrail posts or guard stones).

## The energy simulation (`src/lib/sim`)

Hour by hour through a typical year at Knotten (EU PVGIS, sun from satellite, temperature and wind from ERA5): each home's panels on its real roof pitch and direction with its terrain horizon (Perez sky, Martin and Ruiz reflection, Faiman module temperature, the Huld model PVGIS uses, 14 % losses, calibrated to PVGIS's own yield for the spot), household use in the rhythm of real NO2 homes (Elhub 2025), heat pumps on the borehole field (SCOP 3.6), batteries that keep 30 % for outages, sharing in the field, the budget's prices or NO2 spot prices for 2025, and an outage drill. It runs in a Web Worker on the page (`useSim.ts`) and on the server for the portal's figures and `/api/energy/frame` (`src/lib/energy.ts`). With the energy budget's own assumptions it lands close to the budget (self-sufficiency 51.4 % against 52.5 %).

## Data and assumptions

- `public/data/plots.json`, `trees.json`, `road.json`, `clearing.json` come from `../data` (pipeline outputs). Re-copy after re-running the pipeline.
- `src/lib/facts/` is the single source of the project's facts, shared by both designs and the portal: `sources.ts` (the quotes behind every "Kilde" chip), `figures.ts` (the key numbers in `FACT`, the assumptions with source, date and `provisional` flag, and the Klassisk figures table), `energy.ts` (energy budget, EED borehole field, the measures with their verdicts, and the owner's direction), `project.ts` (contact details, the internship, the work plan and the document register), `team.ts` (the people on the team pages), `model.ts`, `core.ts` (number formatting) and `index.ts` (what `@/lib/facts` exports). Pages keep their own markup and wording but take every shared number, date and contact detail from `@/lib/facts`, so one change there reaches both designs. Facts were checked against the project material on 27 September 2026.
- Registrations land in the CRM records (see "Where data is kept"); the old `data/leads.json` from the first form is taken over once if it exists.

## The owner's images

The originals (photographs and maps from the project owner) are in `../assets-src/incoming/`, outside the public folder. `python ../pipeline/optimise_images.py` writes the WebP copies the pages load (`public/assets/incoming/web/`, `public/renders/web/`). Sections hide themselves while a file is missing.

## Before launch

The owner's checklist. The portal addresses below are given in Norwegian (`/no/portal/...`); `/en/portal/...` is the same in English.

Accounts and secrets

1. Set `AUTH_SECRET` (32 characters or more) and `CRON_SECRET` in Vercel and deploy again. Setting `AUTH_SECRET` ends every session, so do it before people are invited.
2. Do the first-time setup on `/logg-inn`: enter the setup code (the value of `KNOTTEN_SETUP_CODE` if you set one, otherwise the code written to the server log in Vercel) and create the super administrator. Remove `KNOTTEN_SETUP_CODE` afterwards. Invite the project group from Users and access (`/no/portal/admin/brukere`).
3. Open `/api/health` while logged in and check that `storage` is `kv`, `files` is `blob`, `authSecret` is `set` and `cron` is `true`.

Content the owner fills in (all in the portal's administration)

4. Company facts in Settings (`/no/portal/admin/innstillinger`): organisation number, postal address, email and phone, and the status line. A detail that is not entered is left out of the pages, never guessed.
5. Plot statuses and prices (`/no/portal/admin/tomter`).
6. The configurator's price list (`/no/portal/admin/konfigurator`). Until a price is set, a choice says "Pris på forespørsel".
7. News (`/no/portal/admin/nyheter`): write and publish the first items.
8. Upload the internal documents through the portal (`/no/portal/dokumenter`), under the titles in the checklist there, so the links from the public document bank open them.

Services

9. Email, once a sending domain exists: set `MAIL_FROM` with `RESEND_API_KEY` (verify the domain at Resend) or `SMTP_URL`. Until then sign-up works without confirmation by email and the portal shows links to copy (see "Buyer accounts and Min side").
10. A custom domain: add it in Vercel, set `SITE_URL` to it and build again.
11. Turnstile: create the keys at Cloudflare for the domain, set `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and build again.
12. The language model for Knotten AI, if wanted: the key in `ANTHROPIC_API_KEY` and the model's name in `KNOTTEN_AI_MODEL`, as environment variables only; neither is ever written in the code. Adjust `KNOTTEN_AI_DAILY_LIMIT` if needed. The privacy page names the provider while this is on.

Texts that wait for the owner's approval

13. The privacy text (`/personvern` in both designs, `src/lib/content/privacy.ts`).
14. The consent texts (`src/lib/consent.ts`). To change one, give it a new id, keep the old one for the records given under it, and bump `PRIVACY_VERSION`.
15. The headline claim on the front pages (`src/lib/content/home.ts` and the front pages of each design).
16. The answer to "What does it cost to live there?" (`src/lib/content/investors.ts`).
17. The team pages and quotes (`src/lib/facts/team.ts`): each person approves their own page.

Data and licences

18. Replace the Esri imagery in `public/twin` (each terrain ring's aerial photo, which also gives the trees their colour) with Norge i bilder or a drone orthophoto (licence): `../pipeline/twin_fetch.py`, then `twin_terrain.py` and the steps after it.
19. Confirm the terms of NIBIO's AR5 map service (the twin's water and forest masks) or move to open data, and credit the twin's sources where the site names the model's data (see the table in the README one level up).
20. When the site plan changes: `../pipeline/plan_layout_v6.py` (it copies `../data/*.json` here), then `build_klassisk_plan.py`.

After launch

21. Set the targets for the key figures after two months of real traffic.
22. Later, when there are homes: meters and the equipment interfaces (Energy, Smart home), BankID for residents if wanted.
