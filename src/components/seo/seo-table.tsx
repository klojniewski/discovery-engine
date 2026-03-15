"use client";

import { Badge } from "@/components/ui/badge";

interface SeoPageRow {
  id: string;
  url: string;
  title: string | null;
  organicTraffic: number | null;
  trafficValueCents: number | null;
  referringDomains: number | null;
  topKeyword: string | null;
  seoScore: number | null;
  contentTier: string | null;
  isRedirectCritical: boolean | null;
  psiScoreMobile: number | null;
  psiScoreDesktop: number | null;
}

function formatDollars(cents: number | null): string {
  if (cents === null) return "\u2014";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatNumber(n: number | null): string {
  if (n === null) return "\u2014";
  return n.toLocaleString("en-US");
}

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  must_migrate: { label: "Must Migrate", color: "bg-green-100 text-green-800" },
  improve: { label: "Improve", color: "bg-blue-100 text-blue-800" },
  consolidate: { label: "Consolidate", color: "bg-yellow-100 text-yellow-800" },
  archive: { label: "Archive", color: "bg-red-100 text-red-800" },
};

export function SeoTable({ pages }: { pages: SeoPageRow[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">URL</th>
            <th className="text-right p-3 font-medium">Traffic</th>
            <th className="text-right p-3 font-medium">Value</th>
            <th className="text-right p-3 font-medium">RDs</th>
            <th className="text-left p-3 font-medium">Top Keyword</th>
            <th className="text-right p-3 font-medium">SEO Score</th>
            <th className="text-left p-3 font-medium">Tier</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => {
            const tierConfig = page.contentTier
              ? TIER_CONFIG[page.contentTier]
              : null;
            return (
              <tr
                key={page.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="p-3 max-w-xs">
                  <div className="flex items-center gap-2">
                    {page.isRedirectCritical && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        Critical
                      </Badge>
                    )}
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary underline-offset-4 hover:underline truncate"
                      title={page.url}
                    >
                      {page.url}
                    </a>
                  </div>
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatNumber(page.organicTraffic)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatDollars(page.trafficValueCents)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatNumber(page.referringDomains)}
                </td>
                <td className="p-3 max-w-[200px]">
                  <span className="truncate block text-xs text-muted-foreground">
                    {page.topKeyword || "\u2014"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <span
                    className={`tabular-nums font-medium ${
                      (page.seoScore ?? 0) >= 50
                        ? "text-red-600"
                        : (page.seoScore ?? 0) >= 25
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {page.seoScore ?? "\u2014"}
                  </span>
                </td>
                <td className="p-3">
                  {tierConfig ? (
                    <Badge className={`${tierConfig.color} text-xs border-0`}>
                      {tierConfig.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">{"\u2014"}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
