const CRUX_API_URL =
  "https://chromeuxreport.googleapis.com/v1/records:queryRecord";
const CRUX_HISTORY_URL =
  "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord";

const METRICS = [
  "largest_contentful_paint",
  "cumulative_layout_shift",
  "interaction_to_next_paint",
  "first_contentful_paint",
  "experimental_time_to_first_byte",
] as const;

export type CruxMetricName = (typeof METRICS)[number];

export interface CruxHistogramBucket {
  start: number;
  end?: number;
  density: number;
}

export interface CruxMetricData {
  histogram: CruxHistogramBucket[];
  p75: number;
}

export interface CruxOriginData {
  origin: string;
  metrics: Partial<Record<CruxMetricName, CruxMetricData>>;
  fetchedAt: string;
}

export interface CruxHistoryPoint {
  date: string; // YYYY-MM-DD (end of collection period)
  p75: number;
}

export interface CruxHistoryData {
  origin: string;
  metrics: Partial<Record<CruxMetricName, CruxHistoryPoint[]>>;
  fetchedAt: string;
}

export type CruxFormFactor = "PHONE" | "DESKTOP" | "ALL";

export type CruxErrorCode = "no_data" | "transport";
export interface CruxError {
  error: string;
  code: CruxErrorCode;
}

export async function fetchCruxOrigin(
  origin: string,
  formFactor?: CruxFormFactor
): Promise<CruxOriginData | CruxError> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey)
    return { error: "PAGESPEED_API_KEY not configured", code: "transport" };

  try {
    const body: Record<string, unknown> = {
      origin: origin.replace(/\/$/, ""),
      metrics: [...METRICS],
    };
    if (formFactor && formFactor !== "ALL") {
      body.formFactor = formFactor;
    }

    const res = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body?.error?.message || `CrUX API returned ${res.status}`;
      if (res.status === 404 || msg.includes("NOT_ENOUGH_DATA")) {
        return {
          error: "Not enough traffic data for this domain in Chrome UX Report",
          code: "no_data",
        };
      }
      return { error: msg, code: "transport" };
    }

    const data = await res.json();
    const record = data.record;
    const metrics: CruxOriginData["metrics"] = {};

    for (const name of METRICS) {
      const m = record?.metrics?.[name];
      if (!m) continue;
      metrics[name] = {
        histogram: (m.histogram || []).map(
          (b: { start: number | string; end?: number | string; density: number }) => ({
            start: Number(b.start),
            end: b.end != null ? Number(b.end) : undefined,
            density: b.density,
          })
        ),
        p75: Number(
          m.percentiles?.p75 ?? m.histogram?.[0]?.start ?? 0
        ),
      };
    }

    return {
      origin: origin.replace(/\/$/, ""),
      metrics,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "CrUX API request failed",
      code: "transport",
    };
  }
}

export async function fetchCruxHistory(
  origin: string,
  formFactor?: CruxFormFactor
): Promise<CruxHistoryData | { error: string }> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return { error: "PAGESPEED_API_KEY not configured" };

  try {
    const body: Record<string, unknown> = {
      origin: origin.replace(/\/$/, ""),
      metrics: [...METRICS],
    };
    if (formFactor && formFactor !== "ALL") {
      body.formFactor = formFactor;
    }

    const res = await fetch(`${CRUX_HISTORY_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        body?.error?.message || `CrUX History API returned ${res.status}`;
      if (res.status === 404 || msg.includes("NOT_ENOUGH_DATA")) {
        return { error: "Not enough traffic data for this domain" };
      }
      return { error: msg };
    }

    const data = await res.json();
    const record = data.record;
    const metrics: CruxHistoryData["metrics"] = {};

    for (const name of METRICS) {
      const m = record?.metrics?.[name];
      if (!m) continue;

      const periods: { firstDate: { year: number; month: number; day: number }; lastDate: { year: number; month: number; day: number } }[] =
        record.collectionPeriods || [];

      const p75Values: number[] =
        m.percentilesTimeseries?.p75s || [];

      const points: CruxHistoryPoint[] = periods.map(
        (period, i) => {
          const d = period.lastDate;
          const date = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
          return { date, p75: Number(p75Values[i] ?? 0) };
        }
      );

      metrics[name] = points;
    }

    return {
      origin: origin.replace(/\/$/, ""),
      metrics,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "CrUX History API request failed",
    };
  }
}

/** Human-readable metric labels and thresholds */
export const METRIC_CONFIG: Record<
  CruxMetricName,
  {
    label: string;
    short: string;
    unit: string;
    goodMax: number;
    poorMin: number;
    format: (v: number) => string;
  }
> = {
  largest_contentful_paint: {
    label: "Largest Contentful Paint",
    short: "LCP",
    unit: "ms",
    goodMax: 2500,
    poorMin: 4000,
    format: (v) => `${(v / 1000).toFixed(1)}s`,
  },
  cumulative_layout_shift: {
    label: "Cumulative Layout Shift",
    short: "CLS",
    unit: "",
    goodMax: 0.1,
    poorMin: 0.25,
    format: (v) => v.toFixed(2),
  },
  interaction_to_next_paint: {
    label: "Interaction to Next Paint",
    short: "INP",
    unit: "ms",
    goodMax: 200,
    poorMin: 500,
    format: (v) => `${Math.round(v)}ms`,
  },
  first_contentful_paint: {
    label: "First Contentful Paint",
    short: "FCP",
    unit: "ms",
    goodMax: 1800,
    poorMin: 3000,
    format: (v) => `${(v / 1000).toFixed(1)}s`,
  },
  experimental_time_to_first_byte: {
    label: "Time to First Byte",
    short: "TTFB",
    unit: "ms",
    goodMax: 800,
    poorMin: 1800,
    format: (v) => `${Math.round(v)}ms`,
  },
};
