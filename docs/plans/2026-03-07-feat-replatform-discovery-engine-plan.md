---
title: "feat: Replatform Discovery Engine - Build Plan"
type: feat
date: 2026-03-07
status: in-progress
target_site: https://pagepro.co
version: 2.0
---

# Replatform Discovery Engine - Build Plan v2

## Overview

Build an AI-powered website analysis tool (internal to Pagepro) that crawls websites, runs multi-step AI analysis (template detection, component inventory, content scoring, complexity estimation), and generates professional migration audit reports. The tool serves Pagepro's sales process for Next.js + Sanity replatforming projects.

**Scope:** Internal tool only. No payment collection, no public landing page, no self-service. Pagepro team creates projects and triggers audits from the dashboard. Payment collection and public-facing features will be added after proving the tool works.

**Target test site:** https://pagepro.co
**Tech stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Shadcn/ui, PostgreSQL (Supabase), Firecrawl API, Inngest (durable functions), Claude API (Haiku + Sonnet), Vercel

## AI Workflow & Agent-Browser Verification

Every milestone includes agent-browser verification steps. The development workflow is:

1. **Implement** features for the milestone
2. **Verify with agent-browser** - use browser automation to visually confirm UI renders correctly, forms submit, data flows through the pipeline
3. **Test with pagepro.co** as the target site where applicable
4. **Review & feedback** - user reviews results, provides feedback
5. **Update plan** - adjust next milestones based on feedback

### Claude Code AI Workflow

When working on each milestone:
- Use `/compound-engineering:workflows:work` to implement each phase
- After implementation, use `agent-browser` to verify effects visually
- If issues found, fix and re-verify before moving to next milestone
- Keep the plan updated with actual findings and adjustments

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Crawler | Firecrawl API | API-first, handles JS rendering, anti-bot, screenshots. No infra to manage. |
| Frontend | Next.js 16 App Router | Server Components for dashboard + public reports. |
| Database | Supabase (PostgreSQL) | Managed Postgres with storage and auth. No pgvector needed. |
| Background Jobs | Inngest | Serverless durable functions. Deploys with Vercel. No Redis, no separate worker. Handles retries, timeouts, step functions. |
| Auth | Supabase Auth | Already using Supabase. No need for a second auth system (Auth.js). |
| LLM - Classification | Claude Haiku 4.5 | Fast, cheap, sufficient for page-type classification. |
| LLM - Analysis/Vision | Claude Sonnet 4.6 | Best quality for component detection (vision) and report generation. |
| Embeddings | None (cut) | Duplicate detection via text hashing. No OpenAI dependency, no pgvector. |
| PDF Generation | Deferred | Web report is the primary deliverable. Cmd+P for PDF if needed. Add proper PDF generation later. |
| Sitemap Viz | Page tree with checkboxes | Recursive tree grouped by URL path segments. Folder-level select/deselect. Used on Scrape tab. |
| ORM | Drizzle ORM | Type-safe, lightweight, excellent PostgreSQL support. |
| Testing | Vitest | Unit + integration tests from Phase 1. |
| Payments | None (deferred) | Internal tool for now. Add Stripe when business model is validated. |
| Email | None (deferred) | Manual communication for now. Add Resend when needed. |

---

## Database Schema (ERD)

```mermaid
erDiagram
    PROJECTS {
        uuid id PK
        varchar client_name
        varchar client_email
        varchar website_url
        varchar status
        varchar report_share_id UK
        varchar report_password
        jsonb settings
        timestamp created_at
        timestamp published_at
        timestamp crawl_started_at
        timestamp crawl_completed_at
        timestamp analysis_completed_at
    }

    PAGES {
        uuid id PK
        uuid project_id FK
        text url
        text title
        text meta_description
        text h1
        integer word_count
        text raw_markdown
        text raw_html
        text html_snapshot_url
        text screenshot_url
        uuid template_id FK
        varchar content_tier
        integer navigation_depth
        boolean excluded
        boolean is_orphan
        boolean is_duplicate
        text content_hash
        jsonb detected_sections
        jsonb metadata
        timestamp created_at
    }

    TEMPLATES {
        uuid id PK
        uuid project_id FK
        varchar name
        varchar display_name
        varchar confidence
        integer page_count
        uuid representative_page_id FK
        text description
        varchar complexity
        timestamp created_at
    }

    SECTION_TYPES {
        uuid id PK
        varchar slug UK
        varchar name
        varchar category
        text description
        text svg_content
        integer sort_order
        timestamp created_at
        timestamp updated_at
    }

    REPORT_SECTIONS {
        uuid id PK
        uuid project_id FK
        varchar section_type
        jsonb content
        integer sort_order
        text notes
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS ||--o{ PAGES : "has many"
    PROJECTS ||--o{ TEMPLATES : "has many"
    PROJECTS ||--o{ REPORT_SECTIONS : "has many"
    TEMPLATES ||--o{ PAGES : "groups"
```

**Key simplifications vs original:**
- No `EMBEDDINGS` table (cut pgvector entirely)
- No `LINKS` table (link data stored as JSONB in `pages.metadata` if needed)
- No `REPORT_ANALYTICS` table (deferred)
- **Replaced `COMPONENTS` + `COMPONENT_PAGES`** with taxonomy-driven `SECTION_TYPES` table + `pages.detected_sections` JSONB
- Added `SECTION_TYPES` — 64 pre-seeded section types with slugs, categories, SVG wireframes
- Added `pages.detected_sections` — JSONB storing AI-detected sections with taxonomy slugs per page
- Added `REPORT_SECTIONS` for editable report content
- Added `content_hash` on pages for simple duplicate detection

---

## Audit State Machine

```mermaid
stateDiagram-v2
    [*] --> created : Team creates project
    created --> crawling : Team triggers crawl
    crawling --> crawl_failed : Firecrawl error
    crawling --> crawled : Crawl completes
    crawl_failed --> crawling : Retry
    crawled --> scraping : Team selects pages & starts scrape
    scraping --> reviewing : Scrape completes
    reviewing --> analyzing : Team triggers analysis
    analyzing --> analysis_failed : AI pipeline error
    analyzing --> reviewing : Analysis completes
    analysis_failed --> analyzing : Retry
    reviewing --> published : Team publishes report
    reviewing --> scraping : Re-scrape (fresh screenshots)
    published --> [*]
```

**8 states** with separate crawl → scrape → analyse flow.

---

## Phase 1: Foundation & Project Scaffolding

**Duration:** 3-4 days
**Milestone:** Project boots locally, dashboard shell renders, database connected, first test passes

### Tasks

#### 1.1 Repository Setup
- [x] Initialize git repository
- [x] Create `.gitignore` (node_modules, .env, .next, etc.)
- [x] Create `CLAUDE.md` with project conventions:
  - TypeScript strict mode
  - Server Components by default, Client Components only when needed
  - Drizzle ORM for all database queries
  - File naming: kebab-case for files, PascalCase for components
  - Use Server Actions for mutations, not API routes (except webhooks)
- [x] Create `.env.example` with required keys:
  - `DATABASE_URL`
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
  - `FIRECRAWL_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`

**Files:**
```
.gitignore
CLAUDE.md
.env.example
```

#### 1.2 Next.js 16 App Setup
- [x] `npx create-next-app@latest` with App Router, TypeScript, Tailwind v4
- [x] Install and configure Shadcn/ui
- [x] Set up route groups:
  - `app/(dashboard)/` - internal authenticated routes
  - `app/(public)/` - public report viewer
- [x] Create dashboard layout shell with sidebar navigation:
  - Projects list
  - New Project
  - Settings (placeholder)

**Files:**
```
app/
  (dashboard)/
    layout.tsx              -- dashboard shell with sidebar
    page.tsx                -- redirect to /projects
    projects/
      page.tsx              -- project list (empty state for now)
      new/
        page.tsx            -- new project form
      [id]/
        layout.tsx          -- project detail layout with tabs
        page.tsx            -- project overview
        crawl/page.tsx      -- crawl status (placeholder)
        analysis/page.tsx   -- analysis results (placeholder)
        report/page.tsx     -- report preview (placeholder)
  (public)/
    layout.tsx              -- minimal public layout
    reports/
      [shareId]/
        page.tsx            -- public report viewer (placeholder)
```

#### 1.3 Database Setup
- [ ] Set up Supabase project
- [x] Install Drizzle ORM + drizzle-kit
- [x] Create Drizzle schema (5 tables: projects, pages, templates, components, component_pages, report_sections)
- [ ] Run initial migration
- [x] Create seed script with test data (1 project, 5 pages)

**Files:**
```
src/
  db/
    schema.ts               -- Drizzle schema (all tables)
    index.ts                 -- DB connection
    seed.ts                  -- Test data seeder
drizzle.config.ts            -- Drizzle Kit config
```

#### 1.4 Authentication Setup
- [x] Configure Supabase Auth (email/password)
- [x] Protect `(dashboard)` route group with middleware
- [x] Create login page
- [ ] Seed initial admin user

**Files:**
```
app/(auth)/
  login/page.tsx            -- login form
src/
  lib/
    supabase/
      client.ts             -- browser Supabase client
      server.ts             -- server Supabase client
middleware.ts                -- route protection
```

#### 1.5 Test Setup
- [x] Install Vitest
- [x] Write first test: scoring function assigns correct tiers based on word count and depth
- [ ] Set up test database connection
- [x] Add `npm run test` script

**Files:**
```
vitest.config.ts
src/
  services/
    __tests__/              -- test directory
```

### Acceptance Criteria
- [ ] `npm run dev` starts the app without errors
- [ ] Dashboard renders with sidebar navigation at `/projects`
- [ ] Login page works, redirects to dashboard after auth
- [ ] Unauthenticated users redirected to login, return URL preserved
- [ ] Database tables created, seed data queryable
- [ ] Drizzle migrations are reversible
- [ ] `npm run test` passes (at least 1 test)

### Agent-Browser Verification
```
1. Navigate to http://localhost:3000 -> verify redirect to /login
2. Screenshot login page
3. Log in with test credentials -> verify redirect to dashboard
4. Verify sidebar: Projects, New Project, Settings
5. Navigate to /projects -> verify empty state or seed data
6. Navigate to /projects/new -> verify form renders
7. Check console for errors
```

---

## Phase 2: Firecrawl Integration & Crawling

**Duration:** 3-4 days
**Milestone:** Can enter a URL, trigger Firecrawl crawl, store results in DB, view crawl progress. Pagepro.co crawled successfully.

### Tasks

#### 2.1 Firecrawl API Client
- [x] Install Firecrawl SDK (`@mendable/firecrawl-js`)
- [x] Create Firecrawl service wrapper:
  - `startCrawl(url, options)` - initiate crawl job
  - `getCrawlStatus(jobId)` - poll crawl progress
  - `getAllCrawlResults(jobId)` - get all pages
- [x] Configure crawl options:
  - Page limit: configurable per project (default 500)
  - Exclude paths: regex patterns (e.g. `/blog/.*`)
  - Include markdown: true
  - Include metadata: true

**Files:**
```
src/
  services/
    firecrawl.ts             -- Firecrawl API client wrapper
  lib/
    constants.ts             -- crawl defaults, limits
```

#### 2.2 Background Job Approach
- [x] Simplified to client-side polling (Inngest deferred)
  - Server action starts Firecrawl async crawl
  - Client polls status every 5 seconds via server action
  - On completion, server action stores results in DB

#### 2.3 New Project Form & Crawl Trigger
- [x] Build "New Project" form:
  - Website URL (required, validated)
  - Client name (required)
  - Client email (required)
  - Page limit override (optional, default 500)
  - Exclude paths (optional, regex patterns, one per line)
  - Notes (optional textarea)
- [x] Server Action: `createProject` - validates, creates DB record, redirects
- [x] Server Action: `startProjectCrawl` - starts Firecrawl, updates status to 'crawling'

**Files:**
```
src/
  actions/
    projects.ts              -- createProject, startCrawl
  components/
    projects/
      new-project-form.tsx   -- intake form
```

#### 2.4 Crawl Progress & Results Storage
- [x] Progress UI: poll project status every 5 seconds, show pages discovered count
- [x] When crawl completes:
  - Store each page in `pages` table (url, title, meta_description, word_count)
  - Generate `content_hash` (MD5 of first 500 chars of markdown) for duplicate detection
  - Store markdown content in pages.metadata
  - Update project status to 'reviewing'
- [x] Results table with clickable URLs (open in new tab)
- [x] CSV export with project name and date in filename
- [x] Screenshots storage in Supabase Storage (completed in Phase 3)
- [ ] HTML snapshot storage (deferred)

**Files:**
```
src/
  components/
    projects/
      crawl-progress.tsx     -- real-time status UI
      crawl-results.tsx      -- crawled pages table
app/(dashboard)/projects/[id]/crawl/page.tsx  -- real crawl UI
```

#### 2.5 Test with pagepro.co
- [x] Create project for https://pagepro.co
- [x] Run crawl: 77 pages crawled successfully
- [x] Verify page metadata stored correctly (title, word count, content hash)
- [ ] Verify screenshots captured and loadable (deferred - screenshots not yet enabled)
- [ ] Write integration test for crawl result storage

### Acceptance Criteria
- [x] New Project form validates and creates DB record
- [x] "Start Crawl" triggers Firecrawl and shows progress
- [x] Progress updates with page count
- [x] Completed crawl stores all pages with metadata
- [x] Content hashes generated for all pages
- [x] pagepro.co crawled successfully (77 pages)
- [x] URL exclusion patterns working (excludePaths)
- [x] CSV export of crawl results
- [x] Screenshots stored in Supabase Storage (completed in Phase 3)

### Additional UI improvements (completed)
- [x] Active tab highlighting in project tabs
- [x] Active sidebar nav item highlighting
- [x] Collapsible sidebar navigation
- [x] Clickable URLs in crawl results table (open in new tab)
- [x] Projects list shows real data with status badges
- [x] DB connection singleton pattern to avoid pool exhaustion
- [x] European date format (DD/MM/YYYY)

### Crawl/Scrape/Analyse workflow split (completed)
- [x] Three-tab workflow: Crawl → Scrape → Analyse
- [x] **Crawl tab:** URL discovery, simple table (URL, Title, Words), CSV export, content preview panel (rendered markdown in right slide-out)
- [x] **Scrape tab:** Page tree grouped by URL path with checkboxes, folder-level select/deselect, "Scrape N Pages" button, progress polling, results table with content status icons (markdown/HTML) and screenshot links with retake, ZIP download of all screenshots
- [x] **Analyse tab:** Only processes non-excluded (scraped) pages
- [x] `excluded` boolean column on pages for selection state
- [x] `raw_markdown` and `raw_html` text columns for full scraped content
- [x] Firecrawl `scrapeUrl` for individual page scraping (markdown + HTML)
- [x] Full-page screenshots via `screenshot@fullPage` format
- [x] Cache-busting `?t=timestamp` on screenshot URLs for CDN freshness
- [x] Re-scrape always re-captures screenshots, only fetches missing content
- [x] Template inline rename with pencil icon
- [x] Clickable template page count badges with modal showing page URLs
- [x] Content tier tooltips explaining Must Migrate, Improve, Consolidate, Archive
- [x] Install react-markdown + @tailwindcss/typography for content preview

### Agent-Browser Verification
```
1. Navigate to /projects/new
2. Fill: URL=https://pagepro.co, Client=Pagepro, Email=test@pagepro.co
3. Submit -> verify redirect to project page
4. Click "Start Crawl"
5. Screenshot crawl progress (wait for completion, poll every 30s)
6. Navigate to crawl tab -> verify pages table shows results
7. Click a page row -> verify metadata populated (title, URL, word count)
8. Verify a screenshot loads (check image URL)
9. Report: page count, crawl duration, errors, screenshot quality
```

---

## Phase 3: AI Analysis Pipeline

**Duration:** 5-7 days
**Milestone:** Template classification, content scoring, and component detection all working. Analysis results visible in dashboard. Pagepro.co fully analyzed.

### Tasks

#### 3.1 Claude API Client
- [x] Install Anthropic SDK (`@anthropic-ai/sdk` v0.78.0)
- [x] Create Claude service wrapper (text + vision, Haiku for classification, Sonnet for vision)
- [ ] Create cost tracking utility (deferred - not needed for MVP)
- [ ] Add `api_usage` table or simple logging for cost monitoring (deferred)

**Files:**
```
src/
  services/
    anthropic.ts             -- Claude API client wrapper
    cost-tracker.ts          -- API cost logging
```

#### 3.2 Template Classification
- [x] Create classification service using Claude Haiku:
  - Input: page URL, title, meta description, word count, content preview
  - Output: templateType, confidence, reasoning as JSON
  - Template types: homepage, landing_page, blog_post, blog_listing, product_page, product_listing, case_study, about_page, team_page, contact_page, legal_page, documentation_page, resource_page, service_page, custom_page
- [x] Batch classification (10 pages per LLM call)
- [x] After classification, group pages by template_type:
  - Create `templates` records with page counts
  - Assign representative page (highest confidence per type)
- [ ] Calculate complexity per template (deferred)
- [ ] Write tests: mock Claude responses, verify classification logic (deferred)

**Files:**
```
src/
  services/
    classification.ts        -- template classification
  services/__tests__/
    classification.test.ts   -- classification tests
```

#### 3.3 Content Quality Scoring
- [x] Create scoring service (heuristics, no LLM needed):
  - **Word count:** <300 = thin, 300-1000 = medium, >1000 = substantial
  - **Navigation depth:** homepage=0 (highest), 1-2=high, 3+=lower
  - **Metadata quality:** check title (exists, 30-60 chars), description (exists, 120-160 chars), h1 exists
  - **Duplicate detection:** compare `content_hash` - matching hashes = duplicate
  - **Orphan detection:** pages not linked from any other crawled page
- [x] Tier assignment:
  - **Tier 1 (Must Migrate):** substantial + good metadata + depth <=2 + not duplicate
  - **Tier 2 (Improve):** medium content or missing metadata, reachable
  - **Tier 3 (Consolidate):** duplicate or near-duplicate
  - **Tier 4 (Archive):** thin + deep + poor metadata
- [x] Store tier in `pages.content_tier`
- [x] Write comprehensive tests for scoring logic (10 tests passing)

**Files:**
```
src/
  services/
    scoring.ts               -- content quality scoring
  services/__tests__/
    scoring.test.ts          -- scoring tests (thorough)
```

#### 3.4 Component Detection (Claude Vision - Simplified)
- [x] After template classification, select representative pages (1 per template)
- [x] Send representative page screenshots to Claude Sonnet with vision:
  - Identify UI sections: hero, navigation, CTA, form, card_grid, testimonial, logo_grid, stats, accordion, tabs, footer, etc.
  - Output: JSON array with type, style description, position, complexity
- [x] Store in `components` table with frequency
- [x] Create `component_pages` join records
- [x] Skip if screenshot unavailable for a page (graceful degradation)

**Files:**
```
src/
  services/
    components.ts            -- component detection via Claude Vision
```

#### 3.5 Analysis Pipeline Orchestration (Server Actions)
- [x] Create `runFullAnalysis` server action with sequential steps:
  - Step 0: Capture screenshots (Firecrawl scrape + Supabase Storage)
  - Step 1: Classify all pages (Claude Haiku, batched 10/batch)
  - Step 2: Create template clusters with representative pages
  - Step 3: Score content quality (heuristics + duplicate detection)
  - Step 4: Detect components (Claude Sonnet vision on representative pages)
- [x] Update project status/step after each step (polling-based UI updates)
- [x] Handle failures: catch errors, store in settings, allow retry
- [x] Progress tracking with completed/total counts
- Note: Inngest deferred — using simple server actions + polling instead

**Files:**
```
src/
  inngest/
    functions/
      analyze-project.ts     -- full analysis pipeline
```

#### 3.6 Dashboard: Analysis Results
- [x] Build analysis results page with sections:
  - **Templates:** template clusters grid with page counts, confidence, representative screenshot
  - **Content Tiers:** tier breakdown bar + sortable pages table with tier badges
  - **Components:** detected components grid with type, style description, position, complexity
- [x] Pipeline progress indicator with step checkmarks and spinner
- [x] "Re-run Analysis" button
- [x] Progress counts during screenshot capture (X/Y)
- Note: Recharts deferred — using simple CSS bar for tier breakdown

**Files:**
```
src/
  components/
    analysis/
      template-clusters.tsx  -- template grouping
      content-tiers.tsx      -- tier breakdown chart
      component-inventory.tsx -- component grid
      duplicates-list.tsx    -- duplicate pages
      pipeline-progress.tsx  -- step progress indicator
app/(dashboard)/projects/[id]/analysis/page.tsx  -- tabbed analysis UI
```

#### 3.7 Test with pagepro.co
- [x] Run full analysis pipeline on pagepro.co (77 pages)
- [x] Validate: template classifications — 11 templates identified:
  - Service Page (32), Case Study (21), Resource Page (10), Custom Page (4), Landing Page (2), Contact Page (2), Legal Page (2), Team Page (1), About Page (1), Homepage (1), Blog Listing (1)
- [x] Validate: content tiers assigned (mostly "improve" due to null navigation depth — acceptable for MVP)
- [x] Validate: 43 components detected across representative pages
- [x] Screenshots: 77/77 captured and stored in Supabase Storage

### Acceptance Criteria
- [x] Analysis pipeline processes all steps sequentially (server actions + polling)
- [x] Template classification assigns types accurately (11 meaningful templates for pagepro.co)
- [x] Template clusters created with correct page counts and representative pages
- [x] Content tiers assigned to all pages based on scoring criteria
- [x] Duplicates detected via content hash matching
- [x] Components detected from representative page screenshots (43 components)
- [x] Analysis results page shows templates, content tiers, and components
- [x] Pipeline progress indicator works with step checkmarks
- [x] Full pipeline completes for pagepro.co (~5 minutes for screenshots, ~2 min for AI steps)
- [x] Scoring tests pass (10/10 tests)
- [x] Pipeline handles failures gracefully with error display and retry

### Agent-Browser Verification
```
1. Navigate to /projects/[pagepro-id]/analysis
2. Verify pipeline progress shows all steps complete
3. Templates tab: screenshot, verify template names match pagepro.co
   (expect: homepage, service_page, case_study, blog_post, about_page, contact_page, etc.)
4. Content tab: screenshot tier breakdown chart
   (expect: most pages Tier 1-2 for a well-maintained site like pagepro.co)
5. Components tab: screenshot component grid
   (expect: hero, nav, CTA, case study cards, team grid, footer, etc.)
6. Duplicates tab: check if any flagged
7. Check console for errors
8. Report: template count, tier distribution, component count, any misclassifications
```

---

## Phase 4: Report Generation & Publishing

**Duration:** 5-7 days
**Milestone:** Can generate a professional 7-section web report, preview it, add notes, publish it with a share link. Pagepro.co report looks great.

### Tasks

#### 4.1 Report Data Assembly
- [x] Create report data service that compiles all analysis into structured sections:
  1. **Executive Summary:** site stats, template count, content volume, complexity score, key findings
  2. **Template Inventory:** template grid with screenshots, page counts, complexity
  3. **Site Architecture:** collapsible tree view of URL hierarchy, orphan flags, depth stats
  4. **Content Audit:** tier breakdown, consolidation suggestions, duplicate list, metadata quality
  5. **Technical Recommendations:** tech approach for Next.js 16 + Sanity, performance opportunities (generated by Claude Sonnet)
  6. **Investment Summary:** effort estimate by complexity, comparison (migrate all vs smart migration)
  7. **Next Steps:** action items, recommended workshop agenda
- [ ] Use Claude Sonnet to generate (deferred — data sections first):
  - Key findings for executive summary (3-4 bullets)
  - Technical recommendations (5-7 specific, actionable items)
  - Investment summary narrative
  - Next steps content
- [x] Store generated content in `report_sections` table

**Files:**
```
src/
  services/
    report-data.ts           -- compile analysis into report structure
  types/
    report.ts                -- TypeScript types for report sections
```

#### 4.2 Report UI Components (7 Sections)
- [x] Build report section components (4 data sections, AI sections deferred):
  1. `ExecutiveSummary` - stats cards, key findings bullets, complexity score badge
  2. `TemplateInventory` - grid of template cards with representative screenshots, page count, complexity badge
  3. `SiteArchitecture` - collapsible tree view (recursive Tailwind component), color-coded by template type, orphan/thin flags
  4. `ContentAudit` - tier breakdown bar chart (Recharts), tier table with filters, duplicate pairs
  5. `TechnicalRecommendations` - categorized recommendation cards (Content Strategy, Technical Approach, Risk Mitigation)
  6. `InvestmentSummary` - effort estimate table, comparison card (migrate all vs smart), timeline overview
  7. `NextSteps` - numbered action items, workshop agenda, "Contact Pagepro" CTA
- [x] Report layout with sticky sidebar navigation (scroll to section)
- [x] Report header with Pagepro branding + client name + date
- [ ] Responsive (desktop-first, readable on tablet) — partially done

**Files:**
```
src/
  components/
    report/
      executive-summary.tsx
      template-inventory.tsx
      site-architecture.tsx
      content-audit.tsx
      technical-recommendations.tsx
      investment-summary.tsx
      next-steps.tsx
      report-layout.tsx      -- full layout with sticky sidebar nav
      report-header.tsx      -- branded header
      sitemap-tree.tsx       -- recursive collapsible tree component
```

#### 4.3 Report Preview & Notes
- [x] Report preview page (`/projects/[id]/report`) showing full report
- [x] Per-section notes field: team can add context, corrections, or commentary
- [x] Notes saved via Server Action, displayed alongside AI content
- [ ] "Re-generate" button per section (re-runs Claude for that section only) — deferred

**Files:**
```
src/
  actions/
    report.ts                -- save notes, regenerate section
app/(dashboard)/projects/[id]/report/page.tsx  -- full report preview
```

#### 4.4 Publishing & Sharing
- [x] Publish flow:
  - Team clicks "Publish" -> confirmation modal
  - Generates unique share ID (crypto.randomBytes)
  - Optionally set password
  - Updates project status to 'published'
- [x] Public report page (`/reports/[shareId]`):
  - Password gate (if password set)
  - Full report rendered (read-only, notes visible if set)
  - Sticky sidebar navigation
  - "Contact Pagepro" CTA (persistent bottom bar)
- [x] Share link copyable from dashboard

**Files:**
```
src/
  actions/
    publish.ts               -- publish report, generate share link
  components/
    report/
      password-gate.tsx      -- password entry form
      report-cta-bar.tsx     -- persistent CTA bar
app/(public)/reports/[shareId]/page.tsx  -- public report viewer
```

#### 4.5 Test with pagepro.co
- [ ] Generate full report for pagepro.co
- [ ] Review all 7 sections for accuracy and visual quality
- [ ] Add notes to 2 sections, verify they save
- [ ] Publish report, access via share link
- [ ] Test password protection
- [ ] Verify report looks professional, not generic AI output

### Acceptance Criteria
- [ ] Report preview shows all 7 sections with real pagepro.co data
- [ ] Charts render correctly (Recharts)
- [ ] Sitemap tree view renders with correct hierarchy and template color coding
- [ ] Per-section notes save and display
- [ ] "Re-generate" re-runs Claude for individual sections
- [ ] Published report accessible via share link
- [ ] Password protection works (wrong password rejected, correct password grants access)
- [ ] Report looks professional with Pagepro branding
- [ ] Sticky sidebar navigation scrolls to correct sections
- [ ] CTA bar visible on public report

### Agent-Browser Verification
```
1. Navigate to /projects/[pagepro-id]/report
2. Screenshot each section (scroll through full report):
   - Executive Summary: verify stats and findings
   - Template Inventory: verify grid with screenshots
   - Site Architecture: verify tree view with hierarchy
   - Content Audit: verify tier chart and table
   - Technical Recommendations: verify specific to pagepro.co
   - Investment Summary: verify estimates present
   - Next Steps: verify actionable items
3. Click a section in sidebar nav -> verify scroll to section
4. Add a note to Executive Summary -> verify save
5. Click "Publish" -> enter password -> confirm
6. Copy share link, navigate to it
7. Enter password -> verify report renders (read-only)
8. Verify CTA bar visible
9. Report: section quality, visual polish, any rendering issues
```

---

## Phase 5: Cleanup, Cost Tracking & Deployment

**Duration:** 4-5 days
**Milestone:** Old component system removed from DB, API costs tracked per audit, deployed to production. Ready for beta audits.

### Tasks

#### 5.1 Codebase & Schema Cleanup
- [x] Delete orphaned component files:
  - `src/components/analysis/component-inventory.tsx`
  - `src/components/report/component-inventory-report.tsx`
- [x] DB migration: drop `components` and `component_pages` tables (no longer used — replaced by `section_types` + `pages.detected_sections`)
- [x] Remove `components` and `componentPages` exports from `src/db/schema.ts`
- [x] Clean up any remaining references to old component system

#### 5.2 API Cost Tracking
- [x] Create `api_usage` table: `id`, `project_id`, `step` (classification/scoring/sections/report), `model`, `input_tokens`, `output_tokens`, `cost_usd`, `created_at`
- [x] Instrument `callClaude` and `callClaudeWithImage` in `src/services/anthropic.ts` to log usage from API response (`usage.input_tokens`, `usage.output_tokens`)
- [x] Track costs across retries and re-analysis batches (each API call logged individually, summed per project)
- [x] Cost display on project overview: total cost, cost per step breakdown
- [x] Cost per audit visible in project list

#### 5.3 Error Handling & Resilience
- [x] Crawl failures: retry UI, error messages, partial crawl handling
- [x] Analysis failures: retry individual steps, skip non-critical failures gracefully
- [x] Loading states and skeleton UIs for all async pages

#### 5.4 Multi-Site Testing
- [ ] Test full flow on 3 different site types:
  - A WordPress blog (different structure from pagepro.co)
  - A React SPA / JS-heavy site
  - A large content site (500+ pages)
- [ ] Document results: accuracy, processing time, costs, issues found
- [ ] Fix bugs discovered during testing

#### 5.5 Production Deployment
- [ ] Deploy Next.js app to Vercel
  - Configure environment variables
  - Set up custom domain
  - Connect to Supabase (production instance)
- [ ] Run database migrations in production
- [ ] Set up Sentry for error monitoring
- [ ] Verify full flow works in production
- [ ] Create Pagepro team user accounts

#### 5.6 Documentation
- [ ] Update CLAUDE.md with final conventions
- [ ] Internal team playbook: how to create a project, trigger crawl, review analysis, publish report

### Acceptance Criteria
- [ ] `components` and `component_pages` tables dropped, no code references remain
- [ ] API cost tracked per call, summed per project (including retries/re-runs)
- [ ] Cost breakdown visible on project overview page
- [ ] Full E2E flow completes without errors for pagepro.co in production
- [ ] Error states handled gracefully with user-facing messages
- [ ] Tested on 3+ different websites successfully
- [ ] App accessible at production URL with SSL
- [ ] Sentry captures errors

### Agent-Browser Verification
```
1. Production URL verification:
   a. Navigate to https://[domain] -> verify login page
   b. Log in -> verify dashboard
   c. Create project for pagepro.co
   d. Start crawl -> wait for completion
   e. Verify analysis runs
   f. Navigate through all analysis tabs
   g. Navigate to report -> verify all sections
   h. Publish report -> copy share link
   i. Open share link in incognito -> verify public report
2. Error scenario testing:
   a. Try invalid URL -> verify error message
   b. Try wrong report password -> verify rejection
3. Check all pages for console errors
4. Report: production readiness, performance, any issues
```

---

## Milestone Summary

| Phase | Milestone | Status |
|-------|-----------|--------|
| 1 | Project boots, dashboard shell, DB, auth, first test | **Done** |
| 2 | Firecrawl crawls pagepro.co, pages stored, 3-tab workflow (Crawl/Scrape/Analyse) | **Done** |
| 3 | AI analysis: templates, scoring, sections. Analysis dashboard. | **Done** |
| 4 | 5-section report (data), preview, notes, publish, share link | **Done** |
| 5 | Cleanup, cost tracking, multi-site testing, deployment | In progress (5.1, 5.2 done) |

**Progress: ~85% complete** (Phases 1-4 done, Phase 5 remaining)

### Post-Phase 4 Improvements (Done)
- Editable content tiers — manual tier override per page via dropdown in Analysis tab
- Shared content preview panel — reusable component for Crawl and Scrape tabs with rendered markdown, backdrop overlay, toggle behavior
- Cleaned up Scrape table — single content icon (FileText) instead of two (removed Code icon)
- **Section Placeholder Library** — `section_types` table with 64 types, SVG wireframes, Settings CRUD UI
- **Taxonomy-Driven Section Detection** — AI prompt uses DB taxonomy, returns slugs instead of free-form labels
- **Replaced components with sections** — removed old component detection system, reports show Section Inventory instead of Component Inventory
- **Image resize fix** — screenshots exceeding Claude's 8000px limit are automatically resized

---

## Future Additions (Post-MVP, on request)

| Feature | Trigger to Add |
|---------|---------------|
| Report sections 5-7 (Technical Recommendations, Investment Summary, Next Steps) | After MVP validated — needs Claude Sonnet narrative generation |
| Stripe payment collection | Business model validated, ready for self-service |
| Landing page (public marketing) | Ready for inbound leads |
| Email notifications (Resend) | Manual emails become a bottleneck |
| PDF generation | Clients request downloadable format |
| React Flow interactive sitemap | Simple tree view insufficient |
| Report analytics (view tracking) | Need data on client engagement |
| Google Analytics integration | Clients want traffic-based prioritization |
| Competitor analysis | Proven add-on demand |
| pgvector + embeddings | Need semantic search or better duplicate detection |
| Self-service SaaS tier | 20+ audits/month, ready to scale |

---

## How to Use This Plan

### Starting Work
```
/compound-engineering:workflows:work docs/plans/2026-03-07-feat-replatform-discovery-engine-plan.md
```

### After Each Milestone
1. Run agent-browser verification steps
2. Review results, provide feedback
3. Update plan with learnings
4. Proceed to next phase

### Iterative Loop
```
Phase N -> Agent-Browser Verify -> Review -> Update Plan -> Phase N+1
```
