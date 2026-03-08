"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scan, ExternalLink } from "lucide-react";
import { runPageDetection } from "@/actions/analysis";
import { matchSectionType } from "@/lib/section-matching";
import type { PageSection } from "@/types/page-sections";

interface SectionTypeInfo {
  slug: string;
  name: string;
  category: string;
  svgContent: string | null;
}

interface PageDetailProps {
  page: {
    id: string;
    projectId: string;
    url: string;
    title: string | null;
    wordCount: number | null;
    screenshotUrl: string | null;
    contentTier: string | null;
    templateName: string | null;
    detectedSections: PageSection[] | null;
  };
  sectionTypes: SectionTypeInfo[];
}

const TIER_COLORS: Record<string, string> = {
  must_migrate: "bg-green-100 text-green-800",
  improve: "bg-blue-100 text-blue-800",
  consolidate: "bg-yellow-100 text-yellow-800",
  archive: "bg-red-100 text-red-800",
};

const COMPLEXITY_VARIANT: Record<string, "destructive" | "default" | "secondary"> = {
  complex: "destructive",
  moderate: "default",
  simple: "secondary",
};

export function PageDetail({ page, sectionTypes }: PageDetailProps) {
  const [sections, setSections] = useState<PageSection[] | null>(
    page.detectedSections
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDetect() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await runPageDetection(page.id);
        setSections(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Detection failed"
        );
      }
    });
  }

  const totalComponents = sections?.reduce(
    (sum, s) => sum + s.components.length,
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Page metadata */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{page.title || "Untitled Page"}</h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {page.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {page.wordCount != null && (
            <Badge variant="outline">{page.wordCount} words</Badge>
          )}
          {page.templateName && (
            <Badge variant="outline">{page.templateName}</Badge>
          )}
          {page.contentTier && (
            <Badge
              className={`${TIER_COLORS[page.contentTier] ?? ""} border-0 text-xs`}
            >
              {page.contentTier.replace(/_/g, " ")}
            </Badge>
          )}
          {sections && (
            <Badge variant="outline">
              {sections.length} sections, {totalComponents} components
            </Badge>
          )}
        </div>
      </div>

      {/* Screenshot */}
      {page.screenshotUrl ? (
        <div className="rounded-lg border overflow-hidden bg-muted">
          <img
            src={page.screenshotUrl}
            alt={`Screenshot of ${page.url}`}
            className="w-full block"
          />
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>No screenshot available.</p>
          <p className="text-sm mt-1">
            Go to the Scrape tab to capture a screenshot first.
          </p>
        </div>
      )}

      {/* Detect button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleDetect}
          disabled={!page.screenshotUrl || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing screenshot...
            </>
          ) : (
            <>
              <Scan className="h-4 w-4 mr-2" />
              {sections ? "Re-detect Components" : "Detect Components"}
            </>
          )}
        </Button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Section results */}
      {sections && sections.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">
            Detected Sections ({sections.length})
          </h3>
          <div className="space-y-3">
            {sections.map((section, idx) => {
              const matched = matchSectionType(section.sectionLabel, sectionTypes);
              return (
                <div
                  key={idx}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* SVG thumbnail */}
                    {matched?.svgContent ? (
                      <div
                        className="w-24 h-14 shrink-0 rounded border bg-muted/30 overflow-hidden [&>svg]:w-full [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: matched.svgContent.replace(/width="280"\s+height="140"/, 'width="100%" height="auto"') }}
                      />
                    ) : (
                      <div className="w-24 h-14 shrink-0 rounded border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                        No match
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <h4 className="font-medium">{section.sectionLabel}</h4>
                        {matched && (
                          <Badge variant="outline" className="text-[10px]">
                            {matched.slug}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {section.components.length} component{section.components.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {section.components.map((comp, cIdx) => (
                          <div
                            key={cIdx}
                            className="rounded border bg-muted/30 p-3 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">
                                {comp.type.replace(/_/g, " ")}
                              </span>
                              <Badge
                                variant={COMPLEXITY_VARIANT[comp.complexity] ?? "default"}
                                className="text-xs"
                              >
                                {comp.complexity}
                              </Badge>
                            </div>
                            {comp.styleDescription && (
                              <p className="text-xs text-muted-foreground">
                                {comp.styleDescription}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
