"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  startProjectCrawl,
  pollCrawlStatus,
  startScreenshots,
  getScreenshotProgress,
} from "@/actions/projects";
import { Loader2, CheckCircle2, Circle, Camera } from "lucide-react";

interface CrawlProgressProps {
  projectId: string;
  initialStatus: string;
  pageCount: number;
}

export function CrawlProgress({ projectId, initialStatus, pageCount }: CrawlProgressProps) {
  const [status, setStatus] = useState(initialStatus);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [screenshotProgress, setScreenshotProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCrawling = status === "crawling";
  const isScreenshotting = status === "screenshotting";
  const canStartCrawl = status === "created" || status === "crawl_failed";
  const canStartScreenshots = status === "crawled";
  const isDone = status === "reviewing" || status === "analyzing" || status === "analysis_failed";

  // Poll crawl status
  useEffect(() => {
    if (!isCrawling) return;

    const interval = setInterval(() => {
      pollCrawlStatus(projectId)
        .then((result) => {
          setStatus(result.status);
          setTotal(result.total);
          setCompleted(result.completed);
        })
        .catch((err) => setError(String(err)));
    }, 5000);

    return () => clearInterval(interval);
  }, [isCrawling, projectId]);

  // Poll screenshot progress
  useEffect(() => {
    if (!isScreenshotting) return;

    const interval = setInterval(() => {
      getScreenshotProgress(projectId)
        .then((result) => {
          setStatus(result.status);
          setScreenshotProgress(result.progress);
        })
        .catch((err) => setError(String(err)));
    }, 3000);

    return () => clearInterval(interval);
  }, [isScreenshotting, projectId]);

  function handleStartCrawl() {
    setError(null);
    startTransition(async () => {
      try {
        await startProjectCrawl(projectId);
        setStatus("crawling");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleStartScreenshots() {
    setError(null);
    setStatus("screenshotting");
    startTransition(async () => {
      try {
        await startScreenshots(projectId);
        setStatus("reviewing");
        setScreenshotProgress(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("crawled");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {canStartCrawl && (
        <div className="rounded-lg border p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            {status === "crawl_failed"
              ? "The previous crawl failed. You can retry."
              : "Ready to crawl. Click below to start."}
          </p>
          <Button onClick={handleStartCrawl} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : status === "crawl_failed" ? (
              "Retry Crawl"
            ) : (
              "Start Crawl"
            )}
          </Button>
        </div>
      )}

      {/* Pipeline steps */}
      {(isCrawling || isScreenshotting || canStartScreenshots || isDone) && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-medium text-sm">Crawl Pipeline</h3>
          <div className="space-y-2">
            {/* Step 1: Crawling */}
            <div className="flex items-center gap-2 text-sm">
              {isCrawling ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : canStartScreenshots || isScreenshotting || isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={isCrawling || canStartScreenshots || isScreenshotting || isDone ? "text-foreground" : "text-muted-foreground"}>
                Crawling Pages
                {isCrawling && total > 0 && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({completed}/{total})
                  </span>
                )}
                {(canStartScreenshots || isScreenshotting || isDone) && pageCount > 0 && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({pageCount} pages)
                  </span>
                )}
              </span>
            </div>

            {/* Step 2: Screenshots */}
            <div className="flex items-center gap-2 text-sm">
              {isScreenshotting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={isScreenshotting || isDone ? "text-foreground" : "text-muted-foreground"}>
                Capturing Screenshots
                {isScreenshotting && screenshotProgress && (
                  <span className="ml-1.5 text-muted-foreground">
                    ({screenshotProgress.completed}/{screenshotProgress.total})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Progress bar for crawling */}
          {isCrawling && total > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (completed / total) * 100)}%` }}
              />
            </div>
          )}

          {/* Progress bar for screenshots */}
          {isScreenshotting && screenshotProgress && screenshotProgress.total > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (screenshotProgress.completed / screenshotProgress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Start screenshots button */}
      {canStartScreenshots && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 space-y-3">
          <p className="font-medium text-blue-900">Crawl completed! {pageCount} pages found.</p>
          <p className="text-sm text-blue-700">
            Now capture screenshots for all crawled pages.
          </p>
          <Button onClick={handleStartScreenshots} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Capture Screenshots
              </>
            )}
          </Button>
        </div>
      )}

      {isDone && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-2">
          <p className="font-medium text-green-900">Crawl & screenshots complete!</p>
          <p className="text-sm text-green-700">
            {pageCount} pages crawled with screenshots. Ready for analysis.
          </p>
        </div>
      )}
    </div>
  );
}
