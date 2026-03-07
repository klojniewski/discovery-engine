"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight, ChevronDown } from "lucide-react";
import { togglePageExclusion, bulkToggleExclusion } from "@/actions/projects";

interface CrawlPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  excluded: boolean | null;
}

interface TreeNode {
  segment: string;
  fullPath: string;
  pages: CrawlPage[];
  children: Map<string, TreeNode>;
}

function buildTree(pages: CrawlPage[], baseUrl: string): TreeNode {
  const root: TreeNode = {
    segment: "/",
    fullPath: "/",
    pages: [],
    children: new Map(),
  };

  for (const page of pages) {
    try {
      const url = new URL(page.url);
      const pathname = url.pathname;
      const segments = pathname.split("/").filter(Boolean);

      if (segments.length === 0) {
        root.pages.push(page);
        continue;
      }

      let current = root;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!current.children.has(seg)) {
          current.children.set(seg, {
            segment: seg,
            fullPath: "/" + segments.slice(0, i + 1).join("/"),
            pages: [],
            children: new Map(),
          });
        }
        current = current.children.get(seg)!;
      }
      current.pages.push(page);
    } catch {
      root.pages.push(page);
    }
  }

  return root;
}

function getAllPageIds(node: TreeNode): string[] {
  const ids: string[] = node.pages.map((p) => p.id);
  for (const child of node.children.values()) {
    ids.push(...getAllPageIds(child));
  }
  return ids;
}

function getAllPages(node: TreeNode): CrawlPage[] {
  const result: CrawlPage[] = [...node.pages];
  for (const child of node.children.values()) {
    result.push(...getAllPages(child));
  }
  return result;
}

function TreeBranch({
  node,
  depth,
  exclusions,
  onTogglePage,
  onToggleFolder,
}: {
  node: TreeNode;
  depth: number;
  exclusions: Set<string>;
  onTogglePage: (pageId: string, excluded: boolean) => void;
  onToggleFolder: (pageIds: string[], excluded: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  const allPages = useMemo(() => getAllPages(node), [node]);
  const allPageIds = useMemo(() => allPages.map((p) => p.id), [allPages]);
  const excludedCount = allPages.filter((p) => exclusions.has(p.id)).length;
  const allExcluded = excludedCount === allPages.length && allPages.length > 0;
  const someExcluded = excludedCount > 0 && !allExcluded;

  const hasChildren = node.children.size > 0;
  const sortedChildren = useMemo(
    () =>
      Array.from(node.children.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      ),
    [node.children]
  );

  return (
    <div>
      {/* Folder row */}
      {(hasChildren || node.pages.length > 0) && depth > 0 && (
        <div
          className="flex items-center gap-1.5 py-1 hover:bg-muted/30 rounded px-1 group"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4.5" />
          )}
          <input
            type="checkbox"
            checked={!allExcluded}
            ref={(el) => {
              if (el) el.indeterminate = someExcluded;
            }}
            onChange={() => onToggleFolder(allPageIds, !allExcluded ? true : false)}
            className="rounded border-gray-300"
          />
          <span className="font-mono text-sm text-muted-foreground">
            /{node.segment}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            ({allPages.length - excludedCount}/{allPages.length})
          </span>
        </div>
      )}

      {/* Root pages (homepage etc) */}
      {(expanded || depth === 0) &&
        node.pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center gap-1.5 py-1 hover:bg-muted/30 rounded px-1"
            style={{ paddingLeft: `${(depth + (hasChildren ? 1 : 0)) * 16 + 4}px` }}
          >
            <span className="w-4.5" />
            <input
              type="checkbox"
              checked={!exclusions.has(page.id)}
              onChange={() =>
                onTogglePage(page.id, !exclusions.has(page.id))
              }
              className="rounded border-gray-300"
            />
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-mono text-xs hover:underline truncate ${
                exclusions.has(page.id)
                  ? "text-muted-foreground line-through"
                  : "text-primary"
              }`}
            >
              {page.url}
            </a>
            {page.title && (
              <span className="text-xs text-muted-foreground truncate ml-2 hidden lg:inline">
                {page.title}
              </span>
            )}
          </div>
        ))}

      {/* Children */}
      {expanded &&
        sortedChildren.map(([key, child]) => (
          <TreeBranch
            key={key}
            node={child}
            depth={depth + 1}
            exclusions={exclusions}
            onTogglePage={onTogglePage}
            onToggleFolder={onToggleFolder}
          />
        ))}
    </div>
  );
}

export function CrawlResultsTable({
  pages,
  projectName,
}: {
  pages: CrawlPage[];
  projectName: string;
}) {
  const [exclusions, setExclusions] = useState<Set<string>>(
    () => new Set(pages.filter((p) => p.excluded).map((p) => p.id))
  );
  const [isPending, startTransition] = useTransition();

  const baseUrl = pages.length > 0 ? new URL(pages[0].url).origin : "";

  const tree = useMemo(() => buildTree(pages, baseUrl), [pages, baseUrl]);

  const selectedCount = pages.length - exclusions.size;

  function handleTogglePage(pageId: string, excluded: boolean) {
    setExclusions((prev) => {
      const next = new Set(prev);
      if (excluded) next.add(pageId);
      else next.delete(pageId);
      return next;
    });
    startTransition(async () => {
      await togglePageExclusion(pageId, excluded);
    });
  }

  function handleToggleFolder(pageIds: string[], excluded: boolean) {
    setExclusions((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (excluded) next.add(id);
        else next.delete(id);
      }
      return next;
    });
    startTransition(async () => {
      await bulkToggleExclusion(pageIds, excluded);
    });
  }

  function selectAll() {
    setExclusions(new Set());
    startTransition(async () => {
      await bulkToggleExclusion(
        pages.map((p) => p.id),
        false
      );
    });
  }

  function deselectAll() {
    setExclusions(new Set(pages.map((p) => p.id)));
    startTransition(async () => {
      await bulkToggleExclusion(
        pages.map((p) => p.id),
        true
      );
    });
  }

  function exportCsv() {
    const header = "URL,Title,Word Count,Selected";
    const rows = pages.map((p) => {
      const title = (p.title ?? "").replace(/"/g, '""');
      return `"${p.url}","${title}",${p.wordCount ?? ""},${!exclusions.has(p.id) ? "Yes" : "No"}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const date = new Date().toISOString().slice(0, 10);
    a.download = `${slug}-crawl-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">
            Page Tree ({selectedCount}/{pages.length} selected)
          </h3>
          <div className="flex gap-1">
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-xs text-muted-foreground">/</span>
            <button
              onClick={deselectAll}
              className="text-xs text-primary hover:underline"
            >
              Deselect all
            </button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-lg border p-3 max-h-[600px] overflow-y-auto">
        {/* Root pages */}
        {tree.pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center gap-1.5 py-1 hover:bg-muted/30 rounded px-1"
          >
            <span className="w-4.5" />
            <input
              type="checkbox"
              checked={!exclusions.has(page.id)}
              onChange={() =>
                handleTogglePage(page.id, !exclusions.has(page.id))
              }
              className="rounded border-gray-300"
            />
            <span className="font-mono text-xs text-primary font-medium">
              / (homepage)
            </span>
            {page.title && (
              <span className="text-xs text-muted-foreground ml-2">
                {page.title}
              </span>
            )}
          </div>
        ))}
        {/* Tree branches */}
        {Array.from(tree.children.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => (
            <TreeBranch
              key={key}
              node={child}
              depth={1}
              exclusions={exclusions}
              onTogglePage={handleTogglePage}
              onToggleFolder={handleToggleFolder}
            />
          ))}
      </div>
    </div>
  );
}
