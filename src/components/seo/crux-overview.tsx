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
}: {
  histogram: { start: number; end?: number; density: number }[];
}) {
  const good = histogram[0]?.density ?? 0;
  const mid = histogram[1]?.density ?? 0;
  const poor = histogram[2]?.density ?? 0;

  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full">
      {good > 0 && (
        <div
          className="bg-green-500"
          style={{ width: `${(good * 100).toFixed(1)}%` }}
          title={`Good: ${(good * 100).toFixed(0)}%`}
        />
      )}
      {mid > 0 && (
        <div
          className="bg-amber-400"
          style={{ width: `${(mid * 100).toFixed(1)}%` }}
          title={`Needs Improvement: ${(mid * 100).toFixed(0)}%`}
        />
      )}
      {poor > 0 && (
        <div
          className="bg-red-500"
          style={{ width: `${(poor * 100).toFixed(1)}%` }}
          title={`Poor: ${(poor * 100).toFixed(0)}%`}
        />
      )}
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

export function CruxOverview({
  projectId,
  initialOrigin,
  initialHistory,
}: {
  projectId: string;
  initialOrigin: CruxOriginData | null;
  initialHistory: CruxHistoryData | null;
}) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCruxData(projectId);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      if (result.origin) setOrigin(result.origin as CruxOriginData);
      if (result.history) setHistory(result.history as CruxHistoryData);
    }
    setLoading(false);
  };

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
              variant={origin ? "outline" : "default"}
              size="sm"
              disabled={loading}
              onClick={handleFetch}
            >
              {loading ? (
                "Fetching..."
              ) : origin ? (
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

          {origin && (
            <div className="space-y-6">
              {/* Core Web Vitals */}
              <div>
                <h4 className="text-sm font-medium mb-3">Core Web Vitals</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  {CORE_WEB_VITALS.map((name) => {
                    const m = origin.metrics[name];
                    if (!m) return null;
                    const config = METRIC_CONFIG[name];
                    const rating = ratingColor(m.p75, config.goodMax, config.poorMin);
                    const historyPoints = history?.metrics[name];
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
                    const m = origin.metrics[name];
                    if (!m) return null;
                    const config = METRIC_CONFIG[name];
                    const rating = ratingColor(m.p75, config.goodMax, config.poorMin);
                    const historyPoints = history?.metrics[name];
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
                Data from {origin.origin} &middot; Fetched{" "}
                {new Date(origin.fetchedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {!origin && !error && !loading && (
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
      <DistributionBar histogram={metric.histogram} />
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
