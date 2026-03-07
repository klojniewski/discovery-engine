"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, CheckCircle2, Image, FileText, Download } from "lucide-react";
import { retakeScreenshot } from "@/actions/projects";
import { ContentPreviewPanel } from "./content-preview-panel";

interface ScrapedPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  screenshotUrl: string | null;
  hasMarkdown: boolean;
  rawMarkdown: string | null;
}

export function ScrapeResultsTable({ projectId, pages }: { projectId: string; pages: ScrapedPage[] }) {
  const [retaking, setRetaking] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [isZipping, setIsZipping] = useState(false);
  const [previewPage, setPreviewPage] = useState<ScrapedPage | null>(null);

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

  async function downloadScreenshotsZip() {
    setIsZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const pagesWithScreenshots = pages.filter(
        (p) => screenshots[p.id] || p.screenshotUrl
      );

      await Promise.all(
        pagesWithScreenshots.map(async (page) => {
          const ssUrl = screenshots[page.id] || page.screenshotUrl;
          if (!ssUrl) return;

          try {
            const res = await fetch(ssUrl);
            if (!res.ok) return;
            const blob = await res.blob();

            // Create filename from URL path
            const urlPath = new URL(page.url).pathname;
            const filename =
              (urlPath === "/" ? "homepage" : urlPath.replace(/\//g, "_").replace(/^_/, "")) + ".png";

            zip.file(filename, blob);
          } catch {
            console.warn(`Failed to fetch screenshot for ${page.url}`);
          }
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screenshots-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed:", err);
    } finally {
      setIsZipping(false);
    }
  }

  const screenshotCount = pages.filter(
    (p) => screenshots[p.id] || p.screenshotUrl
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Scraped Pages ({pages.length})</h3>
        {screenshotCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={downloadScreenshotsZip}
            disabled={isZipping}
          >
            {isZipping ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Zipping...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Download Screenshots ({screenshotCount})
              </>
            )}
          </Button>
        )}
      </div>
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
                    <Link
                      href={`/projects/${projectId}/pages/${page.id}`}
                      className="hover:text-primary hover:underline underline-offset-4"
                    >
                      {page.title || new URL(page.url).pathname}
                    </Link>
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

      {previewPage && (
        <ContentPreviewPanel
          page={previewPage}
          onClose={() => setPreviewPage(null)}
        />
      )}
    </div>
  );
}
