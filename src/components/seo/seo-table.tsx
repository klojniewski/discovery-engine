"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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

function HeaderWithTooltip({
  label,
  tooltip,
  align = "left",
}: {
  label: string;
  tooltip: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger className="cursor-help">
          <Info className="h-3 w-3 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs font-normal">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function SeoTable({ pages }: { pages: SeoPageRow[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">URL</th>
            <th className="text-right p-3 font-medium">
              <HeaderWithTooltip label="Traffic" tooltip="Estimated monthly organic visits from Google, sourced from Ahrefs" />
            </th>
            <th className="text-right p-3 font-medium">
              <HeaderWithTooltip label="Value" tooltip="Monthly traffic value in USD — what this organic traffic would cost as Google Ads. Higher value = more important to preserve." align="right" />
            </th>
            <th className="text-right p-3 font-medium">
              <HeaderWithTooltip label="RDs" tooltip="Referring Domains — number of unique websites linking to this page. Pages with many backlinks carry link equity that must be redirected." align="right" />
            </th>
            <th className="text-left p-3 font-medium">
              <HeaderWithTooltip label="Top Keyword" tooltip="The highest-ranking keyword this page appears for in Google search results" />
            </th>
            <th className="text-right p-3 font-medium">
              <HeaderWithTooltip label="SEO Score" tooltip="Composite score (0-100) based on traffic value (45%), referring domains (35%), and organic traffic (20%). Pages scoring 50+ are flagged as redirect-critical." align="right" />
            </th>
            <th className="text-left p-3 font-medium">
              <HeaderWithTooltip label="Tier" tooltip="Content migration tier assigned during analysis — determines whether the page should be migrated, improved, consolidated, or archived" />
            </th>
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
