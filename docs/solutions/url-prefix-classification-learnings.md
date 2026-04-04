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

## Files Changed

| File | What |
|---|---|
| `src/services/classification.ts` | Full rewrite: `groupPagesByUrlPrefix`, `nameTemplateGroups`, `classifySingletonPages`, `mergeSingletonNames`, `scoreTiersBatch` |
| `src/actions/analysis.ts` | New orchestration in `runClassifyAndScore` + `runTemplateClassificationOnly` |
| `src/components/analysis/classify-runner.tsx` | Updated pipeline steps, added re-classify buttons |
| `src/db/schema.ts` | Added `urlPattern` column to templates |
| `src/lib/cost-estimates.ts` | Updated cost formula for new pipeline |
| `src/actions/seo.ts` | Added `resolveOrigin()` for CrUX API |
| `drizzle/0008_absent_chat.sql` | Migration: `ALTER TABLE templates ADD COLUMN url_pattern` |
| `src/services/__tests__/classification.test.ts` | 11 tests for `groupPagesByUrlPrefix` |
