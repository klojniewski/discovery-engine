# Product Requirements Document (PRD)
## Replatform Discovery Engine

**Version:** 1.5
**Last Updated:** April 4, 2026
**Document Owner:** Chris (CEO)
**Status:** MVP ~90% Complete -- Internal Sales Tool Only

> **v1.5 Update:** Scope narrowed to internal sales acceleration tool. SaaS phases removed from 2026 scope. Report sections 7-9 elevated to MVP-critical. Sales process integration added. PRD split into sub-documents.

***

## Current State (as of April 4, 2026)

### What's Built

The tool answers three questions prospects care about most:
1. **What do we have?** -- Complete inventory of pages, templates, content, and UI sections
2. **What's worth keeping?** -- Content tiered by business value, duplicates flagged, architecture mapped
3. **Will we lose our Google rankings?** -- SEO baseline with redirect-critical pages, traffic value at risk, and real user performance data

**Pipeline:** Crawl -> Classify & Score -> Screenshot & Detect -> Report (~7 min for 500 pages)

**SEO Enrichment (optional, user-triggered):**
- On-page extraction from stored HTML (H1, canonical, meta robots, schema.org, internal links)
- Ahrefs CSV import (Top Pages + Best by Links, auto-detected, UTF-16LE/UTF-8)
- PageSpeed Insights (lab scores on representative pages)
- Chrome UX Report (real user Core Web Vitals at domain level + 25-week trends)
- SEO scoring: 45% organic traffic + 35% referring domains + 20% on-page health
- Post-enrichment tier correction: archive pages with traffic >= 50 or RDs >= 5 upgraded to consolidate

**Dashboard tabs:** Overview | Crawl | Pages | Analysis | SEO | Performance | Report

**Report sections (6 live, 3 MVP-critical deferred):**
1. Executive Summary -- with traffic value headline ("$X/mo at stake") *[BUILT]*
2. Template Inventory *[BUILT]*
3. Section Inventory (64 section types with SVG wireframes) *[BUILT]*
4. Site Architecture (tree view) *[BUILT]*
5. Content Audit (tier breakdown) *[BUILT]*
6. SEO Baseline (redirect-critical pages, on-page debt) *[BUILT]*
7. Technical Recommendations **MVP-CRITICAL** *[DEFERRED]*
8. Investment Summary **MVP-CRITICAL** *[DEFERRED]*
9. Next Steps **MVP-CRITICAL** *[DEFERRED]*

### Key Design Decisions

- **URL-prefix template classification** -- Group pages by first URL path segment (deterministic), then AI names each group dynamically. Listing/detail split separates index pages from detail pages. Naming convention enforced: "Index" for listings, content-specific nouns for details, "Page" for singletons.
- **Content tier scoring separated from classification** -- Template classification and tier scoring are independent passes. Duplicates (content hash) auto-assigned `consolidate`.
- **SEO scoring: 45% organic traffic + 35% RDs + 20% on-page health** -- Independent signals only. Performance excluded (shown separately).
- **CrUX over PSI for domain baseline** -- One free API call gives real user data for the entire domain.
- **Ahrefs CSV over API** -- API costs $500+/month. CSV exports from $99 plan give the same data.
- **Screenshot only representatives** -- 1 per template (~12-25 pages) not all 500+. 90% API cost reduction.
- **No separate tables for SEO data** -- All per-page data on `pages` table. Domain-level data in `projects.settings` JSONB.

### What's Left (Before First Sales Call Use)

**MVP-Critical (must ship):**
- **Report sections 7-9** -- Technical Recommendations, Investment Summary, Next Steps (Claude Sonnet narrative). Highest priority.
- **Multi-site testing** -- Minimum: WordPress blog, one 200+ page site.
- **Full end-to-end report testing** -- pagepro.co report must be verified and presentable
- **Production deployment** -- Vercel, env vars, internal domain, Supabase production, Sentry

**Acceptable workarounds (non-blocking):**
- **PDF generation** -- Cmd+P sufficient for now.

**Removed from scope (permanently, 2026):**
- ~~Stripe payments~~ -- no payment collection needed for internal tool
- ~~Organic Keywords CSV~~ -- v2 consideration only
- ~~Public landing page~~ -- internal access only
- ~~Email notifications (Resend)~~ -- not needed for internal tool

***

## Sub-Documents

| Document | Description |
|---|---|
| [Sales Process](prd/sales-process.md) | How the tool fits Pagepro's sales stages, Pipedrive integration, when to run/not run, internal user flow |
| [Features](prd/features.md) | Core features 1-8: crawler, template detection, architecture mapping, sections, content scoring, report generation |
| [Technical Architecture](prd/technical-architecture.md) | Stack, database schema, pipeline, AI prompts, infrastructure, cost estimates |
| [Roadmap](prd/roadmap.md) | What's built, near-term, medium-term, deferred. Launch readiness checklist. |
| [Phase 2 Vision](prd/phase2-vision.md) | Aspirational post-validation plans: paid audits, GTM, pricing, SaaS tiers. Out of scope for 2026. |
| [Sample Report Outline](prd/sample-report-outline.md) | Full section-by-section report structure (Appendix A) |

***

**Document Status:** MVP In Progress -- Internal Sales Tool
**Tool Owner:** Chris (CEO)
**Next Review:** After first 5 real sales call uses

---

## Changelog

| Version | Date | Summary |
|---|---|---|
| v1.5 | Apr 4, 2026 | Scope narrowed to internal sales tool. SaaS phases removed. Report 7-9 MVP-critical. Sales process added. PRD split into sub-documents. Schema fixed to match actual DB. |
| v1.4 | Apr 4, 2026 | Template classification rewritten -- URL-prefix grouping, listing/detail split, standardized naming, 56 unit tests |
| v1.3 | Mar 15, 2026 | SEO Baseline feature complete. Combined PRD with implementation state |
| v1.2 | -- | MVP scope changed to internal-only. Payment/public features deferred |
| v1.0 | -- | Original PRD |
