"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileBarChart, RotateCcw } from "lucide-react";
import { generateReport } from "@/actions/report";
import { useRouter } from "next/navigation";

interface ReportGeneratorProps {
  projectId: string;
  hasExistingReport: boolean;
}

export function ReportGenerator({
  projectId,
  hasExistingReport,
}: ReportGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        await generateReport(projectId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="rounded-lg border p-6 text-center space-y-3">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-muted-foreground text-sm">
        {hasExistingReport
          ? "Re-generate the report to update with latest analysis data."
          : "Generate a report from the analysis results."}
      </p>
      <Button onClick={handleGenerate} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : hasExistingReport ? (
          <>
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-generate Report
          </>
        ) : (
          <>
            <FileBarChart className="mr-2 h-4 w-4" />
            Generate Report
          </>
        )}
      </Button>
    </div>
  );
}
