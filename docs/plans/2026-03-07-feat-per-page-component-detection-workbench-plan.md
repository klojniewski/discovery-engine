---
title: "feat: Per-Page Component Detection Workbench"
type: feat
date: 2026-03-07
status: in-progress
---

# Per-Page Component Detection Workbench

## Overview

Build a per-page detail view where users can pick a specific scraped page, view its screenshot, and trigger AI component detection on just that page. The AI splits the page into ordered horizontal sections and identifies components within each. This enables iterating on detection quality one page at a time, without running full analysis across all templates.

## Problem Statement

Component detection currently runs across all templates during full analysis — one representative page per template. This has several issues:

1. **No way to iterate** — you must re-run full analysis to see different results, burning API calls on all templates
2. **No per-page view** — can't inspect what was detected for a specific page
3. **Coarse position data** — `position` field uses 5 buckets (header/above_fold/mid_page/below_fold/footer) which can't distinguish between two components in the same zone
4. **132 components, many duplicates** — no concept of ordered sections, just a flat list

## Proposed Solution

### Page Detail View

A new route `/projects/[id]/pages/[pageId]` that shows:
- Full-page screenshot (scrollable)
- Page metadata (URL, title, word count, template, content tier)
- Detected sections/components for this page
- "Detect Components" button to trigger per-page AI analysis

### Improved AI Prompt — Section-Based Detection

Update the AI prompt to return **ordered sections** (array position = order) instead of a flat component list:

```json
[
  {
    "sectionLabel": "Navigation Bar",
    "components": [
      {
        "type": "navigation",
        "styleDescription": "Dark header with logo left, links center, CTA right",
        "complexity": "moderate"
      }
    ]
  },
  {
    "sectionLabel": "Hero Banner",
    "components": [
      {
        "type": "hero",
        "styleDescription": "Split layout, headline left, red graphic right, CTA button",
        "complexity": "complex"
      }
    ]
  }
]
```

Each section is a horizontal band of the page. Array position provides the order (no explicit `sectionIndex` needed).

## Technical Approach

### Data Model

Add a `detectedSections` JSONB column to `pages` table. Per-page detection results live on the page itself, independent of the bulk `components` table. No conflict on re-run, no new tables.

```sql
ALTER TABLE pages ADD COLUMN detected_sections jsonb;
```

### Type Safety (Critical)

Define shared types and validate at the boundary:

```typescript
// src/types/page-sections.ts
export interface PageSection {
  sectionLabel: string;
  components: SectionComponent[];
}

export interface SectionComponent {
  type: string;
  styleDescription: string;
  complexity: "simple" | "moderate" | "complex";
}
```

Use `.$type<PageSection[] | null>()` on the Drizzle column. Add a parse/normalize function to handle AI response shape variations (missing fields, unexpected types).

### Key Files

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `detectedSections` jsonb column to `pages` |
| `src/types/page-sections.ts` | **New** — `PageSection` and `SectionComponent` types |
| `src/services/components.ts` | New `detectPageSections(screenshotUrl, pageUrl)` with section-aware prompt + validation |
| `src/actions/analysis.ts` | New `runPageDetection(pageId)` server action |
| `src/app/(dashboard)/projects/[id]/pages/[pageId]/page.tsx` | **New** — page detail route (server component) |
| `src/components/pages/page-detail.tsx` | **New** — client component: metadata, screenshot, detect button, section results |
| `src/components/projects/scrape-results-table.tsx` | Make rows clickable → link to detail view |

### Implementation Phases

#### Phase 1: Backend — Schema + AI Prompt + Server Action

- [x] Add `detectedSections` jsonb column to `pages` table in schema + migration
- [x] Create `PageSection` and `SectionComponent` types in `src/types/page-sections.ts`
- [x] Create `detectPageSections(screenshotUrl, pageUrl)` in `src/services/components.ts`
  - Section-aware prompt returning ordered array of `{ sectionLabel, components[] }`
  - Parse/validate response with fallbacks for missing fields
  - Throw on complete failure (not silent empty array)
  - Use Claude Sonnet (same as current component detection)
- [x] Create `runPageDetection(pageId)` server action in `src/actions/analysis.ts`
  - Fetch page, validate it has a screenshot
  - Call `detectPageSections`
  - Store result in `pages.detectedSections`
  - Call `revalidatePath` to refresh the page
  - Return the sections
- [ ] Test the prompt against 2-3 real pages before building UI

#### Phase 2: Frontend — Page Detail View + Navigation

- [x] Create route `src/app/(dashboard)/projects/[id]/pages/[pageId]/page.tsx`
  - Server component: fetch page + project data, 404 if not found
- [x] Create `src/components/pages/page-detail.tsx` (client component)
  - Single-column layout: metadata header, screenshot, detect button, section results below
  - "Detect Components" button (disabled if no screenshot, loading spinner during AI call)
  - Error message if detection fails
  - Display `detectedSections` as ordered numbered section cards, each with components
  - `useTransition` for the detect action
- [x] Make scrape table rows clickable → link to `/projects/[id]/pages/[pageId]`
- [x] Add breadcrumb: Project > Scrape > Page Detail
- [x] Pages without screenshots: show message "No screenshot available. Go to Scrape tab to capture one."

## Acceptance Criteria

- [ ] Can navigate from scrape table to a page detail view
- [ ] Page detail view shows screenshot + metadata
- [ ] "Detect Components" triggers AI analysis on just this page
- [ ] Results show ordered sections with components (not flat list)
- [ ] Re-running detection replaces previous results for this page
- [ ] Full analysis (`runFullAnalysis`) still works independently — doesn't touch `detectedSections`
- [ ] Error feedback if AI call fails
- [ ] Loading state visible during AI call

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Store results | JSONB on `pages.detectedSections` | Independent from bulk `components` table, no conflict on re-run |
| AI prompt | Section-based ordered array | Better than flat list, gives structure for visualization |
| Detail view | New route `/projects/[id]/pages/[pageId]` | Needs screen space for screenshot + sections |
| Layout | Single-column (screenshot top, sections below) | Simpler than side-by-side, works on all screen sizes, iterate later if needed |
| Type safety | Shared types + parse/validate | Prevent runtime crashes from AI response shape changes |
| Iteration scope | Developer re-runs detection, no prompt editing UI | Keep it simple |

## Out of Scope (Future)

- Bounding box coordinates / visual overlays on screenshot
- Prompt editing UI for end users
- Diff view between detection runs
- Merging per-page results back into bulk `components` table (note: if this becomes needed, JSONB queries across pages are slower than relational — revisit data model then)
- Cost tracking per detection call
- Side-by-side two-column layout (upgrade from single-column if scrolling becomes annoying)
- "Take Screenshot" button on detail view (use scrape tab instead)
- Template clusters page links (one entry point is enough for now)

## References

- `src/services/components.ts:10-47` — current `detectComponents` function
- `src/actions/analysis.ts:189-242` — `runComponentDetection` (bulk, template-based)
- `src/services/anthropic.ts` — `callClaudeWithImage` with Sharp resize
- `src/components/projects/content-preview-panel.tsx` — existing slide-over panel pattern
- `src/components/analysis/component-inventory.tsx` — current component display
- `src/db/schema.ts:78-90` — components table schema
