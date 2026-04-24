"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

interface PageItem {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  contentTier: string | null;
  templateName: string | null;
  excluded: boolean | null;
}

function csvCell(v: string | number | boolean | null): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportSitemapCsv(pages: PageItem[], projectId: string) {
  const header = ["URL", "Title", "Word Count", "Content Tier", "Template", "Excluded"];
  const lines = pages.map((p) =>
    [
      p.url,
      p.title,
      p.wordCount,
      p.contentTier,
      p.templateName,
      p.excluded ? "yes" : "no",
    ].map(csvCell).join(",")
  );
  const csv = [header.map(csvCell).join(","), ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sitemap-${projectId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface TreemapNode {
  segment: string;
  fullPath: string;
  pages: PageItem[];
  children: TreemapNode[];
  totalPages: number;
  totalWords: number;
  tierCounts: Record<string, number>;
  dominantTier: string | null;
}

interface LayoutRect {
  node: TreemapNode;
  x: number;
  y: number;
  w: number;
  h: number;
}

const TIER_BG: Record<string, string> = {
  must_migrate: "#dcfce7",
  improve: "#dbeafe",
  consolidate: "#fef9c3",
  archive: "#fee2e2",
};

const TIER_BORDER: Record<string, string> = {
  must_migrate: "#86efac",
  improve: "#93c5fd",
  consolidate: "#fde047",
  archive: "#fca5a5",
};

const TIER_TEXT: Record<string, string> = {
  must_migrate: "#166534",
  improve: "#1e3a5f",
  consolidate: "#854d0e",
  archive: "#991b1b",
};

const TIER_LABELS: Record<string, string> = {
  must_migrate: "Must Migrate",
  improve: "Improve",
  consolidate: "Consolidate",
  archive: "Archive",
};

// --- Squarified treemap layout algorithm ---

function squarify(
  nodes: TreemapNode[],
  x: number,
  y: number,
  w: number,
  h: number
): LayoutRect[] {
  const totalValue = nodes.reduce((s, n) => s + n.totalPages, 0);
  if (totalValue === 0 || nodes.length === 0) return [];

  // Sort descending by value
  const sorted = [...nodes].sort((a, b) => b.totalPages - a.totalPages);

  const rects: LayoutRect[] = [];
  let remaining = [...sorted];
  let cx = x,
    cy = y,
    cw = w,
    ch = h;
  let remainingValue = totalValue;

  while (remaining.length > 0) {
    const isHorizontal = cw >= ch;
    const sideLength = isHorizontal ? ch : cw;

    // Find the best row
    const row: TreemapNode[] = [];
    let rowValue = 0;
    let bestAspect = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      row.push(remaining[i]);
      rowValue += remaining[i].totalPages;

      const rowFraction = rowValue / remainingValue;
      const rowLength = isHorizontal ? cw * rowFraction : ch * rowFraction;

      // Calculate worst aspect ratio in this row
      let worstAspect = 0;
      for (const item of row) {
        const itemFraction = item.totalPages / rowValue;
        const itemLength = sideLength * itemFraction;
        const aspect = Math.max(rowLength / itemLength, itemLength / rowLength);
        worstAspect = Math.max(worstAspect, aspect);
      }

      if (worstAspect > bestAspect && row.length > 1) {
        // Adding this item made it worse — remove it and finalize row
        row.pop();
        rowValue -= remaining[i].totalPages;
        break;
      }
      bestAspect = worstAspect;
    }

    // Layout the row
    const rowFraction = rowValue / remainingValue;
    const rowLength = isHorizontal ? cw * rowFraction : ch * rowFraction;

    let offsetAlongSide = 0;
    for (const item of row) {
      const itemFraction = item.totalPages / rowValue;
      const itemLength = sideLength * itemFraction;

      if (isHorizontal) {
        rects.push({
          node: item,
          x: cx,
          y: cy + offsetAlongSide,
          w: rowLength,
          h: itemLength,
        });
      } else {
        rects.push({
          node: item,
          x: cx + offsetAlongSide,
          y: cy,
          w: itemLength,
          h: rowLength,
        });
      }
      offsetAlongSide += itemLength;
    }

    // Shrink remaining area
    if (isHorizontal) {
      cx += rowLength;
      cw -= rowLength;
    } else {
      cy += rowLength;
      ch -= rowLength;
    }
    remainingValue -= rowValue;
    remaining = remaining.slice(row.length);
  }

  return rects;
}

// --- Tree building (unchanged) ---

function buildTreemapData(pages: PageItem[]): TreemapNode {
  const root: TreemapNode = {
    segment: "/",
    fullPath: "/",
    pages: [],
    children: [],
    totalPages: 0,
    totalWords: 0,
    tierCounts: {},
    dominantTier: null,
  };

  const nodeMap = new Map<string, TreemapNode>();
  nodeMap.set("/", root);

  for (const page of pages) {
    let pathname: string;
    try {
      pathname = new URL(page.url).pathname;
    } catch {
      pathname = page.url;
    }

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      root.pages.push(page);
      continue;
    }

    for (let i = 0; i < segments.length; i++) {
      const path = "/" + segments.slice(0, i + 1).join("/");
      const parentPath = i === 0 ? "/" : "/" + segments.slice(0, i).join("/");

      if (!nodeMap.has(path)) {
        const node: TreemapNode = {
          segment: segments[i],
          fullPath: path,
          pages: [],
          children: [],
          totalPages: 0,
          totalWords: 0,
          tierCounts: {},
          dominantTier: null,
        };
        nodeMap.set(path, node);
        nodeMap.get(parentPath)!.children.push(node);
      }

      if (i === segments.length - 1) {
        nodeMap.get(path)!.pages.push(page);
      }
    }
  }

  function calcTotals(node: TreemapNode): void {
    node.totalPages = node.pages.length;
    node.totalWords = node.pages.reduce((s, p) => s + (p.wordCount ?? 0), 0);
    node.tierCounts = {};
    for (const p of node.pages) {
      if (p.contentTier) {
        node.tierCounts[p.contentTier] =
          (node.tierCounts[p.contentTier] ?? 0) + 1;
      }
    }
    for (const child of node.children) {
      calcTotals(child);
      node.totalPages += child.totalPages;
      node.totalWords += child.totalWords;
      for (const [tier, count] of Object.entries(child.tierCounts)) {
        node.tierCounts[tier] = (node.tierCounts[tier] ?? 0) + count;
      }
    }
    let maxCount = 0;
    for (const [tier, count] of Object.entries(node.tierCounts)) {
      if (count > maxCount) {
        maxCount = count;
        node.dominantTier = tier;
      }
    }
  }

  calcTotals(root);

  function collapse(node: TreemapNode): TreemapNode {
    node.children = node.children.map(collapse);
    if (
      node.children.length === 1 &&
      node.pages.length === 0 &&
      node.segment !== "/"
    ) {
      const child = node.children[0];
      return {
        ...child,
        segment: node.segment + "/" + child.segment,
        fullPath: child.fullPath,
      };
    }
    return node;
  }

  return collapse(root);
}

// --- Tier bar for inside rectangles ---

function TierMiniBar({
  tierCounts,
  total,
}: {
  tierCounts: Record<string, number>;
  total: number;
}) {
  if (total === 0) return null;
  const tiers = ["must_migrate", "improve", "consolidate", "archive"];
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden mt-1">
      {tiers.map((tier) => {
        const count = tierCounts[tier] ?? 0;
        if (count === 0) return null;
        return (
          <div
            key={tier}
            style={{
              width: `${(count / total) * 100}%`,
              backgroundColor: TIER_BORDER[tier],
            }}
          />
        );
      })}
    </div>
  );
}

// --- Rendered treemap ---

function TreemapView({
  nodes,
  width,
  height,
  onDrillDown,
}: {
  nodes: TreemapNode[];
  width: number;
  height: number;
  onDrillDown: (node: TreemapNode) => void;
}) {
  const rects = useMemo(
    () => squarify(nodes, 0, 0, width, height),
    [nodes, width, height]
  );

  return (
    <div className="relative" style={{ width, height }}>
      {rects.map((rect) => {
        const tier = rect.node.dominantTier ?? "improve";
        const bg = TIER_BG[tier] ?? TIER_BG.improve;
        const border = TIER_BORDER[tier] ?? TIER_BORDER.improve;
        const text = TIER_TEXT[tier] ?? TIER_TEXT.improve;
        const isLarge = rect.w > 120 && rect.h > 60;
        const isMedium = rect.w > 80 && rect.h > 40;
        const isTiny = rect.w < 60 || rect.h < 30;

        return (
          <button
            key={rect.node.fullPath}
            className="absolute overflow-hidden transition-all hover:brightness-95 hover:shadow-lg"
            style={{
              left: rect.x + 1,
              top: rect.y + 1,
              width: rect.w - 2,
              height: rect.h - 2,
              backgroundColor: bg,
              borderColor: border,
              borderWidth: 2,
              borderStyle: "solid",
              borderRadius: 6,
              color: text,
              cursor: "pointer",
              padding: isTiny ? 2 : isLarge ? 12 : 6,
            }}
            onClick={() => onDrillDown(rect.node)}
            title={`${rect.node.fullPath}\n${rect.node.totalPages} pages · ${rect.node.totalWords.toLocaleString()} words`}
          >
            <div className="flex flex-col h-full justify-between min-w-0">
              <div className="min-w-0">
                {!isTiny && (
                  <div
                    className="font-bold truncate"
                    style={{ fontSize: isLarge ? 16 : isMedium ? 13 : 11 }}
                  >
                    /{rect.node.segment}
                  </div>
                )}
                {isTiny && (
                  <div className="font-bold truncate" style={{ fontSize: 9 }}>
                    /{rect.node.segment}
                  </div>
                )}
                {isMedium && (
                  <div
                    className="opacity-70 mt-0.5"
                    style={{ fontSize: isLarge ? 13 : 11 }}
                  >
                    {rect.node.totalPages} pages
                  </div>
                )}
              </div>
              {isLarge && (
                <TierMiniBar
                  tierCounts={rect.node.tierCounts}
                  total={rect.node.totalPages}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- Page list for leaf nodes ---

function PageList({
  pages,
  projectId,
}: {
  pages: PageItem[];
  projectId: string;
}) {
  if (pages.length === 0) return null;

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-medium">Page</th>
            <th className="text-right p-2 font-medium">Words</th>
            <th className="text-left p-2 font-medium">Tier</th>
            <th className="text-left p-2 font-medium">Template</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => {
            let slug: string;
            try {
              slug = new URL(page.url).pathname;
            } catch {
              slug = page.url;
            }
            return (
              <tr
                key={page.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="p-2">
                  <a
                    href={`/projects/${projectId}/pages/${page.id}`}
                    className="text-primary underline-offset-4 hover:underline text-xs font-mono truncate block max-w-md"
                    title={page.url}
                  >
                    {slug}
                  </a>
                  {page.title && (
                    <div className="text-xs text-muted-foreground truncate max-w-md">
                      {page.title}
                    </div>
                  )}
                </td>
                <td className="p-2 text-right tabular-nums text-xs">
                  {page.wordCount ?? "—"}
                </td>
                <td className="p-2">
                  {page.contentTier && (
                    <Badge
                      className="text-[10px] border-0"
                      style={{
                        backgroundColor: TIER_BG[page.contentTier],
                        color: TIER_TEXT[page.contentTier],
                      }}
                    >
                      {TIER_LABELS[page.contentTier]}
                    </Badge>
                  )}
                </td>
                <td className="p-2 text-xs text-muted-foreground truncate max-w-[120px]">
                  {page.templateName ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Main component ---

export function SitemapTreemap({
  pages,
  projectId,
}: {
  pages: PageItem[];
  projectId: string;
}) {
  const rootNode = useMemo(() => buildTreemapData(pages), [pages]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathParam = searchParams.get("path") ?? "/";

  // Build drill stack from URL path param by walking the tree
  const drillStack = useMemo(() => {
    if (pathParam === "/") return [rootNode];

    const segments = pathParam.split("/").filter(Boolean);
    const stack: TreemapNode[] = [rootNode];
    let current = rootNode;

    for (let i = 0; i < segments.length; i++) {
      const targetPath = "/" + segments.slice(0, i + 1).join("/");
      const child = current.children.find((c) => {
        // Handle collapsed segments (e.g. "blog/category")
        return c.fullPath === targetPath || targetPath.startsWith(c.fullPath);
      });
      if (!child) break;
      stack.push(child);
      current = child;
      // If the child's fullPath is longer (collapsed), skip ahead
      if (child.fullPath !== targetPath) {
        break;
      }
    }
    return stack;
  }, [rootNode, pathParam]);

  const currentNode = drillStack[drillStack.length - 1];

  const updatePath = useCallback(
    (path: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (path === "/") {
        params.delete("path");
      } else {
        params.set("path", path);
      }
      params.delete("lp"); // reset list page
      const qs = params.toString();
      router.push(`?${qs}`, { scroll: false });
    },
    [router, searchParams]
  );

  function drillDown(node: TreemapNode) {
    updatePath(node.fullPath);
  }

  function drillUp() {
    if (drillStack.length > 1) {
      const parent = drillStack[drillStack.length - 2];
      updatePath(parent.fullPath);
    }
  }

  const displayChildren = currentNode.children;

  // At root: show pages with single-segment paths (e.g. /about, /contact).
  // Elsewhere: show all pages in subtree recursively.
  const displayPages = useMemo(() => {
    if (currentNode.fullPath === "/") {
      const all: PageItem[] = [];
      // Direct root pages (/) plus one page from each immediate child
      all.push(...currentNode.pages);
      for (const child of currentNode.children) {
        all.push(...child.pages);
      }
      return all;
    }
    const collected: PageItem[] = [];
    function collect(node: TreemapNode) {
      collected.push(...node.pages);
      for (const child of node.children) collect(child);
    }
    collect(currentNode);
    return collected;
  }, [currentNode]);

  const PAGE_SIZE = 50;
  const listPage = Number(searchParams.get("lp") ?? "1");
  const totalListPages = Math.ceil(displayPages.length / PAGE_SIZE);
  const paginatedPages = displayPages.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  function setListPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("lp");
    } else {
      params.set("lp", String(page));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  // Use full available width, fixed aspect ratio
  const treemapWidth = 1100;
  const treemapHeight = 600;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {drillStack.length > 1 && (
            <Button variant="ghost" size="sm" onClick={drillUp}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {drillStack.map((node, i) => (
              <span key={node.fullPath} className="flex items-center gap-1">
                {i > 0 && <span className="opacity-40">/</span>}
                <button
                  className={`hover:underline ${i === drillStack.length - 1 ? "text-foreground font-medium" : ""}`}
                  onClick={() => updatePath(node.fullPath)}
                >
                  {node.segment === "/" ? "/ (Root)" : node.segment}
                </button>
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {currentNode.totalPages} pages ·{" "}
            {currentNode.totalWords.toLocaleString()} words
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportSitemapCsv(pages, projectId)}
          title="Export full sitemap (all pages, not just the current drill-down)"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(currentNode.tierCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([tier, count]) => (
            <div key={tier} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm border"
                style={{
                  backgroundColor: TIER_BG[tier],
                  borderColor: TIER_BORDER[tier],
                }}
              />
              <span>
                {TIER_LABELS[tier] ?? tier}: {count}
              </span>
            </div>
          ))}
      </div>

      {/* Treemap */}
      {displayChildren.length > 0 && (
        <div className="overflow-x-auto">
          <TreemapView
            nodes={displayChildren}
            width={treemapWidth}
            height={treemapHeight}
            onDrillDown={drillDown}
          />
        </div>
      )}

      {/* All pages in subtree */}
      {displayPages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">
            Pages in {currentNode.fullPath || "/"}
            <span className="text-muted-foreground font-normal ml-1">
              ({displayPages.length})
            </span>
          </h3>
          <PageList pages={paginatedPages} projectId={projectId} />
          {totalListPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-muted-foreground">
                Showing {(listPage - 1) * PAGE_SIZE + 1}–{Math.min(listPage * PAGE_SIZE, displayPages.length)} of {displayPages.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={listPage <= 1}
                  onClick={() => setListPage(listPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {listPage} / {totalListPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={listPage >= totalListPages}
                  onClick={() => setListPage(listPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
