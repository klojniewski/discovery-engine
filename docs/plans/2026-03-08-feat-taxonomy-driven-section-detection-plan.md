---
title: "feat: Taxonomy-Driven Section Detection"
type: feat
date: 2026-03-08
status: draft
---

# Taxonomy-Driven Section Detection

## Overview

Update the AI section detection prompt to use the database-backed section type taxonomy instead of free-form labels. The AI picks from 64 known slugs, returning structured `sectionType` values. Add a Section Inventory view to the analysis page showing detected sections with SVG wireframe placeholders. Integrate section detection into the full analysis pipeline so it runs across all pages automatically.

## Problem Statement

1. **Free-form labels are unreliable** — the AI returns arbitrary strings like "Benefits Feature Grid" or "Feature Cards" that don't normalize to our 64-type taxonomy. The current `matchSectionType` bridge catches ~60-70% via substring matching — the rest show "No match."
2. **Analysis page has no section visibility** — the analysis page shows template clusters, content tiers, and component inventory but zero section-level data. Section detection only runs per-page when a user manually clicks "Detect Components."
3. **No bulk section detection** — `runFullAnalysis` runs `detectComponents` (flat component list) but not `detectPageSections`. There's no way to get section data across a whole project without clicking each page individually.

## Proposed Solution

### 1. Update the Detection Prompt

Inject section types from DB into `buildSectionPrompt`. The AI receives a compact taxonomy list and must return a `sectionType` slug for each detected section.

**Prompt taxonomy format** (token-efficient, ~500 tokens for 64 types):

```
SECTION TYPE TAXONOMY (use these slugs for sectionType):

Navigation: navigation, sticky-header, mega-menu, breadcrumbs
Hero: hero — Full-width headline with CTA, hero-split — Text left image right, hero-video, hero-slider
Content: about, content-block, card-grid, features — Feature highlights grid, benefits, how-it-works, services, columns, text-block, stats, timeline, comparison
Media: image-gallery, video-section, bento-grid, masonry, carousel
Social Proof: testimonials, reviews, logo-cloud, case-studies, clients, awards
CTA: cta, cta-banner, banner, newsletter, download
Forms: contact-form, login-form, signup-form, search
Commerce: pricing, product-grid, product-featured, cart
Blog: blog-grid, blog-featured, blog-list, categories
Support: faq, accordion, tabs
People: team, author
Footer: footer, footer-simple, sitemap, social-links
Location: map, locations
Utility: divider, spacer, marquee, countdown, announcement
```

**Key prompt instructions:**
- Return `sectionType` as the matching slug from the taxonomy, or `null` if no match
- Keep `sectionLabel` as a human-readable description (always returned)
- Component `type` field should also use the taxonomy slugs where applicable

### 2. Update `PageSection` Interface

```typescript
// src/types/page-sections.ts
export interface PageSection {
  sectionLabel: string;           // Human-readable (always present)
  sectionType: string | null;     // Taxonomy slug or null (NEW)
  yStartPercent: number;
  yEndPercent: number;
  components: SectionComponent[];
}
```

### 3. Add Section Detection to Full Analysis

Add a new step to `runFullAnalysis` in `src/actions/analysis.ts` that runs `detectPageSections` on all non-excluded pages with screenshots. Skip pages that already have `detectedSections` (user can force re-detect per-page).

### 4. Section Inventory on Analysis Page

New component showing detected section types aggregated across all project pages:
- Grid of cards grouped by category
- Each card: SVG thumbnail, section type name, occurrence count
- "No sections detected" empty state when no pages have been analyzed
- Links to pages containing each section type

### 5. Fix Existing Bugs

- **`createSectionType` sort order bug** — uses `asc` ordering when it should use `desc` to get the max sort order (`src/actions/section-types.ts:51-55`)

## Technical Approach

### Key Files

| File | Change |
|------|--------|
| `src/services/components.ts` | **Modify** — Update `buildSectionPrompt` to accept + inject section types; update `detectPageSections` to fetch types from DB |
| `src/types/page-sections.ts` | **Modify** — Add `sectionType: string \| null` to `PageSection`; update `parsePageSections` to extract and validate |
| `src/actions/analysis.ts` | **Modify** — Update `runPageDetection` to pass section types; add section detection step to `runFullAnalysis` |
| `src/app/(dashboard)/projects/[id]/analysis/page.tsx` | **Modify** — Fetch section data, render Section Inventory |
| `src/components/analysis/section-inventory.tsx` | **New** — Section type grid with SVG placeholders and counts |
| `src/components/pages/page-detail.tsx` | **Modify** — Use `sectionType` for direct SVG lookup, fall back to `matchSectionType` for legacy data |
| `src/actions/section-types.ts` | **Modify** — Fix sort order bug in `createSectionType` |

### Data Flow

```
section_types table (64 rows)
        │
        ▼
buildSectionPrompt(sectionTypes)  ← injects taxonomy into AI prompt
        │
        ▼
Claude Sonnet returns JSON with sectionType slugs
        │
        ▼
parsePageSections(raw, validSlugs) ← validates slugs against taxonomy
        │
        ▼
pages.detectedSections JSONB      ← stored with sectionType field
        │
        ├──► Page Detail View     ← direct slug lookup for SVG
        └──► Analysis Page        ← aggregated section inventory
```

### Backward Compatibility

Existing `detectedSections` JSONB rows lack `sectionType`. Strategy:
- `parsePageSections` treats missing `sectionType` as `null`
- Display logic: use `sectionType` for SVG lookup if present, fall back to `matchSectionType(sectionLabel)` for legacy data
- Re-running detection on a page overwrites with new format (full overwrite is existing behavior)
- No data migration needed — legacy data works via fallback

### Implementation Phases

#### Phase 1: Update Prompt + Type + Parsing

- [x] Add `sectionType: string | null` to `PageSection` interface in `src/types/page-sections.ts`
- [x] Update `parsePageSections` to accept optional `validSlugs?: string[]` parameter
  - Extract `sectionType` from AI response
  - If `validSlugs` provided and slug not in set, set `sectionType` to `null`
  - Normalize slug casing (lowercase, trim)
- [x] Update `buildSectionPrompt` in `src/services/components.ts` to accept `sectionTypes` parameter
  - Format as compact taxonomy list grouped by category
  - Include slug and description (skip name — usually just formatted slug)
  - Add instruction: return `sectionType` slug from taxonomy, or `null` if no match
  - Update example JSON to show both `sectionType` and `sectionLabel`
- [x] Update `detectPageSections` to accept and pass section types
- [x] Update `runPageDetection` in `src/actions/analysis.ts` to fetch section types and pass to detection
- [x] Update page detail display in `src/components/pages/page-detail.tsx`:
  - Use `section.sectionType` for direct SVG lookup when available
  - Fall back to `matchSectionType(section.sectionLabel)` when `sectionType` is null
- [x] Fix `createSectionType` sort order bug: change `asc` to `desc` in max order query
- [ ] Test: run detection on a page, verify `sectionType` slugs are returned and SVGs match

#### Phase 2: Bulk Detection + Analysis Page

- [x] Add section detection step to `runFullAnalysis` in `src/actions/analysis.ts`:
  - After component detection step, iterate all non-excluded pages with screenshots
  - Skip pages that already have `detectedSections` (avoid redundant API calls)
  - Use existing `analysisProgress` pattern for progress reporting
  - Update `analysisStep` values to include new step
- [x] Create `src/components/analysis/section-inventory.tsx`:
  - Accept aggregated section data + section types as props
  - Grid of cards grouped by category
  - Each card: SVG thumbnail (from `section_types.svg_content`), type name, occurrence count badge
  - Fallback card for sections with `sectionType: null` showing count of unmatched sections
  - Empty state: "No sections detected. Run analysis to detect sections across all pages."
- [x] Update `src/app/(dashboard)/projects/[id]/analysis/page.tsx`:
  - Query all pages' `detectedSections` for the project
  - Aggregate by `sectionType` slug: count occurrences, collect page IDs
  - Fetch section types from DB for SVG content
  - Render `SectionInventory` component between ContentTiers and ComponentInventory
- [ ] Test: run full analysis, verify section inventory populates on analysis page

## Acceptance Criteria

- [ ] AI detection prompt includes all 64 section type slugs with descriptions
- [ ] AI returns `sectionType` slugs that match the taxonomy
- [ ] `PageSection` has `sectionType: string | null` field
- [ ] Unknown sections get `sectionType: null` with descriptive `sectionLabel`
- [ ] Page detail SVG lookup uses `sectionType` directly (no fuzzy matching for new detections)
- [ ] Legacy `detectedSections` without `sectionType` still display correctly via fallback
- [ ] `runFullAnalysis` includes a section detection step across all pages
- [ ] Analysis page shows Section Inventory with SVG placeholders and occurrence counts
- [ ] Section Inventory groups by category, shows empty state when no detections exist
- [ ] `createSectionType` sort order bug is fixed
- [ ] No TypeScript compilation errors

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Taxonomy format in prompt | Compact `slug — description` per line, grouped by category | ~500 tokens for 64 types; readable by AI; minimal cost |
| `sectionType` nullability | `string \| null` | AI may encounter sections outside taxonomy; null = unknown |
| Keep `sectionLabel` | Yes, always returned | Human-readable fallback, debugging context, handles unknowns |
| Slug validation | In `parsePageSections` with optional `validSlugs` param | Keeps function testable; validation is opt-in |
| Invalid slug handling | Set to `null`, keep section | Don't lose data; show "No match" in UI |
| Bulk detection scope | Pages with screenshots, skip already-detected | Avoid redundant API calls; user can force re-detect per-page |
| `matchSectionType` fate | Keep as fallback for legacy data | Backward compat; remove when all data has been re-detected |
| SVG in prompt | Never include | Too large (~1-3KB each); slug + description sufficient |

## Out of Scope

- Removing `yStartPercent`/`yEndPercent` from type (keep for now, clean up later)
- Removing `matchSectionType` entirely (needed for backward compat)
- SVG content editing in the prompt
- Cost estimation/budgeting for bulk API calls
- Parallel detection (sequential is fine for MVP)
- Slug validation in the AddSectionForm UI

## References

- Prior plan: `docs/plans/2026-03-08-feat-section-placeholder-library-plan.md`
- Current prompt: `src/services/components.ts:109-146` (`buildSectionPrompt`)
- Detection function: `src/services/components.ts:52-100` (`detectPageSections`)
- Full analysis pipeline: `src/actions/analysis.ts:245` (`runFullAnalysis`)
- Page detection action: `src/actions/analysis.ts:326` (`runPageDetection`)
- Section type CRUD: `src/actions/section-types.ts`
- Section matching bridge: `src/lib/section-matching.ts`
- Page detail UI: `src/components/pages/page-detail.tsx`
- Analysis page: `src/app/(dashboard)/projects/[id]/analysis/page.tsx`
- PageSection type: `src/types/page-sections.ts`
