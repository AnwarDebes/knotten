# Runbook: editing the site content (no code)

Status: guide for the owner. Everything the public site shows that changes over time (plots, prices, status, the timeline, FAQ, news and images) is edited from the browser, with no developer and no deploy. Edits appear on the public site shortly after saving.

## Getting in

1. Sign in at `/admin` with your email, password and TOTP code (see the admin section of `HANDOVER.md`).
2. Open **Innhold** in the top navigation. Content editing requires the **owner** role.

## What you can edit

The Innhold page lists each area:

- **Tomter** (plots): name, status (ledig / reservert / solgt), size, indicative price, gnr/bnr, position and a note. Status, orientation and the numeric fields are constrained, so you cannot enter an invalid value.
- **Fremdrift** (timeline): the stages, their NO/EN labels, the date or phase, and which stage is current.
- **FAQ**: question and answer in NO and EN, ordered, draft or published.
- **Aktuelt** (news): a post with a URL name (slug), NO/EN title and body, saved as draft or published.
- **Tekstblokker**: short text blocks such as the hero intro and contact details, in NO and EN.
- **Dashbord**: the illustrative values for the community dashboard. These are illustrative only and carry a forbehold; they are not live telemetry.
- **Bilder**: image slots, each with required alt text and fields to mark and disclose AI or illustration imagery.

## How edits reach the public site

- Saving an edit refreshes the affected public pages automatically (NO and EN). You do not need to publish or deploy.
- Plot edits update the plot overview on Området; published news appears on Aktuelt; published FAQ appears on the contact page.
- A news post is only public when its status is **published**. Drafts stay hidden.

## Honesty rules built in

- Prices and dashboard values are always shown with a forbehold and labelled as indicative; do not present them as final.
- Every image needs alt text (the form will not save without it).
- If an image is AI-generated or an illustration, tick the box and fill in the disclosure; it is shown on the public side.

## Undo: versions

Plots, timeline stages, news posts and text blocks keep a version history. On the edit page for one of these, the **Tidligere versjoner** list lets you restore an earlier value with one click. A restore is itself reversible (the current value is snapshotted first).

## Images

- Upload JPG, PNG or WebP, up to 5 MB. The file type is checked on the server.
- In production the files are stored in the EU (see `HANDOVER.md`); replacing a slot's image keeps the alt text and disclosure unless you change them.

## Every change is logged

Each create, edit, delete and restore is written to the **Aktivitetslogg** with who did it and when. The log holds no personal data about visitors.
