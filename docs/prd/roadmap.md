# Development Roadmap

> **Note:** The original 16-week roadmap described a stack that was never built (Playwright, pgvector, BullMQ, Railway). It has been replaced with the actual status below.

## What's Been Built (Phases 1-4, ~90% complete)

- [x] Core pipeline: Crawl -> Classify & Score -> Screenshot & Detect -> Report
- [x] 6 report sections live (Executive Summary, Templates, Sections, Architecture, Content Audit, SEO Baseline)
- [x] SEO enrichment: Ahrefs CSV import, on-page extraction, PageSpeed Insights, Chrome UX Report
- [x] Performance tab with CrUX real user data and PSI lab scores
- [x] Public report sharing with optional password protection
- [x] API cost tracking per project per step
- [x] Supabase Auth for team login
- [x] 56 unit tests passing (URL grouping, listing split, SEO scoring, Ahrefs parsing)

## Near-term (Weeks 1-2)

- [ ] Multi-site testing -- WordPress blog, React SPA, large content site (500+ pages)
- [ ] Full end-to-end report testing -- verify pagepro.co report works completely
- [ ] Production deployment -- Vercel, env vars, custom domain, Supabase production, Sentry

## Medium-term (Weeks 3-6)

- [ ] Report sections 7-9 -- Technical Recommendations, Investment Summary, Next Steps (Claude Sonnet narrative generation)
- [ ] Organic Keywords CSV import (v2) -- intent classification for redirect priority, especially local intent pages
- [ ] Post-enrichment tier override UI -- show which pages were auto-corrected and why

## Deferred (Post-Validation)

- [ ] PDF generation -- currently Cmd+P, proper PDF when report format stabilises
- [ ] Stripe payments -- deferred until business model validated with internal use
- [ ] Batch audit mode -- paste URL list, run overnight, export enrichment CSV for Clay/Lemlist outbound
- [ ] CRM note generation -- auto-generate Pipedrive CRM note from audit data
- [ ] Email notifications (Resend) -- notify team when crawl/analysis completes
- [ ] Report analytics tracking (PostHog) -- track client engagement with published reports
- [ ] Landing page for paid audit sales

## Internal Launch Readiness Checklist

- [ ] Report sections 7-9 built and tested
- [ ] Verified on 3 different site types
- [ ] pagepro.co full report passes review
- [ ] Production deployment complete
- [ ] Chris runs first live audit on a warm prospect

## Dependencies (remaining)

- Anthropic API key + credits (Claude Sonnet for sections 7-9)
- Firecrawl API key
- Internal domain setup
- Supabase production environment

## Removed dependencies

- ~~Stripe Connect setup~~ -- not needed
- ~~Public landing page design~~ -- not needed
- ~~Beta client recruitment~~ -- internal use only, no external sign-up flow
