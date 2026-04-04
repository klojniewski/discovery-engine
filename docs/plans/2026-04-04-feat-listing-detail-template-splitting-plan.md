---
title: Listing/Detail Template Splitting
type: feat
date: 2026-04-04
---

# Listing/Detail Template Splitting

## Overview

The URL-prefix classification groups all pages sharing a prefix into one template. This means listing/index pages (e.g., `/press-releases`) get lumped with detail pages (e.g., `/press-releases/announcing-dremio`), even though they're structurally different templates.

Add one post-processing function after URL-prefix grouping that extracts index pages into the ungrouped pool, so the AI singleton classifier names them separately.

## Problem Statement

**Evidence from Dremio project (1,340 pages):**

| Prefix | Listing page | Detail pages | Issue |
|---|---|---|---|
| `/press-releases` | 1 page (1281 words) | 94 pages | Listing mixed with detail |
| `/events` | 1 page (2033 words) | 166 pages | Listing mixed with detail |
| `/blog` | 1 page (1286 words) | 583 pages | Listing mixed with posts |
| `/customers` | 1 page (705 words) | 32 pages | Listing mixed with case studies |
| `/wiki` | 1 page (603 words) | 73 pages | Listing mixed with definitions |
| `/gnarly-data-waves` | 1 page (6872 words) | 88 pages | Hub page mixed with episodes |
| `/awards` | 1 page (1236 words) | 46 pages | Listing mixed with awards |
| `/resources` | 1 page (626 words) | 27 pages | Listing mixed with resources |

A migration audit needs to know: "There are 2 listing pages and 94 press release detail pages" — not "95 press release pages." The listing template has a card grid layout; the detail template has article content. They require different migration strategies.

## Proposed Solution

Add a `splitListingPages()` function that runs after `groupPagesByUrlPrefix()` and before `nameTemplateGroups()`.

**Algorithm:**

For each prefix group, check if any page's URL path (after stripping trailing slashes) exactly equals the prefix. If so, extract those index pages into the ungrouped pool — the AI singleton classifier names them individually.

```
/press-releases           → pathname === prefix "/press-releases" → index page → extract to ungrouped
/press-releases/slug      → pathname !== prefix → detail page → stays in group
```

**Index detection uses path equality, not depth arithmetic** (per reviewer feedback — simpler, immune to future changes in `extractPrefix`):

```typescript
function isIndexPage(pageUrl: string, prefix: string): boolean {
  const { pathname } = new URL(pageUrl);
  const clean = pathname.replace(/\/+$/, "") || "/";
  return clean === prefix;
}
```

**Edge cases:**
- Homepage (`/`) is never treated as a listing page — already always ungrouped
- Trailing slashes stripped before comparison (existing behavior)
- If extracting index pages leaves the detail group with <3 pages, the remaining detail pages also move to ungrouped (become singletons) — this is fine, the AI handles small groups well
- If a group has no index pages, it's unchanged

**No `isListing` flag or prompt hints needed.** The AI already receives URL + title + word count. A group with 1 page at `/press-releases` titled "Press Releases | Dremio" will be correctly named without hints.

### Pipeline Integration

```
1. groupPagesByUrlPrefix()          — existing, unchanged
2. splitListingPages(groups)        — NEW: extract index pages to ungrouped
3. nameTemplateGroups(groups)       — existing, receives cleaned groups
4. classifySingletonPages(ungrouped) — existing, listing pages land here
5. mergeSingletonNames(results)     — existing, unchanged
6. scoreTiersBatch(pages)           — existing, unchanged
7. Save results                     — existing, unchanged
```

### What About 404s and Pagination Pages?

Reviewers unanimously recommended deferring content-aware sub-splitting (404 detection, pagination detection). The AI naming step already sees sample titles like "Page not found | Dremio" and names groups appropriately. The tier scoring prompt already assigns `archive` to 404s and pagination pages. If template card noise proves a problem after this ships, add content-aware splitting in a follow-up.

## Technical Approach

### New Function

#### `splitListingPages(groups, ungrouped)`

**Location:** `src/services/classification.ts`

```typescript
export function splitListingPages(
  groups: PrefixGroup[],
  ungrouped: PageInput[]
): { groups: PrefixGroup[]; ungrouped: PageInput[] } {
  const newGroups: PrefixGroup[] = [];
  const newUngrouped = [...ungrouped];

  for (const group of groups) {
    const indexPages: PageInput[] = [];
    const detailPages: PageInput[] = [];

    for (const page of group.pages) {
      const { pathname } = new URL(page.url);
      const clean = pathname.replace(/\/+$/, "") || "/";
      if (clean === group.prefix) {
        indexPages.push(page);
      } else {
        detailPages.push(page);
      }
    }

    if (indexPages.length > 0 && detailPages.length > 0) {
      // Index pages become singletons (AI classifies them individually)
      newUngrouped.push(...indexPages);
      // Rebuild group stats with detail pages only
      newGroups.push(rebuildGroup(group, detailPages));
    } else {
      // No split needed — all pages are same type
      newGroups.push(group);
    }
  }

  return { groups: newGroups, ungrouped: newUngrouped };
}
```

Plus a small `rebuildGroup()` helper that recalculates `sampleUrls`, `sampleTitles`, `avgWordCount`, and `pages` for the remaining detail pages.

### Files to Change

| File | Change |
|---|---|
| `src/services/classification.ts` | Add `splitListingPages()` and `rebuildGroup()` (~30 lines) |
| `src/actions/analysis.ts` | Insert split step between grouping and naming (~2 lines) |
| `src/services/__tests__/classification.test.ts` | Add tests for `splitListingPages` |
| `src/components/analysis/template-clusters.tsx` | Show `urlPattern` on template cards (~3 lines) |

### Database Changes

**None.** The existing `urlPattern` column stores the pattern. Detail templates keep `/press-releases/*`. Listing pages become singletons with `urlPattern: null` (same as other singletons).

### UI: Show URL Pattern on Template Cards

```tsx
{template.urlPattern && (
  <span className="font-mono text-xs text-muted-foreground">
    {template.urlPattern}
  </span>
)}
```

## Acceptance Criteria

- [ ] Index pages at prefix level are extracted from prefix groups into ungrouped pool
- [ ] `/press-releases` (listing) and `/press-releases/*` (detail) become separate templates
- [ ] Groups with no index page are unchanged
- [ ] If extracting leaves <3 detail pages, all pages become ungrouped (no broken groups)
- [ ] Listing pages correctly classified and named by AI singleton classifier
- [ ] URL pattern visible on template cards in the UI
- [ ] All existing 11 tests pass unchanged
- [ ] 6+ new tests cover split function (basic split, no index page, trailing slash, all-index group, homepage not affected, group stats recalculated)
- [ ] Re-classify templates only works with new split logic

## Success Metrics

- **Dremio project:** Press releases split into 2 templates (listing + detail) instead of 1
- **Dremio project:** All 8 affected prefixes produce separate listing and detail templates
- **General:** Any site with `/section` + `/section/*` pages produces separate templates

## Dependencies & Risks

**Dependencies:** None — modifies existing classification code only.

**Risks:**
- **Listing singleton merge risk:** The singleton merge pass could theoretically merge listing pages across different prefixes. Low risk — listing pages from different sections have different titles and content.
- **Flat URL sites:** Sites with all pages at root level won't benefit (no prefix groups to split). No worse than today.

## Deferred (Future PRs)

- **Content-aware sub-splitting:** 404 detection, pagination detection, word count outlier detection. Deferred until we see whether the AI naming + tier scoring handles these adequately after the listing/detail split.
- **Representative page filtering:** Skip 404-titled pages when selecting representative pages. Can be a 3-line fix in `selectRepresentative` if needed.

## References

### Internal
- Current classification: `src/services/classification.ts` (lines 29-84 for grouping)
- Analysis orchestration: `src/actions/analysis.ts` (lines 63-252 for `runClassifyAndScore`)
- Template UI: `src/components/analysis/template-clusters.tsx`
- Classification plan: `docs/plans/2026-04-02-feat-url-prefix-template-classification-plan.md`
- Learnings: `docs/solutions/url-prefix-classification-learnings.md`

### Data Analysis (Dremio project `f7b4ff4d`)
- `/press-releases`: 1 listing (1281 words) + 94 detail pages
- `/events`: 1 listing (2033 words) + 166 detail pages
- `/blog`: 1 listing (1286 words) + 583 posts
- 8 prefixes total affected by listing/detail mixing
