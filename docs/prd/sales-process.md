# Sales Process Integration

The Discovery Engine maps directly to Pagepro's inbound sales stages. Below is where and how it gets used.

## Trigger: Qualification Call Made (Stage 2)

After the Intro Meeting, if the prospect fits ICP (legacy stack, 50+ pages, SEO-critical, UK/US), Chris triggers an audit **before or immediately after the Qualification Call**.

**Who runs it:** Chris initiates and validates technical sections (7-9) before sharing.

## How the Report is Presented

- **Preferred:** Present live during a dedicated 30-min "Migration Findings" call -- share screen, walk through key sections
- **Alternative:** Record a Loom walkthrough (15-20 min), send alongside the CRM follow-up email same day
- **Never:** Send the raw report link without context -- always pair with a walkthrough

## Pipedrive Integration

- Log audit run as activity on the deal
- Attach report link to deal in Pipedrive notes
- Tag deal with `audit-complete` when report is ready to share
- If prospect responds positively to report -> move to **Stage 3: Deal Qualified**

## When NOT to Run an Audit

- Prospect is not yet BANT-qualified (waste of time)
- Site is clearly out of ICP (e.g., static brochure site <20 pages, no CMS)
- Prospect is in early exploratory stage -- use the report as a reason to re-engage, not as a cold outreach hook

## User Flow (Internal)

```
1. Chris identifies qualified prospect (post Intro Meeting or from pipeline)

2. Chris opens Discovery Engine dashboard (internal URL)

3. Enters prospect's website URL -> initiates crawl
   - Crawl runs in background (~7 min for 500 pages)
   - Chris continues other work

4. AI analysis runs automatically after crawl

5. Chris reviews draft report (30-60 min)
   - Validates Technical Recommendations (section 7)
   - Adjusts Investment Summary (section 8) based on Nexity delivery knowledge
   - Confirms Next Steps messaging (section 9)

6. Chris presents report on call or via Loom
   - First 10 min: Key findings (SEO risk, complexity, templates)
   - Next 10 min: What we'd recommend and why
   - Last 10 min: Investment range, how Nexity de-risks it, next steps

7. Post-call: attach report to Pipedrive deal, send follow-up email

8. Proposal references audit findings extensively
   - Audit becomes Appendix A
   - Pricing is anchored to audit estimates
   - Scope is based on audit recommendations

9. Close deal -> Begin replatforming project
```
