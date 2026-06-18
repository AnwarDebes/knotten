# ADR-0001: Next.js App Router on Vercel

## Status

Accepted, 2026-06-18.

## Context

The site is a bilingual (Norwegian and English) marketing and interest-capture presence for a development at Rødberg, Sniksfjorden, Lindesnes kommune (Agder), at the outlet of the Audna river (price zone NO2). Its job is to present the project credibly, explain the energy and building economics (Strømstøtte, Norgespris, plusskunde and energy sharing, passivhus performance, solar yield), and capture expressions of interest from prospective buyers.

The constraints that shape the choice:

- Search visibility matters. Content must be server-rendered HTML so that crawlers and link-preview bots see the full page without executing JavaScript, and so that first paint does not wait on a client bundle.
- The owner is non-technical. Day-to-day operation must require near-zero maintenance: no servers to patch, no build pipelines to babysit, no manual deploys.
- Content changes over time. Figures, copy, and the interest form will be edited by the owner (via an admin surface backed by a database), and edits must reach visitors without a developer in the loop and without a full redeploy for every word.
- Data residency is constrained. Email and database must stay in the EU/EEA. Analytics is Plausible (EU, cookieless), so no cookie banner is required.
- Honesty is a hard requirement. Unit and plot counts are UNKNOWN ("8" referred to student internship positions, not homes), no real site photography exists yet, and all energy figures are indicative estimates. The stack must make placeholder and data-driven content the default, not an afterthought.

The platform decision must serve fast, SEO-safe, bilingual content that an owner can run alone, while leaving room for owner-edited content that updates without redeployment.

## Decision

Build the site with **Next.js (App Router, TypeScript)**, rendering content statically (SSG) at build time and using **Incremental Static Regeneration (ISR)** for content that the owner edits through the admin surface. Host on **Vercel** as a single managed platform.

Concretely:

- Pages are React Server Components by default. Marketing and explanatory content is generated as static HTML at build time, so the first byte a crawler or visitor receives is the complete page.
- Owner-edited content (copy, figures, the interest-capture form configuration) is served via ISR: pages are statically cached and revalidated on a defined interval or on-demand after an edit, so changes propagate without a developer-triggered redeploy.
- The interest-capture endpoint and any admin actions run as serverless functions on the same platform, writing to an EU/EEA-hosted database and dispatching email through an EU/EEA provider.
- Internationalisation (nb and en) is handled through the App Router's routing, with both locales pre-rendered.
- Vercel provides build, deploy, CDN, TLS, and serverless execution as one managed unit, with Git-push as the only deploy action.

The performance budget defined in ADR-0011 applies to every page this stack produces.

## Alternatives considered

**Astro (static-first, islands).** Astro ships zero JavaScript by default and excels at exactly the HTML-first, content-heavy profile this site needs; its build output would likely be marginally leaner than Next.js for the same pages. It was not chosen because the interest-capture and owner-edit flows want first-class server functions and a mature ISR-style revalidation story integrated with the host, and because the React + Next.js + Vercel path is the most direct route to the managed, near-zero-maintenance operation required. Astro remains the strongest runner-up; if the dynamic surface stays trivial, revisiting it would be defensible.

**Plain React SPA (client-rendered).** Rejected. A client-rendered single-page app fails the SEO-safe and HTML-first requirements: crawlers and link-preview bots would receive an empty shell, and first paint would block on the bundle. Server rendering would have to be bolted on, which is what a framework already provides.

**CMS-hosted site (e.g. a hosted website builder or all-in-one CMS).** Attractive for the non-technical owner, since editing and hosting come bundled. Rejected because of weaker control over output (HTML quality, performance budget, bilingual routing), constraints on EU/EEA data residency for form submissions and stored data, and lock-in to a vendor's content model. The chosen approach keeps an owner-facing admin surface while retaining control of rendering, data location, and the form pipeline.

**Separate static site generator with a decoupled host (e.g. Hugo or Eleventy on object storage plus CDN).** Produces excellent static HTML and is cheap to host. Rejected because dynamic needs (interest capture, owner edits that update without a full rebuild, serverless email) would require stitching together a separate function host and revalidation mechanism, increasing the operational surface the owner must not have to manage. A single managed platform is preferred.

## Consequences

- **HTML-first, server-rendered content.** Pages arrive as complete HTML, satisfying the SEO-safe and link-preview requirements and giving fast first paint. The performance budget in ADR-0011 is the standing constraint against which this is measured.
- **ISR for admin-edited content.** Owner edits propagate through revalidation rather than developer-triggered redeploys, but content is therefore eventually consistent: a visitor may briefly see a cached version after an edit until revalidation completes. Revalidation timing must be chosen and documented so the staleness window is acceptable. On-demand revalidation after a save mitigates this for high-priority edits.
- **Single managed hosting.** One platform covers build, CDN, TLS, and serverless execution, which minimises operational burden and matches the near-zero-maintenance goal. The trade-off is concentration on one vendor: pricing, regional execution, and platform changes are outside direct control. The application code (standard Next.js) stays portable, so the realistic lock-in is operational (build and revalidation conventions, function runtime) rather than in the source.
- **Data residency must be configured explicitly.** Database and email in the EU/EEA, and serverless function regions, are not automatic; they are deliberate configuration that has to be verified, since the default region of a managed platform is not guaranteed to be EU/EEA.
- **TypeScript and React Server Components raise the floor on contributor skill.** This is acceptable given developer-built, owner-operated; it is not a stack a non-technical owner edits directly, which is precisely why the owner-facing admin surface (backed by ISR) exists.
- **Placeholder-by-default discipline is enforced in content, not the platform.** Because unit and plot counts are UNKNOWN and no real photography exists, the data layer and components must treat figures and imagery as labelled estimates and honest placeholders. The stack supports this (data-driven rendering), but the honesty guarantee lives in how content is modelled, and must be upheld in review.
- **Analytics stays cookieless.** Plausible (EU) requires no cookie banner, keeping the consent surface empty and the page lighter; this is consistent with the data-residency and performance posture.
