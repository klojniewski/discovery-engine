"use client";

import { useState } from "react";
import Link from "next/link";
import { ContentPreviewPanel } from "@/components/projects/content-preview-panel";

interface PageRow {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  rawMarkdown: string | null;
}

export function PagesTable({
  pages,
  projectId,
}: {
  pages: PageRow[];
  projectId: string;
}) {
  const [previewPage, setPreviewPage] = useState<PageRow | null>(null);

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
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
