import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  projects,
  pages,
  templates,
  sectionTypes,
} from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { ClassifyRunner } from "@/components/analysis/classify-runner";
import { SectionRunner } from "@/components/analysis/section-runner";
import { TemplateClusters } from "@/components/analysis/template-clusters";
import { ContentTiers } from "@/components/analysis/content-tiers";
import { SectionInventory } from "@/components/analysis/section-inventory";
import type { PageSection } from "@/types/page-sections";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) return notFound();

  const settings = project.settings as {
    analysisStep?: string;
    analysisError?: string;
  } | null;

  const projectPages = await db
    .select({
      id: pages.id,
      url: pages.url,
      title: pages.title,
      wordCount: pages.wordCount,
      contentTier: pages.contentTier,
      templateId: pages.templateId,
      isDuplicate: pages.isDuplicate,
      screenshotUrl: pages.screenshotUrl,
      detectedSections: pages.detectedSections,
    })
    .from(pages)
    .where(and(eq(pages.projectId, id), eq(pages.excluded, false)));

  const projectTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.projectId, id));

  // Count pages for cost estimation
  const [pageCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(and(eq(pages.projectId, id), eq(pages.excluded, false)));
  const pageCount = Number(pageCountResult.count);

  // Enrich templates with representative screenshots
  const enrichedTemplates = projectTemplates.map((t) => {
    const repPage = t.representativePageId
      ? projectPages.find((p) => p.id === t.representativePageId)
      : null;
    return {
      ...t,
      representativeScreenshot: repPage?.screenshotUrl ?? null,
    };
  });

  // Aggregate detected sections across all pages
  const allSectionTypes = await db
    .select()
    .from(sectionTypes)
    .orderBy(asc(sectionTypes.sortOrder));

  const sectionCounts = new Map<string, number>();
  let unmatchedSectionCount = 0;
  let pagesWithSections = 0;

  for (const page of projectPages) {
    const detected = page.detectedSections as PageSection[] | null;
    if (!detected || detected.length === 0) continue;
    pagesWithSections++;
    for (const section of detected) {
      if (section.sectionType) {
        sectionCounts.set(
          section.sectionType,
          (sectionCounts.get(section.sectionType) ?? 0) + 1
        );
      } else {
        unmatchedSectionCount++;
      }
    }
  }

  const sectionTypesWithCounts = allSectionTypes
    .filter((st) => sectionCounts.has(st.slug))
    .map((st) => ({
      slug: st.slug,
      name: st.name,
      category: st.category,
      svgContent: st.svgContent,
      count: sectionCounts.get(st.slug) ?? 0,
    }));

  const hasTemplates = projectTemplates.length > 0;
  const hasScoring = projectPages.some((p) => p.contentTier);
  const hasSections = pagesWithSections > 0;

  // Determine which phase to show
  const status = project.status;
  const showClassifyPhase =
    status === "crawled" || status === "analysis_failed" ||
    (status === "analyzing" && (settings?.analysisStep === "classifying" || settings?.analysisStep === "scoring" || settings?.analysisStep === "saving"));
  const showReviewPhase = status === "classified" || (hasTemplates && !hasSections && status !== "analyzing");
  const showResultsPhase = status === "reviewing" || hasSections;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Analysis</h2>
        <p className="text-muted-foreground text-sm">
          AI-powered analysis of <strong>{project.websiteUrl}</strong>
        </p>
      </div>

      {/* Phase A: Classify & Score */}
      {showClassifyPhase && (
        <ClassifyRunner
          projectId={id}
          initialStatus={status}
          initialStep={settings?.analysisStep ?? null}
          pageCount={pageCount}
        />
      )}

      {/* Phase B: Review Templates & Capture Screenshots */}
      {showReviewPhase && (
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Templates ({projectTemplates.length})
              </h3>
              <ClassifyRunner
                projectId={id}
                initialStatus={status}
                initialStep="completed"
                pageCount={pageCount}
                compact
              />
            </div>
            <TemplateClusters templates={enrichedTemplates} />
          </section>

          {hasScoring && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Content Tiers</h3>
              <ContentTiers pages={projectPages} />
            </section>
          )}

          <SectionRunner
            projectId={id}
            initialStatus={status}
            initialStep={settings?.analysisStep ?? null}
            templateCount={projectTemplates.length}
          />
        </div>
      )}

      {/* Phase C: Results */}
      {showResultsPhase && (
        <>
          {hasTemplates && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  Templates ({projectTemplates.length})
                </h3>
                <ClassifyRunner
                  projectId={id}
                  initialStatus={status}
                  initialStep="completed"
                  pageCount={pageCount}
                  compact
                />
              </div>
              <TemplateClusters templates={enrichedTemplates} />
            </section>
          )}

          {hasScoring && (
            <section>
              <h3 className="text-lg font-semibold mb-3">Content Tiers</h3>
              <ContentTiers pages={projectPages} />
            </section>
          )}

          <section>
            <h3 className="text-lg font-semibold mb-3">
              Sections
              {pagesWithSections > 0 && (
                <span className="text-muted-foreground font-normal text-sm ml-2">
                  ({sectionTypesWithCounts.length} types)
                </span>
              )}
            </h3>
            <SectionInventory
              sectionTypes={sectionTypesWithCounts}
              unmatchedCount={unmatchedSectionCount}
              totalPages={projectPages.length}
              pagesWithSections={pagesWithSections}
            />
          </section>
        </>
      )}
    </div>
  );
}
