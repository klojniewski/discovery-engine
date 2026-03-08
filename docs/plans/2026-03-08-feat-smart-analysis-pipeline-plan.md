---
title: "feat: Smart Analysis Pipeline - Restructure Workflow"
type: feat
date: 2026-03-08
status: in-progress
---

# Smart Analysis Pipeline - Restructure Crawl → Analyse → Screenshot Workflow

## Overview

Restructure the analysis pipeline so classification and scoring run immediately after crawl (using already-captured markdown), then let users select representative pages per template for targeted screenshot capture and section detection. This eliminates the wasteful "scrape everything" step and gives users a smarter, cheaper workflow.

## Problem Statement

The current flow forces users through a rigid Crawl → Scrape → Analyse pipeline:

1. **Scrape is mostly redundant** — Crawl already captures markdown + HTML for all pages. Scrape's only unique value is screenshot capture.
2. **Users must screenshot before they know what's needed** — You can't see template groups until after classification, but classification is locked behind the scrape step.
3. **All-or-nothing screenshots** — Scraping 1147 pages takes screenshots for all of them. Section detection (vision AI) only needs ~20-30 representatives.
4. **No cost visibility** — Users can't estimate costs before committing to expensive operations.
5. **Low-value pages clutter everything** — WordPress pagination (`/author/*/page/N`), tag archives, and taxonomy pages inflate page counts without adding analysis value.

**Cost impact example:** For pagepro.co (1147 pages):
- Screenshot capture: ~1147 Firecrawl API calls (sequential, ~20+ minutes)
- Section detection: ~1147 Sonnet vision calls at ~$0.05/page = ~$57
- With smart pipeline: ~25 screenshots + 25 vision calls = ~$1.25

## Proposed Solution

### New Workflow (4 phases instead of 3)

```
┌─────────┐    ┌──────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│  Crawl  │───>│ Classify & Score │───>│ Select & Screenshot │───>│ Section Detection │
│         │    │ (all pages,      │    │ (representatives    │    │ (vision AI on     │
│ discover│    │  no screenshots) │    │  per template)      │    │  screenshots)     │
│ pages   │    │                  │    │                     │    │                   │
└─────────┘    └──────────────────┘    └─────────────────────┘    └──────────────────┘
   Haiku            Haiku                  Firecrawl                    Sonnet
  ~$0.50          ~$2-5                  ~25 calls                    ~$1.25
```

### Tab Structure Change

**Before:** Overview | Crawl | Scrape | Analysis | Report
**After:** Overview | Crawl | Analysis | Report

The "Scrape" tab is removed. Screenshot capture becomes part of the Analysis flow (after classification reveals which pages need screenshots).

## Technical Approach

### Phase 1: Pipeline Restructure (Core)

#### 1.1 Split `runFullAnalysis()` into independent steps

**File:** `src/actions/analysis.ts`

Currently `runFullAnalysis()` runs classification → scoring → section detection sequentially. Split into:

- `runClassificationAndScoring(projectId)` — Can run right after crawl. No screenshots needed.
- `captureRepresentativeScreenshots(projectId)` — Screenshots only for selected representative pages.
- `runSectionDetection(projectId)` — Vision AI only on pages with screenshots.

```typescript
// src/actions/analysis.ts

export async function runClassificationAndScoring(projectId: string) {
  // Set status to "analyzing"
  // Step 1: Classification (unchanged - uses markdown/metadata)
  // Step 2: Scoring (unchanged - uses markdown/metadata)
  // Set status to "classified" (new status)
  // Return template groups for user review
}

export async function captureRepresentativeScreenshots(projectId: string) {
  // Get all templates for project
  // For each template, get representativePageId
  // Capture screenshot for each representative (sequential Firecrawl calls)
  // Set status to "screenshots_captured"
}

export async function runSectionDetection(projectId: string) {
  // Only process pages with screenshotUrl and no detectedSections
  // Same logic as current runSectionDetection
  // Set status to "reviewing"
}
```

#### 1.2 New project status values

Add to status machine: `classified` (after classification + scoring, before screenshots)

```
created → crawling → crawled → analyzing → classified → reviewing
                                                ↓
                                        (user selects reps,
                                         screenshots captured,
                                         sections detected)
```

#### 1.3 Update Analysis page UI to multi-phase

**File:** `src/app/(dashboard)/projects/[id]/analysis/page.tsx`, `src/components/analysis/analysis-runner.tsx`

The Analysis page becomes a multi-phase wizard:

**Phase A: Classify & Score** (shown when status is `crawled`)
- "Run Classification & Scoring" button
- Show page count and cost estimate: "Analyze {N} pages. Est. cost: ~${X}"
- Cost formula: `(pages / 10) * haiku_cost_per_call * 2` (classification + scoring batches)
- Progress steps: Classification → Scoring → Done

**Phase B: Review Templates & Select Representatives** (shown when status is `classified`)
- Show template groups (already exists as `TemplateClusters` component)
- Each template shows: name, page count, auto-selected representative
- User can change representative via dropdown of pages in that group
- "Capture Screenshots & Detect Sections" button
- Show count: "Will screenshot {N} representative pages. Est. cost: ~${X}"

**Phase C: Section Detection Results** (shown when status is `reviewing`)
- Same as current post-analysis view: templates, content tiers, section inventory

#### 1.4 Remove Scrape tab

**File:** `src/components/projects/project-tabs.tsx`

Remove the Scrape tab from navigation. Screenshot capture is now integrated into the Analysis flow.

Keep the scrape server actions and page-tree component for now (don't delete) — they can be repurposed later if needed for manual screenshot capture of additional pages.

### Phase 2: Crawl Page Improvements

#### 2.1 Search/filter on crawl table

**File:** `src/app/(dashboard)/projects/[id]/crawl/page.tsx`, `src/components/projects/crawl-results-table.tsx`

Add a search input above the table that filters by URL or title. Server-side filtering via query param.

```typescript
// src/actions/projects.ts - update getProjectPagesPaginated
export async function getProjectPagesPaginated(
  projectId: string,
  page: number = 1,
  perPage: number = 50,
  search?: string  // NEW: filter by URL or title
)
```

#### 2.2 Expand WordPress junk URL patterns

**File:** `src/actions/projects.ts` — `JUNK_URL_PATTERNS`

Add patterns for WordPress pagination and taxonomy pages:

```typescript
const JUNK_URL_PATTERNS = [
  // ... existing patterns ...
  /\/page\/\d+\/?$/i,           // WordPress pagination: /author/foo/page/2
  /\/tag\//i,                    // Tag archives
  /\/category\/.*\/page\//i,     // Category pagination
  /\/author\/.*\/page\//i,       // Author pagination
];
```

These are filtered at crawl storage time. For existing data, provide a one-time cleanup.

#### 2.3 Crawl summary stats on Overview page

**File:** `src/app/(dashboard)/projects/[id]/page.tsx`, `src/actions/projects.ts`

Add a `getProjectStats(projectId)` action that returns:
- Total pages crawled
- Pages with content (rawMarkdown not null)
- Average word count
- Top URL path prefixes with counts (e.g., `/blog: 450 pages, /case-studies: 12 pages`)

Display on Overview page below project details when status is `crawled` or later.

### Phase 3: Cost Estimation

#### 3.1 Cost estimate helper

**File:** `src/lib/cost-estimates.ts` (new)

```typescript
const PRICING = {
  haiku: { input: 0.80, output: 4.00 },  // per 1M tokens
  sonnet: { input: 3.00, output: 15.00 },
};

export function estimateClassificationCost(pageCount: number): number {
  // ~500 input tokens per page, ~100 output tokens per page
  // Batches of 10
  const batches = Math.ceil(pageCount / 10);
  const inputTokens = pageCount * 500;
  const outputTokens = pageCount * 100;
  return (inputTokens * PRICING.haiku.input + outputTokens * PRICING.haiku.output) / 1_000_000;
}

export function estimateScoringCost(pageCount: number): number {
  // Similar calculation with batches of 15
}

export function estimateSectionDetectionCost(pageCount: number): number {
  // ~2000 input tokens per page (image + prompt), ~500 output
  const inputTokens = pageCount * 2000;
  const outputTokens = pageCount * 500;
  return (inputTokens * PRICING.sonnet.input + outputTokens * PRICING.sonnet.output) / 1_000_000;
}
```

#### 3.2 Show estimates in UI

Display before each action button:
- "Classify & Score {N} pages — Est. ~${X}"
- "Screenshot & analyze {N} templates — Est. ~${X}"

### Phase 4: Additional UI Polish

#### 4.1 Fix Pages tab 404

**File:** `src/app/(dashboard)/projects/[id]/pages/page.tsx` (new)

Create a pages list page that shows all pages with their template assignment, content tier, and screenshot status. Paginated, searchable. Links to individual page detail at `/pages/[pageId]`.

#### 4.2 Representative page selection component

**File:** `src/components/analysis/template-representatives.tsx` (new)

After classification, show each template group as a card:
- Template name + page count
- Currently selected representative (auto-selected: highest confidence)
- Dropdown to change representative from pages in that group
- Checkbox to include/exclude template from section detection
- "Select All" / "Deselect All" for bulk operations

#### 4.3 Allow adding extra pages for screenshots

Users might want to screenshot more than just the auto-selected representative per template. Add an "Add more pages" option per template that lets them pick additional pages from the group for screenshot + section detection.

## Acceptance Criteria

### Functional
- [x] Classification and scoring run directly after crawl (no scrape step required)
- [x] After classification, template groups are visible with representative page selection
- [x] Screenshots captured only for selected representative pages
- [x] Section detection runs only on pages with screenshots
- [x] Scrape tab removed from navigation
- [x] Cost estimates shown before classification and before section detection
- [x] Search/filter works on crawl page table
- [x] WordPress pagination/taxonomy URLs filtered from crawl results
- [x] Overview page shows crawl summary stats
- [x] Pages tab shows list of all pages (not 404)

### Quality & Scoring Improvements (added 2026-03-08)
- [x] Merged classification + scoring into single API call (~30% cost reduction)
- [x] Fixed scoring prompt: legal pages (privacy, terms, cookies) now must_migrate, not archive
- [x] Added PDF and binary file filtering at Firecrawl level (earliest possible)
- [x] Added PDF/binary backup filtering in JUNK_URL_PATTERNS
- [x] Content Tiers table: pagination (50/page) and tier filtering
- [x] Template pages modal: truncated URLs with ... and proper link styling

### Non-Functional
- [ ] Classification + scoring for 1000 pages completes in < 5 minutes
- [ ] Screenshot capture for 25 pages completes in < 5 minutes
- [ ] No regressions in existing report generation

## Edge Cases & Open Questions

1. **Re-running classification** — If user re-runs classification, existing templates get deleted and recreated. This is already handled in `runClassification()` (clears templates first). But now there's a gap: if screenshots were already captured for old representatives, new representatives may not have screenshots. The UI should detect this and prompt for new screenshots.

2. **Templates with 1 page** — Some templates may have only 1 page. The representative is automatic — no dropdown needed. But still needs a screenshot.

3. **Pages already scraped from previous runs** — Some pages may already have `screenshotUrl` from a previous scrape. The screenshot step should skip these (already handled in current code pattern).

4. **Status transitions when re-running** — If a project is in `reviewing` status and user wants to re-classify (maybe after excluding pages), the status should go back to `analyzing` → `classified`. Need clear "Re-run Classification" option.

5. **Empty templates after exclusion** — If user excludes all pages in a template group via the crawl page, the template should be removed or shown as empty.

6. **Large classification batches** — With 1147 pages in batches of 10, that's 115 Haiku calls for classification alone. Progress should show batch progress (e.g., "Classifying... 450/1147 pages").

7. **Scrape tab backward compatibility** — Old projects that already went through the scrape flow should still work. Don't break existing data. The "Scrape" tab is removed from nav but the routes can remain.

## Implementation Order

1. **Phase 1.1-1.3** — Pipeline restructure + Analysis page multi-phase UI (core change)
2. **Phase 1.4** — Remove Scrape tab
3. **Phase 2.2** — Expand junk URL patterns (quick win)
4. **Phase 3** — Cost estimates
5. **Phase 2.1** — Crawl search/filter
6. **Phase 2.3** — Overview stats
7. **Phase 4.1** — Fix Pages 404
8. **Phase 4.2-4.3** — Representative selection polish

## References

### Key Files
- `src/actions/analysis.ts` — Analysis pipeline orchestration
- `src/actions/projects.ts` — Crawl, scrape, page management
- `src/services/classification.ts` — Haiku classification (batches of 10)
- `src/services/scoring.ts` — DEPRECATED: scoring merged into classification.ts
- `src/services/components.ts` — `detectPageSections()` Sonnet vision
- `src/services/screenshots.ts` — Firecrawl screenshot capture
- `src/services/anthropic.ts` — `callClaude()`, `callClaudeWithImage()`, usage logging
- `src/components/projects/project-tabs.tsx` — Tab navigation
- `src/components/analysis/analysis-runner.tsx` — Analysis step UI
- `src/db/schema.ts` — `templates.representativePageId`, `pages.excluded`

### Data Dependencies
- Classification: `url`, `title`, `metaDescription`, `wordCount`, `rawMarkdown` (first 10k chars)
- Scoring: `url`, `title`, `metaDescription`, `wordCount`, `rawMarkdown` (first 500 chars), `isDuplicate`
- Section Detection: `screenshotUrl`, `url`, `rawHtml`, `sectionTypes` taxonomy

### Cost Reference
- Haiku: $0.80 input / $4.00 output per 1M tokens
- Sonnet: $3.00 input / $15.00 output per 1M tokens
- Firecrawl screenshot: 1 API credit per page
