---
title: Update Content Tier Scoring for Risk-Free Migration
type: feat
date: 2026-04-12
---

# Update Content Tier Scoring for Risk-Free Migration

## Overview

Reframe content tier scoring around a "risk-free migration" philosophy. The current prompt is too conservative — it splits pages between must_migrate and improve based on content quality signals, producing ~72% must_migrate / 11% improve. The new approach assumes **migrate everything by default** and only archives truly dead content. Pagination and tag archive pages should be excluded from scoring entirely.

## Problem Statement

### Current vs New Requirements

| Aspect | Current Implementation | New Requirement |
|---|---|---|
| Philosophy | "Which pages are worth migrating?" | "Migrate everything — which few can we skip?" |
| must_migrate target | 40-50% | **70-80%** |
| improve target | 20-30% | **10-20%** |
| consolidate | 5-15% (exact hash duplicates only) | **5-10%** |
| archive target | 15-25% | **0-5%** |
| Pagination pages | Scored normally by AI | **Excluded entirely** |
| Tag/category archives | Scored normally by AI | **Excluded entirely** |
| Default tier (AI fallback) | `improve` | `improve` (unchanged) |

### What the AI Prompt Currently Says

```
- "must_migrate": High-value pages critical to the business — homepage,
  key service/product pages, case studies, about pages, team pages, pricing.
  Blog posts with 500+ words. Legal pages.
- "improve": Pages worth keeping but need work — thin landing pages,
  outdated content, pages with poor structure.
- "archive": Empty/placeholder pages, outdated job postings, blog
  listing/pagination pages, tag archives, author archives.
```

### What Needs to Change

1. **Prompt rewrite** — `must_migrate` should be the default for any page with real content. `improve` is for pages that need significant content updates. `archive` is only for empty/broken pages.
2. **Pre-scoring exclusion** — pagination pages (`/page/\d+`) and tag/category/author archives should be excluded from scoring and from the page list. They're not migration candidates.
3. **Remove pagination/archive guidance from AI prompt** — the AI no longer needs to handle these because they're excluded before scoring.

## Proposed Solution

### Change 1: Exclude Pagination and Archive Pages Before Scoring

Add a pre-scoring filter in `runClassifyAndScore()` that marks pagination and taxonomy archive pages as `excluded = true` in the database. These pages are removed from all downstream processing — they don't appear in templates, tier scoring, or reports.

**Detection patterns (deterministic, no AI):**

```
Pagination:
- URL contains /page/\d+ (e.g., /blog/page/2, /category/news/page/3)
- URL contains ?page= or ?p= query parameters

Tag/Category/Author archives:
- URL contains /tag/ or /tags/
- URL contains /category/ or /categories/
- URL contains /author/ (but NOT /authors/ which is a section index)
- URL matches /blog/category/, /blog/tag/, /blog/author/ patterns
```

**Implementation:** New function `excludeArchivePages(projectPages)` in `classification.ts` that returns URLs to exclude. Called in `runClassifyAndScore()` before template grouping. Sets `excluded = true` on matched pages in the DB.

**Why exclude rather than archive?** These pages are structural artifacts of the CMS (WordPress pagination, taxonomy pages), not real content. Including them inflates page counts and distorts tier distribution. A 1,341-page site might actually have 1,100 real pages + 241 pagination/taxonomy pages.

### Change 2: Rewrite the Tier Scoring Prompt

**New prompt:**

```
Analyze each webpage and assign a content migration tier.

CONTEXT: This is a risk-free website migration. The goal is to preserve
the existing site structure and content. Most pages should be migrated.

CONTENT TIERS:
- "must_migrate": Any page with real content that serves a business purpose.
  This includes: all product/service pages, blog posts, case studies, about
  pages, team pages, pricing, legal pages, landing pages, resource pages,
  partner pages, event pages, press releases, documentation, guides.
  When in doubt, choose must_migrate.
- "improve": Pages that should be migrated but need significant content
  updates — very outdated content (years-old announcements with no lasting
  value), pages with broken/missing content, pages where the content is
  mostly placeholder text.
- "archive": ONLY pages with no real content — empty placeholder pages,
  pages that are entirely 404/error pages, pages with fewer than 50 words
  and no clear purpose.

GUIDELINES:
- Default to must_migrate. Most pages on a well-structured site should
  be migrated as-is.
- Blog posts with real content are must_migrate regardless of age.
- Legal/policy pages are always must_migrate.
- improve means "migrate but flag for content review" — use sparingly.
- archive is rare — only for truly empty or broken pages.
- Do NOT archive pages just because they're old or have low word count.
  Old content still has SEO value.
```

### Change 3: No Other Code Changes Needed

The existing architecture is correct:
- Duplicate detection (content hash → `consolidate`) stays the same
- Listing pages forced to `must_migrate` stays the same
- Post-Ahrefs enrichment tier override stays the same
- Re-score Tiers button works independently
- `runTierScoringOnly` action works independently

## Technical Approach

### Files to Change

| File | Change |
|---|---|
| `src/services/classification.ts` | Rewrite `scoreBatch()` prompt. Add `getExcludePatterns()` helper. |
| `src/actions/analysis.ts` | Add exclusion step before template grouping in `runClassifyAndScore()`. Mark matched pages as `excluded = true`. |

### New Function: Page Exclusion

```typescript
// src/services/classification.ts

/**
 * Detect pagination and taxonomy archive pages that should be
 * excluded from migration analysis entirely.
 */
export function detectExcludablePages(
  pages: { url: string }[]
): Set<string> {
  const excludeUrls = new Set<string>();

  for (const page of pages) {
    try {
      const { pathname, searchParams } = new URL(page.url);

      // Pagination: /page/2, /page/3, etc.
      if (/\/page\/\d+/.test(pathname)) {
        excludeUrls.add(page.url);
        continue;
      }

      // Query-based pagination: ?page=2, ?p=2
      if (searchParams.has("page") || searchParams.has("p")) {
        excludeUrls.add(page.url);
        continue;
      }

      // Tag archives: /tag/*, /tags/*
      if (/\/(tags?)\//.test(pathname)) {
        excludeUrls.add(page.url);
        continue;
      }

      // Category archives: /category/*, /categories/*
      if (/\/(categor(?:y|ies))\//.test(pathname)) {
        excludeUrls.add(page.url);
        continue;
      }

      // Author archives (but not /authors/ section index)
      if (/\/author\//.test(pathname)) {
        excludeUrls.add(page.url);
        continue;
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return excludeUrls;
}
```

### Orchestration Change

In `runClassifyAndScore()`, before the URL-prefix grouping step:

```typescript
// ── Step 0: Exclude pagination and taxonomy archive pages ──
const excludableUrls = detectExcludablePages(pageInputs);
if (excludableUrls.size > 0) {
  const excludableIds = projectPages
    .filter((p) => excludableUrls.has(p.url))
    .map((p) => p.id);
  // Mark as excluded in batches
  for (let i = 0; i < excludableIds.length; i += 500) {
    const batch = excludableIds.slice(i, i + 500);
    await db
      .update(pages)
      .set({ excluded: true })
      .where(inArray(pages.id, batch));
  }
  // Remove from processing
  projectPages = projectPages.filter((p) => !excludableUrls.has(p.url));
  pageInputs = pageInputs.filter((p) => !excludableUrls.has(p.url));
}
```

## Acceptance Criteria

- [ ] Pagination pages (`/page/\d+`, `?page=N`) are excluded from all analysis
- [ ] Tag/category/author archive pages are excluded from all analysis
- [ ] Excluded pages don't appear in templates, tier scoring, or reports
- [ ] AI prompt defaults to `must_migrate` for any page with real content
- [ ] `improve` tier used only for pages needing significant content updates
- [ ] `archive` tier used only for empty/broken pages (<50 words, no purpose)
- [ ] Dremio project produces ~70-80% must_migrate after re-scoring
- [ ] All existing tests pass
- [ ] New tests for `detectExcludablePages` covering pagination, tags, categories, author archives
- [ ] Re-score Tiers button works with new prompt

## Success Metrics

On the Dremio project (1,341 pages → expected ~1,100 after exclusions):
- **must_migrate**: 70-80% (~770-880 pages)
- **improve**: 10-20% (~110-220 pages)
- **consolidate**: 5-10% (from duplicate detection)
- **archive**: 0-5% (~0-55 pages, only truly empty/broken)
- **excluded**: ~200+ pagination/taxonomy pages removed from counts

## Risks

- **False positive exclusion**: A page at `/category/enterprise-solutions` might be a real landing page, not a taxonomy archive. Mitigation: the regex checks for `/category/` followed by more path segments typical of archives. Single-segment paths like `/category` itself won't match (it would be caught by the listing/detail split instead).
- **Over-migration**: With 70-80% must_migrate, the project scope is larger. This is intentional — the user's philosophy is "migrate everything for risk-free migration, clean up after."

## References

- Current scoring prompt: `src/services/classification.ts:507-527`
- Orchestration: `src/actions/analysis.ts:106-146`
- Tier scoring review: `docs/analysis/content-tier-scoring-review.md`
- Classification learnings: `docs/solutions/url-prefix-classification-learnings.md`
