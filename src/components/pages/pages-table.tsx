"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ContentPreviewPanel } from "@/components/projects/content-preview-panel";

interface PageRow {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  rawMarkdown: string | null;
  seoScore?: number | null;
  isRedirectCritical?: boolean | null;
}

export function PagesTable({
  pages,
  projectId,
}: {
  pages: PageRow[];
  projectId: string;
}) {
  const [previewPage, setPreviewPage] = useState<PageRow | null>(null);
  const hasSeoScores = pages.some((p) => p.seoScore != null);

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
              {hasSeoScores && (
                <th className="text-right p-3 font-medium">SEO</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr
                key={page.id}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => setPreviewPage(page)}
              >
                <td className="p-3 font-mono text-xs max-w-xs truncate">
                  <Link
                    href={`/projects/${projectId}/pages/${page.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {page.url}
                  </Link>
                </td>
                <td className="p-3 max-w-xs truncate">
                  {page.title || "\u2014"}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {page.wordCount ?? "\u2014"}
                </td>
                {hasSeoScores && (
                  <td className="p-3 text-right">
                    {page.seoScore != null ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {page.isRedirectCritical && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Critical
                          </Badge>
                        )}
                        <span
                          className={`tabular-nums font-medium ${
                            page.seoScore >= 50
                              ? "text-red-600"
                              : page.seoScore >= 25
                                ? "text-amber-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {page.seoScore}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{"\u2014"}</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
