import { METRIC_CONFIG, type CruxMetricName } from "@/services/crux";

export interface NormalizedInput {
  original: string;
  origin: string | null;
  error?: string;
}

export function normalizeUrls(raw: string): NormalizedInput[] {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>();
  const out: NormalizedInput[] = [];

  for (const line of lines) {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(line) ? line : `https://${line}`;

    let parsed: URL;
    try {
      parsed = new URL(withScheme);
    } catch {
      out.push({ original: line, origin: null, error: "invalid URL" });
      continue;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      out.push({ original: line, origin: null, error: "unsupported scheme" });
      continue;
    }

    const host = parsed.hostname.toLowerCase();
    const origin = `${parsed.protocol}//${host}${parsed.port ? `:${parsed.port}` : ""}`;

    if (seen.has(origin)) continue;
    seen.add(origin);
    out.push({ original: line, origin });
  }

  return out;
}

export interface CwvMetricResult {
  p75: number;
  status: "good" | "needs_improvement" | "poor";
}

export type CwvFormFactorResult =
  | {
      status: "pass" | "fail";
      lcp: CwvMetricResult;
      inp: CwvMetricResult;
      cls: CwvMetricResult;
    }
  | {
      status: "no_data";
      partial?: {
        lcp?: CwvMetricResult;
        inp?: CwvMetricResult;
        cls?: CwvMetricResult;
      };
    }
  | { status: "error"; errorMessage: string };

const CWV_METRICS = [
  "largest_contentful_paint",
  "interaction_to_next_paint",
  "cumulative_layout_shift",
] as const satisfies readonly CruxMetricName[];

function classify(p75: number, goodMax: number, poorMin: number): CwvMetricResult {
  if (p75 <= goodMax) return { p75, status: "good" };
  if (p75 < poorMin) return { p75, status: "needs_improvement" };
  return { p75, status: "poor" };
}

export function evaluateCwv(
  metrics: Partial<Record<CruxMetricName, { p75: number }>>
): CwvFormFactorResult {
  const lcpRaw = metrics.largest_contentful_paint;
  const inpRaw = metrics.interaction_to_next_paint;
  const clsRaw = metrics.cumulative_layout_shift;

  const lcp = lcpRaw
    ? classify(
        lcpRaw.p75,
        METRIC_CONFIG.largest_contentful_paint.goodMax,
        METRIC_CONFIG.largest_contentful_paint.poorMin
      )
    : undefined;
  const inp = inpRaw
    ? classify(
        inpRaw.p75,
        METRIC_CONFIG.interaction_to_next_paint.goodMax,
        METRIC_CONFIG.interaction_to_next_paint.poorMin
      )
    : undefined;
  const cls = clsRaw
    ? classify(
        clsRaw.p75,
        METRIC_CONFIG.cumulative_layout_shift.goodMax,
        METRIC_CONFIG.cumulative_layout_shift.poorMin
      )
    : undefined;

  if (!lcp || !inp || !cls) {
    const partial: NonNullable<Extract<CwvFormFactorResult, { status: "no_data" }>["partial"]> = {};
    if (lcp) partial.lcp = lcp;
    if (inp) partial.inp = inp;
    if (cls) partial.cls = cls;
    return Object.keys(partial).length > 0
      ? { status: "no_data", partial }
      : { status: "no_data" };
  }

  const allGood = lcp.status === "good" && inp.status === "good" && cls.status === "good";
  return { status: allGood ? "pass" : "fail", lcp, inp, cls };
}

export { CWV_METRICS };
