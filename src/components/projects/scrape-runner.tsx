"use client";

import { useEffect, useState } from "react";
import { getScrapeProgress } from "@/actions/projects";
import { Loader2 } from "lucide-react";

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

  const isScraping = status === "scraping";

  useEffect(() => {
    if (!isScraping) return;

    const interval = setInterval(() => {
      getScrapeProgress(projectId)
        .then((result) => {
          setStatus(result.status);
          setProgress(result.progress);
          if (result.status !== "scraping") {
            window.location.reload();
          }
        })
        .catch(console.error);
    }, 3000);

    return () => clearInterval(interval);
  }, [isScraping, projectId]);

  if (!isScraping) return null;

  return (
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
  );
}
