"use client";

import { useState, useMemo, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Info, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
      "High-value pages critical to the business — homepage, service/product pages, case studies, about/team pages, substantial blog posts. Also legally required pages (privacy, terms).",
  },
  improve: {
    label: "Improve",
    color: "bg-blue-100 text-blue-800",
    tooltip:
      "Pages worth keeping but need improvement — may have thin content, missing metadata, or could benefit from better SEO. Migrate with enhancements.",
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

const PAGE_SIZE = 50;

export function ContentTiers({ pages }: { pages: PageWithTier[] }) {
  const [tiers, setTiers] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const p of pages) map[p.id] = p.contentTier;
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filterTier, setFilterTier] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filter and sort pages
  const filteredAndSorted = useMemo(() => {
    const filtered =
      filterTier === "all"
        ? pages
        : pages.filter((p) => getTier(p.id) === filterTier);

    return filtered.sort((a, b) => {
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, filterTier, tiers]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const startIdx = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedPages = filteredAndSorted.slice(startIdx, startIdx + PAGE_SIZE);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setFilterTier(value);
    setCurrentPage(1);
  };

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
          <li><strong>Must Migrate</strong> — high-value pages critical to the business: homepage, service/product pages, case studies, about/team pages, substantial blog posts, legally required pages</li>
          <li><strong>Improve</strong> — pages worth keeping but need work: thin landing pages, outdated content, poor structure but has potential value</li>
          <li><strong>Consolidate</strong> — duplicate or near-duplicate content that should be merged into a single canonical page</li>
          <li><strong>Archive</strong> — low-value pages to drop or redirect: empty/placeholder pages, outdated job postings, pagination/taxonomy pages</li>
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
              <button
                key={key}
                className={`${config.color} flex items-center justify-center text-xs font-medium transition-all cursor-pointer hover:opacity-80`}
                style={{ width: `${pct}%` }}
                title={`${config.label}: ${count} pages (${Math.round(pct)}%) — click to filter`}
                onClick={() => handleFilterChange(filterTier === key ? "all" : key)}
              >
                {pct > 8 && `${count}`}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(TIER_CONFIG).map(([key, config]) => (
            <button
              key={key}
              className={`flex items-center gap-1.5 cursor-pointer hover:opacity-70 ${filterTier === key ? "ring-2 ring-primary rounded-md px-1 -mx-1" : ""}`}
              onClick={() => handleFilterChange(filterTier === key ? "all" : key)}
            >
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
            </button>
          ))}
        </div>
      </div>

      {/* Filter indicator */}
      {filterTier !== "all" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Showing {filteredAndSorted.length} {TIER_CONFIG[filterTier as TierKey]?.label} pages
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => handleFilterChange("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

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
            {paginatedPages.map((page) => {
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filteredAndSorted.length)} of {filteredAndSorted.length} pages
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and pages near current
                return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2;
              })
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === safeCurrentPage ? "default" : "outline"}
                    size="sm"
                    className="w-8"
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
