---
title: Cloning a project for demo use
date: 2026-04-24
tags: [demo, scripts, db, drizzle, supabase, anonymization]
category: ops
---

# Cloning a project for demo use

`scripts/clone-demo-project.ts` duplicates a Discovery project under a new name and applies a substitution layer to anonymize brand markers, author names, partner relationships, and event branding. Used to build the Meridian demo (clone of Dremio) for sales showcases.

## What it does

Inserts new rows in `projects`, `templates`, `pages`, and `report_sections` with new UUIDs, mapped foreign keys, and rewritten text. Wraps everything in a single Drizzle transaction so partial failure rolls back. Idempotent — re-runs delete the prior demo by `clientName` match.

## Substitution layer

`src/lib/demo-clone.ts` exports `DEMO_PROJECT_SUBSTITUTIONS` — a composed list of:

- **Brand:** `Dremio` → `Meridian`, `dremio.com` → `meridian.ai`
- **Authors:** real Dremio employees (Aalhad Kulkarni, Alex Merced, Aniket Kulkarni, Tomer Shiran, Matt/Matthew Topol, Isha Sharma, Mark Hoerth, Srini Srinivasan) → fictional names. Plus the `tshiran` social handle.
- **Podcast:** `Gnarly Data Waves` (any case, including URL-encoded `%20` and underscored `_`) → `Podcast`
- **Partner:** `NetApp` (5 case variants including camelCase `netApp` from image filenames) → `Vercell`
- **URL section:** `/subsurface` → `/integrations`

## Gotchas (in order of how much pain they caused)

### 1. Sequential per-row inserts close the Supabase pooler connection mid-transaction

A `for…of` loop over 1300+ pages with per-row `INSERT … RETURNING` inside `db.transaction(...)` exceeded the pooler's connection lifetime. The transaction failed, the DELETE that preceded it (outside the transaction) had already committed, leaving an empty demo project until the next run.

**Fix:** chunked batch insert via `tx.insert(pages).values(chunk).returning({ id })` in chunks of 100. Maps `oldPageId → newPageId` by index. Cuts round-trips from 1341 to 14, transaction stays well under any timeout.

Also passed `idle_timeout: 0`, `connect_timeout: 60`, `max: 1` to the postgres client. The DELETE-before-INSERT runs on the same connection so the pool doesn't churn.

### 2. Circular FK between `templates.representativePageId` and `pages.templateId`

Templates point at pages; pages point at templates. Two-pass insert resolves it:

1. Insert templates with `representativePageId = NULL`
2. Insert pages with `templateId` remapped via the template ID map
3. UPDATE templates with `representativePageId` from the page ID map

Both maps live in JS for the duration of the transaction. Don't try to re-derive them from the DB — it's slower and adds round-trips.

### 3. Substitution ordering

Apply the longest, most-specific patterns first. `www.dremio.com` → `meridian.ai` must run before `Dremio` → `Meridian`, otherwise you end up with `www.meridian.com` (wrong TLD).

Within author rules, full names before standalone surnames before standalone given names. Spaced form before hyphenated form before lowercase slug — otherwise `Aalhad Kulkarni` only gets the trailing surname swapped.

### 4. Hostname rewriting alone leaves brand strings in URL paths

`new URL().hostname = "..."` swaps only the host. URL paths like `/blog/dremio-aws-edition` need substitution too. Compose: `substituteString(rewriteUrlHost(url, newHost))`.

### 5. False positives in residual checks

`ILIKE '%Tomer%'` matched 652 pages — but most were `customer`, `customers`, `customer360`, `toPolars`, `topology`. Anything with the 5-letter substring matches. Use word-boundary regex (`\bTomer\b`) when validating the cleanup pass; ILIKE is for finding-something-might-be-broken triage only.

### 6. Image filenames carry brand strings as camelCase

`netApp-whitespace-200x100.png` slipped through `NETAPP/NetApp/Netapp/netapp` rules — needed an explicit `netApp` (camelCase) variant. When auditing residuals, always sample exact substrings via `regexp_matches` rather than relying on a fixed casings list.

### 7. URL-encoded forms

`Gnarly%20Data%20Waves` shows up in Twitter/Facebook share URLs as a query param. Substitution rules need an explicit URL-encoded variant for any title that appears in social-share links.

### 8. Storage objects are not copied

`pages.screenshotUrl` on the cloned project points at the original project's Supabase Storage paths. Saves 1300+ storage API calls. Tradeoff: if the original is ever fully purged, the demo screenshots go with it. Documented in the plan; revisit only if the source project is genuinely getting deleted.

### 9. Inbound link rewriting after page deletion

Deleting `/partners/vast` etc. left `<a href="/partners/vast">` references in OTHER pages' markdown. Rewrite the link targets to a valid page (`/partners/vercell` for partners, `/resources` for podcasts) before merging the demo to avoid 404s during the pitch.

### 10. Standalone surnames need collision risk review

Replacing `Sharma` or `Srinivasan` standalone breaks unrelated content (common South Asian surnames). Replacing `Kulkarni` or `Hoerth` standalone is safe because they're rare in tech writing. The author rule list has comments calling out which surnames are deliberately excluded from the standalone-surname fallback.

## Running the script

```bash
DATABASE_URL="..." npx tsx scripts/clone-demo-project.ts \
  --source=<source-project-uuid> \
  --name=Meridian \
  --url=https://meridian.ai \
  [--force]
```

The `--force` flag skips the "delete existing and recreate" confirmation prompt — needed when running from a non-interactive shell.

After the clone, run the SQL grep checklist in `docs/plans/2026-04-24-feat-meridian-demo-project-plan.md` to verify zero residual brand/personal-data references across the demo project's text fields. Expect zero hits when targeting the rule list — any non-zero count is either a false positive (substring inside an unrelated word) or a missed casing variant to add to the rules.

## When NOT to use this

- **Re-creating the same demo** — running again replaces it; no need for a separate "refresh" path.
- **Showing real client work** — this script is for showcase-only demos. Real audits go in their own projects, named correctly, never anonymized.
- **Deep redaction (GDPR-grade)** — text substitution leaves screenshots untouched (Dremio branding remains in PNG assets). For genuine PII removal, screenshots would need replacing too — and meridian.ai doesn't exist as a real site to recapture against.
