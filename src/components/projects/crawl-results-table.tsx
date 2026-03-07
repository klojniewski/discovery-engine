"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

      {/* Content preview panel - slides in from right */}
      {previewPage && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setPreviewPage(null)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-[520px] max-w-[90vw] bg-background border-l shadow-lg z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30 shrink-0">
              <div className="min-w-0 mr-3">
                <p className="text-sm font-medium truncate">
                  {previewPage.title || "Untitled"}
                </p>
                <a
                  href={previewPage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate block"
                >
                  {previewPage.url}
                </a>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {previewPage.wordCount} words
                </p>
              </div>
              <button
                onClick={() => setPreviewPage(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground">
                <ReactMarkdown>
                  {previewPage.rawMarkdown || "No content available."}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
