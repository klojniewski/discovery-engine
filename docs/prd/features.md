# Core Features & Requirements

## 1. Website Crawler & Data Collection *[CHANGED -- uses Firecrawl API]*

> **Note:** The original spec described Playwright + headless Chrome. The actual implementation uses **Firecrawl API** (managed crawling service). Functional requirements below still describe what data is collected, but the technical approach is different.

**Functional Requirements:**
- Input: Single website URL
- Crawl depth: Configurable (default: 5 levels, max: 10 levels)
- Page limit: 500 pages default (configurable up to 2,000)
- Respect robots.txt and crawl-delay directives
- Handle JavaScript-rendered content (SPA support)
- Extract from each page:
  - Full HTML source
  - Rendered DOM structure
  - All assets (images, videos, PDFs, fonts, scripts)
  - Metadata (title, description, Open Graph, schema.org)
  - All internal and external links
  - Page load performance metrics (Core Web Vitals)

**Non-Functional Requirements:**
- Handle dynamic content loading (infinite scroll, lazy loading)
- Timeout handling (skip pages that take >30s to load)
- Error recovery (retry failed pages 2x before skipping)
- Progress tracking (real-time crawl status updates)

---

## 2. AI-Powered Template Detection *[CHANGED]*

> **Note:** The original spec described CLIP embeddings, pgvector, K-means clustering, and 14 fixed template types. None of that was built. The actual implementation uses URL-prefix grouping + AI naming, described below.

**Actual Implementation (URL-Prefix Classification):**

1. **URL-prefix grouping** (deterministic, no AI) -- Group pages by first path segment. Groups with 3+ pages qualify as templates. E.g., all `/blog/*` pages -> one group.
2. **Listing/detail split** (deterministic) -- Extract index pages (pathname === prefix) into their own groups. E.g., `/press-releases` listing separated from `/press-releases/slug` detail pages.
3. **AI template naming** (1 Haiku call per <=50 groups) -- AI names and describes each group dynamically. No fixed enum.
4. **Singleton classification** (batches of 10) -- Ungrouped pages classified individually with free-form types + merge pass for consistency.
5. **Content tier scoring** (separate pass, batches of 10) -- `must_migrate`, `improve`, `archive`. Duplicates auto-assigned `consolidate`.

**Naming Convention (enforced via AI prompts):**
- Listing templates: end with "Index" (e.g., "Blog Index", "Events Index")
- Detail templates: content-specific noun, never "Page" (e.g., "Blog Post", "Customer Story", "Legal Document")
- Singleton templates: end with "Page" (e.g., "About Page", "Contact Page")

**Output:**
- Visual grid showing template clusters with representative screenshots
- Confidence score per cluster (high/medium/low)
- URL pattern displayed on each template card
- Click page count badge to see all pages in a template
- Inline rename for template display names
- Re-classify templates without re-scoring content tiers

**Technical Details:**
- Classification service: `src/services/classification.ts`
- Orchestration: `src/actions/analysis.ts`
- 56 unit tests covering grouping, splitting, and edge cases
- Cost: ~$0.01 for group naming + ~$0.10-0.50 for singletons + ~$2-5 for tier scoring (1000 pages)

---

## 3. Page Architecture Mapping

- Interactive visual sitemap (collapsible tree view)
- URL hierarchy and navigation depth
- Orphan pages, duplicates, thin pages flagged
- Color-coded by template type
- Built with React Flow

---

## 4. Component & Section Inventory

- Claude Sonnet with vision analyzes representative page screenshots
- 64 section types with SVG wireframes in taxonomy
- Sections stored in `pages.detected_sections` JSONB
- Section types defined in `section_types` table

---

## 5. URL Structure & Routing Analysis

- URL pattern summary with examples
- Recommended Next.js 16 routing structure (App Router)
- Migration mapping table (old URL -> new URL pattern)
- Redirect strategy (301 permanent redirects for SEO preservation)

---

## 6. Content Quality Scoring

**Tiers:**
- **Must Migrate** -- High-value pages critical to business
- **Improve** -- Worth keeping but need work
- **Consolidate** -- Duplicates (same content hash, auto-assigned)
- **Archive** -- Low-value pages to drop or redirect

**Technical Details:**
- Duplicate detection via content hash (MD5 of page markdown), not embeddings
- Content tier scoring via Claude Haiku in batches of 10
- Duplicates auto-assigned `consolidate` tier without AI calls
- Post-enrichment tier correction: archive pages with traffic >= 50 or RDs >= 5 upgraded to consolidate

---

## 7. Migration Complexity Estimation

- Complexity Score: Simple (1-3), Moderate (4-6), Complex (7-10)
- Based on: unique templates, complex components, third-party integrations, content volume, legacy CMS complexity
- Risk flags: High/Medium/Low with specific indicators

---

## 8. Report Generation

**Report sections (6 live, 3 MVP-critical deferred):**
1. Executive Summary -- with traffic value headline *[BUILT]*
2. Template Inventory *[BUILT]*
3. Section Inventory (64 section types with SVG wireframes) *[BUILT]*
4. Site Architecture (tree view) *[BUILT]*
5. Content Audit (tier breakdown) *[BUILT]*
6. SEO Baseline (redirect-critical pages, on-page debt) *[BUILT]*
7. Technical Recommendations **MVP-CRITICAL** *[DEFERRED]*
8. Investment Summary **MVP-CRITICAL** *[DEFERRED]*
9. Next Steps **MVP-CRITICAL** *[DEFERRED]*

**Technical Requirements:**
- React + Tailwind for report UI
- Recharts for data visualizations
- Shareable link (password-protected or public)
- PDF: Cmd+P for now, proper PDF generation deferred
