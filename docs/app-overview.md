# Replatform Discovery Engine — Overview

## Vision

### App Objective

Automate the discovery phase of website migration projects. Turn an 8-16 hour manual audit into a 30-minute AI-powered process that produces a data-driven migration report — the kind that justifies $50k-150k replatforming contracts.

The tool answers three questions prospects care about most:
1. **What do we have?** — Complete inventory of pages, templates, content, and UI sections
2. **What's worth keeping?** — Content tiered by business value, duplicates flagged, architecture mapped
3. **Will we lose our Google rankings?** — SEO baseline with redirect-critical pages, traffic value at risk, and real user performance data

### Target User

**Primary (MVP):** Pagepro internal team — solution architects, sales engineers, and project managers preparing migration proposals for prospects.

**Future:** CTOs and VP Engineering at 20-100 person digital-native SMBs with legacy websites (WordPress, custom CMS, older React/Angular) planning a move to modern stacks (Next.js, Sanity, headless CMS).

### User Needs

| Need | Pain Without Tool | How Tool Solves It |
|------|-------------------|--------------------|
| Understand what exists on a prospect's site | Manual crawling, spreadsheet inventories, missed pages | Automated crawl of entire site with content extraction |
| Classify content by migration priority | Subjective guesses, inconsistent across team members | AI-powered tiering: must_migrate, improve, consolidate, archive |
| Identify page templates for component planning | Screenshot-by-screenshot review, easy to miss patterns | AI clusters pages into template types, detects 64 UI section types |
| Quantify SEO risk of migration | "Trust us, we'll handle redirects" — no data | Redirect-critical pages ranked by traffic value and link equity |
| Deliver a professional audit to prospects | Manual report writing, inconsistent quality | Auto-generated 6-section report with shareable link |
| Estimate project scope accurately | Gut feel, past experience, frequently wrong | Template count, content volume, section inventory = concrete scope inputs |

### Jobs to Be Done

1. **When** a prospect asks "what would migrating our site involve?", **I want to** run a comprehensive audit in under 30 minutes, **so that** I can answer with data instead of guesses.

2. **When** scoping a migration project, **I want to** know exactly how many distinct page templates and UI sections exist, **so that** I can estimate development effort accurately.

3. **When** a prospect worries about losing Google rankings, **I want to** show them which specific pages carry the most SEO value, **so that** I can turn "we'll handle redirects" into a scoped redirect plan with dollar values attached.

4. **When** preparing a proposal, **I want to** share a professional audit report with the prospect, **so that** the data-driven approach justifies the project investment.

5. **When** triaging content for migration, **I want to** know which pages are duplicates and which are thin/low-value, **so that** we can reduce scope by archiving pages nobody visits.

---

## Execution

### Core Processes

The tool runs a 4-phase pipeline, with optional SEO enrichment at any point after crawling:

```
[1. Crawl] → [2. Classify & Score] → [3. Screenshot & Detect] → [4. Report]
                                                                      ↑
                                          [SEO Enrichment] ───────────┘
                                          (on-page extraction,
                                           Ahrefs CSV import,
                                           PageSpeed Insights,
                                           Chrome UX Report)
```

**Phase 1: Crawl** (~2 min for 500 pages)
- Firecrawl API crawls the site with JS rendering and anti-bot handling
- Extracts URL, title, meta description, word count, markdown, raw HTML per page
- Filters junk URLs (WordPress pagination, admin, feeds, PDFs)
- Normalizes URLs and deduplicates by content hash
- Output: complete page inventory in `pages` table

**Phase 2: Classify & Score** (~3 min for 500 pages)
- Batches pages (10 per API call) to Claude Haiku
- Each page gets: template type (15 categories), content tier (must_migrate/improve/consolidate/archive), confidence, reasoning
- Duplicate pages auto-scored as "consolidate" — no API call needed
- Clusters pages into templates, auto-selects one representative page per template
- Output: `pages` updated with tiers, `templates` table created

**Phase 3: Screenshot & Detect** (~2 min for ~12-25 pages)
- Captures full-page screenshots of representative pages only (1 per template, not all 500+)
- Sends screenshots to Claude Sonnet with vision — detects UI sections against a taxonomy of 64 pre-defined section types (hero, navigation, CTA, testimonials, pricing, footer, etc.)
- Each section type has an SVG wireframe for the report
- Output: `pages.detectedSections` JSONB with section coordinates and types

**Phase 4: Report Generation** (instant)
- Assembles all analysis data into a 6-section report:
  1. Executive Summary — site stats, key findings
  2. Template Inventory — screenshot + page count per template type
  3. Section Inventory — detected UI sections with wireframes and frequency
  4. Site Architecture — interactive URL tree with content tier at each node
  5. Content Audit — tier breakdown, duplicate list, all pages with assignments
  6. SEO Baseline — redirect-critical pages, on-page issues, performance data
- Published via shareable link with optional password protection

**SEO Enrichment** (optional, user-triggered)
- **On-page extraction:** Parses stored HTML with cheerio for H1, canonical, meta robots, schema.org types, internal link count
- **Ahrefs CSV import:** User uploads Top Pages and Best by Links exports — auto-detected, parsed (UTF-16LE/UTF-8), matched to crawled pages by normalized URL. Note: Organic Keywords export is not yet supported (v2) — local intent pages with low CPC but high business value are invisible without it
- **PageSpeed Insights:** Lab performance scores (mobile + desktop) on representative pages
- **Chrome UX Report:** Real user Core Web Vitals (LCP, INP, CLS, FCP, TTFB) at domain level + 25-week history
- **SEO scoring:** Weighted composite (45% organic traffic, 35% referring domains, 20% on-page health) — flags redirect-critical pages. Post-enrichment tier correction upgrades archive pages with significant traffic/links

### Core Integrations

| Integration | What It Provides | When Used |
|-------------|-----------------|-----------|
| **Firecrawl API** | JS-rendered crawling, content extraction, screenshots | Phase 1 (crawl), Phase 3 (screenshots) |
| **Claude Haiku** | Fast, cheap AI classification | Phase 2 (template typing + content tiering, 10 pages/batch) |
| **Claude Sonnet** | Vision AI for UI analysis | Phase 3 (section detection from screenshots) |
| **Supabase** | PostgreSQL database, auth, file storage | All phases — data persistence, team login, screenshot hosting |
| **Drizzle ORM** | Type-safe database queries | All database operations |
| **Ahrefs** (CSV) | SEO traffic + backlink data | SEO enrichment — user uploads CSV exports from their Ahrefs account |
| **Google PageSpeed Insights API** | Lab performance scores per page | SEO enrichment — mobile + desktop scores on representative pages |
| **Google CrUX API** | Real user performance data | SEO enrichment — domain-level Core Web Vitals + 25-week trends |
| **Vercel** | Hosting + serverless deployment | Production |
| **Zod** | Runtime validation of external data | Ahrefs CSV parsing, API response validation |

### Data Flow

```
                         ┌─────────────────────────────────────────────────┐
                         │                   INPUTS                        │
                         │                                                 │
  Website URL ──────────►│  Firecrawl API ──► pages table (~500 rows)     │
                         │    - URL, title, meta, HTML, markdown           │
                         │    - word count, content hash                   │
                         │                                                 │
  Ahrefs CSVs ─────────►│  CSV Parser ──► pages table (SEO columns)      │
  (user upload)          │    - organic traffic, traffic value             │
                         │    - referring domains, top keyword             │
                         │                                                 │
                         └────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                         ┌─────────────────────────────────────────────────┐
                         │                 ANALYSIS                        │
                         │                                                 │
  Claude Haiku ─────────►│  Classification ──► pages.contentTier          │
  (10 pages/batch)       │                 ──► templates table             │
                         │                                                 │
  Claude Sonnet ────────►│  Section Detection ──► pages.detectedSections  │
  (vision, per template) │    (64 section types with SVG wireframes)      │
                         │                                                 │
  Cheerio ──────────────►│  On-Page Extraction ──► pages SEO columns     │
  (HTML parsing)         │    (H1, canonical, meta robots, schema.org)     │
                         │                                                 │
  SEO Scoring ──────────►│  Weighted formula ──► pages.seoScore           │
                         │    (45% value + 35% links + 20% traffic)       │
                         │  ──► pages.isRedirectCritical                   │
                         │                                                 │
                         └────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                         ┌─────────────────────────────────────────────────┐
                         │                 OUTPUTS                         │
                         │                                                 │
  Dashboard ────────────►│  7 tabs: Overview, Crawl, Analysis, Pages,     │
  (authenticated)        │         SEO, Performance, Report                │
                         │                                                 │
  Report ───────────────►│  6 sections assembled from analysis data       │
  (shareable link)       │  Password-protected public URL                  │
                         │  /reports/[shareId]                             │
                         │                                                 │
  Performance ──────────►│  CrUX: real user LCP, INP, CLS + 25wk trends  │
  (domain-level)         │  PSI: lab scores per representative page        │
                         │                                                 │
                         └─────────────────────────────────────────────────┘
```

### Key Design Decisions

- **No separate tables for SEO data** — Ahrefs/PSI/scoring data stored as columns on `pages`. Parsed in memory, matched by URL, written directly. Simpler than staging tables.
- **Domain-level data in JSONB** — CrUX scores, Ahrefs upload metadata, progress tracking stored in `projects.settings`. Avoids schema migrations for optional features.
- **Screenshot only representatives** — 1 per template type (~12-25 pages) instead of all 500+. Reduces API cost by 90%.
- **Performance excluded from SEO score** — A page ranking well despite bad performance is more important to protect, not less. Performance shown separately as a migration opportunity.
- **Ahrefs CSV over API** — Ahrefs API costs $500+/month. CSV exports from a $99 plan give the same data. Most agencies already have Ahrefs.
- **CrUX over PSI for domain baseline** — One free API call gives real user data for the entire domain. PSI is lab-only and per-page. CrUX is more credible in sales conversations.
- **SEO enrichment is fully optional** — The core pipeline (crawl → classify → detect → report) works without any SEO data. Each data source contributes independently.
- **SEO scoring: 45% organic traffic + 35% RDs + 20% on-page health** — Previous formula double-counted by using both traffic value (traffic × CPC) and organic traffic at 65% combined. Fixed to use organic traffic as the traffic signal and on-page health (H1, canonical, schema.org, meta robots, internal links) as the third factor. Performance deliberately excluded.
- **Tier overrides post-enrichment** — After Ahrefs import, pages with organic traffic >= 50/mo or referring domains >= 5 get upgraded from archive to consolidate minimum. Prevents classification (which runs without traffic data) from archiving pages that are actually important. Threshold of 50 visits/mo chosen because Ahrefs Top Pages export only includes pages with measurable traffic.
- **Organic Keywords CSV deferred to v2** — Traffic value from Ahrefs already encodes intent implicitly via CPC (transactional pages have higher CPC = higher traffic value). **Known gap:** local intent pages (e.g., "dentist teeth whitening London") have low CPC but high business value — they are invisible without the Organic Keywords export. This gap is flagged in the SEO enrichment UI when running without keywords data. Planned for v2 alongside intent-based redirect priority.
- **Technical Recommendations and Investment Summary sections deferred** — Report sections 5-7 require SEO baseline data and Claude Sonnet narrative generation to produce valid recommendations. Planned for post-SEO enrichment build, not current scope. Current report has 6 sections; sections 5-7 are explicitly deferred, not dropped.
