"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { captureAndDetectSections, getAnalysisStatus } from "@/actions/analysis";
import { estimateSectionDetectionCost, formatCost } from "@/lib/cost-estimates";

const STEPS = [
  { key: "screenshots", label: "Capturing Screenshots" },
  { key: "sections", label: "Detecting Sections (Vision AI)" },
  { key: "completed", label: "Analysis Complete" },
];

interface SectionRunnerProps {
  projectId: string;
  initialStatus: string;
  initialStep: string | null;
  templateCount: number;
}

export function SectionRunner({
  projectId,
  initialStatus,
  initialStep,
  templateCount,
}: SectionRunnerProps) {
  const [status, setStatus] = useState(initialStatus);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isRunning = status === "analyzing" && (currentStep === "screenshots" || currentStep === "sections");
  const canRun = status === "classified" || status === "analysis_failed";

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const result = await getAnalysisStatus(projectId);
        setStatus(result.status);
        setCurrentStep(result.step);
        setProgress(result.progress);
        if (result.error) setError(result.error);
        if (result.status === "reviewing") {
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, projectId]);

  function handleRun() {
    setError(null);
    setStatus("analyzing");
    setCurrentStep("screenshots");
    startTransition(async () => {
      try {
        await captureAndDetectSections(projectId);
        setStatus("reviewing");
        setCurrentStep("completed");
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("analysis_failed");
      }
    });
  }

  const costEstimate = formatCost(estimateSectionDetectionCost(templateCount));
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {canRun && (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
          <p className="text-muted-foreground">
            Capture screenshots for {templateCount} representative pages and detect UI sections.
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
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Screenshot &amp; Detect Sections
              </>
            )}
          </Button>
        </div>
      )}

      {isRunning && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-medium text-sm">Section Detection Pipeline</h3>
          <div className="space-y-2">
            {STEPS.map((step, idx) => {
              let icon;
              if (idx < currentStepIndex) {
                icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
              } else if (idx === currentStepIndex) {
                icon = <Loader2 className="h-4 w-4 animate-spin text-primary" />;
              } else {
                icon = <Circle className="h-4 w-4 text-muted-foreground" />;
              }

              const showProgress = idx === currentStepIndex && progress;

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
