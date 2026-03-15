# Product Requirements Document (PRD)
## Replatform Discovery Engine

**Version:** 1.3
**Last Updated:** March 15, 2026
**Document Owner:** Pagepro Product Team
**Status:** MVP ~90% Complete

> **v1.3 Update:** SEO Baseline feature complete. Core pipeline fully functional. This document combines the original PRD with current implementation state. Sections below marked with *[BUILT]* reflect what's live; *[DEFERRED]* marks planned-but-not-yet-built features; *[CHANGED]* marks where implementation diverged from the original spec.

> **v1.2 Update:** MVP scope changed to internal-only tool. Payment collection (Stripe), public landing page, email notifications (Resend), and self-service features are deferred until the tool is proven with internal use.

***

## Current State (as of March 15, 2026)

### What's Built

The tool answers three questions prospects care about most:
1. **What do we have?** — Complete inventory of pages, templates, content, and UI sections
2. **What's worth keeping?** — Content tiered by business value, duplicates flagged, architecture mapped
3. **Will we lose our Google rankings?** — SEO baseline with redirect-critical pages, traffic value at risk, and real user performance data

**Pipeline:** Crawl → Classify & Score → Screenshot & Detect → Report (~7 min for 500 pages)

**SEO Enrichment (optional, user-triggered):**
- On-page extraction from stored HTML (H1, canonical, meta robots, schema.org, internal links)
- Ahrefs CSV import (Top Pages + Best by Links, auto-detected, UTF-16LE/UTF-8)
- PageSpeed Insights (lab scores on representative pages)
- Chrome UX Report (real user Core Web Vitals at domain level + 25-week trends)
- SEO scoring: 45% organic traffic + 35% referring domains + 20% on-page health
- Post-enrichment tier correction: archive pages with traffic >= 50 or RDs >= 5 upgraded to consolidate

**Dashboard tabs:** Overview | Crawl | Analysis | Pages | SEO | Performance | Report

**Report sections (6 live, 3 deferred):**
1. Executive Summary — with traffic value headline ("$X/mo at stake") *[BUILT]*
2. Template Inventory *[BUILT]*
3. Section Inventory (64 section types with SVG wireframes) *[BUILT]*
4. Site Architecture (tree view) *[BUILT]*
5. Content Audit (tier breakdown) *[BUILT]*
6. SEO Baseline (redirect-critical pages, on-page debt) *[BUILT]*
7. Technical Recommendations *[DEFERRED — needs Claude Sonnet narrative]*
8. Investment Summary *[DEFERRED]*
9. Next Steps *[DEFERRED]*

### Key Design Decisions

- **SEO scoring: 45% organic traffic + 35% RDs + 20% on-page health** — Original formula double-counted by using both traffic value (traffic × CPC) and organic traffic. Fixed to use independent signals only.
- **Tier overrides post-enrichment** — After Ahrefs import, pages with organic traffic >= 50/mo or referring domains >= 5 get upgraded from archive to consolidate minimum. Prevents classification (which runs without traffic data) from archiving important pages.
- **Performance excluded from SEO score** — A page ranking well despite bad performance is MORE important to protect. Performance shown separately as a migration opportunity.
- **Organic Keywords CSV deferred to v2** — Traffic value encodes intent implicitly via CPC. **Known gap:** local intent pages (low CPC, high business value) are invisible without it.
- **CrUX over PSI for domain baseline** — One free API call gives real user data for the entire domain. More credible in sales conversations than lab scores.
- **Ahrefs CSV over API** — API costs $500+/month. CSV exports from $99 plan give the same data.
- **No separate tables for SEO data** — All per-page SEO data stored as columns on `pages` table. Domain-level data in `projects.settings` JSONB.
- **Screenshot only representatives** — 1 per template (~12-25 pages) not all 500+. 90% API cost reduction.

### What's Left

- **Multi-site testing** — WordPress blog, React SPA, large 500+ page site
- **Production deployment** — Vercel, env vars, custom domain, Supabase production, Sentry
- **Report sections 7-9** — Technical Recommendations, Investment Summary, Next Steps (Claude Sonnet narrative)
- **Full end-to-end report testing** — pagepro.co report not yet verified
- **PDF generation** — deferred, Cmd+P for now
- **Stripe payments** — deferred until business model validated
- **Organic Keywords CSV** — v2, for local intent classification

***

## Executive Summary

**Product Name:** Replatform Discovery Engine  
**Product Type:** AI-powered website analysis SaaS + professional service  
**Target Market:** Mid-market and enterprise companies planning website migrations  
**Primary Use Case:** Initial discovery phase for Next.js + Sanity replatforming projects

**Value Proposition:**  
Turn weeks of manual website auditing into hours of AI-powered analysis. Generate comprehensive migration scope reports that convert prospects into signed contracts by eliminating uncertainty and demonstrating expertise.

**Business Model:**
- **Phase 1 (MVP):** Internal tool for Pagepro team. No payment collection. Audits created manually by team members.
- **Phase 2 (Post-Validation):** Paid Discovery Audit: $2,500-5,000 per project (feeds into $50k-150k replatforming contracts)
- **Phase 3 (Future):** Self-Service SaaS: $299/month unlimited projects
- **Phase 4 (Future):** Enterprise Annual License: $50k-100k/year for enterprise clients with multiple brands

***

## Problem Statement

### Current Pain Points

**For Pagepro (Internal):**
1. Manual website audits take 8-16 hours per project
2. Inconsistent discovery process across different team members
3. Difficult to accurately scope migration complexity early
4. Hard to differentiate from competing agencies in sales process
5. Risk of underestimating effort and losing margin

**For Clients (Mid-Market & Enterprise):**
1. Don't know what content/pages they actually have (especially large enterprises with 500+ pages)
2. Fear of SEO loss during migration (often the biggest blocker to decision)
3. Uncertainty about migration timeline and cost (can't get budget approval)
4. Can't articulate current website structure to vendors (makes RFP process difficult)
5. Paralyzed by "we should probably migrate everything" mindset (leads to scope bloat)
6. Internal stakeholders have competing priorities (IT wants speed, Marketing wants features, C-suite wants ROI)

***

## Product Vision

### North Star Metric
**Conversion Rate:** Percentage of discovery audits that convert to signed replatforming contracts (Target: 70%+)

### Success Criteria (90 Days Post-Launch)
- Complete 10 paid discovery audits
- Generate $50k in audit revenue
- Convert 7+ audits into replatforming contracts ($500k+ pipeline)
- Reduce internal discovery time from 12 hours → 2 hours average
- Achieve 90%+ client satisfaction on audit quality

***

## Target Users

### Primary Persona: "Technical Buyer Tom"
- **Role:** CTO, VP Engineering, Head of Digital, Director of Technology
- **Company:** Mid-market to enterprise, 100-2,000 employees, $25M-500M revenue
- **Current Website:** 200-2,000 pages on legacy stack (WordPress, Drupal, Sitecore, Adobe Experience Manager, custom CMS)
- **Pain:** Current website is slow, hard to maintain, expensive to update, poor developer experience
- **Budget Authority:** Can approve $2.5k-5k audit, influences/approves $50k-250k project decisions
- **Tech Savvy:** Understands technical concepts, appreciates data-driven decisions, cares about performance and developer velocity
- **Motivation:** Wants modern tech stack, better performance, lower maintenance cost, faster time-to-market for content updates

### Secondary Persona: "Marketing Director Maria"
- **Role:** Marketing Director, CMO, VP of Marketing, Digital Marketing Manager
- **Company:** Same as Technical Buyer Tom
- **Current Website:** 200-2,000 pages, frustrated by slow content updates and poor UX
- **Pain:** Website is slow, hard to update content without dev team, SEO performance declining, can't execute marketing campaigns quickly
- **Fear:** Losing organic traffic during migration, budget waste on failed projects, long timelines
- **Influence:** Champions project internally, controls marketing budget, focuses on SEO/content preservation and business outcomes
- **Motivation:** Wants faster content publishing, better SEO, improved conversion rates, marketing autonomy

### Tertiary Persona: "Executive Sponsor Eva"
- **Role:** CEO, COO, Chief Digital Officer, VP of Product
- **Company:** Same as above
- **Pain:** Current website doesn't support business growth, competitor websites are better, high cost of website operations
- **Focus:** ROI, timeline, risk mitigation, competitive advantage
- **Decision Process:** Needs clear business case with numbers (cost savings, revenue impact, risk analysis)
- **Motivation:** Wants strategic advantage, operational efficiency, reduced risk, clear roadmap

***

## Core Features & Requirements

## MVP Feature Set (Phase 1 - Target: 8 Weeks)

### 1. Website Crawler & Data Collection

**Functional Requirements:**
- Input: Single website URL
- Crawl depth: Configurable (default: 5 levels, max: 10 levels)
- Page limit: 1,000 pages for MVP (expandable to 10,000 for enterprise)
- Respect robots.txt and crawl-delay directives
- Handle JavaScript-rendered content (SPA support)
- Extract from each page:
  - Full HTML source
  - Rendered DOM structure
  - All assets (images, videos, PDFs, fonts, scripts)
  - Metadata (title, description, Open Graph, schema.org)
  - All internal and external links
  - Page load performance metrics (Core Web Vitals)

**Technical Requirements:**
- Built with Playwright for browser automation
- Headless Chrome for speed
- Async/parallel crawling (max 5 concurrent pages per domain for politeness)
- Request caching to avoid re-crawling during development
- Crawl time: <3 minutes for 100 pages, <30 minutes for 1,000 pages
- Store raw data in PostgreSQL + S3 for HTML snapshots

**Non-Functional Requirements:**
- Handle dynamic content loading (infinite scroll, lazy loading)
- Bypass basic bot detection (user-agent rotation, viewport emulation)
- Timeout handling (skip pages that take >30s to load)
- Error recovery (retry failed pages 2x before skipping)
- Progress tracking (real-time crawl status updates)

***

### 2. AI-Powered Template Detection

**Functional Requirements:**
- Automatically cluster pages into template types
- Identify common page templates:
  - Homepage
  - Landing page (campaign/promo)
  - Blog article/news post
  - Category/listing page
  - Product/service page
  - Case study/portfolio item
  - About/team page
  - Legal/policy page
  - Contact/form page
  - Documentation/resource page
  - Custom/unique pages

**AI Analysis Method:**
- **Visual similarity:** Screenshot each page → use computer vision embeddings (CLIP model) → cluster by visual similarity
- **Structural similarity:** Extract DOM structure → convert to tree representation → calculate tree edit distance → cluster
- **Content similarity:** Extract text content → generate embeddings (OpenAI text-embedding-3-small) → semantic clustering
- **Combined scoring:** Weighted combination of visual (40%), structural (40%), content (20%) similarity

**Output:**
- "Your site likely has **17 unique templates**, not 863 individual pages"
- Visual grid showing template clusters with representative examples
- Confidence score per cluster (high/medium/low)
- List of pages per template with variation notes
- **Business impact:** "Reducing 863 pages to 17 templates means 80% faster development and 70% lower ongoing maintenance cost"

**Technical Requirements:**
- Use Claude 3.5 Sonnet for LLM-powered analysis
- K-means or DBSCAN clustering on embedding vectors
- Store embeddings in pgvector for fast similarity search
- Processing time: <45 seconds per 100 pages

***

### 3. Page Architecture Mapping

**Functional Requirements:**
- Generate visual sitemap showing:
  - URL hierarchy and structure
  - Navigation depth (clicks from homepage)
  - Page relationships (parent-child, sibling)
  - Orphan pages (not linked from anywhere internally)
  - Duplicate pages (same content, different URLs)
  - Thin pages (<300 words, low value)
  - High-traffic pages (if GA integrated)

**Deliverable:**
- Interactive visual sitemap (collapsible tree view)
- Color-coded by template type
- Size-coded by word count or traffic (if GA connected)
- Flags for issues (orphans, duplicates, thin content)
- **Business insight:** "42 orphan pages can be deleted, saving $8k in migration costs"

**Technical Requirements:**
- Graph database representation (PostgreSQL with recursive CTEs)
- D3.js or React Flow for visualization
- Export to PNG/PDF for client presentations
- Performance: render 1,000+ pages smoothly

***

### 4. Component & Section Inventory

**Functional Requirements:**
- Scan all pages to identify reusable sections/modules:
  - Hero sections (with variants: video bg, image bg, split layout)
  - CTA banners (styles: full-width, boxed, sticky)
  - Forms (contact, newsletter, quote request, multi-step)
  - Content blocks (text, image-text split, quote blocks)
  - Navigation (main nav, footer, sidebar, mega menu)
  - Card grids (blog cards, product cards, team members)
  - Media galleries (image carousel, video players, lightbox)
  - Social proof (testimonials, logos, reviews, stats)
  - Interactive (accordions, tabs, modals, tooltips)

**AI Analysis:**
- Use LLM (Claude 3.5 Sonnet) with vision to analyze page screenshots
- Prompt: "Identify all distinct UI sections on this page. Classify each by type (hero, CTA, form, etc.) and describe visual style."
- Extract semantic HTML structure for each identified component
- Group similar components across pages into reusable patterns

**Output:**
- Component library document showing:
  - All unique component types found
  - Frequency of use across site
  - Visual examples (screenshots)
  - Structural patterns (semantic HTML summary)
  - Recommended Next.js component names
  - **Business value:** "23 reusable components means future pages can be built 5x faster"

**Technical Requirements:**
- Claude 3.5 Sonnet with vision for image analysis
- Component fingerprinting (hash of structure + style)
- Deduplication logic (group visually similar components)

***

### 5. URL Structure & Routing Analysis

**Functional Requirements:**
- Analyze current URL patterns:
  - URL structure conventions (`/blog/category/post-slug` vs `/blog/post-slug`)
  - Dynamic segments (IDs, dates, slugs)
  - Query parameters (filtering, pagination, tracking)
  - File extensions (.html, .php, .aspx, .jsp)
  - Language/locale paths (`/en/`, `/fr/`, `/de/`)
  - Subdomain usage (blog.company.com vs company.com/blog)

**Output:**
- URL pattern summary with examples
- Recommended Next.js 16 routing structure using App Router
  - Dynamic routes (`/blog/[slug]`, `/products/[category]/[id]`)
  - Route groups for organization (`/(marketing)`, `/(app)`)
  - Parallel routes for complex layouts
  - Intercepting routes if needed
- Migration mapping table (old URL → new URL pattern)
- Redirect strategy (301 permanent redirects for SEO preservation)

***

### 6. Content Quality Scoring

**Functional Requirements:**
- Assign migration priority to each page based on:
  - **Word count:** <300 words = thin, 300-1000 = medium, >1000 = substantial
  - **Content freshness:** Last modified date (if available from sitemap or meta tags)
  - **Navigation prominence:** Homepage linked = high, 3+ clicks deep = low
  - **Duplicate detection:** Exact or near-duplicate content (use embeddings)
  - **Broken links:** Internal 404s, external dead links
  - **Metadata quality:** Missing titles/descriptions, keyword stuffing, duplicate meta descriptions
  - **SEO signals:** Presence of schema markup, alt text quality, heading hierarchy

**Output:**
- Each page gets a score: **Must Migrate, Should Improve, Consider Consolidating, Can Archive**
- Tier breakdown:
  - **Tier 1 (Must Migrate - High Priority):** 40-50% of pages - high value, current, well-structured
  - **Tier 2 (Improve During Migration):** 25-35% - good content, needs refresh or restructuring
  - **Tier 3 (Consolidate):** 10-20% - thin or duplicate, merge with other pages
  - **Tier 4 (Archive/Delete):** 10-20% - outdated, low value, broken, not worth migrating
- **Business impact:** "Migrating only Tier 1+2 (65% of pages) saves 6 weeks and $45k vs migrating everything"

**Technical Requirements:**
- Content similarity via embeddings (cosine similarity >0.95 = duplicate)
- Last-modified from HTTP headers or sitemap.xml
- Link checker (parallel HEAD requests for all links)
- Broken link detection and reporting

***

### 7. Migration Complexity Estimation

**Functional Requirements:**
- Calculate rough effort estimate based on:
  - Number of unique templates (more templates = more dev work)
  - Complex components (forms, calculators, interactive widgets)
  - Third-party integrations (maps, CRMs, payment processors, analytics)
  - Custom JavaScript functionality
  - Content volume (pages + assets)
  - Legacy CMS complexity (inferred from patterns)
  - Current tech stack (detected from source code)

**Output:**
- **Complexity Score:** Simple (1-3), Moderate (4-6), Complex (7-10)
- **Effort Bands:**
  - Small Migration: <100 pages, 3-5 templates → 6-8 weeks, $40k-60k
  - Medium Migration: 100-500 pages, 5-10 templates → 10-14 weeks, $80k-120k
  - Large Migration: 500-1,500 pages, 10-15 templates → 16-24 weeks, $150k-250k
  - Enterprise Migration: 1,500+ pages, 15+ templates, custom features → 24+ weeks, $250k-500k+

**Risk Flags:**
- 🚨 **High Risk:** JS-heavy SPAs, fragile forms with complex validation, uncommon CMS, heavy third-party dependencies
- ⚠️ **Medium Risk:** Mixed content (HTTP/HTTPS), broken links, thin content, inconsistent structure
- ✅ **Low Risk:** Static pages, standard CMS (WordPress, Contentful), clean structure, good metadata

**Business-Focused Output:**
- Timeline with phases (Discovery → Design → Development → Testing → Launch)
- ROI projection (performance improvements, SEO gains, reduced maintenance costs)
- Risk mitigation strategies

***

### 8. Report Generation

**Functional Requirements:**
- Generate comprehensive PDF report containing:
  
  **1. Executive Summary** (1 page)
     - Site overview stats (total pages, unique templates, content volume)
     - Migration complexity score and timeline estimate
     - **Total investment estimate** (e.g., "$120k-150k, 14-16 weeks")
     - **ROI projection:** Performance gains, SEO preservation, operational savings
     - Key findings and strategic recommendations
  
  **2. Business Case** (1-2 pages) ⭐ NEW
     - **Current state costs:** Slow performance impacts conversion, high dev costs for content updates, SEO declining
     - **Future state benefits:** Faster site (2-3x), better Core Web Vitals, marketing autonomy, lower maintenance
     - **Migration investment vs ongoing savings** comparison
     - **Competitive analysis:** How current site compares to modern industry standards
  
  **3. Template Inventory** (2-3 pages)
     - Visual grid of identified templates
     - Page count per template
     - Representative screenshots
     - **Development effort per template** (simple/moderate/complex)
  
  **4. Site Architecture Map** (1-2 pages)
     - Visual sitemap with hierarchy
     - URL structure analysis
     - Recommended Next.js 16 routing structure
     - **Content organization recommendations** for Sanity
  
  **5. Component Library** (2-3 pages)
     - All unique UI sections/components
     - Frequency analysis
     - Next.js 16 component recommendations (Server Components vs Client Components)
     - **Reusability score:** How many future pages benefit from component library
  
  **6. Content Audit & Strategy** (2-3 pages)
     - Migration priority tiers with page counts
     - Pages to consolidate/archive (with cost savings)
     - Content quality issues and remediation plan
     - **Content gap analysis:** What's missing vs competitors
     - **SEO preservation strategy:** Critical pages, redirect map overview
  
  **7. Technical Recommendations** (2-3 pages)
     - High-level Sanity schema suggestions
     - Third-party integrations to preserve/modernize
     - Performance optimization opportunities
     - **Next.js 16 advantages for this specific site** (Server Components, streaming, image optimization, etc.)
     - Security considerations
  
  **8. Migration Roadmap** (2 pages)
     - **Phase 1: Discovery & Planning** (2-3 weeks)
     - **Phase 2: Design & Prototyping** (3-4 weeks)
     - **Phase 3: Development** (6-12 weeks depending on size)
     - **Phase 4: Content Migration** (2-4 weeks)
     - **Phase 5: Testing & QA** (2-3 weeks)
     - **Phase 6: Launch & Optimization** (1-2 weeks)
     - **Parallel workstreams** where possible
  
  **9. Investment Summary** (1 page)
     - Effort estimate by phase
     - Cost breakdown (transparent pricing)
     - **Comparison:** Migrate everything vs smart migration (show savings)
     - Payment milestones
     - What's included / what's optional
  
  **10. Next Steps** (1 page)
     - Immediate actions client should take
     - Recommended discovery workshop (agenda + objectives)
     - Timeline to decision
     - How to get started with Pagepro

**Branding:**
- Pagepro logo and colors throughout
- Professional layout (not generic AI output)
- Custom cover page with client logo
- Charts and visualizations for data-heavy sections
- Clear typography hierarchy

**Technical Requirements:**
- React + Tailwind for report UI
- Recharts for data visualizations
- Puppeteer for PDF generation (high-quality, print-ready)
- Report generation time: <90 seconds
- Shareable link (password-protected or public)
- Downloadable PDF (branded, professional quality)

***

## User Flow

### Primary Flow: Discovery Audit Purchase

```
1. Prospect visits Pagepro website → "Get Migration Audit" CTA
   OR Pagepro sales team sends direct link during outreach

2. Lands on audit landing page
   - Explains what's included (with sample screenshots)
   - Shows anonymized sample report
   - Social proof: testimonials, logos of companies analyzed
   - Pricing: $2,500 (standard sites <500 pages) or $4,500 (enterprise 500-2000 pages)
   - FAQ section addressing common concerns

3. Fills out intake form:
   - Website URL (required)
   - Company name and industry (required)
   - Current CMS/platform (optional dropdown)
   - Approximate page count (optional: <100, 100-500, 500-1000, 1000+)
   - Google Analytics access? (yes/no - optional but encouraged)
   - Primary migration goals (checkboxes: performance, SEO, content management, design refresh, tech modernization)
   - Current pain points (open text)
   - Contact info (name, email, title, phone)
   - Preferred report delivery timeline (3 days, 5 days, 7 days)

4. Payment via Stripe ($2,500 or $4,500 upfront)

5. Confirmation email + internal Slack notification to Pagepro team

6. Pagepro team member:
   - Reviews submission within 2 hours
   - Sends personal welcome email with timeline confirmation
   - Initiates crawler (clicks "Start Audit" button in admin dashboard)
   - Monitors crawl progress (10-40 minutes depending on site size)

7. AI analysis runs automatically after crawl (10-20 minutes)

8. Draft report generated automatically

9. Pagepro senior consultant reviews report (1-2 hours)
   - Validates AI analysis accuracy
   - Adds human insights based on industry knowledge
   - Customizes business case and recommendations
   - Adds competitive context
   - Refines investment estimates based on experience

10. Final report published to secure link

11. Client receives email with:
    - Report access link (password-protected)
    - Video message from consultant (30-second Loom intro)
    - Calendar link to book 45-minute walkthrough call

12. Client reviews report (analytics track: time on page, sections viewed, PDF downloaded)

13. **45-minute walkthrough call** (scheduled within 5 days of delivery):
    - First 20 min: Walk through key findings
    - Next 15 min: Answer questions, dig into concerns
    - Last 10 min: Discuss next steps, gauge interest in full project
    - If interested → send detailed proposal within 3 days

14. Proposal references audit findings extensively
    - Audit becomes Appendix A
    - Pricing is anchored to audit estimates
    - Scope is based on audit recommendations

15. Close deal → Begin replatforming project
```

**Target SLA:**
- Report delivered within 3 business days for standard tier ($2,500)
- Report delivered within 5 business days for enterprise tier ($4,500)
- Stretch goal: 48 hours for standard tier

***

## Information Architecture

### Dashboard Structure (Internal Pagepro Tool)

```
/dashboard
  /projects (list of all audits with status, client name, date, tier)
  /projects/new (start new audit - enter URL + client details + settings)
  /projects/[id]
    /overview (high-level stats, progress indicator)
    /crawl (crawl status, discovered pages, errors, logs)
    /analysis (AI analysis results - templates, components, content tiers)
    /edit (manual refinement of AI findings)
    /report-preview (live preview of report before publishing)
    /publish (finalize and send to client)
    /analytics (track client engagement with report)
  /templates (saved report templates, prompt configurations)
  /settings (crawler config, AI prompts, integrations, team members)
  /analytics (business metrics: conversion rates, avg deal size, etc.)
```

### Public Report Structure

```
/reports/[share-id]
  - Password protection (optional)
  - Sticky navigation sidebar: Executive Summary, Business Case, Templates, Architecture, Components, Content, Technical, Roadmap, Investment, Next Steps
  - Download PDF button (top right)
  - "Schedule Call with Pagepro" CTA (persistent bottom bar)
  - Analytics tracking (PostHog: sections viewed, time spent, interactions)
```

***

## Technical Architecture

### Stack

**Frontend:**
- **Next.js 16** (App Router, React 19)
- TypeScript (strict mode)
- Tailwind CSS v4
- Shadcn/ui components
- Recharts for data visualization
- React Flow for sitemap visualization
- Framer Motion for micro-interactions

**Backend:**
- Next.js 16 API routes (serverless functions)
- Server Actions for mutations
- Vercel deployment (Pro plan)
- PostgreSQL (Vercel Postgres or Supabase)
- pgvector extension for embeddings
- Vercel Blob for HTML snapshots and screenshots

**Crawler Service (Separate Service):**
- Node.js + Playwright (headless Chrome)
- Deployed on Railway or Fly.io (needs long-running process support)
- Queue system: BullMQ + Upstash Redis
- Horizontal scaling support (spin up multiple workers)

**AI Services:**
- **Primary:** Claude 3.5 Sonnet (Anthropic API) - text analysis, classification, recommendations
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions) - semantic similarity
- **Vision:** Claude 3.5 Sonnet with vision - component identification from screenshots
- **Fallback:** OpenAI GPT-4o for redundancy if Anthropic has issues

**Data Storage:**

```sql
-- PostgreSQL Schema

-- Projects (audits)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  tier VARCHAR(50) NOT NULL, -- 'standard' or 'enterprise'
  status VARCHAR(50) NOT NULL, -- 'pending', 'crawling', 'analyzing', 'reviewing', 'published'
  payment_status VARCHAR(50) NOT NULL, -- 'paid', 'refunded'
  stripe_payment_id VARCHAR(255),
  report_share_id VARCHAR(50) UNIQUE,
  report_password VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  crawl_started_at TIMESTAMP,
  crawl_completed_at TIMESTAMP,
  analysis_completed_at TIMESTAMP
);

-- Pages discovered during crawl
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  word_count INTEGER,
  html_snapshot_url TEXT, -- S3/Blob URL
  screenshot_url TEXT, -- S3/Blob URL
  template_id UUID REFERENCES templates(id),
  content_tier VARCHAR(50), -- 'must_migrate', 'improve', 'consolidate', 'archive'
  navigation_depth INTEGER,
  is_orphan BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  has_broken_links BOOLEAN DEFAULT FALSE,
  last_modified TIMESTAMP,
  metadata JSONB, -- flexible storage for additional data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template clusters
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- 'blog_post', 'product_page', etc.
  display_name VARCHAR(255), -- 'Blog Article', 'Product Page', etc.
  confidence VARCHAR(50), -- 'high', 'medium', 'low'
  page_count INTEGER DEFAULT 0,
  representative_page_id UUID REFERENCES pages(id),
  description TEXT,
  complexity VARCHAR(50), -- 'simple', 'moderate', 'complex'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Components/sections found
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- 'hero', 'cta', 'form', etc.
  style_description TEXT,
  frequency INTEGER DEFAULT 0, -- how many pages use this
  example_page_ids UUID[], -- array of page IDs
  screenshot_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Links between pages
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL,
  is_broken BOOLEAN DEFAULT FALSE,
  link_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embeddings for semantic search
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  vector vector(1536), -- pgvector, 1536 dimensions for OpenAI embeddings
  embedding_type VARCHAR(50), -- 'content', 'structure', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (vector vector_cosine_ops);

-- Audit activity tracking
CREATE TABLE report_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  event_type VARCHAR(100), -- 'viewed', 'pdf_downloaded', 'section_viewed', 'call_booked'
  event_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Job Queue Flow:**
```
1. User submits URL + payment → Create project record (status: 'pending')
2. Enqueue "crawl_website" job → Crawler service picks up
3. Crawler discovers pages → Store in DB, enqueue "analyze_page" jobs for each
4. Page analysis workers:
   - Generate embeddings (OpenAI API)
   - Extract metadata
   - Take screenshot
   - Store HTML snapshot
5. When all pages analyzed → Enqueue "classify_templates" job
6. Template classification:
   - Cluster pages by similarity (K-means on embeddings)
   - Assign template types using Claude
   - Update pages with template_id
7. Enqueue "detect_components" job
8. Component detection:
   - Claude Vision analyzes screenshots
   - Identifies reusable sections
   - Stores in components table
9. Enqueue "content_scoring" job
10. Content scoring:
    - Calculate quality scores
    - Detect duplicates (embedding similarity)
    - Check for broken links
    - Assign content tiers
11. Enqueue "generate_report" job
12. Report generation:
    - Compile all data
    - Generate business case calculations
    - Create visualizations
    - Render report HTML
13. Update project status to 'reviewing'
14. Pagepro team reviews → clicks "Publish"
15. Generate shareable link → Send email to client
16. Project status → 'published'
```

**Infrastructure:**
- **Vercel:** Frontend hosting, serverless functions
- **Railway/Fly.io:** Crawler service (needs long-running processes)
- **Upstash Redis:** Job queue (BullMQ)
- **Vercel Postgres or Supabase:** Database with pgvector
- **Vercel Blob or S3:** File storage (HTML snapshots, screenshots, PDFs)
- **PostHog:** Product analytics
- **Sentry:** Error monitoring
- **Resend:** Transactional emails
- **Stripe:** Payment processing

***

## AI/LLM Implementation Details

### Claude 3.5 Sonnet Prompts

**1. Template Classification Prompt:**
```
You are analyzing a website for migration planning. Based on the following page data, classify this page into one of these template types:

Template Types:
- homepage
- landing_page (promotional/campaign page)
- blog_post
- blog_listing
- product_page
- product_listing
- case_study
- about_page
- team_page
- contact_page
- legal_page (privacy, terms, etc.)
- documentation_page
- resource_page (whitepaper, guide, etc.)
- custom_page (unique, doesn't fit other types)

Page Data:
URL: {url}
Title: {title}
H1: {h1_text}
Word Count: {word_count}
First 500 characters: {content_preview}
Navigation Depth: {depth}
Meta Description: {meta_description}

Respond in JSON format only, no additional text:
{
  "template_type": "blog_post",
  "confidence": "high",
  "reasoning": "This page has blog post structure with article content, author byline, publish date, and commenting section."
}
```

**2. Component Detection Prompt (with vision):**
```
Analyze this website screenshot. Identify all distinct UI sections/components visible on the page.

For each component, provide:
1. Component type (use these categories: hero, navigation, cta, form, content_block, card_grid, testimonial, logo_grid, stats, accordion, tabs, image_gallery, video, footer, other)
2. Visual style description (be specific about layout, colors, imagery)
3. Position on page (header, above_fold, mid_page, below_fold, footer)
4. Complexity assessment (simple, moderate, complex)

Focus on reusable patterns that appear across multiple pages.

Respond in JSON array format only:
[
  {
    "type": "hero",
    "style": "Full-width hero with background video, centered headline (white text), subheading, and two CTA buttons (primary and secondary)",
    "position": "header",
    "complexity": "moderate"
  },
  {
    "type": "card_grid",
    "style": "3-column grid of feature cards, each with icon, heading, and description. Cards have subtle shadows and hover effects",
    "position": "above_fold",
    "complexity": "simple"
  }
]

Image: [base64 screenshot]
```

**3. Business Case Generator Prompt:**
```
You are a business consultant helping create an ROI-focused migration business case.

Given this website analysis:
- Total pages: {page_count}
- Unique templates: {template_count}
- Current tech stack: {tech_stack}
- Content quality distribution: {quality_breakdown}
- Performance issues detected: {performance_issues}
- Complex features: {features_list}

Generate a compelling business case for migrating to Next.js 16 + Sanity CMS. Include:

1. **Current State Costs** (3-4 bullet points)
   - Quantify pain points (slow performance impacts conversion, high dev costs, SEO issues)
   - Use specific examples from this site's analysis

2. **Future State Benefits** (3-4 bullet points)
   - Performance improvements (Core Web Vitals, page speed)
   - Operational efficiency (faster content updates, lower maintenance)
   - Business impact (better SEO, improved conversion, competitive advantage)

3. **Investment vs Savings**
   - One-time migration investment estimate
   - Ongoing annual savings (reduced dev costs, hosting, etc.)
   - Break-even timeline

Keep language business-focused (ROI, efficiency, competitive advantage), not technical jargon.
Format as markdown with clear headings.
```

**4. Migration Recommendations Prompt:**
```
You are a technical consultant specializing in Next.js 16 and Sanity CMS migrations.

Given this website analysis:
- Total pages: {page_count}
- Unique templates: {template_count}
- Content quality distribution: {quality_breakdown}
- Complex features detected: {features_list}
- Third-party integrations: {integrations_list}

Provide 5-7 specific, actionable recommendations for the migration. Organize into these categories:

**Content Strategy** (2-3 recommendations)
- What to migrate, improve, consolidate, or archive
- Content gap opportunities

**Technical Approach** (2-3 recommendations)
- Next.js 16 patterns to leverage (Server Components, streaming, etc.)
- Sanity schema considerations
- Performance optimization opportunities

**Risk Mitigation** (1-2 recommendations)
- Potential challenges and mitigation strategies
- Critical pages requiring special attention

Keep each recommendation concise (2-3 sentences) and action-oriented.
Focus on this specific site's characteristics.
Format as markdown with clear headings and bullet points.
```

### Embedding Strategy

**When to generate embeddings:**
- Full page content (for duplicate detection and similarity clustering)
- Page titles + descriptions (for semantic grouping)
- Component descriptions (for grouping similar UI patterns)

**Embedding model:** OpenAI text-embedding-3-small
- 1536 dimensions
- Fast inference (~50ms per embedding)
- Cost-effective ($0.02 per 1M tokens)

**Similarity thresholds:**
- **>0.95** = Duplicate content (flag for consolidation)
- **0.85-0.95** = Very similar (likely same template)
- **0.70-0.85** = Related content (same category/topic)
- **<0.70** = Different content

**Storage:** pgvector column in PostgreSQL
- Use IVFFlat index for fast similarity search
- Query: `ORDER BY vector <=> query_vector LIMIT 10`

***

## Success Metrics & Analytics

### Product Metrics (Track in PostHog)

**Acquisition:**
- Landing page visitors
- Form starts vs completions (conversion rate)
- Payment success rate

**Engagement:**
- Audits initiated
- Audits completed successfully
- Average crawl time
- Average AI analysis time
- Report views (unique visitors)
- Time spent on report (avg)
- Sections viewed (which sections most popular)
- PDF downloads
- Call bookings from report page

**Quality:**
- Human review time per report (target: <90 min for standard, <120 min for enterprise)
- Number of manual edits to AI analysis (track which sections need most editing)
- Client satisfaction scores (post-delivery survey, NPS)
- Report accuracy (validate template classification on sample)

**Business (Revenue):**
- Audit revenue (monthly recurring)
- Audit → project conversion rate (target: 70%+)
- Average project value from audit-sourced leads
- Time from audit delivery → contract signed (target: <30 days)
- Total pipeline value influenced by audits

### Technical Metrics (Track in Vercel/Sentry)

**Performance:**
- Crawler: pages/minute (target: >25)
- AI analysis: time per page (target: <4 seconds)
- Report generation: total time (target: <90 seconds)
- Dashboard load time (target: <2 seconds)
- Report page load time (target: <1.5 seconds)

**Reliability:**
- Uptime: 99.5%+ for dashboard
- Crawler success rate: 95%+ (pages successfully crawled)
- AI API error rate: <1%
- Failed job retry success rate

**Costs:**
- AI API costs per audit (target: <$15)
- Infrastructure costs per audit (target: <$5)
- Total COGS per audit (target: <$25)

**Accuracy (Validate Monthly):**
- Template classification accuracy (manually validate 50 pages per month)
- Component detection recall (did it find all major components?)
- False positive rate for duplicate detection
- Broken link detection accuracy

***

## Go-to-Market Strategy

### Phase 1: Closed Beta (Weeks 1-4)

**Goal:** Validate product with 5 friendly enterprise clients

**Target Beta Clients:**
- Existing Pagepro clients planning future migrations
- Enterprise prospects in pipeline (100-500 employees)
- Companies with 300+ page websites on legacy platforms
- Industries: SaaS, Professional Services, Manufacturing, Healthcare

**Approach:**
- Personal outreach from Pagepro leadership
- Offer **free audit** ($2,500 value) in exchange for:
  - Detailed feedback (1-hour feedback session)
  - Permission to use as case study (anonymized)
  - Testimonial if satisfied
- Hands-on support throughout process
- Schedule feedback session within 2 days of report delivery

**Success Criteria:**
- 4/5 clients say report is "very valuable" or "extremely valuable"
- 3/5 clients request full replatforming proposal
- Identify and fix top 5 product issues
- Validate pricing: would they have paid $2,500 for this?
- Refine report template based on feedback

### Phase 2: Soft Launch (Weeks 5-8)

**Goal:** Complete 5 paid audits, convert 3 to projects

**Target Audience:**
- Past proposals that didn't close (re-engage with audit offer)
- Inbound leads from past 12 months (warm leads)
- LinkedIn connections of Pagepro team (warm outreach)

**Channels:**
1. **Email outreach** to past prospects (personalized, reference past conversations)
2. **LinkedIn outreach** (connection + personalized message mentioning audit)
3. **Existing client referrals** (incentivize with $500 credit)

**Messaging:**
- "Before you commit to a $100k+ migration, get clarity for $2,500"
- "See exactly what you're migrating before you migrate it"
- Emphasize risk reduction and informed decision-making

**Landing Page (Simple):**
- Hero: "Don't Guess Your Migration Scope. Know It."
- Problem: "85% of website migrations go over budget because of unknown complexity"
- Solution: AI-powered discovery audit in 3 days
- What's included (bullet list with icons)
- Sample report preview (anonymized, embedded PDF or screenshots)
- Testimonial from beta client
- Pricing: $2,500 (value anchor: "vs 40 hours of manual analysis at $150/hr = $6,000")
- FAQ (5-7 common objections)
- CTA: "Get Your Audit" → Form

**Sales Process:**
- Audit purchase → Auto-deliver report → Email with Calendly link
- 45-min call within 5 days of report delivery
- Call framework:
  - Discuss findings (15 min)
  - Answer questions (15 min)
  - Gauge interest (10 min)
  - If interested: "I'll send a detailed proposal by Friday"
  - If not ready: "When should I follow up?" (nurture)
- Proposal includes audit as Appendix A
- Close deal within 30 days of audit delivery (target)

### Phase 3: Public Launch (Weeks 9-16)

**Goal:** 15 paid audits, 10 projects won, establish market presence

**New Channels:**
1. **Content marketing:**
   - Blog post: "The Hidden Costs of Website Migrations (And How to Avoid Them)"
   - LinkedIn posts showcasing anonymized audit insights
   - Case study: Beta client before/after

2. **Paid advertising:**
   - **Google Ads:** "website migration services", "next.js agency", "cms migration planning"
   - **LinkedIn Ads:** Target job titles (CTO, VP Engineering, Marketing Director) at companies 100-1000 employees

3. **Partnerships:**
   - Sanity (cross-promotion in their partner directory)
   - Vercel (showcase on their agency partners page)
   - WordPress plugin developers (target sites ready to migrate)

4. **Webinar:**
   - "How to Plan a Risk-Free Website Migration"
   - 30-min presentation + 15-min Q&A
   - Offer: Free 10-page audit for attendees (upsell to full audit)

5. **Outbound sales:**
   - SDR/BDR dedicated to audit sales
   - Target: 50 qualified conversations/month
   - Close rate: 10% (5 audits/month from outbound)

**Landing Page (Enhanced):**
- Add social proof (logos of companies analyzed)
- Add "How It Works" section (3 steps with icons)
- Add comparison table: "DIY Manual Audit vs AI Audit"
- Add live chat (qualify leads, answer questions)
- Add exit-intent popup (discount code for newsletter subscribers)

### Phase 4: Scale (Month 5+)

**Goal:** 10+ audits/month, 80% conversion, productize further

**Scale Tactics:**
1. **Self-serve tier:**
   - $299/month SaaS subscription
   - Unlimited audits (target agencies and consultancies who need ongoing audits)
   - No human review, fully automated
   - DIY report interpretation

2. **Enterprise annual contracts:**
   - $50k-100k/year for companies with multiple brands
   - Unlimited audits across all properties
   - Quarterly migration planning workshops
   - Priority support

3. **Platform integrations:**
   - Sanity Studio plugin ("Audit your existing site before migration")
   - Vercel marketplace listing
   - WordPress plugin ("Ready to migrate? Get audit")

4. **Content flywheel:**
   - Monthly "State of Website Migrations" report (aggregate anonymized data)
   - Industry-specific migration guides
   - Video content (YouTube shorts showing audit process)

5. **Partner channel:**
   - Co-selling with Sanity sales team
   - Referral program for development agencies (20% commission)
   - Integration with RFP platforms (attach audit to proposals)

***

## Pricing Strategy

### Launch Pricing

**Standard Tier: $2,500**
- Websites up to 500 pages
- 3 business day delivery
- Full AI-powered analysis (all features)
- Comprehensive PDF report (60-80 pages)
- 45-minute walkthrough call
- Email support during review

**Enterprise Tier: $4,500**
- Websites 500-2,000 pages
- 5 business day delivery
- Full AI-powered analysis + deeper customization
- Comprehensive PDF report (80-120 pages)
- Optional Google Analytics integration
- 60-minute strategy call
- Priority support

**Rationale:**
- $2,500 is 5-10% of typical project value ($50k-150k)
- Impulse purchase range for VP-level buyers (no board approval needed)
- High enough to filter tire-kickers
- Low enough to be no-regret purchase
- 44% gross margin after COGS ($1,100 profit per audit)

### Future Pricing (Post-Launch)

**Tiered SaaS Model:**
- **Starter:** $199/month - 5 audits/month, automated only
- **Professional:** $499/month - 15 audits/month, automated + email support
- **Agency:** $1,499/month - unlimited audits, white-label reports, API access

**Add-Ons (À La Carte):**
- **GA/GSC integration:** +$500 (includes traffic data and ranking analysis)
- **Competitor benchmark:** +$1,000 (analyze 2-3 competitor sites for comparison)
- **Content strategy workshop:** +$2,500 (4-hour session to plan content migration)
- **Sanity schema generation:** +$1,500 (production-ready schema files, not just recommendations)
- **Priority 24-hour delivery:** +$1,000 (rush fee)

**Enterprise Licensing:**
- **Annual Contract:** $50k-100k/year
  - Unlimited audits across all properties
  - Dedicated success manager
  - Quarterly strategy workshops
  - Custom integrations
  - White-label option
  - API access

***

## Development Roadmap

### Week 1-2: Foundation & Infrastructure
**Milestone: Can crawl a single URL and store data**

- [ ] Next.js 16 project setup (App Router, TypeScript, Tailwind v4)
- [ ] PostgreSQL database provisioning (Vercel Postgres or Supabase)
- [ ] Install pgvector extension
- [ ] Create database schema (all tables)
- [ ] Basic authentication (team login for dashboard)
- [ ] Crawler service setup (Node.js + Playwright)
- [ ] Deploy crawler to Railway or Fly.io
- [ ] Test: Crawl single page, store HTML in DB

### Week 3-4: Multi-Page Crawler
**Milestone: Can crawl 100-page site in <5 minutes**

- [ ] Job queue implementation (BullMQ + Upstash Redis)
- [ ] Multi-page crawling with queue
- [ ] Parallel crawling (5 concurrent pages)
- [ ] Respect robots.txt
- [ ] Link discovery and following
- [ ] Screenshot generation (Playwright)
- [ ] HTML snapshot storage (Vercel Blob or S3)
- [ ] Error handling and retry logic
- [ ] Dashboard UI: Start audit form
- [ ] Dashboard UI: Crawl progress (real-time updates via polling or SSE)
- [ ] Test: Crawl 100-page site successfully

### Week 5-6: AI Analysis - Core Features
**Milestone: Can classify templates and detect components**

- [ ] OpenAI API integration (text-embedding-3-small)
- [ ] Generate embeddings for all pages
- [ ] Store embeddings in pgvector
- [ ] Anthropic API integration (Claude 3.5 Sonnet)
- [ ] Template classification (LLM + clustering)
- [ ] Component detection (Claude Vision + screenshots)
- [ ] Content quality scoring
- [ ] Duplicate detection (embedding similarity)
- [ ] Dashboard UI: View analysis results
- [ ] Test: Analyze 100-page site, validate template accuracy

### Week 7-8: AI Analysis - Advanced Features
**Milestone: Can generate complete migration recommendations**

- [ ] URL structure analysis
- [ ] Broken link detection
- [ ] Sitemap generation (visual with React Flow)
- [ ] Migration complexity estimation
- [ ] Business case generation (LLM prompt)
- [ ] Technical recommendations (LLM prompt)
- [ ] Content tier assignment
- [ ] Test: Full analysis on 3 different site types

### Week 9-10: Report Generation
**Milestone: Can generate beautiful PDF report**

- [ ] Report UI components (all 10 sections)
- [ ] Data visualization (Recharts for charts)
- [ ] Interactive sitemap visualization
- [ ] Report editing interface (for human review)
- [ ] PDF generation (Puppeteer)
- [ ] Shareable report links (public or password-protected)
- [ ] Report analytics tracking (PostHog)
- [ ] Test: Generate report for 3 beta clients

### Week 11-12: Polish, Launch Prep, Beta Testing
**Milestone: 5 beta clients complete, ready for paid launch**

- [ ] Landing page (audit sales page)
- [ ] Stripe payment integration
- [ ] Email notifications (Resend)
  - Payment confirmation
  - Crawl started
  - Report ready
  - Follow-up sequences
- [ ] Dashboard refinements (UI polish)
- [ ] Report template refinements (based on beta feedback)
- [ ] Error monitoring (Sentry)
- [ ] Performance optimization
- [ ] Beta testing with 5 friendly clients
- [ ] Collect feedback and iterate
- [ ] Bug fixes
- [ ] Documentation (internal team playbook)
- [ ] Launch preparation checklist

### Week 13-14: Soft Launch
**Milestone: First 5 paid audits**

- [ ] Public landing page live
- [ ] Payment processing active
- [ ] Email campaigns to warm leads
- [ ] LinkedIn outreach to prospects
- [ ] First 5 paid audits delivered
- [ ] Customer feedback collection
- [ ] Iterate based on real customer feedback

### Week 15-16: Scale & Optimize
**Milestone: 10+ audits completed, conversion rate >60%**

- [ ] Optimize AI prompts based on review time data
- [ ] Performance improvements (faster crawling/analysis)
- [ ] Add analytics dashboard (internal metrics)
- [ ] Content marketing (first blog post live)
- [ ] Case study from beta client
- [ ] Paid ads launch (Google + LinkedIn)
- [ ] Referral program setup
- [ ] Monitor conversion funnel and optimize

***

## Open Questions & Risks

### Open Questions (Need Decisions)

1. **Google Analytics Integration - MVP or V2?**
   - **Pro:** Traffic data makes prioritization more accurate (business value)
   - **Con:** Adds complexity (OAuth flow, API integration, data processing)
   - **Recommendation:** Save for V2. Launch faster without it, add as $500 upsell after validation.

2. **Competitor Analysis - Include or Separate Product?**
   - **Question:** Should we analyze 2-3 competitor sites automatically?
   - **Recommendation:** No for MVP. Offer as $1,000 add-on later (requires more crawling).

3. **Real-Time vs Async Report Delivery?**
   - **Question:** Should client wait 30-45 min for report, or receive later?
   - **Recommendation:** Async with 3-day SLA. Sets better expectations, allows human review.

4. **White-Label Option - When?**
   - **Question:** Should we offer white-label from day 1 for agencies?
   - **Recommendation:** No. Agencies are competitors. Focus on direct-to-enterprise for first 12 months.

5. **Freemium Tier?**
   - **Question:** Should we offer free tier (10 pages analyzed)?
   - **Recommendation:** Not for MVP. Paid-only to validate willingness to pay. Consider freemium in Phase 4.

6. **Sanity Schema Auto-Generation?**
   - **Question:** Should MVP generate production-ready Sanity schema files?
   - **Recommendation:** No. High-level recommendations only. Full schema generation is separate product (Priority #2: Sanity Schema Architect - build after validation).

### Risks & Mitigation Strategies

**Risk 1: Crawler gets blocked by anti-bot systems**
- **Likelihood:** Medium (15-20% of sites have bot protection)
- **Impact:** High (can't deliver audit)
- **Mitigation:**
  - User-agent rotation and viewport emulation (basic)
  - Add proxy rotation if needed (Bright Data ~$0.01/page)
  - Offer manual fallback: client provides sitemap.xml or admin access
  - Communicate upfront: "Some sites with aggressive bot protection may require admin access"

**Risk 2: AI analysis is inaccurate, requires excessive human review**
- **Likelihood:** Medium (AI is improving but not perfect)
- **Impact:** High (eats into margins, hard to scale)
- **Mitigation:**
  - Track accuracy metrics during beta (template classification, component detection)
  - Iterate on prompts to improve accuracy (target: >80% accuracy → <60 min review time)
  - Budget 90 minutes human review per audit (acceptable)
  - Document common edge cases and build rule-based fallbacks
  - If accuracy <70%, consider hybrid approach (AI + human from start)

**Risk 3: Clients don't see value in report, low conversion rate**
- **Likelihood:** Low-Medium (beta validates value, but paid clients different)
- **Impact:** Critical (business model fails)
- **Mitigation:**
  - Validate with 5 beta clients before paid launch (would they pay $2,500?)
  - Include 45-min walkthrough call (human touch increases perceived value)
  - Collect feedback immediately after delivery (NPS survey)
  - If conversion <50% after 10 audits, iterate on report format or pricing
  - Consider money-back guarantee (if no proposal request within 30 days)

**Risk 4: Development takes longer than 16 weeks**
- **Likelihood:** Medium-High (AI projects often have unexpected challenges)
- **Impact:** Medium (delays revenue, opportunity cost)
- **Mitigation:**
  - Timebox features ruthlessly (cut nice-to-haves if behind schedule)
  - Weekly sprint reviews with clear go/no-go decisions
  - Prioritization framework: Must-have (70%), Should-have (20%), Nice-to-have (10%)
  - If Week 10 and not on track → cut features: interactive sitemap → static image, advanced component detection → basic list
  - Set hard launch date (Week 13) and work backwards

**Risk 5: Operational overhead (human review) prevents scale**
- **Likelihood:** Medium (manual review is part of process)
- **Impact:** High (limits growth to ~20 audits/month with 1 person)
- **Mitigation:**
  - Track review time per audit religiously (target: <90 min average)
  - Identify and automate most time-consuming review tasks
  - Create review templates and checklists (faster, more consistent)
  - Hire and train second reviewer at 10 audits/month
  - Goal: 2 people can handle 40 audits/month by Month 6

**Risk 6: Competitors copy the idea quickly**
- **Likelihood:** Medium (idea is not rocket science, but execution is)
- **Impact:** Medium (market gets crowded, pricing pressure)
- **Mitigation:**
  - Speed to market (launch in 16 weeks, not 6 months)
  - Build brand association (Pagepro = replatforming experts)
  - Focus on quality (best reports in market, not just fastest)
  - Build moat through customer success (70%+ conversion creates word-of-mouth)
  - Continuous improvement (ship V2 features while competitors launch V1)
  - Consider exclusive partnership with Sanity (co-marketing)

**Risk 7: AI API costs spike, erode margins**
- **Likelihood:** Low (costs are predictable, capped per audit)
- **Impact:** Medium (could make product unprofitable)
- **Mitigation:**
  - Monitor costs per audit closely (target: <$15)
  - Optimize prompts for efficiency (shorter prompts, fewer calls)
  - Use cheaper models where possible (Claude Haiku for simple classification)
  - Implement caching (don't re-analyze same pages)
  - Build in pricing buffer (40% gross margin accounts for cost increases)
  - If costs exceed $25/audit, raise prices or optimize

***

## Success Looks Like...

**3 Months After Launch (End of Q2 2026):**
- ✅ 15 paid audits completed ($37.5k revenue)
- ✅ 10 audits converted to replatforming projects ($750k pipeline)
- ✅ 90%+ client satisfaction (NPS >50)
- ✅ Internal discovery time: 12 hours → 2 hours (83% reduction)
- ✅ Average deal size from audit leads: $75k-100k
- ✅ Team capacity: 1 person can handle 10 audits/month

**6 Months After Launch (End of Q3 2026):**
- ✅ 40 paid audits completed ($100k audit revenue)
- ✅ 28 audits converted to projects (70% conversion, $2.1M pipeline)
- ✅ Audit is standard part of Pagepro sales process (100% of proposals include prior audit)
- ✅ 2-3 detailed case studies published
- ✅ Team of 2 people handling 20 audits/month
- ✅ Payback period on $50k project: audit cost recovered in first milestone

**12 Months After Launch (Q1 2027):**
- ✅ 120 audits completed ($300k audit revenue)
- ✅ 85 projects won from audits (71% conversion, $6.4M total revenue)
- ✅ Self-serve tier launched ($299/month, 10 enterprise customers = $36k ARR)
- ✅ Featured in Sanity partner showcase
- ✅ Recognized product in market ("Pagepro Audit" becomes noun)
- ✅ Considering spinning off as separate SaaS product
- ✅ Inbound leads: 30% mention audit as reason for contacting Pagepro

**18 Months After Launch (Q3 2027):**
- ✅ 250+ audits completed
- ✅ Product is profitable standalone business unit
- ✅ Enterprise annual contracts: 5 clients at $50k-75k/year
- ✅ Expanded to other agency partners (white-label licensing reconsidered)
- ✅ V2 features: GA integration, competitor analysis, automated Sanity schema generation
- ✅ Team of 3-4 people, fully systematized

***

## Appendix A: Sample Report Outline

**Cover Page**
- Client logo + website URL
- "Website Migration Discovery Audit"
- Prepared for: [Client Name]
- Report Date: [Date]
- Prepared by: Pagepro
- Pagepro logo

**Table of Contents** (with page numbers)

**Section 1: Executive Summary** (1 page)
- Site Overview Statistics
  - Total pages analyzed: 487
  - Unique templates identified: 17
  - Content volume: 145,000 words, 2,300 images
  - Current platform: WordPress
- Migration Complexity: Moderate (6/10)
- Timeline Estimate: 12-14 weeks
- Investment Range: $110k-$135k
- Key Findings (3-4 bullets)
- Strategic Recommendations (3-4 bullets)

**Section 2: Business Case** (2 pages)
- Current State Costs & Pain Points
  - Performance issues impacting conversion
  - High development costs for content updates ($X/month)
  - SEO declining (Y% traffic loss over 12 months)
  - Competitive disadvantage
- Future State Benefits with Next.js 16 + Sanity
  - 3x faster page load times (Core Web Vitals improvement)
  - Marketing autonomy (publish content without dev team)
  - 60% lower ongoing maintenance costs
  - Improved SEO potential
- Investment vs ROI Analysis
  - One-time investment: $110k-135k
  - Annual savings: $40k-50k (dev time + hosting + maintenance)
  - Break-even: 24-30 months
  - 3-year ROI: 45-65%

**Section 3: Template Inventory** (3 pages)
- Visual Grid of 17 Templates
  - Each template: screenshot, page count, complexity score
- Template Breakdown Table
  - Template name, page count, development effort
- Variations & Edge Cases
  - Where templates differ (noted for scoping)

**Section 4: Site Architecture** (2 pages)
- Visual Sitemap (interactive in web version, static in PDF)
- URL Structure Analysis
  - Current patterns
  - Recommended Next.js 16 App Router structure
  - Example routes
- Content Organization for Sanity
  - Recommended document types
  - Content relationships

**Section 5: Component Library** (3 pages)
- Identified Components (23 total)
  - Each component: type, screenshot, frequency, complexity
- Reusability Analysis
  - "23 components can build 95% of future pages"
- Next.js 16 Recommendations
  - Which should be Server Components
  - Which need Client Components
  - Suggested component hierarchy

**Section 6: Content Audit & Strategy** (3 pages)
- Migration Priority Tiers
  - Tier 1 (Must Migrate): 245 pages (50%)
  - Tier 2 (Improve): 147 pages (30%)
  - Tier 3 (Consolidate): 63 pages (13%)
  - Tier 4 (Archive): 32 pages (7%)
- Detailed Breakdown (table with examples)
- Content Quality Issues
  - Duplicate content (23 instances)
  - Thin content (18 pages <300 words)
  - Broken links (47 internal, 12 external)
  - Missing metadata (89 pages)
- Cost Impact
  - "Migrating only Tiers 1+2 saves $28k and 4 weeks"

**Section 7: SEO Preservation Plan** (2 pages)
- Critical Pages (top 20 by traffic/value)
- Redirect Strategy Overview
  - 301 redirects for all migrated pages
  - Handling of archived content
- Metadata Preservation
  - Current metadata patterns
  - Recommendations for Sanity schema
- Schema Markup Opportunities
  - Currently missing, should add

**Section 8: Technical Recommendations** (3 pages)
- Sanity Content Model (High-Level)
  - Recommended document types
  - Field suggestions
  - References and relationships
- Third-Party Integrations
  - Preserve: Google Analytics, HubSpot, Intercom
  - Modernize: Form handler, email marketing
  - Remove: Legacy plugins (list)
- Performance Optimization
  - Next.js 16 advantages for this site
  - Image optimization opportunities (2,300 images)
  - Caching strategy
- Security & Accessibility
  - Accessibility issues found (WCAG violations)
  - Security best practices for new site

**Section 9: Migration Roadmap** (2 pages)
- Phase-by-Phase Plan
  - Phase 1: Discovery & Planning (2 weeks)
  - Phase 2: Design & Prototyping (3 weeks)
  - Phase 3: Development (7 weeks)
  - Phase 4: Content Migration (3 weeks)
  - Phase 5: Testing & QA (2 weeks)
  - Phase 6: Launch & Optimization (1 week)
- Gantt Chart or Timeline Visualization
- Parallel Workstreams (what can happen simultaneously)
- Critical Path Items

**Section 10: Investment Summary** (2 pages)
- Effort Breakdown by Phase
  - Discovery: 80 hours
  - Design: 120 hours
  - Development: 280 hours
  - Content: 120 hours
  - Testing: 80 hours
  - Total: 680-750 hours
- Cost Breakdown
  - Design: $X
  - Development: $Y
  - Content Migration: $Z
  - Project Management: $A
  - Total: $110k-135k
- Comparison Table
  - Migrate Everything: $135k, 18 weeks
  - Smart Migration (Recommended): $110k, 14 weeks
  - Savings: $25k, 4 weeks
- Payment Milestones
  - Deposit (30%): $33k
  - Design Complete (20%): $22k
  - Development Milestone (30%): $33k
  - Launch (20%): $22k

**Section 11: Next Steps** (1 page)
- Immediate Actions for Client
  1. Review this report with stakeholders
  2. Identify questions for walkthrough call
  3. Confirm budget and timeline alignment
  4. Provide GA/GSC access (if willing)
- Pagepro Next Steps
  1. Schedule 45-minute walkthrough call
  2. Answer questions and refine recommendations
  3. Provide detailed proposal (if interested)
  4. Begin discovery phase (if approved)
- Timeline to Decision
  - Recommended: Decision within 2-4 weeks
  - Proposed project start: [Date]
- How to Get Started
  - Contact: [Name, Email, Phone]
  - Calendar link for walkthrough call

**Appendix: Methodology** (1 page)
- How This Audit Was Conducted
  - AI-powered crawling and analysis
  - Human expert review and validation
  - Industry best practices applied
- Tools & Technologies Used
- Limitations & Assumptions

***

## Appendix B: Technical Implementation Notes

### Next.js 16 Specific Features to Leverage

**App Router Patterns:**
- Server Components by default (faster page loads, less JS)
- Streaming with Suspense (progressive report loading)
- Server Actions for form submissions (payment, audit intake)
- Parallel routes for dashboard multi-panel views
- Route groups for organizing dashboard vs public pages

**Performance:**
- Automatic image optimization (report screenshots, client logos)
- Font optimization (next/font with local fonts)
- Metadata API for SEO (dynamic meta tags per report)
- Built-in analytics (track Core Web Vitals for dashboard)

**Data Fetching:**
- Server Components fetch data at request time (no client-side loading states)
- Unstable_cache for caching AI responses (reduce API costs)
- React Suspense for incremental loading (crawl progress updates)

**Deployment:**
- Vercel Edge Functions for API routes (low latency)
- Incremental Static Regeneration for public report pages (fast CDN delivery)
- Environment variables for API keys (secure)

### Database Indexing Strategy

**Critical Indexes:**
```sql
-- Fast project lookups
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_report_share_id ON projects(report_share_id);

-- Fast page queries
CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_pages_template_id ON pages(template_id);
CREATE INDEX idx_pages_content_tier ON pages(content_tier);
CREATE INDEX idx_pages_url ON pages(url); -- for duplicate detection

-- Fast link queries
CREATE INDEX idx_links_project_id ON links(project_id);
CREATE INDEX idx_links_source_page_id ON links(source_page_id);
CREATE INDEX idx_links_is_broken ON links(is_broken);

-- Fast embedding similarity search (pgvector)
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops);
```

### Cost Estimates

**Per Audit (1,000 pages):**
- OpenAI embeddings: 1,000 pages × 500 tokens avg × $0.02/1M tokens = $0.01
- Claude API calls: 1,000 pages × 1 classification call × $0.003 = $3.00
- Claude Vision: 100 screenshots × 1 component detection call × $0.04 = $4.00
- Vercel Blob storage: 1,000 HTML files × 50KB × $0.15/GB = $0.75
- Screenshot storage: 1,000 screenshots × 200KB × $0.15/GB = $3.00
- Total AI + Storage: **~$11/audit**
- Buffer for retries/errors: **$15/audit**
- Target COGS: **<$25/audit** (includes infrastructure overhead)

**Monthly Infrastructure (20 audits/month):**
- Vercel Pro: $20/month
- Upstash Redis: $10/month
- Railway (crawler): $20/month
- Vercel Postgres or Supabase: $25/month
- Total: **~$75/month base** + variable costs ($300 for 20 audits)

**Gross Margin:**
- Revenue per audit: $2,500
- COGS per audit: $25
- Gross profit: $2,475
- **Gross margin: 99%** (not accounting for human review time)
- Human review time: 1.5 hours × $100/hr = $150
- Net profit per audit: $2,325
- **Net margin: 93%**

***

## Next Steps to Begin Development

**Immediate Actions (This Week):**
1. ✅ **Stakeholder sign-off:** Review this PRD with Pagepro leadership
2. 📋 **Resource allocation:** Assign 1-2 senior developers for 16 weeks (full-time or 70%+ capacity)
3. 🔑 **API key setup:**
   - Anthropic API account (Claude 3.5 Sonnet)
   - OpenAI API account (embeddings)
   - Stripe account for payments
4. 🏗️ **Infrastructure setup:**
   - Provision Vercel Pro account
   - Set up Vercel Postgres or Supabase
   - Railway or Fly.io account for crawler service
   - Upstash Redis for job queue
5. 👥 **Beta client recruitment:** Reach out to 5-7 prospects, confirm participation
6. 📅 **Sprint planning:** Week 1 kickoff meeting, define first 2-week sprint

**Dependencies:**
- Anthropic API key + credits
- OpenAI API key + credits  
- Stripe Connect setup
- Domain for report hosting (e.g., audit.pagepro.com)
- GitHub repo + project board
- Figma designs for dashboard and report (or use Shadcn/ui defaults)

**Budget Allocation:**
- **Development:** 2 devs × 16 weeks (internal cost, prioritize over other projects)
- **AI APIs:** $500 initial credits (covers 30-40 audits for testing)
- **Infrastructure:** $200/month × 4 months = $800
- **Design:** 40 hours for landing page + report template (internal or freelance)
- **Total:** Mostly internal labor cost + ~$2,000 external costs

**Success Criteria for Week 4 Review:**
- ✅ Can crawl 100-page site successfully
- ✅ Data stored in database correctly
- ✅ Dashboard shows crawl progress in real-time
- ✅ No major technical blockers identified
- ✅ Team velocity is on track for 16-week timeline

***

**Document Status:** ✅ Ready for Development Kickoff  
**Next Review:** Week 4 (mid-sprint checkpoint), Week 8 (halfway review), Week 12 (pre-launch review)

**Questions or Need Clarification?** Contact: [Your Name/Email]

Sources
