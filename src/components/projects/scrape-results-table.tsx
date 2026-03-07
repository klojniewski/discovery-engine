"use client";

import { useState, useTransition } from "react";
import { Camera, Loader2, CheckCircle2, Image, FileText, Code } from "lucide-react";
import { retakeScreenshot } from "@/actions/projects";

interface ScrapedPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  screenshotUrl: string | null;
  hasMarkdown: boolean;
  hasHtml: boolean;
}

export function ScrapeResultsTable({ pages }: { pages: ScrapedPage[] }) {
  const [retaking, setRetaking] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

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
      <h3 className="font-medium mb-3">Scraped Pages ({pages.length})</h3>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
              <th className="text-center p-3 font-medium">Content</th>
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
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <span title={page.hasMarkdown ? "Markdown captured" : "No markdown"}>
                        <FileText className={`h-4 w-4 ${page.hasMarkdown ? "text-green-600" : "text-muted-foreground"}`} />
                      </span>
                      <span title={page.hasHtml ? "HTML captured" : "No HTML"}>
                        <Code className={`h-4 w-4 ${page.hasHtml ? "text-green-600" : "text-muted-foreground"}`} />
                      </span>
                    </div>
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
