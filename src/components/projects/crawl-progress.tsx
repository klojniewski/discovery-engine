"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startProjectCrawl, pollCrawlStatus } from "@/actions/projects";
import { Loader2 } from "lucide-react";

interface CrawlProgressProps {
  projectId: string;
  initialStatus: string;
  pageCount: number;
}

export function CrawlProgress({ projectId, initialStatus, pageCount }: CrawlProgressProps) {
  const [status, setStatus] = useState(initialStatus);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCrawling = status === "crawling";
  const canStartCrawl = status === "created" || status === "crawl_failed";
  const isCrawled = !canStartCrawl && !isCrawling;

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
              : "Ready to crawl. Click below to start discovering pages."}
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

      {isCrawling && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Discovering pages...
              {total > 0 && (
                <span className="ml-1.5 text-muted-foreground">
                  ({completed}/{total})
                </span>
              )}
            </span>
          </div>
          {total > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (completed / total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {isCrawled && pageCount > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            <strong>{pageCount} pages</strong> discovered. Go to the <strong>Analysis</strong> tab to classify templates and score content tiers.
          </p>
        </div>
      )}
    </div>
  );
}
