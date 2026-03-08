import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  projects,
  pages,
  templates,
  sectionTypes,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { AnalysisRunner } from "@/components/analysis/analysis-runner";
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
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, id), eq(pages.excluded, false)));

  const projectTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.projectId, id));

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

  const hasResults =
    projectTemplates.length > 0 ||
    projectPages.some((p) => p.contentTier);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">Analysis</h2>
        <p className="text-muted-foreground text-sm">
          AI-powered analysis of <strong>{project.websiteUrl}</strong>
        </p>
      </div>

      <AnalysisRunner
        projectId={id}
        initialStatus={project.status}
        initialStep={settings?.analysisStep ?? null}
      />

      {hasResults && (
        <>
          <section>
            <h3 className="text-lg font-semibold mb-3">
              Templates ({projectTemplates.length})
            </h3>
            <TemplateClusters templates={enrichedTemplates} />
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-3">Content Tiers</h3>
            <ContentTiers pages={projectPages} />
          </section>

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
