# SPEC-19 completion note

## What was built

A living Aktuelt section, edited from the admin with no developer, that gives the project a credible, indexable signal of progress.

- **Editing** reuses the SPEC-09 admin news editor (title, slug, NO/EN body, draft/published) inside the MFA-gated admin.
- **Public index** at `/aktuelt` (EN `/news`) lists published posts newest first, each with a snippet linking to its own page.
- **Per-post pages** at `/aktuelt/[slug]` (EN `/news/[slug]`): server-rendered, with the full body, clean metadata, Open Graph `article` tags, NewsArticle JSON-LD structured data, canonical and hreflang alternates. A draft or unknown slug returns 404.
- **Sitemap**: rendered on demand so every published post (NO and EN) joins `/sitemap.xml` immediately; drafts are excluded.
- **Revalidation**: publishing or editing a post revalidates the index and the localized per-post paths, so the public site reflects the change at once.

## Verification

- Local gate green: lint, type-check, format, tests (138), build, bundle budget.
- End-to-end in headless Chromium against the running server: an owner publishes a post; the index lists and links it; the per-post page renders the body with NewsArticle JSON-LD; the English locale renders at `/en/news/[slug]`; the sitemap contains the NO and EN post URLs; and a draft post returns 404 on its public page.

## Security and honesty

The post body is stored as text and rendered by React (escaped), so there is no stored-XSS surface. Stateless public pages collect no personal data. Cover images use the SPEC-09 image slots with the AI/illustration disclosure; no fabricated site photos. Indicative energy figures in posts carry their source per the editorial guidance.

## Deferred to go-live

The optional milestone email to confirmed double opt-in leads depends on the live EU email provider and is wired during go-live; it will send only through the consented SPEC-06 flow with unsubscribe, storing no new personal data.
