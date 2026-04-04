# Technical Architecture

> **Note:** This section describes what was actually built. The original planned architecture (Playwright, pgvector, BullMQ, Railway) was replaced entirely.
>
> | Planned | Built |
> |---------|-------|
> | Playwright + Railway/Fly.io | Firecrawl API (managed crawling) |
> | BullMQ + Upstash Redis | Inngest (serverless durable functions) |
> | Vercel Postgres + pgvector | Supabase PostgreSQL + Drizzle ORM |
> | OpenAI embeddings + GPT-4o fallback | Claude Haiku (classification) + Claude Sonnet (vision) |
> | `components` + `links` + `embeddings` tables | `section_types` table + `pages.detected_sections` JSONB |
> | Stripe, Resend, PostHog | Deferred |

## Stack

**Frontend:**
- **Next.js 16** (App Router, React 19)
- TypeScript (strict mode)
- Tailwind CSS v4
- Shadcn/ui components
- Recharts for data visualization
- React Flow for sitemap visualization

**Backend:**
- Next.js 16 Server Actions for mutations
- Vercel deployment (Pro plan)
- Supabase PostgreSQL + Drizzle ORM
- Supabase Auth + Blob storage

**Crawler:** Firecrawl API (managed)

**AI Services:**
- **Classification:** Claude Haiku -- URL-prefix group naming, singleton classification, content tier scoring
- **Vision:** Claude Sonnet -- section detection from screenshots
- No embeddings, no pgvector, no OpenAI -- all AI through Anthropic API

**Background Jobs:** Inngest (serverless durable functions)

## Pipeline

```
1. User creates project -> Enter URL + settings -> status: 'created'
2. Crawl via Firecrawl API -> Pages stored in DB -> status: 'crawled'
3. Phase A -- Classify & Score (no screenshots needed):
   a. URL-prefix grouping (instant, deterministic)
   b. Listing/detail split (instant, deterministic)
   c. AI template naming (1 Haiku call per <=50 groups)
   d. Singleton classification (batches of 10)
   e. Singleton name merge (1 Haiku call)
   f. Duplicate detection (content hash, instant)
   g. Content tier scoring (batches of 10, non-duplicates only)
   h. Save results -> status: 'classified'
4. Phase B -- Screenshots & Section Detection:
   a. Capture screenshots for representative pages only
   b. Claude Sonnet vision detects sections per screenshot
   c. status: 'reviewing'
5. SEO enrichment (optional, user-triggered):
   - On-page extraction, Ahrefs CSV import, PSI, CrUX
6. Report generation from stored data
```

## Infrastructure

- **Vercel:** Frontend hosting, serverless functions, deployment
- **Supabase:** PostgreSQL database + Auth + Blob storage
- **Inngest:** Serverless durable functions (background jobs)
- **Firecrawl API:** Managed crawling
- **Anthropic API:** Claude Haiku (classification) + Claude Sonnet (vision)
- **Sentry:** Error monitoring *[DEFERRED]*

## Database Schema (Actual)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'created', 'crawling', 'crawled', 'analyzing', 'classified', 'reviewing', 'analysis_failed'
  report_share_id VARCHAR(50) UNIQUE,
  report_password VARCHAR(100),
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  crawl_started_at TIMESTAMP WITH TIME ZONE,
  crawl_completed_at TIMESTAMP WITH TIME ZONE,
  analysis_completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,        -- AI-generated slug: 'blog-post', 'press-release'
  display_name VARCHAR(255),          -- AI-generated: 'Blog Post', 'Press Release'
  confidence VARCHAR(50),             -- 'high', 'medium', 'low'
  page_count INTEGER DEFAULT 0,
  representative_page_id UUID,
  description TEXT,
  complexity VARCHAR(50),
  url_pattern VARCHAR(255),           -- '/blog/*', '/press-releases', or NULL for singletons
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  word_count INTEGER,
  screenshot_url TEXT,
  raw_html TEXT,
  raw_markdown TEXT,
  content_hash VARCHAR(64),
  template_id UUID REFERENCES templates(id),
  content_tier VARCHAR(50),           -- 'must_migrate', 'improve', 'consolidate', 'archive'
  is_duplicate BOOLEAN DEFAULT FALSE,
  excluded BOOLEAN DEFAULT FALSE,
  detected_sections JSONB,
  -- SEO columns
  seo_score NUMERIC,
  organic_traffic INTEGER,
  referring_domains INTEGER,
  -- ... additional SEO/PSI columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE section_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  svg TEXT,                           -- SVG wireframe
  sort_order INTEGER DEFAULT 0
);
```

## AI Prompts

See `src/services/classification.ts` for full prompt text.

**1. Template Group Naming** (1 call per <=50 groups):
- Groups marked `[LISTING/INDEX PAGE]` -> displayName must end with "Index"
- Detail groups -> content-specific noun, never end with "Page"

**2. Singleton Classification** (batches of 10):
- displayName must end with "Page" (exception: "Homepage")

**3. Content Tier Scoring** (batches of 10):
- Returns `must_migrate`, `improve`, or `archive`
- `consolidate` assigned programmatically to duplicates (same content hash)

**4. Section Detection** (Claude Sonnet with vision):
- Analyzes representative page screenshots against 64 section types

## Cost Estimates

**Per Audit (1,000 pages):**
- Group naming: ~$0.01 (1 Haiku call)
- Singleton classification: ~$0.10-0.50
- Content tier scoring: ~$2-5
- Section detection: ~$5-10 (Sonnet vision on ~20 representative pages)
- Supabase storage: < $1
- **Total: ~$8-16/audit**

**Monthly Infrastructure (2 audits/month at current internal volume):**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Firecrawl: usage-based (~$5-10/audit)
- Inngest: free tier
- **Total: ~$45/month base**
