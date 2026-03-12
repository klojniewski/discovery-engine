"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { ContentPreviewPanel } from "@/components/projects/content-preview-panel";

interface PageItem {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  contentTier: string | null;
  templateName: string | null;
  excluded: boolean | null;
  rawMarkdown: string | null;
}

interface TreeNode {
  segment: string;
  fullPath: string;
  pages: PageItem[];
  children: Map<string, TreeNode>;
  totalPages: number;
  tierCounts: Record<string, number>;
}

const TIER_COLORS: Record<string, string> = {
  must_migrate: "bg-green-100 text-green-800",
  improve: "bg-blue-100 text-blue-800",
  consolidate: "bg-yellow-100 text-yellow-800",
  archive: "bg-red-100 text-red-800",
};

const TIER_LABELS: Record<string, string> = {
  must_migrate: "Must Migrate",
  improve: "Improve",
  consolidate: "Consolidate",
  archive: "Archive",
};

function buildTree(pages: PageItem[]): TreeNode {
  const root: TreeNode = {
    segment: "/",
    fullPath: "",
    pages: [],
    children: new Map(),
    totalPages: 0,
    tierCounts: {},
  };

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
    } else {
      let current = root;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!current.children.has(seg)) {
          current.children.set(seg, {
            segment: seg,
            fullPath: "/" + segments.slice(0, i + 1).join("/"),
            pages: [],
            children: new Map(),
            totalPages: 0,
            tierCounts: {},
          });
        }
        current = current.children.get(seg)!;
        if (i === segments.length - 1) {
          current.pages.push(page);
        }
      }
    }
  }

  function calcTotals(node: TreeNode): void {
    node.totalPages = node.pages.length;
    node.tierCounts = {};
    for (const p of node.pages) {
      if (p.contentTier) {
        node.tierCounts[p.contentTier] = (node.tierCounts[p.contentTier] ?? 0) + 1;
      }
    }
    for (const child of node.children.values()) {
      calcTotals(child);
      node.totalPages += child.totalPages;
      for (const [tier, count] of Object.entries(child.tierCounts)) {
        node.tierCounts[tier] = (node.tierCounts[tier] ?? 0) + count;
      }
    }
  }

  calcTotals(root);
  return root;
}

function TierBar({ tierCounts, total }: { tierCounts: Record<string, number>; total: number }) {
  if (total === 0) return null;
  const tiers = ["must_migrate", "improve", "consolidate", "archive"];
  return (
    <div className="flex h-2 w-20 rounded-full overflow-hidden bg-muted shrink-0">
      {tiers.map((tier) => {
        const count = tierCounts[tier] ?? 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={tier}
            className={TIER_COLORS[tier]?.split(" ")[0] ?? "bg-muted"}
            style={{ width: `${pct}%` }}
            title={`${TIER_LABELS[tier]}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function TreeNodeRow({
  node,
  depth,
  defaultOpen,
  onSelectPage,
}: {
  node: TreeNode;
  depth: number;
  defaultOpen: boolean;
  onSelectPage: (page: PageItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node.children.size > 0;
  const sortedChildren = useMemo(
    () =>
      [...node.children.values()].sort((a, b) => b.totalPages - a.totalPages),
    [node.children]
  );

  return (
    <>
      {/* Folder row */}
      {node.segment !== "/" && (
        <div
          className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-muted/50 rounded-md text-sm group"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <button
            className="shrink-0 p-0.5 rounded hover:bg-muted"
            onClick={() => setOpen(!open)}
          >
            {hasChildren ? (
              open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )
            ) : (
              <span className="inline-block w-3.5 h-3.5" />
            )}
          </button>
          {hasChildren ? (
            open ? (
              <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500 shrink-0" />
            )
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medium truncate">/{node.segment}</span>
          <span className="text-xs text-muted-foreground ml-1 shrink-0">
            {node.totalPages}
          </span>
          <TierBar tierCounts={node.tierCounts} total={node.totalPages} />
        </div>
      )}

      {/* Pages directly in this folder */}
      {(open || node.segment === "/") &&
        node.pages.map((page) => (
          <PageRow
            key={page.id}
            page={page}
            depth={node.segment === "/" ? 0 : depth + 1}
            onSelect={onSelectPage}
          />
        ))}

      {/* Child folders */}
      {(open || node.segment === "/") &&
        sortedChildren.map((child) => (
          <TreeNodeRow
            key={child.fullPath}
            node={child}
            depth={node.segment === "/" ? depth : depth + 1}
            defaultOpen={child.totalPages <= 10 || sortedChildren.length <= 3}
            onSelectPage={onSelectPage}
          />
        ))}
    </>
  );
}

function PageRow({
  page,
  depth,
  onSelect,
}: {
  page: PageItem;
  depth: number;
  onSelect: (page: PageItem) => void;
}) {
  const tierConfig = page.contentTier
    ? { color: TIER_COLORS[page.contentTier], label: TIER_LABELS[page.contentTier] }
    : null;

  let slug: string;
  try {
    const { pathname } = new URL(page.url);
    const parts = pathname.split("/").filter(Boolean);
    slug = parts[parts.length - 1] || "/";
  } catch {
    slug = page.url;
  }

  return (
    <div
      className="flex items-center gap-1.5 py-1 px-2 hover:bg-muted/30 rounded-md text-sm group cursor-pointer"
      style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}
      onClick={() => onSelect(page)}
    >
      <span className="w-4.5 shrink-0" />
      <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span
        className="text-primary truncate"
        title={page.url}
      >
        {slug}
      </span>
      {page.title && (
        <span className="text-xs text-muted-foreground truncate hidden group-hover:inline">
          — {page.title}
        </span>
      )}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {page.wordCount != null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {page.wordCount}w
          </span>
        )}
        {tierConfig && (
          <Badge className={`${tierConfig.color} text-[10px] border-0 px-1.5 py-0`}>
            {tierConfig.label}
          </Badge>
        )}
        {page.templateName && (
          <span className="text-[10px] text-muted-foreground hidden group-hover:inline">
            {page.templateName}
          </span>
        )}
      </div>
    </div>
  );
}

export function PageTreeView({
  pages,
  projectId,
}: {
  pages: PageItem[];
  projectId: string;
}) {
  const tree = useMemo(() => buildTree(pages), [pages]);
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);

  return (
    <>
      <div className="rounded-lg border p-2 font-mono text-sm">
        <TreeNodeRow
          node={tree}
          depth={0}
          defaultOpen
          onSelectPage={setPreviewPage}
        />
      </div>

      {previewPage && (
        <ContentPreviewPanel
          page={previewPage}
          onClose={() => setPreviewPage(null)}
        />
      )}
    </>
  );
}
