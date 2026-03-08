"use server";

import { db } from "@/db";
import { projects, pages, templates } from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { classifyAndScorePages } from "@/services/classification";
import { detectPageSections } from "@/services/components";
import { sectionTypes as sectionTypesTable } from "@/db/schema";
import { revalidatePath } from "next/cache";

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

async function runClassifyAndScore(projectId: string) {
  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  await updateStep(projectId, "classification", {
    completed: 0,
    total: projectPages.length,
  });

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

  const results = await classifyAndScorePages(
    pageInputs,
    projectId,
    (completed, total) => updateStep(projectId, "classification", { completed, total })
  );

  // Build a URL→page lookup for fast matching
  const pageByUrl = new Map(projectPages.map((p) => [p.url, p]));

  await updateStep(projectId, "saving");

  // Update pages with content tier and duplicate flag — batch by 50
  for (let i = 0; i < results.length; i += 50) {
    const batch = results.slice(i, i + 50);
    await Promise.all(
      batch.map((result) => {
        const page = pageByUrl.get(result.url);
        if (!page) return;

        const isDuplicate = page.contentHash
          ? (hashCounts.get(page.contentHash) ?? 0) > 1
          : false;

        return db
          .update(pages)
          .set({ contentTier: result.tier, isDuplicate })
          .where(eq(pages.id, page.id));
      })
    );
  }

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
    const representative = group.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    })[0];

    const repPage = pageByUrl.get(representative.url);

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

    // Batch-update pages with template ID
    const pageIds = group
      .map((r) => pageByUrl.get(r.url)?.id)
      .filter((id): id is string => id !== undefined);

    if (pageIds.length > 0) {
      await db
        .update(pages)
        .set({ templateId: template.id })
        .where(inArray(pages.id, pageIds));
    }
  }

  return { classified: results.length, scored: results.length, templates: templateGroups.size };
}

export async function runSectionDetection(projectId: string) {
  await updateStep(projectId, "sections");

  // Fetch section types for taxonomy-driven detection
  const allSectionTypes = await db
    .select({ slug: sectionTypesTable.slug, category: sectionTypesTable.category, description: sectionTypesTable.description })
    .from(sectionTypesTable)
    .orderBy(asc(sectionTypesTable.sortOrder));

  // Get all non-excluded pages with screenshots that don't already have detectedSections
  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  const pagesToDetect = projectPages.filter(
    (p) => p.screenshotUrl && !p.detectedSections
  );

  let detected = 0;
  for (const page of pagesToDetect) {
    await updateStep(projectId, "sections", {
      completed: detected,
      total: pagesToDetect.length,
    });

    try {
      const sections = await detectPageSections(
        page.screenshotUrl!,
        page.url,
        page.rawHtml,
        allSectionTypes,
        { projectId }
      );

      await db
        .update(pages)
        .set({ detectedSections: sections })
        .where(eq(pages.id, page.id));
    } catch (err) {
      console.error(`Section detection failed for page ${page.url}:`, err);
      // Continue with other pages — don't fail the whole analysis
    }

    detected++;
  }

  await updateStep(projectId, "sections", {
    completed: pagesToDetect.length,
    total: pagesToDetect.length,
  });

  return { detected };
}

/**
 * Phase A: Classification & Scoring — runs on crawl data only, no screenshots needed.
 * Sets status to "classified" when complete.
 */
export async function runClassificationAndScoring(projectId: string) {
  try {
    const [currentProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    await db
      .update(projects)
      .set({
        status: "analyzing",
        settings: {
          ...(currentProject.settings as Record<string, unknown>),
          analysisStep: "classification",
          analysisError: undefined,
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    const result = await runClassifyAndScore(projectId);

    const [updated] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    await db
      .update(projects)
      .set({
        status: "classified",
        settings: {
          ...(updated.settings as Record<string, unknown>),
          analysisStep: "classified",
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    return result;
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

/**
 * Phase B: Capture screenshots only for representative pages per template,
 * then run section detection on those pages.
 * Sets status to "reviewing" when complete.
 */
export async function captureAndDetectSections(projectId: string) {
  try {
    const [currentProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    await db
      .update(projects)
      .set({
        status: "analyzing",
        settings: {
          ...(currentProject.settings as Record<string, unknown>),
          analysisStep: "screenshots",
          analysisError: undefined,
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    // Get all templates with their representative pages
    const projectTemplates = await db
      .select()
      .from(templates)
      .where(eq(templates.projectId, projectId));

    const repPageIds = projectTemplates
      .map((t) => t.representativePageId)
      .filter((id): id is string => id !== null);

    if (repPageIds.length > 0) {
      const repPages = await db
        .select()
        .from(pages)
        .where(and(eq(pages.projectId, projectId), inArray(pages.id, repPageIds)));

      // Capture screenshots for representative pages that don't have one
      const { captureScreenshot, uploadScreenshot } = await import("@/services/screenshots");
      let captured = 0;
      const toCapture = repPages.filter((p) => !p.screenshotUrl);

      for (const page of toCapture) {
        await updateStep(projectId, "screenshots", {
          completed: captured,
          total: toCapture.length,
        });

        const screenshot = await captureScreenshot(page.url);
        if (screenshot) {
          const publicUrl = await uploadScreenshot(projectId, page.id, screenshot);
          if (publicUrl) {
            await db
              .update(pages)
              .set({ screenshotUrl: publicUrl })
              .where(eq(pages.id, page.id));
          }
        }
        captured++;
      }
    }

    // Run section detection on representative pages
    const sectionResult = await runSectionDetection(projectId);

    const [updated] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    await db
      .update(projects)
      .set({
        status: "reviewing",
        analysisCompletedAt: new Date(),
        settings: {
          ...(updated.settings as Record<string, unknown>),
          analysisStep: "completed",
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    return { sections: sectionResult };
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

/**
 * Legacy: Run full analysis in one shot (classification + scoring + section detection).
 * Kept for backward compatibility with existing projects.
 */
export async function runFullAnalysis(projectId: string) {
  const result = await runClassificationAndScoring(projectId);

  // For full analysis, also capture screenshots and detect sections
  const sectionResult = await captureAndDetectSections(projectId);

  return {
    ...result,
    ...sectionResult,
  };
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

export async function runPageDetection(pageId: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!page) throw new Error("Page not found");
  if (!page.screenshotUrl) throw new Error("Page has no screenshot");

  // Fetch section types for taxonomy-driven detection
  const allSectionTypes = await db
    .select({ slug: sectionTypesTable.slug, category: sectionTypesTable.category, description: sectionTypesTable.description })
    .from(sectionTypesTable)
    .orderBy(asc(sectionTypesTable.sortOrder));

  const sections = await detectPageSections(page.screenshotUrl, page.url, page.rawHtml, allSectionTypes, { projectId: page.projectId });

  await db
    .update(pages)
    .set({ detectedSections: sections })
    .where(eq(pages.id, pageId));

  revalidatePath(`/projects/${page.projectId}/pages/${pageId}`);

  return sections;
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
