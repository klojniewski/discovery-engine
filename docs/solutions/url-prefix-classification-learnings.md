# URL-Prefix Template Classification — Learnings

## Date: 2026-04-04

## What Changed

Replaced per-page AI classification (15 fixed template types) with a URL-prefix-first approach:

1. **URL-prefix grouping** (deterministic) — group pages by first path segment, 3+ pages = template group
2. **AI template naming** (1 Haiku call per ≤50 groups) — AI names/describes each group dynamically
3. **Singleton classification** (batches of 10) — ungrouped pages classified individually with free-form types
4. **Singleton name merge** — post-classification AI pass consolidates semantically duplicate names across batches
5. **Content tier scoring** — separated into its own pass, duplicates auto-assigned `consolidate`

## Key Decisions

### First-segment-only grouping
We only use the first path segment (`/blog` from `/blog/2024/my-post`). Deeper segments would over-split (e.g., `/blog/2024` vs `/blog/2023` are the same template). Root-level pages (`/about`, `/pricing`) become singletons since their prefix = full path.

### Homepage always ungrouped
The homepage (`/`) is always a singleton — it's never part of a URL-prefix group, even if somehow multiple pages resolve to `/`.

### No merge heuristic for root-level blog posts
Sites like Dremio put some blog posts at root (`/apache-iceberg-achieves-milestone-1-0-release`). These stay as singletons. A merge heuristic could detect this but adds complexity. Deferred to a follow-up if it proves problematic on real sites.

### Singleton name merge is necessary
Without the merge pass, independent batch-of-10 calls produce inconsistent names for similar pages (e.g., "signup-landing-page" and "product-trial-signup" for semantically identical page types). The merge pass costs one extra Haiku call but dramatically improves template coherence.

### `classifyOnly` mode for re-classification
Added a `classifyOnly` option to `runClassifyAndScore` so users can re-group templates without re-scoring all content tiers. This is useful when the user just wants to see how different URL patterns group together.

## Gotchas

### `consolidate` tier only from duplicates
The AI scoring prompt only returns `must_migrate`, `improve`, or `archive`. The `consolidate` tier is assigned programmatically to duplicate pages (same content hash) — never by AI. This prevents the AI from inconsistently using `consolidate` for thin content.

### Locale prefixes create separate groups
`/en/blog/*` and `/de/blog/*` become separate groups. This is intentional — they represent different content sets for migration. Don't try to merge them.

### CrUX origin resolution
Unrelated to classification but shipped on same branch: CrUX API needs the canonical origin after redirects (e.g., `dremio.com` → `www.dremio.com`). Added `resolveOrigin()` that does a HEAD request with redirect follow.

## Listing/Detail Split (added 2026-04-04)

After URL-prefix grouping, `splitListingPages()` extracts index pages (pathname === prefix) into their own small groups. This separates listing pages (e.g., `/press-releases`) from detail pages (e.g., `/press-releases/slug`).

**Key decision: listing pages stay as groups, not singletons.** Initially we moved listing pages to the ungrouped pool (singleton classifier), but the singleton merge pass aggressively merged all listing pages together into one "Hub" template. Keeping them as small groups routes them through the AI naming step directly, skipping the merge pass.

### Standardized Naming Convention

AI prompts enforce consistent suffixes by template role:
- **Listing templates** (exact pattern like `/blog`): displayName ends with "Index" (e.g., "Blog Index")
- **Detail templates** (wildcard pattern like `/blog/*`): content-specific noun, never "Page" (e.g., "Blog Post", "Customer Story")
- **Singleton templates** (no urlPattern): displayName ends with "Page" (e.g., "About Page", "Contact Page")

This is enforced via prompt instructions in `nameGroupChunk()` and `classifySingletonBatch()`, plus fallback naming in the error path.

### Template Card Placeholder

Cards without screenshots now show a placeholder with the same `aspect-video` dimensions, ensuring consistent card height. The recapture button appears on hover for both — allowing first-time capture for templates that don't have screenshots yet.

## Files Changed

| File | What |
|---|---|
| `src/services/classification.ts` | Full rewrite: `groupPagesByUrlPrefix`, `splitListingPages`, `nameTemplateGroups`, `classifySingletonPages`, `mergeSingletonNames`, `scoreTiersBatch`. Naming convention enforced in AI prompts. |
| `src/actions/analysis.ts` | New orchestration in `runClassifyAndScore` + `runTemplateClassificationOnly` + listing split step |
| `src/components/analysis/classify-runner.tsx` | Updated pipeline steps, added re-classify buttons |
| `src/components/analysis/template-clusters.tsx` | Shows `urlPattern` on cards, screenshot placeholder for all cards |
| `src/db/schema.ts` | Added `urlPattern` column to templates |
| `src/lib/cost-estimates.ts` | Updated cost formula for new pipeline |
| `src/actions/seo.ts` | Added `resolveOrigin()` for CrUX API |
| `drizzle/0008_absent_chat.sql` | Migration: `ALTER TABLE templates ADD COLUMN url_pattern` |
| `src/services/__tests__/classification.test.ts` | 19 tests for `groupPagesByUrlPrefix` + `splitListingPages` |
