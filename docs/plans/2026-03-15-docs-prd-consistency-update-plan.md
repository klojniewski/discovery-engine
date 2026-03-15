---
title: "docs: PRD consistency update — align with built product and 2026 goals"
type: docs
date: 2026-03-15
status: complete
---

# PRD Consistency Update

## Overview

The PRD was written as a speculative vision document for a paid SaaS targeting mid-market/enterprise companies. What was built is a lean internal tool for Pagepro's team targeting Digital Native SMBs (20-200 employees). Five specific inconsistencies need fixing to make the PRD useful as a living document rather than a source of confusion.

## Changes

### 1. Propagate ICP fix: "Digital Native SMBs, 20-200 employees"

Replace every instance of the old enterprise positioning throughout the entire document.

**Find → Replace:**

| Line(s) | Current | Replace With |
|---------|---------|--------------|
| 74 | "Mid-market and enterprise companies" | "Digital Native SMBs (20-200 employees)" |
| 82 | "$2,500-5,000 per project (feeds into $50k-150k replatforming contracts)" | "$2,500-5,000 per project (feeds into $30k-80k replatforming contracts)" |
| 84 | "Enterprise Annual License: $50k-100k/year for enterprise clients with multiple brands" | Remove entirely or mark [DEFERRED - Phase 4] |
| 99 | "For Clients (Mid-Market & Enterprise):" | "For Clients (Digital Native SMBs):" |
| 100 | "especially large enterprises with 500+ pages" | "especially growing companies with 200+ pages" |
| 127 | "Mid-market to enterprise, 20-200 employees, $25M-500M revenue" | "Digital Native SMBs, 20-200 employees, $2M-50M revenue" |
| 128 | "200-2,000 pages on legacy stack" | "50-2,000 pages on legacy stack" |
| 137 | "200-2,000 pages" | "50-2,000 pages" |
| 162 | "1,000 pages for MVP (expandable to 10,000 for enterprise)" | "500 pages default (configurable up to 2,000)" |
| 358-361 | Effort bands up to $250k-500k+ | Cap at "Large Migration: 500-2,000 pages, 10-15 templates → 12-20 weeks, $80k-150k" |
| 383 | "$120k-150k, 14-16 weeks" | "$60k-100k, 10-14 weeks" |
| 476 | "$2,500 (standard sites <500 pages) or $4,500 (enterprise 500-2000 pages)" | "$2,500 (standard audit, up to 500 pages)" |
| 536 | Enterprise tier delivery SLA | Remove enterprise tier reference |
| 619 | `tier VARCHAR(50) NOT NULL` | Remove — not in actual schema |
| 946 | Enterprise review time target | Remove enterprise reference |
| 990-994 | "enterprise clients", "20-200 employees" | "Digital Native SMB prospects", "20-200 employees" |
| 1029 | "$100k+ migration" | "$50k+ migration" |
| 1068 | "companies 20-200 employees" | "companies 20-200 employees" |
| 1103-1169 | Enterprise licensing section | Mark entirely as [DEFERRED - Phase 4] |
| 1310 | "Focus on direct-to-enterprise" | "Focus on Digital Native SMBs" |
| 1395-1428 | Revenue projections at enterprise scale | Rescale to SMB: 50-page audits, $30k-80k contracts |

### 2. Replace 16-week development roadmap with expanded "What's Left"

**Delete:** Lines 1179-1288 (the roadmap describing Playwright, pgvector, BullMQ, Railway, etc.)

**Replace with:**

```markdown
## Development Roadmap

### What's Been Built (Phases 1-4, ~90% complete)

- Core pipeline: Crawl → Classify & Score → Screenshot & Detect → Report
- 6 report sections live (Executive Summary, Templates, Sections, Architecture, Content Audit, SEO Baseline)
- SEO enrichment: Ahrefs CSV import, on-page extraction, PageSpeed Insights, Chrome UX Report
- Performance tab with CrUX real user data and PSI lab scores
- Public report sharing with optional password protection
- API cost tracking per project per step

### What's Left

#### Near-term (Weeks 1-2)
- [ ] Multi-site testing — WordPress blog, React SPA, large content site (500+ pages)
- [ ] Full end-to-end report testing — verify pagepro.co report works completely
- [ ] Production deployment — Vercel, env vars, custom domain, Supabase production, Sentry

#### Medium-term (Weeks 3-6)
- [ ] Report sections 7-9 — Technical Recommendations, Investment Summary, Next Steps (Claude Sonnet narrative generation)
- [ ] Organic Keywords CSV import (v2) — intent classification for redirect priority, especially local intent pages
- [ ] Post-enrichment tier override UI — show which pages were auto-corrected and why

#### Deferred (Post-Validation)
- [ ] PDF generation — currently Cmd+P, proper PDF when report format stabilises
- [ ] Stripe payments — deferred until business model validated with internal use
- [ ] Batch audit mode — paste URL list, run overnight, export enrichment CSV for Clay/Lemlist outbound
- [ ] CRM note generation — auto-generate Pipedrive CRM note from audit data
- [ ] Email notifications (Resend) — notify team when crawl/analysis completes
```

### 3. Add callout box to Technical Architecture section

**Insert at line 575** (before the Stack subsection):

```markdown
> **⚠️ Note:** The Technical Architecture section below describes the **original planned architecture** from the initial PRD. The actual built implementation differs significantly:
>
> | Planned | Built |
> |---------|-------|
> | Playwright + Railway/Fly.io | Firecrawl API (managed crawling) |
> | BullMQ + Upstash Redis | Inngest (serverless durable functions) |
> | Vercel Postgres + pgvector | Supabase PostgreSQL + Drizzle ORM |
> | OpenAI embeddings + GPT-4o fallback | Claude Haiku (classification) + Claude Sonnet (vision) |
> | `components` + `links` + `embeddings` tables | `section_types` table + `pages.detected_sections` JSONB |
> | Stripe, Resend, PostHog | Deferred |
>
> See **Current State** section at the top for the actual architecture.
```

### 4. Add "Phase 2 Vision" separator after Current State

**Insert after the Current State section's closing `***`:**

```markdown
---

# Phase 2 Vision (Post-Validation)

> **Everything below this line is aspirational.** These sections describe the original product vision written before development began. They are preserved as reference for future phases but do not reflect the current product. For current reality, see the **Current State** section above.

---
```

### 5. Rewrite Success Metrics to connect to 2026 goals

**Replace lines 112-119** (the current Success Criteria) with:

```markdown
### Success Criteria (2026)

**Primary metric:** Tool's contribution to Pagepro's 2026 business goals:
- **8 Nexity implementations** — each audit should directly inform a Nexity project scope
- **24 new business SQLs** — audits are the primary qualification tool for inbound and outbound leads

**Secondary metrics (operational):**
- Reduce internal discovery time from 12 hours → 30 minutes per audit
- Complete 24+ audits in 2026 (1 per SQL minimum)
- 90%+ of audits result in accurate scope estimates (no >20% overruns on resulting projects)

**Phase 2 metrics (post-validation, when paid audits launch):**
- Generate audit revenue ($2,500 per audit)
- Audit-to-contract conversion rate (target: 70%+)
- Pipeline generated from audits ($500k+ in first 6 months)
```

## Acceptance Criteria

- [x] No instance of "mid-market and enterprise" remains (search entire doc)
- [x] No employee range above 200 except where explicitly marked as Phase 4
- [x] No investment estimate above $150k for a single migration
- [x] 16-week roadmap replaced with expanded What's Left
- [x] Technical Architecture has callout box explaining divergence
- [x] Clear "Phase 2 Vision" separator exists after Current State
- [x] Success metrics reference 8 Nexity implementations and 24 SQLs
- [x] Document still reads coherently top-to-bottom

## References

- `docs/PRD.md` — the document being updated
- `CLAUDE.md` — actual tech stack reference
- `src/db/schema.ts` — actual database schema (6 tables, not 8)
- Repo research agent findings — line-by-line PRD analysis with 25+ specific locations
