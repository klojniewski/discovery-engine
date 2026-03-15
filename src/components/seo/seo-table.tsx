"use client";

import Link from "next/link";
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
  if (cents === null) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatNumber(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US");
}

function tierBadgeColor(tier: string | null): string {
  switch (tier) {
    case "must_migrate":
      return "bg-green-100 text-green-800";
    case "improve":
      return "bg-blue-100 text-blue-800";
    case "consolidate":
      return "bg-amber-100 text-amber-800";
    case "archive":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function SeoTable({ pages }: { pages: SeoPageRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">URL</th>
            <th className="py-2 pr-4 font-medium text-right">Traffic</th>
            <th className="py-2 pr-4 font-medium text-right">Value</th>
            <th className="py-2 pr-4 font-medium text-right">RDs</th>
            <th className="py-2 pr-4 font-medium">Top Keyword</th>
            <th className="py-2 pr-4 font-medium text-right">SEO Score</th>
            <th className="py-2 pr-4 font-medium">Tier</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.id} className="border-b hover:bg-muted/50">
              <td className="py-2 pr-4 max-w-[300px]">
                <div className="flex items-center gap-2">
                  {page.isRedirectCritical && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                      Critical
                    </Badge>
                  )}
                  <span className="truncate text-xs" title={page.url}>
                    {urlPath(page.url)}
                  </span>
                </div>
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatNumber(page.organicTraffic)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatDollars(page.trafficValueCents)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatNumber(page.referringDomains)}
              </td>
              <td className="py-2 pr-4 max-w-[200px]">
                <span className="truncate block text-xs text-muted-foreground">
                  {page.topKeyword || "—"}
                </span>
              </td>
              <td className="py-2 pr-4 text-right">
                <span
                  className={`tabular-nums font-medium ${
                    (page.seoScore ?? 0) >= 50
                      ? "text-red-600"
                      : (page.seoScore ?? 0) >= 25
                        ? "text-amber-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {page.seoScore ?? "—"}
                </span>
              </td>
              <td className="py-2 pr-4">
                {page.contentTier && (
                  <span
                    className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${tierBadgeColor(page.contentTier)}`}
                  >
                    {page.contentTier.replace("_", " ")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
