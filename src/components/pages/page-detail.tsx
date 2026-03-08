"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scan, ExternalLink } from "lucide-react";
import { runPageDetection } from "@/actions/analysis";
import type { PageSection } from "@/types/page-sections";

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

const SECTION_COLORS = [
  "rgba(59,130,246,0.18)",   // blue
  "rgba(16,185,129,0.18)",   // green
  "rgba(245,158,11,0.18)",   // amber
  "rgba(168,85,247,0.18)",   // purple
  "rgba(239,68,68,0.18)",    // red
  "rgba(6,182,212,0.18)",    // cyan
  "rgba(236,72,153,0.18)",   // pink
  "rgba(132,204,22,0.18)",   // lime
  "rgba(251,146,60,0.18)",   // orange
  "rgba(99,102,241,0.18)",   // indigo
];

const SECTION_BORDER_COLORS = [
  "rgba(59,130,246,0.7)",
  "rgba(16,185,129,0.7)",
  "rgba(245,158,11,0.7)",
  "rgba(168,85,247,0.7)",
  "rgba(239,68,68,0.7)",
  "rgba(6,182,212,0.7)",
  "rgba(236,72,153,0.7)",
  "rgba(132,204,22,0.7)",
  "rgba(251,146,60,0.7)",
  "rgba(99,102,241,0.7)",
];

export function PageDetail({ page }: PageDetailProps) {
  const [sections, setSections] = useState<PageSection[] | null>(
    page.detectedSections
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const screenshotRef = useRef<HTMLDivElement>(null);

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

  const hasBounds = sections?.some((s) => s.yEndPercent > 0) ?? false;

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

      {/* Screenshot with overlay */}
      {page.screenshotUrl ? (
        <div>
          {sections && hasBounds && (
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <span
                  className={`inline-block w-3 h-3 rounded border ${
                    showOverlay ? "bg-primary border-primary" : "border-muted-foreground"
                  }`}
                />
                Show section overlays
              </button>
            </div>
          )}
          <div ref={screenshotRef} className="rounded-lg border overflow-hidden bg-muted relative">
            <img
              src={page.screenshotUrl}
              alt={`Screenshot of ${page.url}`}
              className="w-full block"
            />
            {sections && hasBounds && showOverlay && sections.map((section, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 transition-opacity duration-150"
                style={{
                  top: `${section.yStartPercent}%`,
                  height: `${section.yEndPercent - section.yStartPercent}%`,
                  backgroundColor: hoveredSection === idx
                    ? SECTION_COLORS[idx % SECTION_COLORS.length].replace("0.18", "0.35")
                    : SECTION_COLORS[idx % SECTION_COLORS.length],
                  borderTop: `2px solid ${SECTION_BORDER_COLORS[idx % SECTION_BORDER_COLORS.length]}`,
                  borderBottom: `2px solid ${SECTION_BORDER_COLORS[idx % SECTION_BORDER_COLORS.length]}`,
                  opacity: hoveredSection === null || hoveredSection === idx ? 1 : 0.3,
                }}
                onMouseEnter={() => setHoveredSection(idx)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <span
                  className="absolute left-2 top-1 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none"
                  style={{
                    backgroundColor: SECTION_BORDER_COLORS[idx % SECTION_BORDER_COLORS.length],
                    color: "white",
                  }}
                >
                  {idx + 1} {section.sectionLabel}
                </span>
              </div>
            ))}
          </div>
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
            {sections.map((section, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-4 space-y-3 transition-colors duration-150 cursor-pointer ${
                  hoveredSection === idx ? "border-primary bg-primary/5" : ""
                }`}
                onMouseEnter={() => setHoveredSection(idx)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold text-white rounded px-1.5 py-0.5"
                    style={{
                      backgroundColor: hasBounds
                        ? SECTION_BORDER_COLORS[idx % SECTION_BORDER_COLORS.length]
                        : undefined,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h4 className="font-medium">{section.sectionLabel}</h4>
                  <span className="text-xs text-muted-foreground">
                    {section.components.length} component{section.components.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
