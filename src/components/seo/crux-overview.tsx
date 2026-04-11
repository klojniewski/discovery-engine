"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, RefreshCw } from "lucide-react";
import { fetchCruxData } from "@/actions/seo";
import type {
  CruxOriginData,
  CruxHistoryData,
  CruxMetricName,
} from "@/services/crux";
import { METRIC_CONFIG } from "@/services/crux";

function ratingColor(p75: number, goodMax: number, poorMin: number) {
  if (p75 <= goodMax) return { bg: "bg-green-100", text: "text-green-700", label: "Good" };
  if (p75 < poorMin) return { bg: "bg-amber-100", text: "text-amber-700", label: "Needs Improvement" };
  return { bg: "bg-red-100", text: "text-red-700", label: "Poor" };
}

function DistributionBar({
  histogram,
  p75,
  goodMax,
  poorMin,
  formatValue,
}: {
  histogram: { start: number; end?: number; density: number }[];
  p75: number;
  goodMax: number;
  poorMin: number;
  formatValue: (v: number) => string;
}) {
  const good = histogram[0]?.density ?? 0;
  const mid = histogram[1]?.density ?? 0;
  const poor = histogram[2]?.density ?? 0;

  // Position the marker: the bar segments are good|mid|poor by density percentage.
  // Map p75 into a position: if p75 <= goodMax, it's within the green segment;
  // if goodMax < p75 < poorMin, it's in amber; otherwise in red.
  let markerPercent: number;
  if (p75 <= goodMax) {
    // Within green segment: position proportionally within green's width
    const fraction = goodMax > 0 ? p75 / goodMax : 0;
    markerPercent = fraction * good * 100;
  } else if (p75 < poorMin) {
    // Within amber segment
    const fraction = (p75 - goodMax) / (poorMin - goodMax);
    markerPercent = (good + fraction * mid) * 100;
  } else {
    // Within red segment — cap at a reasonable max (2x poorMin)
    const maxVal = poorMin * 2;
    const fraction = Math.min((p75 - poorMin) / (maxVal - poorMin), 1);
    markerPercent = (good + mid + fraction * poor) * 100;
  }

  // Clamp between 1% and 99% so the marker is always visible
  markerPercent = Math.max(1, Math.min(99, markerPercent));

  return (
    <div className="relative">
      {/* Score label above marker */}
      <div className="relative h-5 mb-0.5">
        <div
          className="absolute -translate-x-1/2 text-xs font-medium text-foreground whitespace-nowrap"
          style={{ left: `${markerPercent}%` }}
        >
          {formatValue(p75)}
        </div>
      </div>
      {/* Bar with marker */}
      <div className="relative">
        <div className="flex h-2 rounded-full overflow-hidden w-full">
          {good > 0 && (
            <div
              className="bg-green-500"
              style={{ width: `${(good * 100).toFixed(1)}%` }}
            />
          )}
          {mid > 0 && (
            <div
              className="bg-amber-400"
              style={{ width: `${(mid * 100).toFixed(1)}%` }}
            />
          )}
          {poor > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${(poor * 100).toFixed(1)}%` }}
            />
          )}
        </div>
        {/* Pin marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${markerPercent}%` }}
        >
          <div className="w-3 h-3 rounded-full border-2 border-white bg-gray-700 shadow-sm" />
        </div>
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: { p75: number }[] }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.p75);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 120;
  const height = 28;
  const padding = 2;

  const coords = values.map((v, i) => ({
    x: padding + (i / (values.length - 1)) * (width - padding * 2),
    y: padding + (1 - (v - min) / range) * (height - padding * 2),
  }));

  const pathD = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const lastValue = values[values.length - 1];
  const firstValue = values[0];
  const trending = lastValue > firstValue ? "text-red-500" : "text-green-500";

  return (
    <svg
      width={width}
      height={height}
      className={`inline-block ${trending}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CORE_WEB_VITALS: CruxMetricName[] = [
  "largest_contentful_paint",
  "interaction_to_next_paint",
  "cumulative_layout_shift",
];

const OTHER_METRICS: CruxMetricName[] = [
  "first_contentful_paint",
  "experimental_time_to_first_byte",
];

interface FormFactorData {
  origin: CruxOriginData | null;
  history: CruxHistoryData | null;
}

const TABS = [
  { key: "phone", label: "Mobile" },
  { key: "desktop", label: "Desktop" },
  { key: "all", label: "All Devices" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CruxOverview({
  projectId,
  initialData,
}: {
  projectId: string;
  initialData: Record<TabKey, FormFactorData> | null;
}) {
  const [data, setData] = useState<Record<TabKey, FormFactorData>>(
    initialData ?? { phone: { origin: null, history: null }, desktop: { origin: null, history: null }, all: { origin: null, history: null } }
  );
  const [activeTab, setActiveTab] = useState<TabKey>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnyData = data.phone.origin || data.desktop.origin || data.all.origin;

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCruxData(projectId);
    if ("error" in result && result.error) {
      setError(result.error as string);
    } else {
      // Reload the page to pick up new data from server
      window.location.reload();
    }
    setLoading(false);
  };

  const current = data[activeTab];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                Real User Experience (Chrome UX Report)
              </CardTitle>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Aggregated real user performance data from Chrome browsers
                  visiting this domain. Based on the past 28 days of data.
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              variant={hasAnyData ? "outline" : "default"}
              size="sm"
              disabled={loading}
              onClick={handleFetch}
            >
              {loading ? (
                "Fetching..."
              ) : hasAnyData ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </span>
              ) : (
                "Fetch CrUX Data"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {hasAnyData && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b">
                {TABS.map((tab) => {
                  const tabHasData = !!data[tab.key].origin;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                        activeTab === tab.key
                          ? "border-primary text-foreground"
                          : tabHasData
                            ? "border-transparent text-muted-foreground hover:text-foreground"
                            : "border-transparent text-muted-foreground/40 cursor-not-allowed"
                      }`}
                      disabled={!tabHasData}
                    >
                      {tab.label}
                      {!tabHasData && (
                        <span className="ml-1 text-[10px]">(no data)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {current.origin ? (
                <div className="space-y-6">
                  {/* Core Web Vitals */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Core Web Vitals</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      {CORE_WEB_VITALS.map((name) => {
                        const m = current.origin!.metrics[name];
                        if (!m) return null;
                        const config = METRIC_CONFIG[name];
                        const rating = ratingColor(m.p75, config.goodMax, config.poorMin);
                        const historyPoints = current.history?.metrics[name];
                        return (
                          <MetricCard
                            key={name}
                            config={config}
                            metric={m}
                            rating={rating}
                            historyPoints={historyPoints}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Other metrics */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Other Metrics</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {OTHER_METRICS.map((name) => {
                        const m = current.origin!.metrics[name];
                        if (!m) return null;
                        const config = METRIC_CONFIG[name];
                        const rating = ratingColor(m.p75, config.goodMax, config.poorMin);
                        const historyPoints = current.history?.metrics[name];
                        return (
                          <MetricCard
                            key={name}
                            config={config}
                            metric={m}
                            rating={rating}
                            historyPoints={historyPoints}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Data from {current.origin.origin} &middot; Fetched{" "}
                    {current.origin.fetchedAt.slice(0, 10)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No CrUX data available for this form factor. Sites with low traffic may not have per-device breakdowns.
                </p>
              )}
            </>
          )}

          {!hasAnyData && !error && !loading && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Fetch CrUX Data&quot; to load real user performance
              data for this domain.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  config,
  metric,
  rating,
  historyPoints,
}: {
  config: (typeof METRIC_CONFIG)[CruxMetricName];
  metric: { histogram: { start: number; end?: number; density: number }[]; p75: number };
  rating: { bg: string; text: string; label: string };
  historyPoints?: { date: string; p75: number }[] | null;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {config.label} ({config.short})
        </span>
        <Badge className={`${rating.bg} ${rating.text} text-[10px] border-0`}>
          {rating.label}
        </Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${rating.text}`}>
          {config.format(metric.p75)}
        </span>
        <span className="text-xs text-muted-foreground">p75</span>
      </div>
      <DistributionBar
        histogram={metric.histogram}
        p75={metric.p75}
        goodMax={config.goodMax}
        poorMin={config.poorMin}
        formatValue={config.format}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          Good: {((metric.histogram[0]?.density ?? 0) * 100).toFixed(0)}%
        </span>
        <span>
          Needs work: {((metric.histogram[1]?.density ?? 0) * 100).toFixed(0)}%
        </span>
        <span>
          Poor: {((metric.histogram[2]?.density ?? 0) * 100).toFixed(0)}%
        </span>
      </div>
      {historyPoints && historyPoints.length > 1 && (
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-[10px] text-muted-foreground">25-week trend</span>
          <Sparkline points={historyPoints} />
        </div>
      )}
    </div>
  );
}
