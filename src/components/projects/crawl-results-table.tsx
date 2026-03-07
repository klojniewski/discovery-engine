"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Camera, Loader2, CheckCircle2, Image } from "lucide-react";
import { retakeScreenshot } from "@/actions/projects";

interface CrawlPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  screenshotUrl: string | null;
}

export function CrawlResultsTable({
  pages,
  projectName,
}: {
  pages: CrawlPage[];
  projectName: string;
}) {
  const [retaking, setRetaking] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function exportCsv() {
    const header = "URL,Title,Word Count,Screenshot URL";
    const rows = pages.map((p) => {
      const title = (p.title ?? "").replace(/"/g, '""');
      const ssUrl = screenshots[p.id] || p.screenshotUrl || "";
      return `"${p.url}","${title}",${p.wordCount ?? ""},"${ssUrl}"`;
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

  function handleRetake(pageId: string) {
    setRetaking(pageId);
    startTransition(async () => {
      try {
        const result = await retakeScreenshot(pageId);
        setScreenshots((prev) => ({ ...prev, [pageId]: result.screenshotUrl }));
      } catch (err) {
        console.error("Retake failed:", err);
      } finally {
        setRetaking(null);
      }
    });
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
              <th className="text-center p-3 font-medium">Screenshot</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const ssUrl = screenshots[page.id] || page.screenshotUrl;
              const isRetaking = retaking === page.id;
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
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {ssUrl ? (
                        <a
                          href={ssUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View screenshot"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </a>
                      ) : (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      )}
                      <button
                        onClick={() => handleRetake(page.id)}
                        disabled={isRetaking || isPending}
                        className="text-muted-foreground hover:text-primary p-0.5 rounded"
                        title="Retake screenshot"
                      >
                        {isRetaking ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
