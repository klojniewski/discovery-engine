"use client";

import { useState } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SiteArchitectureNode } from "@/types/report";

interface SiteArchitectureProps {
  tree: SiteArchitectureNode[];
  notes?: string | null;
}

const TIER_COLORS: Record<string, string> = {
  must_migrate: "bg-green-100 text-green-800",
  improve: "bg-blue-100 text-blue-800",
  consolidate: "bg-yellow-100 text-yellow-800",
  archive: "bg-red-100 text-red-800",
};

const TIER_LABELS: Record<string, string> = {
  must_migrate: "Migrate",
  improve: "Improve",
  consolidate: "Consolidate",
  archive: "Archive",
};

export function SiteArchitecture({ tree, notes }: SiteArchitectureProps) {
  const totalPages = countPages(tree);

  return (
    <section id="site-architecture">
      <h2 className="text-2xl font-bold mb-2">Site Architecture</h2>
      <p className="text-muted-foreground mb-6">
        URL hierarchy showing {totalPages} pages organized by path structure
      </p>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">Legend:</span>
          {Object.entries(TIER_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-sm ${TIER_COLORS[key]}`}
              />
              {label}
            </span>
          ))}
        </div>
        <div className="p-2">
          {tree.map((node) => (
            <TreeNode key={node.fullPath} node={node} depth={0} />
          ))}
        </div>
      </div>

      {notes && (
        <div className="mt-6 rounded-lg border bg-amber-50/50 p-4 text-sm">
          <p className="font-medium text-amber-900 mb-1">Notes</p>
          <p className="text-amber-800 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </section>
  );
}

function TreeNode({
  node,
  depth,
}: {
  node: SiteArchitectureNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const isFolder = hasChildren && !node.page;
  const isFolderWithPage = hasChildren && !!node.page;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded hover:bg-muted/50 text-sm cursor-default ${
          hasChildren ? "cursor-pointer" : ""
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <ChevronRight
            className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        ) : (
          <span className="w-3.5" />
        )}

        {isFolder || isFolderWithPage ? (
          expanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          )
        ) : (
          <File className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        <span className="font-mono text-xs truncate">
          {node.segment === "/" ? "/" : `/${node.segment}`}
        </span>

        {node.page && (
          <>
            <span className="text-xs text-muted-foreground truncate ml-2">
              {node.page.title}
            </span>
            {node.page.contentTier && (
              <Badge
                className={`text-[10px] px-1.5 py-0 border-0 shrink-0 ml-auto ${
                  TIER_COLORS[node.page.contentTier] ?? ""
                }`}
              >
                {TIER_LABELS[node.page.contentTier] ?? node.page.contentTier}
              </Badge>
            )}
            {node.page.wordCount != null && (
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-1">
                {node.page.wordCount}w
              </span>
            )}
          </>
        )}

        {!node.page && hasChildren && (
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {countPages([node])} pages
          </span>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <TreeNode key={child.fullPath} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

function countPages(nodes: SiteArchitectureNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.page) count++;
    count += countPages(node.children);
  }
  return count;
}
