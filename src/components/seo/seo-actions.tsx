"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  runOnPageSeoExtraction,
  computeSeoScores,
  runPsiAnalysis,
} from "@/actions/seo";

export function SeoExtractionButton({
  projectId,
  done,
}: {
  projectId: string;
  done: boolean;
}) {
  const [running, setRunning] = useState(false);

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
      {running ? "Extracting..." : done ? "Re-extract" : "Extract"}
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
}: {
  projectId: string;
  done: boolean;
  hasKey: boolean;
}) {
  const [running, setRunning] = useState(false);

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
      disabled={running}
      onClick={async () => {
        setRunning(true);
        await runPsiAnalysis(projectId);
        window.location.reload();
      }}
    >
      {running ? "Running PSI..." : done ? "Re-run PSI" : "Run PSI"}
    </Button>
  );
}
