"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { runClassificationAndScoring, getAnalysisStatus } from "@/actions/analysis";
import { estimateClassificationAndScoringCost, formatCost } from "@/lib/cost-estimates";

const STEPS = [
  { key: "classification", label: "Classifying & Scoring Pages" },
  { key: "saving", label: "Saving Results" },
  { key: "classified", label: "Classification Complete" },
];

interface ClassifyRunnerProps {
  projectId: string;
  initialStatus: string;
  initialStep: string | null;
  pageCount: number;
  compact?: boolean;
}

export function ClassifyRunner({
  projectId,
  initialStatus,
  initialStep,
  pageCount,
  compact,
}: ClassifyRunnerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAnalyzing = status === "analyzing" && (currentStep === "classification" || currentStep === "saving");
  const canRun = status === "crawled" || status === "analysis_failed";
  const isComplete = currentStep === "classified" || currentStep === "completed";

  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(async () => {
      try {
        const result = await getAnalysisStatus(projectId);
        setStatus(result.status);
        setCurrentStep(result.step);
        setProgress(result.progress);
        if (result.error) setError(result.error);
        if (result.status === "classified") {
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnalyzing, projectId]);

  function handleRun() {
    setError(null);
    setStatus("analyzing");
    setCurrentStep("classification");
    startTransition(async () => {
      try {
        await runClassificationAndScoring(projectId);
        setStatus("classified");
        setCurrentStep("classified");
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("analysis_failed");
      }
    });
  }

  const costEstimate = formatCost(estimateClassificationAndScoringCost(pageCount));

  // Compact mode: just show re-run button
  if (compact) {
    return (
      <Button variant="outline" size="sm" onClick={handleRun} disabled={isPending}>
        <RotateCcw className="mr-1 h-3 w-3" />
        Re-run Classification
      </Button>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {canRun && !isComplete && (
        <div className="rounded-lg border p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            {status === "analysis_failed"
              ? "Analysis failed. You can retry."
              : `Classify and score ${pageCount} pages using crawled content. No screenshots needed.`}
          </p>
          <p className="text-xs text-muted-foreground">
            Estimated cost: {costEstimate}
          </p>
          <Button onClick={handleRun} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : status === "analysis_failed" ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Classification
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Classify &amp; Score
              </>
            )}
          </Button>
        </div>
      )}

      {(isAnalyzing || isComplete) && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-medium text-sm">Classification Pipeline</h3>
          <div className="space-y-2">
            {STEPS.map((step, idx) => {
              let icon;
              if (idx < currentStepIndex || isComplete) {
                icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
              } else if (idx === currentStepIndex && isAnalyzing) {
                icon = <Loader2 className="h-4 w-4 animate-spin text-primary" />;
              } else {
                icon = <Circle className="h-4 w-4 text-muted-foreground" />;
              }

              const showProgress = idx === currentStepIndex && isAnalyzing && progress;

              return (
                <div key={step.key} className="flex items-center gap-2 text-sm">
                  {icon}
                  <span className={idx <= currentStepIndex ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                    {showProgress && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({progress.completed}/{progress.total})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
