---
title: CWV Test tab — bulk Core Web Vitals check
type: feat
date: 2026-04-21
---

# CWV Test tab — bulk Core Web Vitals check

## Overview

Add a new top-level tab **CWV Test** to the dashboard sidebar. The page accepts a textarea of website URLs (one per line), runs each through Google's CrUX API for mobile and desktop, and displays a table showing whether each URL passes Core Web Vitals in each form factor. Separate columns for mobile and desktop. Internal auditing tool — no persistence.

## Motivation

The Replatform Discovery Engine already uses CrUX field data per project (SEO tab). We frequently need the same check *outside* a full discovery run — vetting a new prospect's homepage, spot-checking a migration candidate, auditing competitors. Today that's manual: paste each URL into [PageSpeed Insights](https://pagespeed.web.dev/). A bulk textarea + pass/fail table turns a 10-minute workflow into a 2-minute one, and surfaces the same CWV verdict Google applies for ranking.

## Proposed solution

A new authenticated route `/cwv-test` inside the `(dashboard)` group. A single client component holds the textarea, submit state, and results table. A server action (`runCwvCheck`) accepts the raw newline-separated input, fans out calls to `fetchCruxOrigin(origin, formFactor)` for `PHONE` and `DESKTOP`, and returns a single result array. The client renders a table following the project's standard pattern with two status columns (Mobile, Desktop); each cell shows a Pass/Fail badge with the three p75 metric values rendered in muted text beneath it, so the user sees at a glance which metric is failing.

Reuse:
- **`fetchCruxOrigin`** in `src/services/crux.ts:46` — supports `PHONE` / `DESKTOP` and returns p75 values for all three CWV metrics. We add one small change (see below) to distinguish "no data" from transport errors.
- **`METRIC_CONFIG`** in `src/services/crux.ts:183` — encodes Google's `goodMax` / `poorMin` thresholds for LCP (2500ms), INP (200ms), CLS (0.1).
- **`PAGESPEED_API_KEY`** env var — already used by CrUX and PSI. No new secret.
- **Data table pattern** — `CLAUDE.md` → "Data Tables UI Pattern".
- **Sidebar nav** — simple array in `src/components/dashboard/sidebar-nav.tsx:7`.

## Key decisions

1. **Origin-level CrUX, not URL-level.** "Does this site pass CWV" is an origin question; URL-level CrUX returns `NOT_ENOUGH_DATA` for most pages beyond homepages. V2 can add a toggle if needed.
2. **Pass = all three metrics Good at p75.** LCP ≤ 2500ms AND INP ≤ 200ms AND CLS ≤ 0.1, evaluated per form factor. Matches [Google's CWV assessment](https://web.dev/articles/vitals).
3. **Four row states per column:** `pass`, `fail`, `no_data`, `error`. `no_data` = CrUX doesn't have enough Chrome real-user traffic (Google's problem — site is too small). `error` = transport-level failure (our problem — retry). Keeping these separate because they mean different things to the user.
4. **No DB persistence.** Results live in client state. Refreshing clears the run.
5. **50 URLs per run.** At concurrency 5 (CrUX calls, not URLs — see Concurrency), a run finishes in ~20s.
6. **Inline concurrency limiter, no new dep.** 5 CrUX calls in flight at any time, shared across URLs (so 2.5 URLs in flight on average).
7. **No PSI lab fallback.** "Passes CWV" is only meaningful against field data — lab scores can't answer it. `No data` is the honest result for low-traffic sites.
8. **Auto-prepend `https://` for schemeless input, lowercase hostname before de-dupe, strip path/query when deriving origin.** Reject `ftp:` / `file:` etc. with an Error row.
9. **Per-metric values shown inline under the badge** — three small muted values (`LCP 2.1s · INP 180ms · CLS 0.08`). No click-to-expand. Zero extra clicks, same info.

## Acceptance criteria

- [x] Sidebar shows a new `CWV Test` entry with an `Activity` lucide icon, below "New Project" and above "Settings". Active-state matches existing pattern.
- [x] `/cwv-test` renders a page with title, one-sentence description, a textarea labelled "One URL per line", and a primary `Run check` button.
- [x] Empty input shows a validation message inline, no API call fires.
- [x] >50 URLs shows a validation message stating the cap, no API call fires.
- [x] **Textarea input is preserved when validation fails** — users do not lose a 40-URL paste.
- [x] Invalid URLs (`not-a-url`, `ftp://foo`) surface as `Error` rows; valid URLs in the same submission run normally.
- [x] URLs without a scheme auto-prepend `https://`. Hostnames lowercased before de-dupe.
- [x] Duplicate origins collapse to one row.
- [x] The submit button is disabled with a spinner while the run is in flight (no fake progress counter).
- [x] Results render in the project's table pattern with columns `#`, `URL`, `Mobile`, `Desktop`.
- [x] `Mobile` / `Desktop` cells: shadcn `<Badge>` — green `Pass`, red `Fail`, gray `No data`, gray `Error`. Below the badge, three muted values `LCP · INP · CLS` for pass/fail rows; nothing extra for no_data rows with no metrics; the error message for error rows.
- [x] `No data` badge has a tooltip: *"Chrome's real-user data for this origin isn't large enough for a CWV verdict. Try a higher-traffic site."*
- [x] `No data` rows with partial metrics (e.g. LCP + CLS but INP missing) render the metrics that are present.
- [x] Re-running replaces results; no accumulation across runs.
- [x] Missing `PAGESPEED_API_KEY` → all cells show `Error` with the env-var message (matches existing service behavior).

## Files touched

```
src/
  app/(dashboard)/
    cwv-test/
      page.tsx                      -- NEW server component wrapper
  actions/
    cwv.ts                          -- NEW runCwvCheck(rawInput: string) server action
  components/
    cwv-test/
      cwv-test-client.tsx           -- NEW single client component: textarea + table
  lib/
    cwv.ts                          -- NEW normalizeUrls + evaluateCwv (pure, testable)
    __tests__/
      cwv.test.ts                   -- NEW unit tests
  services/
    crux.ts                         -- MODIFY: add `code` field to error return
  components/dashboard/
    sidebar-nav.tsx                 -- MODIFY: add nav entry
```

4 new files, 2 modifications. No DB, no Drizzle, no Inngest.

## Technical approach

### `src/services/crux.ts` — minor service change

Add an error `code` so the action can branch on it without string regex. Purely additive, no existing caller breaks.

```ts
// existing: return { error: string }
// new:      return { error: string, code: "no_data" | "transport" }
```

Set `code: "no_data"` on 404 / `NOT_ENOUGH_DATA`; `code: "transport"` otherwise. ~3 lines.

### `src/lib/cwv.ts` — pure functions (only lib code)

```ts
import { METRIC_CONFIG, type CruxMetricName } from "@/services/crux";

export interface NormalizedInput {
  original: string;
  origin: string | null;
  error?: string; // "invalid URL", "unsupported scheme"
}

export function normalizeUrls(raw: string): NormalizedInput[] {
  // split on \n, trim, drop empty
  // parse via new URL() after auto-prepending https:// if no scheme
  // reject non-http(s) with error: "unsupported scheme"
  // lowercase hostname, build origin, de-dupe by origin
}

export interface CwvMetricResult {
  p75: number;
  status: "good" | "needs_improvement" | "poor";
}

export type CwvFormFactorResult =
  | { status: "pass" | "fail"; lcp: CwvMetricResult; inp: CwvMetricResult; cls: CwvMetricResult }
  | { status: "no_data"; partial?: { lcp?: CwvMetricResult; inp?: CwvMetricResult; cls?: CwvMetricResult } }
  | { status: "error"; errorMessage: string };

// Pure: takes just the metrics shape, not the transport envelope.
export function evaluateCwv(
  metrics: Partial<Record<CruxMetricName, { p75: number }>>
): CwvFormFactorResult {
  // classify each metric via METRIC_CONFIG thresholds (goodMax inclusive)
  // all three present AND good -> pass
  // all three present AND any not-good -> fail
  // any of LCP/INP/CLS missing -> no_data with whichever metrics are present in `partial`
}
```

### `src/actions/cwv.ts` — server action (orchestration only)

```ts
"use server";
import { fetchCruxOrigin } from "@/services/crux";
import { normalizeUrls, evaluateCwv, type CwvFormFactorResult } from "@/lib/cwv";

const MAX_URLS = 50;
const CONCURRENCY = 5;

export interface CwvRow {
  original: string;
  origin: string | null;
  mobile: CwvFormFactorResult;
  desktop: CwvFormFactorResult;
}

export async function runCwvCheck(rawInput: string): Promise<CwvRow[]> {
  const inputs = normalizeUrls(rawInput);
  if (inputs.length === 0) throw new Error("Please provide at least one URL");
  if (inputs.length > MAX_URLS) throw new Error(`Max ${MAX_URLS} URLs per run`);

  // Inline concurrency limiter — caps in-flight CrUX calls (not URLs).
  // Semaphore of 5 slots shared across all (url, formFactor) pairs.
  // For each input with a valid origin, enqueue 2 calls (PHONE + DESKTOP),
  // translate service result into CwvFormFactorResult:
  //   - { error, code: "no_data" } -> evaluateCwv({}) (returns no_data with no partials)
  //   - { error, code: "transport" } -> { status: "error", errorMessage: error }
  //   - CruxOriginData -> evaluateCwv(data.metrics)
  // Invalid-input rows skip CrUX and return { status: "error", errorMessage } for both.
}
```

### `src/components/cwv-test/cwv-test-client.tsx` — single client component

Holds:
- textarea state (uncontrolled `defaultValue` after submit, or controlled — either way preserve on validation error)
- pending state via `useTransition`
- results array
- inline error message for client-side validation

Renders:
- textarea + button
- results table using the `CLAUDE.md` pattern
- inline status badge helper (not a separate file) — a 6-line function mapping `CwvFormFactorResult["status"]` → `<Badge>` variant
- per-cell metric strip: `LCP 2.1s · INP 180ms · CLS 0.08` via `METRIC_CONFIG[name].format(p75)`

No separate badge component. No expandable row.

### `src/components/dashboard/sidebar-nav.tsx` — nav entry

```ts
import { LayoutDashboard, FolderPlus, Activity, Settings } from "lucide-react";

const navItems = [
  { href: "/projects", label: "Projects", icon: LayoutDashboard },
  { href: "/projects/new", label: "New Project", icon: FolderPlus },
  { href: "/cwv-test", label: "CWV Test", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];
```

The existing `isActive` computation handles `/cwv-test` correctly via the fallthrough `pathname.startsWith(item.href)` branch — no regex changes needed.

## Test plan

### Unit tests — `src/lib/__tests__/cwv.test.ts`

Covering the pure functions only. Integration with CrUX is tested manually (real API, real field data).

- [x] `normalizeUrls("")` → `[]`
- [x] `normalizeUrls("example.com")` → origin `https://example.com`
- [x] `normalizeUrls("HTTPS://Example.COM/path?q=1\nexample.com")` → 1 entry (case + scheme de-dupe, path stripped)
- [x] `normalizeUrls("ftp://foo\nnot a url")` → 2 entries, both with `error`
- [x] `evaluateCwv` with LCP=2000, INP=150, CLS=0.05 → `pass`
- [x] `evaluateCwv` with LCP=2500, INP=200, CLS=0.1 → `pass` (boundary; `goodMax` inclusive per `ratingColor`)
- [x] `evaluateCwv` with LCP=3000, INP=150, CLS=0.05 → `fail`
- [x] `evaluateCwv` with LCP=2000, INP missing, CLS=0.05 → `no_data` with `partial.lcp` and `partial.cls` populated
- [x] `evaluateCwv({})` → `no_data` with no `partial`

### Manual QA

- [ ] Paste `https://pagepro.co` → expect both columns populated with current field data
- [ ] Paste a known low-traffic site → `No data` on one or both
- [ ] Paste 51 URLs → validation error, textarea preserved, no API calls
- [ ] Paste 30 valid URLs → run completes in < 45s
- [ ] Invalid + valid URLs mixed → invalid ones show `Error`, valid ones populate
- [ ] Unset `PAGESPEED_API_KEY` → every row shows `Error` in both columns, textarea still usable
- [ ] Re-run with fewer URLs → previous results fully replaced

## Risks & mitigations

- **CrUX `NOT_ENOUGH_DATA` is common for small sites.** Mitigation: `No data` badge with tooltip explaining it's a traffic issue, not a failure.
- **CrUX rate limit is 150 QPM per key.** 50 URLs × 2 form factors = 100 calls, concurrency 5 → ~10 req/s peak. Safe.
- **Flaky 5xx from CrUX.** Existing service returns `{ error }` cleanly — row shows `Error`, user re-runs. No retry loop in v1.

## Dependencies

None new. Reuses `@/services/crux`, `@/components/ui/{badge,button,textarea,tooltip}`, `lucide-react`, `PAGESPEED_API_KEY`.

## References

- `src/services/crux.ts:46` — `fetchCruxOrigin`
- `src/services/crux.ts:183` — `METRIC_CONFIG` with CWV thresholds
- `src/components/seo/crux-overview.tsx:21` — `ratingColor` pattern (metric classification)
- `src/components/dashboard/sidebar-nav.tsx:7` — nav array
- `CLAUDE.md` → "Data Tables UI Pattern"
- [CWV thresholds](https://web.dev/articles/vitals)
- [CrUX API docs](https://developer.chrome.com/docs/crux/api)
- `docs/solutions/seo-baseline-learnings.md`
