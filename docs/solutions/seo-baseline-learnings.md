---
title: SEO Baseline Feature
category: feature
tags: [seo, ahrefs, crux, pagespeed, csv-parsing, performance]
module: seo
date: 2026-03-15
---

# SEO Baseline — Learnings

## Ahrefs CSV Parsing

- Ahrefs exports are **UTF-16LE** with BOM (`0xFF 0xFE`), tab-delimited, quoted fields — not standard CSV
- Check first 2 bytes for BOM before choosing decoder: `TextDecoder("utf-16le")` vs `TextDecoder("utf-8")`
- Auto-detect file type from headers: first column `"URL"` = Top Pages, first column `"Page title"` = Best by Links
- The third export type (Organic Keywords) isn't needed — traffic value from Ahrefs already encodes intent implicitly

## URL Matching

- Ahrefs URLs include both `http://` and `https://` — always normalize to HTTPS before matching
- Normalize: force HTTPS, strip query params + hash, remove trailing slash (except root), lowercase hostname
- The `normalizeUrl()` function lives in `src/lib/url.ts` and is shared by crawl storage and Ahrefs matching
- Best by Links exports include old subdomains (e.g., `blog.pagepro.co`, `romanroad.pagepro.co`) — low match rates (~57%) are expected and correct for subdomain-inclusive exports

## SEO Scoring

- Performance (PSI) is deliberately excluded from the SEO score — a page ranking well despite bad performance is MORE important to protect, not less
- **Original formula was double-counting:** traffic value (45%) + organic traffic (20%) = 65% on the same signal (traffic value IS traffic × CPC)
- **Fixed formula:** organic traffic 45% + referring domains 35% + on-page health score 20% (H1, canonical, meta robots, schema.org, internal links)
- Redirect-critical threshold: score >= 50, OR organic traffic >= 100/mo, OR referring domains >= 5
- **Post-enrichment tier correction:** after Ahrefs import, archive-tier pages with organic traffic >= 50 or referring domains >= 5 get upgraded to consolidate. Prevents classification (which runs without traffic data) from archiving important pages

## CrUX vs PageSpeed Insights

- CrUX = real user data aggregated at domain level. One API call, free, uses same `PAGESPEED_API_KEY`
- PSI = lab simulation per URL. Many calls, slow (~10s per page for mobile+desktop)
- CrUX origin data is much more reliable for SMB sites — individual pages often lack enough traffic for CrUX, but the origin almost always has data
- CrUX History API returns 25 weeks of weekly p75 values — great for showing performance trends
- Sites with very low Chrome traffic (<~1000 monthly sessions) return `NOT_ENOUGH_DATA` — handle gracefully

## PSI Page Selection

- Don't use `screenshotUrl` as selection criteria — screenshots may not have been captured
- Use template representative pages (`templates.representativePageId`), pad with top pages by internal link count up to 25
- The selection logic is in `selectRepresentativePages()` in `src/actions/seo.ts`

## UI Patterns

- **Hydration mismatch**: never use `toLocaleDateString()` in client components — server and client produce different formats. Use `.slice(0, 10)` or `Intl.DateTimeFormat` with explicit locale
- **Long-running operations**: use `useEffect` polling interval (2-3s) to check server-side progress, not just client state. Pass `initialProgress` from server to keep buttons disabled after page refresh
- **Tables**: follow the consistent pattern documented in CLAUDE.md — `rounded-lg border overflow-hidden` wrapper, `bg-muted/50` header, `hover:bg-muted/30` rows
- **Pagination**: server-side via URL searchParams, "Showing X–Y of Z" left, "< Page N of M >" right, with `aria-disabled` and `tabIndex`

## File Upload UX

- Single dropzone that auto-detects file type is better than separate upload zones per type
- When uploading multiple files and one fails, continue processing the others — don't stop on first error
- Include the filename in error messages: `${file.name}: ${error}` so the user knows which file caused the issue
- Show match rate warning if <70% of URLs matched
