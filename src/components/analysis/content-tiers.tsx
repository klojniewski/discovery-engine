"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Loader2 } from "lucide-react";
import { updatePageTier } from "@/actions/analysis";

interface PageWithTier {
  id: string;
  url: string;
  title: string | null;
  contentTier: string | null;
  wordCount: number | null;
  isDuplicate: boolean | null;
}

const TIER_CONFIG = {
  must_migrate: {
    label: "Must Migrate",
    color: "bg-green-100 text-green-800",
    tooltip:
      "High-value pages with substantial content (300+ words), good metadata (title, description, H1), and prominent placement. These should be migrated as-is to the new platform.",
  },
  improve: {
    label: "Improve",
    color: "bg-blue-100 text-blue-800",
    tooltip:
      "Pages worth keeping but need improvement \u2014 may have thin content, missing metadata, or could benefit from better SEO. Migrate with enhancements.",
  },
  consolidate: {
    label: "Consolidate",
    color: "bg-yellow-100 text-yellow-800",
    tooltip:
      "Duplicate or near-duplicate pages that share the same content. Merge these into a single canonical page to avoid content dilution.",
  },
  archive: {
    label: "Archive",
    color: "bg-red-100 text-red-800",
    tooltip:
      "Low-value pages with very thin content, buried deep in navigation, or orphaned. Consider removing these or redirecting to relevant pages.",
  },
} as const;

type TierKey = "must_migrate" | "improve" | "consolidate" | "archive";

export function ContentTiers({ pages }: { pages: PageWithTier[] }) {
  const [tiers, setTiers] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const p of pages) map[p.id] = p.contentTier;
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getTier = (pageId: string) => tiers[pageId] ?? null;

  const handleTierChange = (pageId: string, newTier: TierKey) => {
    setSaving(pageId);
    setTiers((prev) => ({ ...prev, [pageId]: newTier }));
    startTransition(async () => {
      try {
        await updatePageTier(pageId, newTier);
      } catch (err) {
        console.error("Failed to update tier:", err);
      } finally {
        setSaving(null);
      }
    });
  };

  const tierCounts = {
    must_migrate: pages.filter((p) => getTier(p.id) === "must_migrate").length,
    improve: pages.filter((p) => getTier(p.id) === "improve").length,
    consolidate: pages.filter((p) => getTier(p.id) === "consolidate").length,
    archive: pages.filter((p) => getTier(p.id) === "archive").length,
    unscored: pages.filter((p) => !getTier(p.id)).length,
  };

  const total = pages.length || 1;

  return (
    <div className="space-y-6">
      {/* Methodology */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">How pages are scored</p>
        <p>
          Each page is evaluated by AI based on its{" "}
          <strong>business value</strong> — considering the URL, title,
          word count, and a preview of the actual content. Duplicate pages
          (sharing the same content hash) are automatically flagged for
          consolidation.
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li><strong>Must Migrate</strong> — high-value pages critical to the business: homepage, service/product pages, case studies, about/team pages, substantial blog posts</li>
          <li><strong>Improve</strong> — pages worth keeping but need work: thin landing pages, outdated content, poor structure but has potential value</li>
          <li><strong>Consolidate</strong> — duplicate or near-duplicate content that should be merged into a single canonical page</li>
          <li><strong>Archive</strong> — low-value pages to drop or redirect: legal boilerplate, empty/placeholder pages, outdated job postings, utility pages</li>
        </ul>
      </div>

      {/* Tier breakdown bar */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Tier Breakdown</h4>
        <div className="flex h-8 rounded-md overflow-hidden border">
          {Object.entries(TIER_CONFIG).map(([key, config]) => {
            const count = tierCounts[key as keyof typeof tierCounts];
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className={`${config.color} flex items-center justify-center text-xs font-medium transition-all`}
                style={{ width: `${pct}%` }}
                title={`${config.label}: ${count} pages (${Math.round(pct)}%)`}
              >
                {pct > 8 && `${count}`}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(TIER_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${config.color}`} />
              <span>
                {config.label}: {tierCounts[key as keyof typeof tierCounts]}
              </span>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {config.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>

      {/* Pages table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
              <th className="text-left p-3 font-medium">Tier</th>
            </tr>
          </thead>
          <tbody>
            {pages
              .sort((a, b) => {
                const order = {
                  must_migrate: 0,
                  improve: 1,
                  consolidate: 2,
                  archive: 3,
                };
                const tierA = getTier(a.id);
                const tierB = getTier(b.id);
                return (
                  (order[tierA as keyof typeof order] ?? 4) -
                  (order[tierB as keyof typeof order] ?? 4)
                );
              })
              .map((page) => {
                const currentTier = getTier(page.id);
                const config =
                  TIER_CONFIG[currentTier as keyof typeof TIER_CONFIG];
                const isSaving = saving === page.id;
                return (
                  <tr
                    key={page.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-3 font-mono text-xs max-w-xs truncate">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {page.url}
                      </a>
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {page.title || "\u2014"}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {page.wordCount ?? "\u2014"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Select
                          value={currentTier ?? ""}
                          onValueChange={(val) =>
                            handleTierChange(page.id, val as TierKey)
                          }
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs border-0 bg-transparent hover:bg-muted/50 focus:ring-0">
                            <SelectValue>
                              {config ? (
                                <Badge className={`${config.color} text-xs border-0`}>
                                  {config.label}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">{"\u2014"}</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                <Badge className={`${cfg.color} text-xs border-0`}>
                                  {cfg.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isSaving && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
