# Content Tier Scoring — Feature Review

## Objective

Content tier scoring answers the question: **"Which pages should we migrate, and which can we skip?"**

For a migration audit, this is the most commercially important feature. It directly determines:
- **Project scope** — must_migrate + improve pages define the migration size
- **Cost estimate** — fewer pages = lower price = faster delivery
- **SEO risk** — archiving a page with traffic causes real business damage
- **Sales credibility** — if the tier assignments look wrong, the entire report loses trust

The ideal distribution for a healthy 1,000+ page site is roughly:
- **Must Migrate (40-50%)** — pages that must exist on the new site
- **Improve (20-30%)** — pages worth keeping but need updates during migration
- **Consolidate (5-15%)** — duplicates or near-duplicates to merge
- **Archive (15-25%)** — pages to drop or redirect

## Current Implementation

### Pipeline

```
1. Duplicate detection (deterministic)
   - Pages with identical content hash → auto-assigned "consolidate"
   - No AI cost

2. AI tier scoring (Claude Haiku, batches of 10)
   - Sends per page: URL, title, meta description, word count, first 500 chars of markdown
   - Returns: must_migrate, improve, or archive (never consolidate — that's only for duplicates)

3. Post-scoring overrides
   - Listing/index pages → forced to must_migrate
   - Post-Ahrefs-enrichment: archive pages with traffic ≥ 50 or RDs ≥ 5 → upgraded to consolidate
```

### AI Prompt Guidelines

The prompt tells the AI:
- **must_migrate**: Homepage, key service/product pages, case studies, about pages, team pages, pricing. Blog posts with 500+ words. Legal pages (privacy, terms, cookies).
- **improve**: Thin landing pages, outdated content, pages with poor structure but potential value.
- **archive**: Empty/placeholder pages, outdated job postings, pagination pages, tag archives, very thin content (<50 words).

### What the AI Does NOT See

The AI makes tier decisions based only on content signals. It does not receive:
- Organic traffic (how many people visit this page from Google)
- Referring domains (how many external sites link to this page)
- SEO score
- Whether the page returns a 404
- Page age / last modified date
- Internal link count (how connected the page is)
- The page's position in the site hierarchy

## Evidence: Dremio Project (1,341 pages)

### Tier Distribution

| Tier | Count | % | Expected % | Verdict |
|---|---|---|---|---|
| must_migrate | 968 | 72% | 40-50% | **Too high** |
| improve | 147 | 11% | 20-30% | **Too low** |
| archive | 226 | 17% | 15-25% | OK |
| consolidate | 0 | 0% | 5-15% | **Missing** (no duplicate content hashes found) |

### Issue 1: must_migrate is a mega-bucket (72%)

The AI assigns `must_migrate` to almost everything with real content. The prompt says "blog posts with 500+ words = must_migrate" — and 586 of 968 must_migrate pages have 1,000+ words. This is technically correct per the prompt, but it defeats the purpose of tiering.

**Breakdown of 968 must_migrate pages by word count:**

| Word count | Count | Issue |
|---|---|---|
| 1,000+ | 586 | Correct — substantial content |
| 500-999 | 300 | Prompt says must_migrate, but many are thin awards, press releases |
| 300-499 | 59 | Debatable — some are thin landing pages |
| 100-299 | 22 | Should probably be improve |
| <100 | 1 | /get-started (93w, signup form) — debatable |

**By template type:**

| Template | must_migrate count | Issue |
|---|---|---|
| Blog Post | 546 | Every blog post with 500+ words = must_migrate. But not all blog posts are equal. |
| Press Release | 71 | Old press releases from 2019 with no traffic — are they really "must migrate"? |
| Gnarly Data Waves Article | 67 | Entire content series = must_migrate |
| Wiki Article | 61 | Every wiki definition = must_migrate |
| Customer Story | 29 | Correct |
| Resource | 27 | Correct |
| Legal Document | 21 | Correct (legally required) |

### Issue 2: 463 must_migrate pages have ZERO traffic and ZERO referring domains

Nearly half (48%) of must_migrate pages have no organic traffic and no backlinks. These pages have content (500+ words) but no SEO value. They're content that exists but nobody visits and nobody links to.

Examples: old press releases, dated blog posts about 2019 product releases, obscure wiki definitions.

Should these be `must_migrate`? Arguably no — they should be `improve` (migrate but refresh) or in some cases `archive` (the 2019 press release about a feature that no longer exists).

### Issue 3: 22 archive pages have 1,000+ words

The AI archived pages with substantial content because they're outdated:
- `/blog/announcing-the-dremio-august-2021-release` (2,646 words) — old product release
- `/blog/winter-olympics-blog-post` (1,805 words) — seasonal content
- `/blog/predictions-2021-five-big-data-trends` (1,622 words) — dated predictions
- `/blog/covid-19-english-football` (1,471 words) — irrelevant to Dremio's business

This is actually **correct** — the AI recognized these as dated/irrelevant content despite high word count. This is a strength, not a bug.

### Issue 4: 0 consolidate pages

Content hash matching found zero duplicates. On a 1,341-page site this is unusual. Possible reasons:
- Pages genuinely have unique content (each wiki article, blog post is different)
- The markdown extraction produces slightly different output for structurally identical pages (nav/footer differences, timestamps)
- Near-duplicates (90% similar) aren't caught by exact hash matching

### Issue 5: improve is underused (11%)

The AI's prompt gives `improve` a narrow definition: "thin landing pages, outdated content, poor structure." Most pages either have enough content for `must_migrate` or are clearly empty for `archive`. The middle ground (`improve`) is too small.

Pages that should be `improve` but are `must_migrate`:
- Press releases from 2019-2020 with no traffic — still have content, but need freshness review
- Wiki articles with <500 words — educational but thin
- Award pages — "We won the CRN 2019 award" is dated but not archivable

### Issue 6: No business value context in the scoring

The AI can't distinguish between:
- A blog post getting 500 organic visits/month (critical to protect)
- A blog post getting 0 visits (nice to have but not critical)

Both get `must_migrate` because both have 1,000+ words. The business value dimension is missing from the scoring decision.

## Root Causes

1. **The prompt equates "content length" with "business value"** — 500+ words = must_migrate is too simplistic. A 2,000-word blog post from 2019 with zero traffic is not as important as a 300-word pricing page with 200 monthly visits.

2. **No traffic/SEO data in the scoring prompt** — the AI only sees content, not performance. If it knew a page gets 0 traffic and 0 backlinks, it would score differently.

3. **Consolidate only catches exact duplicates** — content hash matching misses near-duplicates and structurally identical pages with minor text differences.

4. **The improve tier is poorly defined** — the prompt description is too narrow, making it a gap between must_migrate and archive that rarely gets used.

## Potential Improvements

### Option A: Feed SEO data into the tier scoring prompt
After Ahrefs enrichment, re-run tier scoring with traffic and RD data included. The AI can then weigh content quality + business value together. Downside: requires Ahrefs data to be uploaded first, adds a dependency.

### Option B: Post-scoring adjustment based on SEO signals
After tier scoring, apply deterministic rules:
- `must_migrate` + 0 traffic + 0 RDs + word count < 800 → downgrade to `improve`
- `must_migrate` + 0 traffic + 0 RDs + content older than 2 years → downgrade to `improve`
- `improve` + traffic ≥ 100 → upgrade to `must_migrate`
- `archive` + traffic ≥ 20 or RDs ≥ 3 → upgrade to `consolidate`

### Option C: Redefine the prompt tiers
- **must_migrate**: Only pages that are structurally critical (homepage, key landing pages, legal, active product pages) OR have proven SEO value
- **improve**: Default tier for most content pages — "migrate but review during migration"
- **archive**: Only clearly dead content (404s, empty pages, pagination, very thin)

This would shift the default from must_migrate to improve, producing a more useful distribution.

### Option D: Two-pass scoring
1. First pass: AI scores based on content (current approach)
2. Second pass: Adjust based on SEO data (post-Ahrefs enrichment)
   - This is partially implemented (the post-enrichment override) but only upgrades archive → consolidate

### Recommendation

**Option C + D combined.** Rewrite the prompt to make `improve` the default tier for content pages, and add a second scoring pass after Ahrefs enrichment that upgrades high-traffic pages and downgrades zero-traffic pages. This produces a more useful distribution without changing the architecture.
