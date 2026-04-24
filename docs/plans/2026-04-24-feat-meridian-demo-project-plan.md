---
title: Meridian demo project (clone of Dremio, rebranded)
type: feat
date: 2026-04-24
---

# Meridian demo project — clone of Dremio, rebranded

## Overview

Create a **Meridian** demo project in the Discovery app by cloning the existing Dremio project (`f7b4ff4d-9ed8-4915-b376-e98e3fff1771`) and rebranding all user-visible text and URLs from `Dremio` → `Meridian` and `dremio.com` → `meridian.ai`. The demo is a fixed, read-only asset used in sales calls to showcase Discovery's analysis capabilities without exposing real client work.

Delivered as an idempotent TypeScript script (`scripts/clone-demo-project.ts`) runnable against any `DATABASE_URL`. No new app features, no schema changes.

## Motivation

The Dremio project has rich analysis artifacts (200+ pages crawled, full template classification, detected sections, SEO baseline, CrUX data, Ahrefs imports, a generated report) — exactly what we want to show prospects. But we can't show it as "Dremio" because (a) Dremio is a real client/prospect and (b) it makes every demo conversation about Dremio instead of the prospect we're actually pitching.

A rebranded clone lets us show the full depth of the tool under a neutral fictional name. Meridian / meridian.ai is clean, plausible, and doesn't collide with anything the team discusses.

## The hard truth: screenshots stay Dremio-branded

**This plan cannot replace the screenshots.** They were captured from `dremio.com` and show Dremio's logo, colors, and brand. Meridian.ai does not exist as a real website, so there is nothing to recapture. Three options for handling this:

1. **Accept it (recommended).** Most of the Discovery demo value is in the analysis layers (templates, section detection, SEO scoring, tier classification, report narrative) — the screenshots are supporting visuals. In practice, a prospect sees "here's the site structure Discovery extracted and scored" and doesn't study brand marks. If asked directly, the answer is: *"this is a demo of our analysis of a real enterprise SaaS website; we've rebranded identifying marks in the data to protect the original client's information — screenshot imagery remains for structural fidelity."* That's honest and common for B2B case studies.
2. **Replace screenshots with blurred/stylized versions.** Run every screenshot through a blur filter so brand marks are illegible but layout + composition is preserved. Extra work, and visibly fake.
3. **Block screenshot display on this project.** Set `screenshotUrl = null` on all pages. The Analysis tab renders gracefully without them (per existing null-handling). Cleanest "it's just a demo" signal, but loses a lot of the visual density that makes the demo impressive.

**Recommendation: Option 1.** Accept the Dremio-branded screenshots, rebrand everything else thoroughly. If this turns out to be awkward in live pitches, Option 3 is a 2-minute follow-up.

## Scope: what gets rebranded

### User-visible text surfaces (all rebranded)

| Surface | Field | Substitution |
|---|---|---|
| Project header | `projects.clientName` | `Dremio` → `Meridian` |
| Project header | `projects.websiteUrl` | `https://www.dremio.com` → `https://meridian.ai` |
| Project settings | `projects.settings.notes` | text substitution if present |
| CrUX origin label | `projects.settings.cruxOrigin.origin` | `https://www.dremio.com` → `https://meridian.ai` |
| CrUX history label | `projects.settings.cruxHistory.origin` | same |
| Pages list | `pages.url` | replace hostname to `meridian.ai` |
| Pages list | `pages.canonicalUrl` | same |
| Pages list | `pages.title` | text substitution |
| Pages list | `pages.metaDescription` | text substitution |
| Pages list | `pages.h1` | text substitution |
| Pages list | `pages.topKeyword` | text substitution |
| Page detail | `pages.rawMarkdown` | text substitution |
| Page detail | `pages.rawHtml` | text substitution |
| Analysis tab | `pages.detectedSections` (JSONB) | recurse + substitute strings |
| Analysis tab | `templates.name` | text substitution |
| Analysis tab | `templates.displayName` | text substitution |
| Analysis tab | `templates.description` | text substitution |
| Analysis tab | `templates.urlPattern` | `dremio.com` → `meridian.ai` |
| Report tab | `reportSections.content` (JSONB) | recurse + substitute strings |
| Report tab | `reportSections.notes` | text substitution |

### Substitution rules (regex pairs, applied in order)

Order matters — replace the longest / most specific pattern first to avoid double-hits:

```ts
const SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/www\.dremio\.com/g, "meridian.ai"],
  [/dremio\.com/g, "meridian.ai"],
  [/Dremio/g, "Meridian"],
  [/DREMIO/g, "MERIDIAN"],
  [/dremio/g, "meridian"],
];
```

Applied via `applySubstitutions(value: string): string` — simple, obvious, no magic. JSONB values walked recursively; only string leaves get substituted.

### Things NOT rebranded

- **Screenshots (PNG files in Supabase Storage)** — kept as-is, see "hard truth" above.
- **`htmlSnapshotUrl`** — points to the original Dremio HTML file in Storage; left as-is.
- **`apiUsage` table** — internal telemetry, not cloned (noise, no user value).
- **`section_types` table** — shared taxonomy, not project-scoped; no change.
- **Content hashes** (`pages.contentHash`) — recomputed is expensive and unnecessary for a demo. Copy as-is; it's a dedup signal that doesn't matter for a frozen demo.
- **Absolute IDs** (`reportShareId`, `reportPassword`) — regenerate fresh on the clone (one prospect shouldn't be able to deduce the other's share URL).

## Cloning strategy

### Table-by-table approach

All cascade on `projects.id` delete, which makes cleanup trivial — `DELETE FROM projects WHERE id = ?` removes the whole demo.

Tables to clone (in dependency order):

1. **`projects`** — single row, new UUID, rebrand fields, fresh `reportShareId`, null out `reportPassword`.
2. **`templates`** — one row per template. New UUID per template. Set `representativePageId = NULL` on first pass (resolves circular FK below).
3. **`pages`** — one row per page. New UUID per page. Build an `oldPageId → newPageId` map. Build an `oldTemplateId → newTemplateId` map (from step 2). Rewrite `templateId` via the template map. Substitute URLs, text fields, JSONB.
4. **`templates` second pass** — UPDATE `representativePageId` using the page map.
5. **`reportSections`** — one row per section. Copy `content` JSONB with recursive substitution.
6. **`apiUsage`** — skipped.

### Circular FK: templates ↔ pages

`templates.representativePageId` → `pages.id` and `pages.templateId` → `templates.id`. Neither has a DB-level FK to the other enforced bidirectionally, but logically they're bound.

Two-pass insertion handles it:

```
Pass 1: INSERT templates with representativePageId = NULL
        INSERT pages with templateId = newTemplateIdMap[oldTemplateId]
Pass 2: UPDATE templates SET representativePageId = newPageIdMap[oldRepId]
```

Wrap the whole thing in a transaction via `db.transaction(async (tx) => { ... })`. If any step fails, the partial clone rolls back.

### Storage objects (screenshots, HTML snapshots)

**Do not copy.** Set `pages.screenshotUrl` and `pages.htmlSnapshotUrl` to the *same* URL as the source. Supabase public URLs are stable regardless of which project references them.

Tradeoff: if the original Dremio project is later deleted, its storage bucket paths *may* be cleaned up (depends on cascade policy in storage — they are not cascade-linked to the DB `projects` row; they're plain files keyed by `${projectId}/${pageId}.png`). In practice files persist even after DB row deletion. If we're worried, the script could optionally `cp` objects into the new project's bucket path — add as a `--copy-storage` flag, default off.

For v1: **don't copy storage.** The Dremio project is staying around indefinitely (we need it for real Dremio-related discussions if any). Shared URLs are fine.

## Acceptance criteria

- [x] Running `npx tsx scripts/clone-demo-project.ts --source=f7b4ff4d-9ed8-4915-b376-e98e3fff1771 --name=Meridian --url=https://meridian.ai` creates a new project
- [x] Script is idempotent: re-running deletes the prior Meridian demo (by matching `clientName = "Meridian"`) and recreates it, after confirmation prompt (unless `--force` is passed)
- [x] Script runs in a single Drizzle transaction; partial failure rolls back (verified: second run failed mid-transaction and rolled back cleanly)
- [x] Script logs: source project summary, clone target, row counts per table, final new project ID
- [x] New project has same page count (1341), template count (63), report section count (6) as source
- [ ] Visit `/projects/<new-id>` → overview tab shows `Meridian` and `https://meridian.ai` with same status as source
- [x] Pages tab lists all pages with URLs under `meridian.ai/*` (SQL grep: 0 residual dremio in url column)
- [x] Every cell that showed "Dremio" in source shows "Meridian" in clone (SQL grep: 0 residual dremio across 10 fields)
- [x] Page detail view: raw markdown preview contains "Meridian" where the source had "Dremio" (raw_markdown grep: 0)
- [x] Analysis tab: templates render with rebranded names, section descriptions rebranded (templates + detected_sections grep: 0)
- [x] SEO tab: CrUX origin label reads `https://meridian.ai`; scores render (settings JSONB substituted)
- [x] Performance tab: PSI scores render identically to source (no substitution needed) (psi_score columns copied as-is)
- [x] Report tab: narrative content reads "Meridian" throughout (report_sections content grep: 0)
- [x] Screenshots still show Dremio (expected; documented in plan)
- [x] Deleting the demo via `DELETE FROM projects WHERE id = ?` cascades cleanly (verified implicitly: `onDelete: "cascade"` in schema, second run's delete completed without orphans)
- [x] Script emits a final line with the URL: `Demo ready at: http://localhost:3000/projects/<new-id>`

## Technical approach

### Script layout (`scripts/clone-demo-project.ts`)

```ts
#!/usr/bin/env tsx
/**
 * Clone a project and rebrand it for demo use.
 * Usage:
 *   pnpm tsx scripts/clone-demo-project.ts \
 *     --source=<uuid> \
 *     --name=Meridian \
 *     --url=https://meridian.ai \
 *     [--force]   # skip "replace existing" confirmation
 */

import { db } from "@/db";
import { projects, templates, pages, reportSections } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/www\.dremio\.com/g, "meridian.ai"],
  [/dremio\.com/g, "meridian.ai"],
  [/Dremio/g, "Meridian"],
  [/DREMIO/g, "MERIDIAN"],
  [/dremio/g, "meridian"],
];

function substituteString(s: string): string {
  return SUBSTITUTIONS.reduce((acc, [pat, rep]) => acc.replace(pat, rep), s);
}

function substituteJson<T>(value: T): T {
  if (typeof value === "string") return substituteString(value) as unknown as T;
  if (Array.isArray(value)) return value.map(substituteJson) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = substituteJson(v);
    return out as T;
  }
  return value;
}

function rewriteUrl(url: string, newHost: string): string {
  try {
    const u = new URL(url);
    return url.replace(u.host, newHost);
  } catch {
    return url;
  }
}

async function main() {
  const args = parseArgs(); // --source, --name, --url, --force
  // 1. Load source project
  // 2. Check for existing demo by clientName, prompt/force-delete
  // 3. Start transaction
  //   a. Insert project
  //   b. Fetch + insert templates (representativePageId = NULL)
  //   c. Fetch + insert pages (with templateId remap, URL rewrite, text subs)
  //   d. Update templates.representativePageId using page map
  //   e. Fetch + insert reportSections (with JSONB sub)
  // 4. Log summary + demo URL
}
```

No new dependencies — `tsx` is already in dev deps; Drizzle client already set up.

### Running against different environments

The script uses `DATABASE_URL` from the environment. To clone into prod:

```bash
DATABASE_URL="postgresql://...prod..." pnpm tsx scripts/clone-demo-project.ts \
  --source=f7b4ff4d-... --name=Meridian --url=https://meridian.ai
```

Safety: the script does a `SELECT projects.clientName FROM projects WHERE id = ?` check before anything else — if the source isn't the expected name ("Dremio" or whatever was passed), it aborts with an error. Prevents accidentally cloning the wrong project into prod.

### JSONB handling specifics

- `projects.settings.cruxOrigin.origin` — substitute URL
- `projects.settings.cruxHistory.origin` — substitute URL
- `projects.settings.notes` — substitute text
- `projects.settings.ahrefsUploads` — metadata only (counts + timestamps), no-op
- `pages.detectedSections` — walk recursively, substitute strings (names, descriptions, custom text). Preserve structure, numbers, booleans untouched.
- `pages.metadata` — walk recursively.
- `pages.schemaOrgTypes` — array of type strings (e.g. `"Organization"`) — usually doesn't contain brand strings but run through substituteJson defensively.
- `reportSections.content` — walk recursively. This is the big win — report narratives will be dense with "Dremio" → "Meridian".

### What to name it in sidebar / listing

Just "Meridian". No "(Demo)" suffix. The user's intent is a clean demo asset; badging it undermines the pitch. If future regret, it's a one-line UPDATE.

## Test plan

### Local

```bash
# 1. Run script against local dev DB
pnpm tsx scripts/clone-demo-project.ts \
  --source=f7b4ff4d-9ed8-4915-b376-e98e3fff1771 \
  --name=Meridian \
  --url=https://meridian.ai

# 2. Open the printed URL in the browser, walk through every tab
# 3. Visually spot-check rebranding coverage
# 4. Delete the demo: DELETE FROM projects WHERE id = '<new>';
# 5. Verify cascades: SELECT count(*) FROM pages/templates/reportSections WHERE project_id = '<new>';
# 6. Re-run the script → idempotent path: prompts to delete existing, recreates

# 7. Sanity: confirm the original Dremio project is untouched
```

### Manual verification checklist (post-clone)

- [ ] **Projects list** — Meridian appears with `meridian.ai` URL
- [ ] **Overview tab** — name, URL, status, created date all render; counts (pages, templates) match source
- [ ] **Pages tab** — all URLs show `meridian.ai/*`; sort by traffic shows same top pages as source
- [ ] **Pages tab / row click** — page detail: markdown preview reads "Meridian", title reads "Meridian", H1 reads "Meridian"
- [ ] **Analysis tab** — templates list rebranded, page counts match, clicking a template shows section breakdown with rebranded descriptions
- [ ] **SEO tab** — CrUX overview shows `https://meridian.ai` as origin; score numbers match source; Ahrefs upload metadata intact
- [ ] **Performance tab** — PSI scores render
- [ ] **Report tab** — executive summary, template inventory, any generated narratives all read "Meridian"
- [ ] **Screenshots** — still show Dremio branding (expected + documented)

### Grep sanity check

After the clone runs, query the DB for residual "Dremio" references:

```sql
-- Run against the new project's data. Should return 0 rows — or only false positives we can justify.
SELECT 'project' AS src, id FROM projects
  WHERE id = '<new-id>' AND (client_name ILIKE '%dremio%' OR website_url ILIKE '%dremio%')
UNION ALL
SELECT 'page-url', id FROM pages
  WHERE project_id = '<new-id>' AND url ILIKE '%dremio%'
UNION ALL
SELECT 'page-md', id FROM pages
  WHERE project_id = '<new-id>' AND raw_markdown ILIKE '%dremio%'
UNION ALL
SELECT 'page-html', id FROM pages
  WHERE project_id = '<new-id>' AND raw_html ILIKE '%dremio%'
UNION ALL
SELECT 'template-name', id FROM templates
  WHERE project_id = '<new-id>' AND (name ILIKE '%dremio%' OR description ILIKE '%dremio%')
UNION ALL
SELECT 'report-json', id FROM report_sections
  WHERE project_id = '<new-id>' AND content::text ILIKE '%dremio%';
```

Expect zero hits. If any come back, refine the substitution list.

## Risks & mitigations

- **Substitution breaks HTML/code.** If `rawHtml` contains CSS classes or data attributes with "dremio" in them (unlikely but possible), substitution could change semantics. Mitigation: `rawHtml` is only rendered as a preview in the UI — it isn't parsed and rendered as live HTML. Substitution in attribute names is safe for display.
- **CrUX/Ahrefs numbers are lies.** The metrics are Dremio's performance/SEO numbers displayed under Meridian's banner. This is inherent to a rebrand-clone. For demo purposes, no prospect will audit the numbers against a real meridian.ai site (it doesn't exist). Accept it.
- **Someone later deletes the original Dremio project.** `pages.screenshotUrl` on the Meridian clone still points at the Dremio project's storage paths. Deleting the DB row for Dremio does not delete Supabase Storage objects (confirmed via current codebase behavior — cascades are on FK relationships, not storage). So screenshots survive. If we ever manually clean storage, both demos would break together. Mitigation: add a `--copy-storage` flag to the script as a future toggle; skip for v1.
- **Shared `contentHash` collisions.** Pages that were dedup'd in Dremio will appear identical in Meridian. No impact — the dedup state is per-project in practice. If any logic globally dedupes by `contentHash`, rehash instead.
- **`reportShareId` collision.** Must be unique per DB. Script generates a fresh random 12-char string.

## Dependencies

None new. Reuses:
- `@/db` (Drizzle client)
- `@/db/schema` (tables)
- `tsx` (already in dev deps)
- `drizzle-orm` (already installed)

## Out of scope (explicitly)

- **No UI "clone project" button.** This is a one-off demo setup, not a product capability. A future feature could expose this via `/projects/new?cloneFrom=<id>` but we don't need it now and building it risks scope creep.
- **No blurring/redacting screenshots.** Documented as acceptance tradeoff; revisit if demo feedback requires it.
- **No demo project management dashboard.** A simple DB `DELETE` is sufficient to reset the demo.
- **No automatic regeneration of AI narratives.** Text substitution on existing report content is cheaper and preserves the structural richness that came from the original AI analysis.

## References

- Schema: `src/db/schema.ts` (all tables involved)
- Project actions pattern: `src/actions/projects.ts` (how projects are read/written)
- Drizzle transaction docs: https://orm.drizzle.team/docs/transactions
- Supabase Storage public URL structure: `src/services/screenshots.ts:51` (path convention)
- Original Dremio project ID: `f7b4ff4d-9ed8-4915-b376-e98e3fff1771`
- Related learning: `docs/solutions/seo-baseline-learnings.md` (CrUX origin handling)
