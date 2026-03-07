import { notFound } from "next/navigation";
import { db } from "@/db";
import { projects, pages, templates, components } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AnalysisRunner } from "@/components/analysis/analysis-runner";
import { TemplateClusters } from "@/components/analysis/template-clusters";
import { ContentTiers } from "@/components/analysis/content-tiers";
import { ComponentInventory } from "@/components/analysis/component-inventory";

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

  const projectComponents = await db
    .select()
    .from(components)
    .where(eq(components.projectId, id));

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

          {projectComponents.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-3">
                Components ({projectComponents.length})
              </h3>
              <ComponentInventory components={projectComponents} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
