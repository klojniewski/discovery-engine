"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Play, Loader2 } from "lucide-react";
import { togglePageExclusion, bulkToggleExclusion, startScraping } from "@/actions/projects";

interface PageItem {
  id: string;
  url: string;
  title: string | null;
  excluded: boolean | null;
}

interface TreeNode {
  segment: string;
  fullPath: string;
  pages: PageItem[];
  children: Map<string, TreeNode>;
}

function buildTree(pages: PageItem[]): TreeNode {
  const root: TreeNode = {
    segment: "/",
    fullPath: "/",
    pages: [],
    children: new Map(),
  };

  for (const page of pages) {
    try {
      const url = new URL(page.url);
      const segments = url.pathname.split("/").filter(Boolean);

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

function getAllPages(node: TreeNode): PageItem[] {
  const result: PageItem[] = [...node.pages];
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
            onChange={() => onToggleFolder(allPageIds, !allExcluded)}
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
              onChange={() => onTogglePage(page.id, !exclusions.has(page.id))}
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

export function PageTree({
  projectId,
  pages,
  initialStatus,
}: {
  projectId: string;
  pages: PageItem[];
  initialStatus: string;
}) {
  const [exclusions, setExclusions] = useState<Set<string>>(
    () => new Set(pages.filter((p) => p.excluded).map((p) => p.id))
  );
  const [isPending, startTransition] = useTransition();
  const [isScraping, setIsScraping] = useState(initialStatus === "scraping");
  const [error, setError] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(pages), [pages]);
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
      await bulkToggleExclusion(pages.map((p) => p.id), false);
    });
  }

  function deselectAll() {
    setExclusions(new Set(pages.map((p) => p.id)));
    startTransition(async () => {
      await bulkToggleExclusion(pages.map((p) => p.id), true);
    });
  }

  function handleStartScrape() {
    setError(null);
    setIsScraping(true);
    startTransition(async () => {
      try {
        await startScraping(projectId);
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setIsScraping(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">
            Select Pages ({selectedCount}/{pages.length})
          </h3>
          <div className="flex gap-1">
            <button onClick={selectAll} className="text-xs text-primary hover:underline">
              Select all
            </button>
            <span className="text-xs text-muted-foreground">/</span>
            <button onClick={deselectAll} className="text-xs text-primary hover:underline">
              Deselect all
            </button>
          </div>
        </div>
        <Button onClick={handleStartScrape} disabled={isPending || isScraping || selectedCount === 0}>
          {isScraping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Scrape {selectedCount} Pages
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border p-3 max-h-[600px] overflow-y-auto">
        {tree.pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center gap-1.5 py-1 hover:bg-muted/30 rounded px-1"
          >
            <span className="w-4.5" />
            <input
              type="checkbox"
              checked={!exclusions.has(page.id)}
              onChange={() => handleTogglePage(page.id, !exclusions.has(page.id))}
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
