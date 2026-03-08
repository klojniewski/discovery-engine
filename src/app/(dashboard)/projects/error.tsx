"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
      <h3 className="font-medium mb-1">Failed to load projects</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
