"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  runOnPageSeoExtraction,
  computeSeoScores,
  runPsiAnalysis,
  getSeoStatus,
} from "@/actions/seo";

export function SeoExtractionButton({
  projectId,
  done,
}: {
  projectId: string;
  done: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(async () => {
      const status = await getSeoStatus(projectId);
      if (status.seoExtractionProgress) {
        setProgress(status.seoExtractionProgress);
      }
      if (status.seoExtractionComplete) {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [running, projectId]);

  return (
    <Button
      variant={done ? "outline" : "default"}
      size="sm"
      disabled={running}
      onClick={async () => {
        setRunning(true);
        await runOnPageSeoExtraction(projectId);
        window.location.reload();
      }}
    >
      {running
        ? progress
          ? `Extracting... ${progress.completed}/${progress.total}`
          : "Extracting..."
        : done
          ? "Re-extract"
          : "Extract"}
    </Button>
  );
}

export function ComputeScoresButton({ projectId }: { projectId: string }) {
  const [running, setRunning] = useState(false);

  return (
    <Button
      size="sm"
      disabled={running}
      onClick={async () => {
        setRunning(true);
        await computeSeoScores(projectId);
        window.location.reload();
      }}
    >
      {running ? "Computing..." : "Compute Scores"}
    </Button>
  );
}

export function PsiButton({
  projectId,
  done,
  hasKey,
  hasCandidates = true,
}: {
  projectId: string;
  done: boolean;
  hasKey: boolean;
  hasCandidates?: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(async () => {
      const status = await getSeoStatus(projectId);
      if (status.psiProgress) {
        setProgress(status.psiProgress);
      }
      if (status.psiComplete) {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [running, projectId]);

  if (!hasKey) {
    return (
      <p className="text-xs text-muted-foreground">
        Set <code>PAGESPEED_API_KEY</code> env var to enable
      </p>
    );
  }

  return (
    <Button
      variant={done ? "outline" : "default"}
      size="sm"
      disabled={running || !hasCandidates}
      onClick={async () => {
        setRunning(true);
        await runPsiAnalysis(projectId);
        window.location.reload();
      }}
    >
      {running
        ? progress
          ? `Running PSI... ${progress.completed}/${progress.total}`
          : "Running PSI..."
        : done
          ? "Re-run PSI"
          : "Run PSI"}
    </Button>
  );
}
