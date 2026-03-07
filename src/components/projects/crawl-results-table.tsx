"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { ContentPreviewPanel } from "./content-preview-panel";

interface CrawlPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  rawMarkdown: string | null;
}

export function CrawlResultsTable({
  pages,
  projectName,
}: {
  pages: CrawlPage[];
  projectName: string;
}) {
  const [previewPage, setPreviewPage] = useState<CrawlPage | null>(null);

  function exportCsv() {
    const header = "URL,Title,Word Count";
    const rows = pages.map((p) => {
      const title = (p.title ?? "").replace(/"/g, '""');
      return `"${p.url}","${title}",${p.wordCount ?? ""}`;
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
        <h3 className="font-medium">Crawled Pages ({pages.length})</h3>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
              <th className="text-center p-3 font-medium w-16">Content</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr
                key={page.id}
                className={`border-b last:border-0 hover:bg-muted/30 ${
                  previewPage?.id === page.id ? "bg-primary/5" : ""
                }`}
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
                <td className="p-3 text-center">
                  {page.rawMarkdown ? (
                    <button
                      onClick={() =>
                        setPreviewPage(
                          previewPage?.id === page.id ? null : page
                        )
                      }
                      className={`p-1 rounded hover:bg-muted ${
                        previewPage?.id === page.id
                          ? "text-primary bg-primary/10"
                          : "text-green-600"
                      }`}
                      title="Preview content"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-muted-foreground">
                      <FileText className="h-4 w-4 inline" />
                    </span>
                  )}
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
    </div>
  );
}
