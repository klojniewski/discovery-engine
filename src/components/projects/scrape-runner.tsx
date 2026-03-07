"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startScraping, getScrapeProgress } from "@/actions/projects";
import { Loader2, Play } from "lucide-react";

interface ScrapeRunnerProps {
  projectId: string;
  initialStatus: string;
  selectedCount: number;
  scrapedCount: number;
}

export function ScrapeRunner({
  projectId,
  initialStatus,
  selectedCount,
  scrapedCount,
}: ScrapeRunnerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isScraping = status === "scraping";
  const canScrape =
    status === "crawled" ||
    status === "reviewing" ||
    status === "analyzing" ||
    status === "analysis_failed";
  const isDone = scrapedCount > 0 && scrapedCount >= selectedCount;

  useEffect(() => {
    if (!isScraping) return;

    const interval = setInterval(() => {
      getScrapeProgress(projectId)
        .then((result) => {
          setStatus(result.status);
          setProgress(result.progress);
        })
        .catch((err) => setError(String(err)));
    }, 3000);

    return () => clearInterval(interval);
  }, [isScraping, projectId]);

  function handleStartScrape() {
    setError(null);
    setStatus("scraping");
    startTransition(async () => {
      try {
        await startScraping(projectId);
        setStatus("reviewing");
        setProgress(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus(canScrape ? "crawled" : status);
      }
    });
  }

  if (selectedCount === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">
          No pages selected. Go to the <strong>Crawl</strong> tab and select pages to scrape.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isScraping && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Scraping pages and capturing screenshots...
              {progress && (
                <span className="ml-1.5 text-muted-foreground">
                  ({progress.completed}/{progress.total})
                </span>
              )}
            </span>
          </div>
          {progress && progress.total > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (progress.completed / progress.total) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {!isScraping && canScrape && !isDone && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="text-sm text-blue-900">
            <strong>{selectedCount} pages</strong> selected for scraping.
            {scrapedCount > 0 && (
              <> {scrapedCount} already scraped — only remaining pages will be processed.</>
            )}
          </p>
          <Button onClick={handleStartScrape} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {scrapedCount > 0 ? "Continue Scraping" : "Start Scraping"}
              </>
            )}
          </Button>
        </div>
      )}

      {!isScraping && isDone && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            All <strong>{scrapedCount}</strong> pages scraped with content and screenshots. Ready for analysis.
          </p>
        </div>
      )}
    </div>
  );
}
