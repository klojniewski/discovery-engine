"use server";

import { db } from "@/db";
import { projects, pages, templates, components, componentPages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { classifyPages } from "@/services/classification";
import { scorePages } from "@/services/scoring";
import { detectComponents } from "@/services/components";

export async function getAnalysisStatus(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const settings = project.settings as {
    analysisStep?: string;
    analysisError?: string;
    analysisProgress?: { completed: number; total: number };
  } | null;

  return {
    status: project.status,
    step: settings?.analysisStep ?? null,
    error: settings?.analysisError ?? null,
    progress: settings?.analysisProgress ?? null,
  };
}

async function updateStep(
  projectId: string,
  step: string,
  progress?: { completed: number; total: number }
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  await db
    .update(projects)
    .set({
      settings: {
        ...(project.settings as Record<string, unknown>),
        analysisStep: step,
        analysisProgress: progress ?? undefined,
      },
    })
    .where(eq(projects.id, projectId));
}

export async function runClassification(projectId: string) {
  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  await updateStep(projectId, "classification", {
    completed: 0,
    total: projectPages.length,
  });

  const pageInputs = projectPages.map((p) => ({
    url: p.url,
    title: p.title,
    metaDescription: p.metaDescription,
    wordCount: p.wordCount,
    contentPreview: p.rawMarkdown?.slice(0, 10000) ?? null,
  }));

  const results = await classifyPages(pageInputs);

  await updateStep(projectId, "classification", {
    completed: projectPages.length,
    total: projectPages.length,
  });

  // Create template records grouped by type
  const templateGroups = new Map<string, typeof results>();
  for (const r of results) {
    const group = templateGroups.get(r.templateType) ?? [];
    group.push(r);
    templateGroups.set(r.templateType, group);
  }

  // Clear existing template references from pages, then delete templates
  await db
    .update(pages)
    .set({ templateId: null })
    .where(eq(pages.projectId, projectId));
  await db.delete(templates).where(eq(templates.projectId, projectId));

  for (const [type, group] of templateGroups) {
    // Find the highest-confidence page as representative
    const representative = group.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    })[0];

    const repPage = projectPages.find((p) => p.url === representative.url);

    const [template] = await db
      .insert(templates)
      .values({
        projectId,
        name: type,
        displayName: type
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        confidence: representative.confidence,
        pageCount: group.length,
        representativePageId: repPage?.id,
        description: representative.reasoning,
      })
      .returning();

    // Update pages with template ID
    for (const r of group) {
      const page = projectPages.find((p) => p.url === r.url);
      if (page) {
        await db
          .update(pages)
          .set({ templateId: template.id })
          .where(eq(pages.id, page.id));
      }
    }
  }

  return { classified: results.length, templates: templateGroups.size };
}

export async function runContentScoring(projectId: string) {
  await updateStep(projectId, "scoring");

  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  // Detect duplicates by content hash
  const hashCounts = new Map<string, number>();
  for (const p of projectPages) {
    if (p.contentHash) {
      hashCounts.set(p.contentHash, (hashCounts.get(p.contentHash) ?? 0) + 1);
    }
  }

  const pageInputs = projectPages.map((p) => ({
    url: p.url,
    title: p.title,
    metaDescription: p.metaDescription,
    wordCount: p.wordCount,
    contentPreview: p.rawMarkdown?.slice(0, 500) ?? null,
    isDuplicate: p.contentHash
      ? (hashCounts.get(p.contentHash) ?? 0) > 1
      : false,
  }));

  const results = await scorePages(pageInputs);

  let scored = 0;
  for (const result of results) {
    const page = projectPages.find((p) => p.url === result.url);
    if (!page) continue;

    const isDuplicate = page.contentHash
      ? (hashCounts.get(page.contentHash) ?? 0) > 1
      : false;

    await db
      .update(pages)
      .set({
        contentTier: result.tier,
        isDuplicate,
      })
      .where(eq(pages.id, page.id));

    scored++;
  }

  return { scored };
}

export async function runComponentDetection(projectId: string) {
  await updateStep(projectId, "components");

  // Get templates with representative pages that have screenshots
  const projectTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.projectId, projectId));

  // Clear existing components
  await db.delete(components).where(eq(components.projectId, projectId));

  let detected = 0;

  for (const template of projectTemplates) {
    if (!template.representativePageId) continue;

    const [repPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, template.representativePageId))
      .limit(1);

    if (!repPage?.screenshotUrl) continue;

    const detectedComponents = await detectComponents(
      repPage.screenshotUrl,
      repPage.url
    );

    for (const comp of detectedComponents) {
      const [component] = await db
        .insert(components)
        .values({
          projectId,
          type: comp.type,
          styleDescription: comp.styleDescription,
          position: comp.position,
          complexity: comp.complexity,
          frequency: 1,
        })
        .returning();

      await db.insert(componentPages).values({
        componentId: component.id,
        pageId: repPage.id,
      });

      detected++;
    }
  }

  return { detected };
}

export async function runFullAnalysis(projectId: string) {
  try {
    await db
      .update(projects)
      .set({ status: "analyzing" })
      .where(eq(projects.id, projectId));

    // Step 1: Classification
    const classificationResult = await runClassification(projectId);

    // Step 2: Content scoring
    const scoringResult = await runContentScoring(projectId);

    // Step 3: Component detection
    const componentResult = await runComponentDetection(projectId);

    // Done
    await db
      .update(projects)
      .set({
        status: "reviewing",
        analysisCompletedAt: new Date(),
        settings: {
          ...(
            (
              await db
                .select()
                .from(projects)
                .where(eq(projects.id, projectId))
                .limit(1)
            )[0].settings as Record<string, unknown>
          ),
          analysisStep: "completed",
        },
      })
      .where(eq(projects.id, projectId));

    return {
      classification: classificationResult,
      scoring: scoringResult,
      components: componentResult,
    };
  } catch (err) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    await db
      .update(projects)
      .set({
        status: "analysis_failed",
        settings: {
          ...(project.settings as Record<string, unknown>),
          analysisError: err instanceof Error ? err.message : String(err),
        },
      })
      .where(eq(projects.id, projectId));

    throw err;
  }
}

export async function renameTemplate(templateId: string, displayName: string) {
  await db
    .update(templates)
    .set({ displayName })
    .where(eq(templates.id, templateId));
}

export async function updatePageTier(
  pageId: string,
  tier: "must_migrate" | "improve" | "consolidate" | "archive"
) {
  await db
    .update(pages)
    .set({ contentTier: tier })
    .where(eq(pages.id, pageId));
}

export async function getTemplatePages(templateId: string) {
  return db
    .select({
      id: pages.id,
      url: pages.url,
      title: pages.title,
    })
    .from(pages)
    .where(eq(pages.templateId, templateId));
}
