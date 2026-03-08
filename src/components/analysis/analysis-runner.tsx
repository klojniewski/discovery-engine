"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { runFullAnalysis, getAnalysisStatus } from "@/actions/analysis";

const STEPS = [
  { key: "classification", label: "Classifying Templates" },
  { key: "scoring", label: "Scoring Content" },
  { key: "components", label: "Detecting Components" },
  { key: "sections", label: "Detecting Sections" },
  { key: "completed", label: "Analysis Complete" },
];

interface AnalysisRunnerProps {
  projectId: string;
  initialStatus: string;
  initialStep: string | null;
}

export function AnalysisRunner({
  projectId,
  initialStatus,
  initialStep,
}: AnalysisRunnerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAnalyzing = status === "analyzing";
  const canRun =
    status === "crawled" || status === "reviewing" || status === "analysis_failed" || status === "crawl_failed";

  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(async () => {
      try {
        const result = await getAnalysisStatus(projectId);
        setStatus(result.status);
        setCurrentStep(result.step);
        setProgress(result.progress);
        if (result.error) setError(result.error);
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
        await runFullAnalysis(projectId);
        setStatus("reviewing");
        setCurrentStep("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("analysis_failed");
      }
    });
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

      {canRun && currentStep !== "completed" && (
        <div className="rounded-lg border p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            {status === "analysis_failed"
              ? "Analysis failed. You can retry."
              : "Ready to analyze. This will classify templates, score content, and detect components."}
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
                Retry Analysis
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      )}

      {(isAnalyzing || currentStep) && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-medium text-sm">Analysis Pipeline</h3>
          <div className="space-y-2">
            {STEPS.map((step, idx) => {
              let icon;
              if (idx < currentStepIndex || currentStep === "completed") {
                icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
              } else if (idx === currentStepIndex && isAnalyzing) {
                icon = <Loader2 className="h-4 w-4 animate-spin text-primary" />;
              } else {
                icon = <Circle className="h-4 w-4 text-muted-foreground" />;
              }

              const showProgress =
                idx === currentStepIndex && isAnalyzing && progress;

              return (
                <div key={step.key} className="flex items-center gap-2 text-sm">
                  {icon}
                  <span
                    className={
                      idx <= currentStepIndex
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
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

      {currentStep === "completed" && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRun} disabled={isPending}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Re-run Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
