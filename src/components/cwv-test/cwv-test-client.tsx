"use client";

import { useState, useTransition } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { runCwvCheck, type CwvRow } from "@/actions/cwv";
import {
  type CwvFormFactorResult,
  type CwvMetricResult,
} from "@/lib/cwv";
import { METRIC_CONFIG } from "@/services/crux";

const NO_DATA_TOOLTIP =
  "Chrome's real-user data for this origin isn't large enough for a CWV verdict. Try a higher-traffic site.";

function psiUrl(origin: string, strategy: "mobile" | "desktop"): string {
  const params = new URLSearchParams({ url: origin, form_factor: strategy });
  return `https://pagespeed.web.dev/analysis?${params}`;
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function metricValue(
  result: CwvFormFactorResult,
  which: "lcp" | "inp" | "cls"
): string {
  if (result.status === "pass" || result.status === "fail") {
    return String(result[which].p75);
  }
  if (result.status === "no_data" && result.partial) {
    const m = result.partial[which];
    return m ? String(m.p75) : "";
  }
  return "";
}

function exportCsv(rows: CwvRow[]) {
  const header = [
    "URL",
    "Mobile status",
    "Mobile LCP (ms)",
    "Mobile INP (ms)",
    "Mobile CLS",
    "Desktop status",
    "Desktop LCP (ms)",
    "Desktop INP (ms)",
    "Desktop CLS",
  ];
  const lines = rows.map((r) =>
    [
      r.origin ?? r.original,
      r.mobile.status,
      metricValue(r.mobile, "lcp"),
      metricValue(r.mobile, "inp"),
      metricValue(r.mobile, "cls"),
      r.desktop.status,
      metricValue(r.desktop, "lcp"),
      metricValue(r.desktop, "inp"),
      metricValue(r.desktop, "cls"),
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = [header.map(csvCell).join(","), ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cwv-test-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type BadgeStyle = { variant?: "destructive" | "outline"; className?: string; label: string };

function badgeStyle(status: CwvFormFactorResult["status"]): BadgeStyle {
  switch (status) {
    case "pass":
      return { className: "bg-green-100 text-green-800 border-0", label: "Pass" };
    case "fail":
      return { variant: "destructive", label: "Fail" };
    case "no_data":
      return { className: "bg-muted text-muted-foreground border-0", label: "No data" };
    case "error":
      return { variant: "outline", className: "text-destructive", label: "Error" };
  }
}

function MetricValue({
  name,
  metric,
}: {
  name: "largest_contentful_paint" | "interaction_to_next_paint" | "cumulative_layout_shift";
  metric: CwvMetricResult;
}) {
  const config = METRIC_CONFIG[name];
  const color =
    metric.status === "good"
      ? "text-green-700"
      : metric.status === "needs_improvement"
        ? "text-amber-700"
        : "text-red-700";
  return (
    <span className={color}>
      {config.short} {config.format(metric.p75)}
    </span>
  );
}

function ResultCell({
  result,
  origin,
  strategy,
}: {
  result: CwvFormFactorResult;
  origin: string | null;
  strategy: "mobile" | "desktop";
}) {
  const style = badgeStyle(result.status);

  const badge = (
    <Badge variant={style.variant} className={style.className}>
      {style.label}
    </Badge>
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {result.status === "no_data" ? (
          <Tooltip>
            <TooltipTrigger className="cursor-help">{badge}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {NO_DATA_TOOLTIP}
            </TooltipContent>
          </Tooltip>
        ) : (
          badge
        )}
        {origin && (
          <a
            href={psiUrl(origin, strategy)}
            target="_blank"
            rel="noreferrer"
            title={`Open live ${strategy} analysis on PageSpeed Insights`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {(result.status === "pass" || result.status === "fail") && (
        <div className="flex gap-2 text-[11px] tabular-nums text-muted-foreground">
          <MetricValue name="largest_contentful_paint" metric={result.lcp} />
          <span aria-hidden>·</span>
          <MetricValue name="interaction_to_next_paint" metric={result.inp} />
          <span aria-hidden>·</span>
          <MetricValue name="cumulative_layout_shift" metric={result.cls} />
        </div>
      )}

      {result.status === "no_data" && result.partial && (
        <div className="flex gap-2 text-[11px] tabular-nums text-muted-foreground">
          {result.partial.lcp && (
            <MetricValue name="largest_contentful_paint" metric={result.partial.lcp} />
          )}
          {result.partial.inp && (
            <>
              <span aria-hidden>·</span>
              <MetricValue name="interaction_to_next_paint" metric={result.partial.inp} />
            </>
          )}
          {result.partial.cls && (
            <>
              <span aria-hidden>·</span>
              <MetricValue name="cumulative_layout_shift" metric={result.partial.cls} />
            </>
          )}
        </div>
      )}

      {result.status === "error" && (
        <p className="text-[11px] text-muted-foreground max-w-xs truncate">
          {result.errorMessage}
        </p>
      )}
    </div>
  );
}

export function CwvTestClient() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<CwvRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please paste at least one URL.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await runCwvCheck(trimmed);
        setRows(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Run failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="cwv-urls" className="text-sm font-medium">
          One URL per line
        </label>
        <Textarea
          id="cwv-urls"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://pagepro.co&#10;https://example.com"
          rows={8}
          className="font-mono text-sm"
          disabled={pending}
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Running…" : "Run check"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {rows && rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "result" : "results"}
          </p>
          <Button variant="outline" size="sm" onClick={() => exportCsv(rows)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium w-12">#</th>
                <th className="text-left p-3 font-medium">URL</th>
                <th className="text-left p-3 font-medium w-64">Mobile</th>
                <th className="text-left p-3 font-medium w-64">Desktop</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.original}-${i}`}
                  className="border-b last:border-0 align-top"
                >
                  <td className="p-3 text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="p-3 max-w-xs">
                    <div className="font-mono text-xs truncate">
                      {row.origin ? (
                        <a
                          href={row.origin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {row.origin}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{row.original}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <ResultCell result={row.mobile} origin={row.origin} strategy="mobile" />
                  </td>
                  <td className="p-3">
                    <ResultCell result={row.desktop} origin={row.origin} strategy="desktop" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
