---
title: "feat: SEO Baseline — Data-Driven Migration Risk Assessment"
type: feat
date: 2026-03-15
status: complete
---

# SEO Baseline — Data-Driven Migration Risk Assessment

## Overview

Add a defensible, data-driven SEO risk assessment to every migration audit — without requiring access to the prospect's analytics accounts. The feature combines three data sources: Ahrefs CSV imports (traffic + links), on-page signal extraction from already-crawled HTML, and PageSpeed Insights API scores on representative pages. The core deliverable is a ranked list of **redirect-critical pages** that must not be lost during migration, turning SEO preservation from a promise into a scoped deliverable.

## Problem Statement

Current audits identify **what** to migrate (content tiers) and **how** to build it (section detection), but they don't answer the most anxiety-inducing question prospects have: **"Will we lose our Google rankings?"**

Without SEO data in the audit:
- Redirect plans are based on guesswork — high-traffic pages get the same treatment as zero-traffic pages
- Link equity is invisible — pages with 100+ referring domains look identical to pages with none
- Performance issues aren't surfaced — slow pages that hurt conversion are only discovered post-migration
- The audit report lacks the data-driven credibility that justifies $50k-150k replatforming contracts

**Why Ahrefs CSVs instead of API?** Ahrefs API costs $500+/month. CSV exports from a $99/month plan give the same data. Most agencies already have Ahrefs. The CSVs are a practical, zero-incremental-cost data source.

## Proposed Solution

### New Pipeline Step: SEO Enrichment

```
Existing:  [Crawl] → [Classify & Score] → [Screenshot & Detect] → [Report]

New:       [On-page SEO]   [PSI on reps]      [Ahrefs CSV upload]
                ↓              ↓                    ↓
           [─────── SEO Score + Redirect-Critical Flags ───────]
                                    ↓
                            [SEO Report Section]
```

SEO enrichment is **optional and non-blocking**. Each data source contributes independently:

| Data Source | Requires | Provides | Cost |
|---|---|---|---|
| On-page extraction | Nothing (uses stored rawHtml) | H1, canonical, meta robots, schema.org, internal links | $0 |
| PageSpeed Insights | PSI API key (env var) | Performance scores (mobile + desktop) | Free (API quota) |
| Ahrefs Top Pages CSV | User upload | Traffic, traffic value, referring domains, top keyword per URL | $0 |
| Ahrefs Best by Links CSV | User upload | Referring domains, link equity, HTTP status codes per URL | $0 |

### Tab Structure Change

**Before:** Overview | Crawl | Analysis | Pages | Report
**After:** Overview | Crawl | Analysis | Pages | **SEO** | Report

## Technical Approach

### Phase 1: Database Schema & URL Normalization

#### 1.1 New columns on `pages` table (no new tables)

**File:** `src/db/schema.ts`

All SEO data lives directly on the `pages` table. No staging tables, no join tables. Parse CSV in memory, match URLs, write to pages.

```typescript
// On-page signals (extracted from rawHtml)
canonicalUrl: text("canonical_url"),
metaRobots: text("meta_robots"),
// h1 already exists but is always null — populate it
schemaOrgTypes: jsonb("schema_org_types"),       // e.g. ["Article", "Organization"]
internalLinkCount: integer("internal_link_count"),

// Ahrefs data (from Top Pages CSV)
organicTraffic: integer("organic_traffic"),
trafficValueCents: integer("traffic_value_cents"), // USD monthly value in cents (consistent with costUsd microdollars pattern)
topKeyword: text("top_keyword"),
topKeywordVolume: integer("top_keyword_volume"),
topKeywordPosition: integer("top_keyword_position"),

// Ahrefs data (from Best by Links CSV, or Top Pages — use max)
referringDomains: integer("referring_domains"),

// PageSpeed Insights (2 integers, not a whole table)
psiScoreMobile: integer("psi_score_mobile"),     // 0-100
psiScoreDesktop: integer("psi_score_desktop"),    // 0-100

// Computed
seoScore: integer("seo_score"),                   // 0-100
isRedirectCritical: boolean("is_redirect_critical").default(false),
```

**Why no `ahrefsImports` staging table?** Parse CSV in memory, match URLs to pages, write directly. If user re-crawls, they re-upload the CSV (it's on their disk). Storing a copy of someone else's export in the database is unnecessary indirection.

**Why no `psiResults` table?** The report only needs the 0-100 performance scores. Store `psiScoreMobile` and `psiScoreDesktop` as two integers on `pages`. If detailed metrics are needed later, re-run the API — PSI data goes stale weekly anyway.

**Why `trafficValueCents` as integer?** Consistent with existing `costUsd` microdollars pattern in `apiUsage`. Avoids Drizzle `numeric` → string parsing headaches.

Track which Ahrefs file types have been uploaded in `projects.settings`:

```typescript
// In projects.settings JSONB:
{
  ahrefsUploads: {
    topPages: { rowCount: 154, matchedCount: 137, uploadedAt: "2026-03-15T..." },
    bestLinks: { rowCount: 374, matchedCount: 269, uploadedAt: "2026-03-15T..." },
  },
  seoExtractionComplete: true,
  psiComplete: true,
}
```

#### 1.2 Enhanced URL normalization

**File:** `src/lib/url.ts` (new — extract from `src/actions/projects.ts:171`)

The existing `normalizeUrl` strips all query params, hash, and trailing slashes. The new shared version must match this behavior exactly to ensure Ahrefs URLs match crawled URLs.

```typescript
// src/lib/url.ts
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Force HTTPS (Ahrefs exports include both http:// and https://)
    u.protocol = "https:";
    // Strip all query params and hash (matches existing crawl behavior)
    u.search = "";
    u.hash = "";
    // Remove trailing slash except root
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    // Lowercase hostname
    u.hostname = u.hostname.toLowerCase();
    return u.toString();
  } catch {
    return raw;
  }
}
```

Update `src/actions/projects.ts` to import from `src/lib/url.ts` instead of the local function.

#### 1.3 Database indexes

```typescript
// Add indexes for SEO query patterns
index("pages_project_redirect_critical").on(pages.projectId, pages.isRedirectCritical),
index("pages_project_seo_score").on(pages.projectId, pages.seoScore),
```

#### 1.4 Drizzle migration

Run `pnpm drizzle-kit generate` and `pnpm drizzle-kit push` after schema changes.

### Phase 2: On-Page SEO Extraction

#### 2.1 HTML signal parser + scoring logic

**File:** `src/services/seo.ts` (new — single file for extraction + scoring)

Parse `rawHtml` for each page and extract:

| Signal | How to Extract | Storage |
|---|---|---|
| H1 tag(s) | cheerio: `$("h1").first().text()` | `pages.h1` |
| Canonical URL | `$('link[rel="canonical"]').attr("href")` | `pages.canonicalUrl` |
| Meta robots | `$('meta[name="robots"]').attr("content")` | `pages.metaRobots` |
| Schema.org types | Parse `<script type="application/ld+json">` → `@type` | `pages.schemaOrgTypes` jsonb |
| Internal link count | Count `<a href>` matching same domain | `pages.internalLinkCount` |

**Dependencies:** `cheerio` for reliable HTML parsing (lightweight, server-side).

```typescript
// src/services/seo.ts
import * as cheerio from "cheerio";

interface OnPageSeoSignals {
  h1: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  schemaOrgTypes: string[];
  internalLinkCount: number;
}

export function extractOnPageSeo(rawHtml: string, pageUrl: string): OnPageSeoSignals {
  const $ = cheerio.load(rawHtml);
  const domain = new URL(pageUrl).hostname;

  const h1 = $("h1").first().text().trim() || null;
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || null;
  const metaRobots = $('meta[name="robots"]').attr("content") || null;

  const schemaOrgTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const types = Array.isArray(json)
        ? json.map((j: { "@type"?: string }) => j["@type"])
        : [json["@type"]];
      schemaOrgTypes.push(...types.filter(Boolean));
    } catch { /* ignore invalid JSON-LD */ }
  });

  let internalLinkCount = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const linkUrl = new URL(href, pageUrl);
      if (linkUrl.hostname === domain || linkUrl.hostname.endsWith(`.${domain}`)) {
        internalLinkCount++;
      }
    } catch { /* ignore malformed hrefs */ }
  });

  return { h1, canonicalUrl, metaRobots, schemaOrgTypes, internalLinkCount };
}
```

**SEO scoring** (same file — too small to warrant its own file):

```typescript
// src/services/seo.ts (continued)

export function computeSeoScore(page: {
  trafficValueCents: number | null;
  referringDomains: number | null;
  organicTraffic: number | null;
}): { score: number; isRedirectCritical: boolean } {
  // Traffic value is already a composite metric from Ahrefs (traffic × CPC).
  // A page ranking well despite bad performance is MORE important, not less.
  // Performance is deliberately excluded — it's a separate concern shown in PSI section.
  const trafficScore = normalizeLog(centsToUsd(page.trafficValueCents ?? 0), 500); // $500/mo = 100
  const linkScore = normalizeLog(page.referringDomains ?? 0, 50);                   // 50 RDs = 100
  const volumeScore = normalizeLog(page.organicTraffic ?? 0, 2000);                 // 2000 visits/mo = 100

  // Weighted: traffic value matters most (it's dollars), links second, raw traffic third
  const score = Math.round(
    trafficScore * 0.45 +
    linkScore * 0.35 +
    volumeScore * 0.20
  );

  // Redirect-critical: score threshold OR any hard rule
  const isRedirectCritical = score >= 50
    || centsToUsd(page.trafficValueCents ?? 0) >= 50  // >$50/mo traffic value
    || (page.referringDomains ?? 0) >= 5;              // >5 referring domains

  return { score, isRedirectCritical };
}

function normalizeLog(value: number, maxExpected: number): number {
  if (value <= 0) return 0;
  return Math.min(100, Math.round((Math.log(value + 1) / Math.log(maxExpected + 1)) * 100));
}

function centsToUsd(cents: number): number {
  return cents / 100;
}
```

**Why no performance in the score?** A page ranking #2 for "web development best practices" with 2,500 monthly visits and a PSI score of 35 is *more* important to protect during migration, not less. If it ranks well despite bad performance, that's a signal of strong content/authority. Performance is shown separately in the PSI section as a migration *opportunity* ("these pages will get faster after migration"), not a risk factor.

**Why no intent classification?** Traffic value from Ahrefs already encodes intent implicitly — transactional pages have higher CPC and therefore higher traffic value. Adding a separate keyword-classification pipeline for a 20% weight in the score is over-engineering for v1. Cut the Organic Keywords CSV upload entirely.

#### 2.2 Batch extraction server action

**File:** `src/actions/seo.ts` (new)

```typescript
"use server";

export async function runOnPageSeoExtraction(projectId: string) {
  // 1. Query all pages with rawHtml (batch of 50)
  // 2. For each page, call extractOnPageSeo(rawHtml, url)
  // 3. Update page with extracted signals
  // 4. Track progress via settings.seoExtractionProgress
  // ~1000 pages in <30 seconds (just HTML parsing, no API calls)
}
```

Runs as a separate step triggered from the SEO tab — does NOT inline into `storeCrawlResults()` to protect the critical crawl path.

### Phase 3: Ahrefs CSV Import

#### 3.1 CSV parser for Ahrefs exports

**File:** `src/services/ahrefs-parser.ts` (new)

Handle the Ahrefs-specific format:
1. Read file as `ArrayBuffer`
2. Detect encoding: check for UTF-16LE BOM (`0xFF 0xFE`), fall back to UTF-8
3. Decode to string via `TextDecoder`
4. Parse as TSV with quoted fields
5. Auto-detect file type from header columns:
   - First column `"URL"` + has `"Current traffic"` → **Top Pages**
   - First column `"Page title"` + has `"Referring domains"` → **Best by Links**
6. Validate with Zod schemas (CLAUDE.md mandates Zod for external data)
7. Return typed array of parsed rows

```typescript
// src/services/ahrefs-parser.ts
import { z } from "zod";

type AhrefsFileType = "top_pages" | "best_links";

const TopPageRowSchema = z.object({
  url: z.string().url(),
  currentTraffic: z.coerce.number().default(0),
  currentTrafficValue: z.coerce.number().default(0),  // USD, will convert to cents
  currentReferringDomains: z.coerce.number().default(0),
  currentTopKeyword: z.string().default(""),
  currentTopKeywordVolume: z.coerce.number().default(0),
  currentTopKeywordPosition: z.coerce.number().default(0),
});

const BestLinksRowSchema = z.object({
  pageUrl: z.string().url(),
  referringDomains: z.coerce.number().default(0),
  dofollow: z.coerce.number().default(0),
  nofollow: z.coerce.number().default(0),
  pageHttpCode: z.coerce.number().optional(),
});

type TopPageRow = z.infer<typeof TopPageRowSchema>;
type BestLinksRow = z.infer<typeof BestLinksRowSchema>;

interface AhrefsParseResult {
  fileType: AhrefsFileType;
  rows: TopPageRow[] | BestLinksRow[];
  rowCount: number;
  parseErrors: number;  // rows that failed Zod validation
}

export function parseAhrefsCsv(buffer: ArrayBuffer): AhrefsParseResult { ... }
```

**Key columns extracted per file type:**

**Top Pages:**
- `URL` → normalize, match to crawled pages
- `Current traffic` → `pages.organicTraffic`
- `Current traffic value` → `pages.trafficValueCents` (multiply by 100)
- `Current referring domains` → `pages.referringDomains`
- `Current top keyword` → `pages.topKeyword`
- `Current top keyword: Volume` → `pages.topKeywordVolume`
- `Current top keyword: Position` → `pages.topKeywordPosition`

**Best by Links:**
- `Page URL` → normalize, match to crawled pages
- `Referring domains` → `pages.referringDomains` (use max of Top Pages and Best by Links)
- `Page HTTP code` → surface 4XX/5XX as pre-migration issues in the report

#### 3.2 Upload server action

**File:** `src/actions/seo.ts`

```typescript
export async function uploadAhrefsCsv(projectId: string, formData: FormData) {
  // 1. Get file from FormData
  // 2. Parse with parseAhrefsCsv() — auto-detects file type
  // 3. Validate: check URL domain matches project domain (>30% match rate)
  // 4. Normalize all Ahrefs URLs using shared normalizeUrl()
  // 5. Match to pages.url in database
  // 6. Write matched data directly to pages table
  // 7. For Best by Links: use max(existing referringDomains, new referringDomains)
  // 8. Update projects.settings with upload metadata
  // 9. Auto-recompute SEO scores for affected pages
  // 10. Return: { fileType, rowCount, matchedCount, unmatchedCount }
}
```

**Domain validation:** Extract domain from the first few URLs in the CSV and compare to the project's crawl domain. If <30% of URLs share the same domain, reject with error: "This export appears to be for a different domain."

**Re-upload behavior:** Clears previous Ahrefs data for that file type (set columns to null for all project pages), then writes new data. Simple, no orphaned data.

#### 3.3 Upload UI component

**File:** `src/components/seo/ahrefs-upload.tsx` (new)

**Single dropzone** with auto-detection (not three separate zones):
- Drag & drop or click to browse
- Accepts multiple files at once
- Auto-detects file type from headers after upload
- Shows per-file result: "Detected: Top Pages, 154 rows, 137 matched (89%)"
- Match rate warning if <70% of URLs matched
- Shows current upload status per type (uploaded / not uploaded)
- "Clear" button to remove uploaded data per type

### Phase 4: PageSpeed Insights Integration

#### 4.1 PSI service

**File:** `src/services/pagespeed.ts` (new)

```typescript
// src/services/pagespeed.ts
const PSI_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function runPageSpeedInsights(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<number> {
  // Call PSI API with PAGESPEED_API_KEY env var
  // Parse lighthouseResult.categories.performance.score (0-1, multiply by 100)
  // Return integer 0-100
  // Retry once with 5s delay on failure, return null if still fails
}
```

Returns just the 0-100 score. No elaborate result objects.

#### 4.2 PSI batch runner

**File:** `src/actions/seo.ts`

```typescript
export async function runPsiAnalysis(projectId: string) {
  // 1. Check PAGESPEED_API_KEY is configured, return early with message if not
  // 2. Get representative pages (same pages used for screenshots, ~25)
  // 3. For each page, run mobile + desktop PSI sequentially
  // 4. Update pages.psiScoreMobile and pages.psiScoreDesktop
  // 5. Track progress via settings.psiProgress
  // ~50 API calls, ~2-3 minutes
}
```

**Vercel timeout consideration:** 50 sequential PSI calls may take 2-3 minutes. Ensure the Vercel plan supports sufficient function timeout (Pro = 60s, Enterprise = 300s). If timeout is an issue, consider using Inngest (already in tech stack) for this step.

**PSI API key:** Optional. If `PAGESPEED_API_KEY` env var is not set, skip PSI. UI shows "PSI not configured" with setup instructions. On-page extraction and Ahrefs data still work independently.

### Phase 5: SEO Tab UI

#### 5.1 SEO page route

**File:** `src/app/(dashboard)/projects/[id]/seo/page.tsx` (new)

Server Component with two sections:

**Section A: Data Sources (always visible)**

Status cards showing what data is available:

| Source | Status | Action |
|---|---|---|
| On-page SEO | Extracted (337 pages) / Not run | "Extract" button |
| PageSpeed Insights | 25/25 complete / Not configured | "Run PSI" button |
| Ahrefs Data | Top Pages: 154 rows (89% matched), Best by Links: 374 rows (72% matched) / Not uploaded | Single upload dropzone |

Plus a "Compute Scores" button that runs scoring on all pages with any SEO data.

**Section B: Redirect-Critical Pages (after scores computed)**

Sortable table: URL, Traffic, Traffic Value, Referring Domains, Top Keyword, SEO Score, Content Tier, Redirect Critical badge.

- Default sort: SEO score descending
- Filter: redirect-critical only toggle
- Paginated (50/page)
- Summary line at top: "X of Y pages are redirect-critical, representing $Z/mo in organic traffic value"

#### 5.2 Add SEO tab to navigation

**File:** `src/components/projects/project-tabs.tsx`

```typescript
const tabs = [
  { href: "", label: "Overview" },
  { href: "/crawl", label: "Crawl" },
  { href: "/analysis", label: "Analysis" },
  { href: "/pages", label: "Pages" },
  { href: "/seo", label: "SEO" },        // NEW
  { href: "/report", label: "Report" },
];
```

### Phase 6: Report Integration

#### 6.1 New report section type

**File:** `src/types/report.ts`

```typescript
export type ReportSectionType =
  | "executive_summary"
  | "template_inventory"
  | "site_architecture"
  | "content_audit"
  | "section_inventory"
  | "seo_baseline";              // NEW

export interface SeoBaselineData {
  hasAhrefsData: boolean;
  hasPsiData: boolean;
  summary: {
    totalPagesScored: number;
    redirectCriticalCount: number;
    totalTrafficValue: number;     // cents — total across all pages
    avgPsiMobile: number | null;
    avgPsiDesktop: number | null;
  };
  redirectCriticalPages: Array<{
    url: string;
    seoScore: number;
    organicTraffic: number | null;
    trafficValueCents: number | null;
    referringDomains: number | null;
    topKeyword: string | null;
    contentTier: string | null;
  }>;
  preMigrationIssues: Array<{
    url: string;
    httpCode: number;
    referringDomains: number;
  }>;
  onPageIssues: {
    missingH1: number;
    missingCanonical: number;
    noindexPages: number;
    missingSchemaOrg: number;
  };
}
```

#### 6.2 Report component

**File:** `src/components/report/seo-baseline-report.tsx` (new)

Renders:
1. **Data completeness banner** — "Full SEO analysis with Ahrefs data" or "On-page analysis only — upload Ahrefs data for traffic and link equity insights"
2. **Redirect-Critical Pages table** — sorted by SEO score, with traffic value, referring domains, top keyword, content tier columns. This is the core deliverable.
3. **Summary stat line** — "X of Y pages are redirect-critical, representing $Z/mo in organic traffic value"
4. **Pre-Migration Issues** — 4XX/5XX errors from Best by Links with referring domains count (frames these as existing problems Pagepro resolves)
5. **On-Page Technical Debt** — counts of missing H1s, missing canonicals, noindex pages, missing schema.org

Performance data (PSI scores) shown separately if available — worst-performing representative pages. This frames slow pages as a migration *opportunity*, not a risk.

#### 6.3 Report data assembly + wiring

**File:** `src/services/report-data.ts` — add `assembleSeoBaselineData(projectId)`
**File:** `src/actions/report.ts` — add `seo_baseline` to `generateReport()`
**File:** `src/components/report/report-layout.tsx` — add to SECTIONS nav array

## Edge Cases

1. **Ahrefs CSV for wrong domain** — Detect by checking if <30% of URLs match project domain. Show error: "This export appears to be for a different domain."

2. **Re-crawl after CSV upload** — Ahrefs data written directly to `pages` columns. Re-crawl deletes and recreates pages with new IDs, so Ahrefs data is lost. User must re-upload CSVs. The SEO tab shows "Ahrefs data: Not uploaded" and the user knows to re-upload.

3. **CSV encoding** — Check for UTF-16LE BOM (`0xFF 0xFE`) first, fall back to UTF-8. These are the only two encodings Ahrefs actually exports.

4. **Duplicate URLs in Ahrefs exports** — Same URL may appear as `http://` and `https://`. Normalize before matching. If duplicates remain, keep the row with higher traffic value.

5. **Pages in Ahrefs but not in crawl** — Report as "X Ahrefs URLs not found in crawl" in the upload summary. Don't fail the upload — just skip unmatched rows.

6. **PSI API key not set** — Skip PSI, show setup instructions in SEO tab. On-page extraction and Ahrefs data work independently.

7. **PSI API timeout/errors** — Retry once with 5s delay. If still fails, skip that page. Don't block the batch.

8. **Redirect-critical page marked `archive` in content tier** — Valid scenario: thin content but high link equity. Show both signals in the report. The recommendation is to redirect to a consolidated page, not delete.

9. **Best by Links shows 301 redirects** — These are not errors but existing redirect chains. Filter them out of "pre-migration issues" (only show 4XX/5XX).

10. **Empty or very small CSVs** — Accept but warn: "Only X rows found. This may be a filtered export."

## Acceptance Criteria

### Functional

- [x] On-page SEO extraction runs on all pages with `rawHtml`, populating h1, canonicalUrl, metaRobots, schemaOrgTypes, internalLinkCount
- [x] Ahrefs CSV upload auto-detects file type (Top Pages or Best by Links)
- [x] UTF-16LE and UTF-8 CSV encodings both handled correctly
- [x] Uploaded Ahrefs data matched to crawled pages via normalized URLs
- [x] Upload summary shows: file type detected, rows parsed, URLs matched, unmatched count
- [x] Wrong-domain CSV rejected with clear error message
- [x] PageSpeed Insights runs on representative pages (mobile + desktop scores)
- [x] PSI scores stored on pages table and displayed in SEO tab
- [x] SEO score computed from traffic value + referring domains + organic traffic (no performance input)
- [x] Redirect-critical pages flagged based on score threshold and hard rules
- [x] SEO tab shows data source status, upload dropzone, and redirect-critical pages table
- [x] Report includes SEO Baseline section with completeness indicator
- [x] Report shows redirect-critical table, pre-migration issues, on-page debt counts
- [x] SEO enrichment is fully optional — audits work without it
- [x] Re-uploading CSV of same type replaces previous data (clears + re-writes)
- [x] Single upload dropzone auto-detects both file types

### Non-Functional

- [x] On-page extraction for 1000 pages completes in < 30 seconds
- [x] CSV parsing handles files up to 10MB
- [x] PSI analysis for 25 pages completes in < 5 minutes
- [x] Score computation for 1000 pages completes in < 5 seconds
- [x] No regressions in existing pipeline (crawl, classify, detect, report)

### Testing

- [x] Unit tests for `extractOnPageSeo()` with sample HTML fixtures
- [x] Unit tests for `parseAhrefsCsv()` using the 3 example CSVs in `docs/example-ahrefs-csv/`
- [x] Unit tests for `computeSeoScore()` with edge cases (all null, high traffic, high links, both)
- [x] Unit tests for `normalizeUrl()` covering protocol, trailing slashes, query params
- [x] Zod schema validation tests for malformed CSV rows

## Implementation Order

1. **Phase 1** — Schema migration + URL normalization extraction (foundation)
2. **Phase 2** — On-page SEO extraction + scoring logic (quick win, zero cost)
3. **Phase 3** — Ahrefs CSV parser + upload + URL matching (core differentiator)
4. **Phase 4** — PageSpeed Insights integration (independent, can parallel with Phase 3)
5. **Phase 5** — SEO tab UI (display layer for all computed data)
6. **Phase 6** — Report integration (final output)

## Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| `cheerio` | HTML parsing for on-page extraction | Lightweight, server-side, well-maintained |
| `PAGESPEED_API_KEY` env var | PSI API access | Optional. Free tier: 400 req/min, 25K/day |
| No new paid APIs | Ahrefs data from user's existing subscription | $0 incremental cost |

## References

### Key Files (existing)
- `src/db/schema.ts` — current schema, add new columns to `pages`
- `src/actions/projects.ts:171` — existing `normalizeUrl()`, extract to `src/lib/url.ts`
- `src/actions/analysis.ts` — analysis pipeline orchestration, progress tracking pattern
- `src/services/anthropic.ts` — API call + usage tracking pattern
- `src/types/report.ts:78` — `ReportSectionType` union, add `seo_baseline`
- `src/services/report-data.ts` — report data assembly, add SEO section
- `src/components/projects/project-tabs.tsx` — tab navigation, add SEO tab
- `src/components/report/report-layout.tsx:5` — SECTIONS nav array for report sidebar

### Key Files (new)
- `src/lib/url.ts` — shared URL normalization (extracted from projects.ts)
- `src/services/seo.ts` — on-page extraction + SEO scoring (two concerns, one file)
- `src/services/ahrefs-parser.ts` — CSV parsing with encoding detection + Zod validation
- `src/services/pagespeed.ts` — PSI API client
- `src/actions/seo.ts` — server actions for all SEO operations
- `src/app/(dashboard)/projects/[id]/seo/page.tsx` — SEO tab page
- `src/components/seo/ahrefs-upload.tsx` — single file upload dropzone with auto-detect
- `src/components/seo/seo-table.tsx` — redirect-critical pages table
- `src/components/report/seo-baseline-report.tsx` — report section

### Ahrefs CSV Examples
- `docs/example-ahrefs-csv/pagepro.co-top-pages-*.csv` — 154 data rows, UTF-16LE, tab-delimited
- `docs/example-ahrefs-csv/pagepro.co-bbl-external-*.csv` — 373 data rows, UTF-16LE, tab-delimited

### Data Flow

```
User Upload                  Existing Data              External API           Computed
───────────                  ─────────────              ────────────           ────────

Ahrefs Top Pages CSV ──┐
                       ├──→ Parse in memory ──→ URL matching ──→ pages table
Ahrefs Best Links CSV ─┘    (auto-detect,       (normalizeUrl)   (organicTraffic,
                              Zod validate)                       trafficValueCents,
                                                                  referringDomains,
                                                                  topKeyword, etc.)

pages.rawHtml ─────────→ On-page extraction ──────────────────→ pages table
                         (cheerio parse)                         (h1, canonicalUrl,
                                                                  metaRobots, etc.)

Representative pages ──→ PSI API ──→ pages table
                         (mobile +   (psiScoreMobile,
                          desktop)    psiScoreDesktop)

                                                               ──→ computeSeoScore()
                                                                   (trafficValue × 0.45
                                                                    + referringDomains × 0.35
                                                                    + organicTraffic × 0.20)
                                                                        ↓
                                                                   pages.seoScore
                                                                   pages.isRedirectCritical
                                                                        ↓
                                                                   Report: seo_baseline
```
