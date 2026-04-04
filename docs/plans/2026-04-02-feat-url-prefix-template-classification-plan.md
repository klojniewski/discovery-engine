---
title: URL-Prefix Template Classification
type: feat
date: 2026-04-02
---

# URL-Prefix Template Classification

## Overview

Replace the current per-page AI classification (15 fixed template types) with a URL-prefix-first approach that groups pages by URL structure, then uses AI to name and describe each group dynamically. This fixes inconsistent classification (awards split across blog_post and custom_page) and eliminates the generic mega-buckets (782-page blog_post, 198-page custom_page junk drawer).

## Problem Statement

The current system sends each page's content to Claude Haiku in batches of 10 and asks it to pick from 15 fixed template types. This has three structural weaknesses:

1. **Inconsistent grouping** — Pages with identical URL structure (`/awards/*`) get split across `blog_post` and `custom_page` because content signals are ambiguous
2. **Fixed types are too generic** — Real sites have awards, events, podcasts, partner pages, integrations. These collapse into `blog_post` or `custom_page`
3. **Content-first is wrong for template detection** — URL structure (`/awards/*`, `/events/*`) is a much stronger signal for "same template" than 500 chars of content. Two award pages look identical structurally even if their text differs

**Evidence from Dremio project (1,340 pages):**
- `/awards/*` pages: 29 classified as `blog_post`, 17 as `custom_page` (same template, split)
- `blog_post` bucket: 782 pages mixing actual blog posts, podcast episodes, root-level articles, and awards
- `custom_page` bucket: 198 pages mixing events (166, mostly 404s), awards (17), partners (4), misc
- `resource_page` (143) vs `documentation_page` (51): both contain `/wiki/` and `/resources/` content, split arbitrarily

## Proposed Solution

**Two-phase approach: URL-prefix grouping (deterministic) + AI naming (one call).**

### Phase 1: URL-Prefix Grouping (No AI)

Extract the first path segment from each page URL and group pages sharing the same prefix.

```
Input URLs:
  /blog/post-1, /blog/post-2, /blog/2024/post-3
  /awards/g2-summer, /awards/crn-big-data
  /gnarly-data-waves/episode-1, /gnarly-data-waves/episode-2
  /about, /pricing, /careers

Output groups:
  /blog/*              → 574 pages
  /awards/*            →  46 pages
  /gnarly-data-waves/* →  30 pages
  /wiki/*              →  73 pages
  /events/*            → 166 pages
  /resources/*         →  27 pages
  ...
  Ungrouped (< 3 pages with same prefix):
    /about, /pricing, /careers, /homepage
```

**Algorithm:**
1. Parse each page URL, extract pathname, strip trailing slash
2. Take first path segment (e.g., `/blog` from `/blog/2024/my-post`)
3. Pages at root (`/about`, `/pricing`) → prefix is the full path (`/about`)
4. Homepage (`/`) → always its own singleton template
5. Group pages by prefix; groups with **3+ pages** qualify as template groups
6. Groups with <3 pages → ungrouped, handled in Phase 2b

**Locale handling:** `/en/blog/*` and `/de/blog/*` become separate groups. This is correct — they represent different content sets for migration purposes.

**No merge heuristic in v1:** Root-level pages (e.g., `/apache-iceberg-achieves-milestone-1-0-release`) stay as singletons even if they're blog posts. If this proves problematic on real sites, a merge heuristic can be added as a post-processing step in a follow-up — kept separate from `groupPagesByUrlPrefix()` to avoid coupling content-aware logic to a URL-structure function.

### Phase 2a: AI Template Naming (One API Call)

Send all group summaries to Claude Haiku in a **single API call**. The AI names and describes each group.

**Group summary format sent to AI:**
```
Group 1: /blog/* (574 pages)
  Sample URLs:
    /blog/10-data-quality-checks-in-sql
    /blog/3-ways-to-convert-a-delta-lake-table
    /blog/apache-iceberg-crash-course
  Sample titles: "10 Data Quality Checks...", "3 Ways to Convert..."
  Avg word count: 2,100

Group 2: /awards/* (46 pages)
  Sample URLs:
    /awards/g2-summer-2023-reports
    /awards/deloitte-500
    /awards/crn-big-data-100-list-2021
  Sample titles: "Leader Positioning in G2...", "Deloitte 500 Recognition..."
  Avg word count: 420

Group 3: /events/* (166 pages)
  Sample URLs:
    /events/aws-summit-london
    /events/apache-iceberg-office-hours
  Sample titles: "Page not found | Dremio", "Page not found | Dremio"
  Avg word count: 108
  Note: 90% of pages have title "Page not found"
```

**AI output per group:**
```json
[
  {
    "prefix": "/blog/*",
    "name": "blog_post",
    "displayName": "Blog Post",
    "description": "Technical blog articles covering data lakehouse topics, Apache Iceberg tutorials, and product guides"
  },
  {
    "prefix": "/awards/*",
    "name": "award",
    "displayName": "Award",
    "description": "Industry award and recognition announcements showcasing company achievements"
  },
  {
    "prefix": "/events/*",
    "name": "event_page",
    "displayName": "Event Page",
    "description": "Past event landing pages, mostly expired/404. Candidates for archival."
  }
]
```

**Key:** The `name` field is now a free-form slug (AI-generated, kebab-cased), not constrained to the old 15-type enum. The `displayName` is the human-readable label shown in UI and reports.

**Sample limit:** Send up to **5 sample URLs + titles** per group (keeps prompt small). For groups where most pages are 404s or identical titles, note that pattern.

**Group cap:** If there are more than **50 prefix groups**, split into multiple naming calls (each ≤50 groups) to stay within reliable Haiku output parsing limits. At 50 groups with 3 sample URLs each, the prompt is ~3-4K tokens — well within limits.

### Phase 2b: Singleton Classification (Existing Batch Approach)

Pages that didn't form groups (< 3 pages with same prefix) are classified individually using the existing batch-of-10 approach — but with a free-form type output instead of the fixed enum.

**Prompt change:** Instead of "choose from these 15 types," ask: "What template type is this page? Provide a short slug name and display name."

**Homepage** always gets its own template (`homepage` / "Homepage").

### Phase 2c: Duplicate Detection (No AI)

Before tier scoring, detect duplicates by content hash — same as today (`analysis.ts` lines 69-85). Pages with duplicate content hashes are:

1. **Auto-assigned `consolidate` tier** — no AI call needed
2. **Joined to their URL prefix group** — they get the same template as other pages with that prefix
3. **Excluded from `scoreTiersBatch()`** — saves API calls

This happens in the orchestration layer (`runClassifyAndScore`), not inside the scoring function.

### Phase 3: Content Tier Scoring (Separate Pass)

Content tier scoring (`must_migrate`, `improve`, `consolidate`, `archive`) runs **per-page** on non-duplicate pages, using the existing batch-of-10 approach. This is now a **separate step** from template classification.

**Why separate:** Template classification is now group-level (one AI call), but tier scoring needs per-page content signals (word count, content quality, legal requirements). Combining them in one call is no longer possible since the group call doesn't have per-page content.

**Note:** The `consolidate` tier is only assigned to duplicates (in Phase 2c above). The AI scoring prompt asks for `must_migrate`, `improve`, or `archive` only.

## Technical Approach

### Files to Change

| File | Change |
|---|---|
| `src/services/classification.ts` | Rewrite: add `groupPagesByUrlPrefix()`, `nameTemplateGroups()`, `classifySingletonPages()`, `scoreTiersBatch()`. Delete `guessTemplateFromUrl()` (duplicates now join their prefix group directly), remove `TEMPLATE_TYPES` enum and `TemplateType` export (only used within this file) |
| `src/actions/analysis.ts` | Update `runClassifyAndScore()` orchestration: prefix grouping → AI naming → singleton classification → duplicate detection + `consolidate` assignment → tier scoring (non-duplicates only) → template creation (batched insert) |
| `src/components/analysis/classify-runner.tsx` | Update pipeline steps display |
| `src/db/schema.ts` | Add `urlPattern` column to templates table |
| `src/lib/cost-estimates.ts` | Update cost formula |

### Database Changes

Add one column to `templates`:

```sql
ALTER TABLE templates ADD COLUMN url_pattern varchar(255);
-- e.g., "/blog/*", "/awards/*", or NULL for singleton templates
```

The `name` column changes from enum-like values (`blog_post`) to free-form AI-generated slugs (`award`, `podcast_episode`, `event_page`). No schema change needed — it's already `varchar(255)`.

### New Classification Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ 1. URL-Prefix Grouping (pure logic, instant)            │
│    Input: all page URLs                                 │
│    Output: groups[] + ungrouped[]                       │
│    - Extract first path segment                         │
│    - Groups: 3+ pages with same prefix                  │
│    - No merge heuristic in v1                           │
├─────────────────────────────────────────────────────────┤
│ 2. AI Template Naming (1+ API calls, ≤50 groups each)   │
│    Input: group summaries (prefix, samples, stats)      │
│    Output: name + displayName + description per group   │
│    Cost: ~$0.01 per call                                │
├─────────────────────────────────────────────────────────┤
│ 3. Singleton Classification (batches of 10)             │
│    Input: ungrouped pages                               │
│    Output: name + displayName per page                  │
│    Cost: ~$0.10-0.50 depending on singleton count       │
├─────────────────────────────────────────────────────────┤
│ 4. Duplicate Detection (pure logic, instant)            │
│    Input: all pages with content hashes                 │
│    Output: duplicates auto-assigned "consolidate" tier  │
│    - Same content-hash approach as today                │
│    - Duplicates excluded from step 5                    │
├─────────────────────────────────────────────────────────┤
│ 5. Content Tier Scoring (batches of 10, non-duplicates) │
│    Input: non-duplicate pages (URL, title, word count)  │
│    Output: tier + tierReasoning per page                │
│    Cost: same as today (~$2-5 for 1000+ pages)          │
├─────────────────────────────────────────────────────────┤
│ 6. Save Results (batched DB operations)                 │
│    - Batch-insert template records (one INSERT call)    │
│    - Link pages to templates (batched inArray updates)  │
│    - Set content tiers on pages                         │
│    - Select representative pages (highest word count)   │
└─────────────────────────────────────────────────────────┘
```

### Key Functions

#### `groupPagesByUrlPrefix(pages)`

```typescript
interface PrefixGroup {
  prefix: string;          // e.g., "/blog"
  pattern: string;         // e.g., "/blog/*"
  pages: PageInput[];
  sampleUrls: string[];    // up to 5
  sampleTitles: string[];  // up to 5
  avgWordCount: number;
}

function groupPagesByUrlPrefix(
  pages: PageInput[]
): { groups: PrefixGroup[]; ungrouped: PageInput[] }
```

- Extract first path segment from each URL
- Homepage (`/`) → always ungrouped (singleton)
- Group by segment, threshold: 3+ pages
- Compute stats per group (avg word count, sample URLs)
- **Replaces `guessTemplateFromUrl()`** — that function is deleted. Duplicates now join their prefix group by URL structure directly, no regex cascade needed.

#### `nameTemplateGroups(groups)`

```typescript
interface NamedGroup {
  prefix: string;
  pattern: string;
  name: string;           // AI-generated slug
  displayName: string;    // AI-generated human name
  description: string;    // AI-generated description
  pages: PageInput[];
}

async function nameTemplateGroups(
  groups: PrefixGroup[]
): Promise<NamedGroup[]>
```

- One Claude Haiku call per chunk of ≤50 groups (split if more)
- Prompt asks for: name (kebab-case slug), displayName, description
- Parse JSON response with fallback: if AI fails, use prefix as name (e.g., `/awards` → "awards" / "Awards")

#### `classifySingletonPages(pages)`

```typescript
async function classifySingletonPages(
  pages: PageInput[]
): Promise<ClassifyResult[]>
```

- Batch of 10 (same as today)
- Free-form type output (no fixed enum)
- Returns name, displayName, confidence, reasoning per page
- Pages with same AI-assigned name get merged into one template

#### `scoreTiersBatch(pages)`

Extracted from the current dual prompt — only the tier scoring part.

```typescript
async function scoreTiersBatch(
  pages: PageInput[]
): Promise<TierResult[]>
```

- Batch of 10
- Same tier logic as today (must_migrate, improve, consolidate, archive)
- Same guidelines (500+ words blog = must_migrate, legal = must_migrate, etc.)

### UI Pipeline Steps

Update `classify-runner.tsx` steps and `isAnalyzing` guard:

```typescript
const STEPS = [
  { key: "classifying", label: "Classifying Pages" },
  { key: "scoring", label: "Scoring Content Tiers" },
  { key: "saving", label: "Saving Results" },
  { key: "classified", label: "Classification Complete" },
];
```

The `classifying` step covers URL-prefix grouping, AI naming, and singleton classification internally (sub-steps reported via progress callback). This keeps the UI simple — users don't need to see the internal distinction.

**Important:** Update the `isAnalyzing` guard (currently `currentStep === "classification" || currentStep === "saving"`) to match the new step keys:

```typescript
const isAnalyzing = status === "analyzing" &&
  (currentStep === "classifying" || currentStep === "scoring" || currentStep === "saving");
```

### Cost Estimate Update

Current: `pages * 500 input + pages * 150 output` tokens.

New formula:
- **Group naming:** 1 call, ~2000 input + ~1000 output tokens (fixed cost ~$0.01)
- **Singleton classification:** `singletonCount / 10` calls, same per-call cost as today
- **Tier scoring:** `totalPages / 10` calls, same as today

Before grouping is done, estimate singleton count as ~20% of total pages (most pages will be in groups). Refine after grouping.

### Representative Page Selection

For prefix groups: select the page with the **highest word count** (excludes near-empty/404 pages). Ties broken by alphabetical URL.

For singleton templates: the page itself is the representative.

User can still override via the existing dropdown in `template-clusters.tsx`.

### Re-classification

- Same behavior as today: delete existing templates, clear templateId on pages
- Content tier overrides: **reset** (same as today)
- Add a confirmation dialog: "Re-running will reset all template assignments and content tiers. Manual edits will be lost. Continue?"

### Error Handling

- Group naming AI call fails → fall back to prefix-as-name (e.g., `/awards` → "Awards")
- Singleton batch fails → fall back to `custom_page` / `improve` (same as today)
- Tier scoring batch fails → fall back to `improve` (same as today)
- Partial failure: completed groups/batches are preserved; only failed items get fallback values

## Acceptance Criteria

- [x] Pages with the same URL prefix are always in the same template (no more awards split)
- [x] Template names are descriptive and site-specific (e.g., "Award", "Podcast Episode", "Event Page")
- [x] `custom_page` no longer exists as a catch-all mega-bucket
- [x] Duplicate pages get `consolidate` tier without AI calls and join their prefix group
- [x] Content tier scoring produces same quality results as today
- [x] Cost is equal or lower than current approach (group naming replaces per-page classification)
- [x] UI shows updated pipeline steps during classification
- [x] Re-classification works cleanly (no orphaned data)
- [x] Templates store their URL pattern for display (`/blog/*`, `/awards/*`)
- [x] Representative page selection works for prefix groups (highest word count)

## Success Metrics

- **Consistency:** 0 cases of same URL prefix split across templates (currently 46 awards pages split)
- **Granularity:** Sites like Dremio produce 15-25 specific templates instead of 14 generic ones
- **Cost:** Group naming call is ~$0.01 vs current ~$2-5 for per-page classification. Net savings depend on singleton count but overall should be 30-50% cheaper since prefix groups skip per-page classification

## Dependencies & Risks

**Dependencies:**
- None — this modifies existing classification code, no new external services

**Risks:**
- **Flat URL structures:** Sites with all pages at root level (no path segments) would produce mostly singletons, falling back to per-page AI classification. Mitigation: this is no worse than today's approach.
- **Over-splitting:** First-segment grouping might create too many small groups on deeply nested sites. Mitigation: 3-page minimum threshold; small groups become singletons.
- **AI naming quality:** Free-form names could be inconsistent across runs. Mitigation: prefix-based fallback if AI fails; users can rename.

## References

### Internal
- Current classification: `src/services/classification.ts`
- Analysis orchestration: `src/actions/analysis.ts`
- Pipeline UI: `src/components/analysis/classify-runner.tsx`
- Template display: `src/components/analysis/template-clusters.tsx`
- Cost estimates: `src/lib/cost-estimates.ts`
- Smart pipeline plan: `docs/plans/2026-03-08-feat-smart-analysis-pipeline-plan.md`

### Data Analysis (Dremio project)
- 782 pages in blog_post (574 /blog/, 29 /awards/, 179 root-level)
- 198 pages in custom_page (166 /events/, 17 /awards/, 15 misc)
- 143 resource_page + 51 documentation_page overlapping on /wiki/ and /resources/
