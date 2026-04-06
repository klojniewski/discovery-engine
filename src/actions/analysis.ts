"use server";

import { db } from "@/db";
import { projects, pages, templates } from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import {
  groupPagesByUrlPrefix,
  splitListingPages,
  nameTemplateGroups,
  classifySingletonPages,
  scoreTiersBatch,
  type ContentTier,
} from "@/services/classification";
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

async function runClassifyAndScore(projectId: string, options?: { classifyOnly?: boolean }) {
  const classifyOnly = options?.classifyOnly ?? false;
  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  const pageByUrl = new Map(projectPages.map((p) => [p.url, p]));

  const pageInputs = projectPages.map((p) => ({
    url: p.url,
    title: p.title,
    metaDescription: p.metaDescription,
    wordCount: p.wordCount,
    contentPreview: p.rawMarkdown?.slice(0, 500) ?? null,
  }));

  // ── Step 1: URL-prefix grouping (instant) ──
  await updateStep(projectId, "classifying", {
    completed: 0,
    total: projectPages.length,
  });

  const { groups: rawGroups, ungrouped: rawUngrouped } = groupPagesByUrlPrefix(pageInputs);

  // ── Step 1b: Split listing/index pages from prefix groups ──
  const { groups, ungrouped } = splitListingPages(rawGroups, rawUngrouped);

  // ── Step 2: AI template naming ──
  const namedGroups = await nameTemplateGroups(groups, projectId);

  // ── Step 3: Singleton classification ──
  const singletonResults = await classifySingletonPages(
    ungrouped,
    projectId,
    (completed, total) =>
      updateStep(projectId, "classifying", {
        completed: projectPages.length - ungrouped.length + completed,
        total: projectPages.length,
      })
  );

  // ── Step 4-5: Duplicate detection + tier scoring (skipped in classifyOnly mode) ──
  const duplicateUrls = new Set<string>();
  let tierByUrl = new Map<string, { tier: ContentTier }>();

  if (!classifyOnly) {
    const hashCounts = new Map<string, number>();
    for (const p of projectPages) {
      if (p.contentHash) {
        hashCounts.set(p.contentHash, (hashCounts.get(p.contentHash) ?? 0) + 1);
      }
    }

    for (const p of projectPages) {
      if (p.contentHash && (hashCounts.get(p.contentHash) ?? 0) > 1) {
        duplicateUrls.add(p.url);
      }
    }

    await updateStep(projectId, "scoring", { completed: 0, total: projectPages.length });

    const nonDuplicateInputs = pageInputs.filter((p) => !duplicateUrls.has(p.url));
    const tierResults = await scoreTiersBatch(
      nonDuplicateInputs,
      projectId,
      (completed, total) => updateStep(projectId, "scoring", { completed, total })
    );

    tierByUrl = new Map(tierResults.map((r) => [r.url, { tier: r.tier }]));

    // Listing/index pages (e.g., /blog, /press-releases) are structurally
    // important — always must_migrate regardless of AI tier assignment.
    // Excludes filtered/paginated variants which stay in detail groups.
    const listingUrls = new Set(
      namedGroups
        .filter((g) => !g.pattern.endsWith("/*"))
        .flatMap((g) => g.pages.map((p) => p.url))
    );
    for (const url of listingUrls) {
      tierByUrl.set(url, { tier: "must_migrate" });
    }
  }

  // ── Step 6: Save results ──
  await updateStep(projectId, "saving");

  // Clear existing template references and delete old templates
  await db
    .update(pages)
    .set({ templateId: null })
    .where(eq(pages.projectId, projectId));
  await db.delete(templates).where(eq(templates.projectId, projectId));

  // Build template records: one per named group + one per unique singleton type
  interface TemplateRecord {
    name: string;
    displayName: string;
    description: string;
    urlPattern: string | null;
    confidence: string | null;
    pageUrls: string[];
  }

  const templateRecords: TemplateRecord[] = [];

  // From prefix groups
  for (const group of namedGroups) {
    templateRecords.push({
      name: group.name,
      displayName: group.displayName,
      description: group.description,
      urlPattern: group.pattern,
      confidence: "high",
      pageUrls: group.pages.map((p) => p.url),
    });
  }

  // From singletons — merge pages with same AI-assigned name into one template
  const singletonGroups = new Map<string, { result: typeof singletonResults[0]; urls: string[] }>();
  for (const r of singletonResults) {
    const existing = singletonGroups.get(r.name);
    if (existing) {
      existing.urls.push(r.url);
    } else {
      singletonGroups.set(r.name, { result: r, urls: [r.url] });
    }
  }

  for (const [, { result, urls }] of singletonGroups) {
    templateRecords.push({
      name: result.name,
      displayName: result.displayName,
      description: result.reasoning,
      urlPattern: null,
      confidence: result.confidence,
      pageUrls: urls,
    });
  }

  // Batch-insert all templates
  if (templateRecords.length > 0) {
    const inserted = await db
      .insert(templates)
      .values(
        templateRecords.map((t) => ({
          projectId,
          name: t.name,
          displayName: t.displayName,
          description: t.description,
          urlPattern: t.urlPattern,
          confidence: t.confidence,
          pageCount: t.pageUrls.length,
          representativePageId: selectRepresentative(t.pageUrls, pageByUrl),
        }))
      )
      .returning();

    // Link pages to templates in batches
    for (let i = 0; i < inserted.length; i++) {
      const template = inserted[i];
      const record = templateRecords[i];
      const pageIds = record.pageUrls
        .map((url) => pageByUrl.get(url)?.id)
        .filter((id): id is string => id !== undefined);

      if (pageIds.length > 0) {
        // Batch in groups of 500 for large inArray clauses
        for (let j = 0; j < pageIds.length; j += 500) {
          const batch = pageIds.slice(j, j + 500);
          await db
            .update(pages)
            .set({ templateId: template.id })
            .where(inArray(pages.id, batch));
        }
      }
    }
  }

  // Update pages with content tier and duplicate flag — batch by 50
  if (!classifyOnly) {
    for (let i = 0; i < projectPages.length; i += 50) {
      const batch = projectPages.slice(i, i + 50);
      await Promise.all(
        batch.map((page) => {
          const isDuplicate = duplicateUrls.has(page.url);
          const tier: ContentTier = isDuplicate
            ? "consolidate"
            : tierByUrl.get(page.url)?.tier ?? "improve";

          return db
            .update(pages)
            .set({ contentTier: tier, isDuplicate })
            .where(eq(pages.id, page.id));
        })
      );
    }
  }

  return {
    classified: projectPages.length,
    scored: projectPages.length,
    templates: templateRecords.length,
  };
}

function selectRepresentative(
  urls: string[],
  pageByUrl: Map<string, { id: string; wordCount: number | null; url: string }>
): string | undefined {
  let best: { id: string; wordCount: number; url: string } | null = null;
  for (const url of urls) {
    const page = pageByUrl.get(url);
    if (!page) continue;
    const wc = page.wordCount ?? 0;
    if (!best || wc > best.wordCount || (wc === best.wordCount && url < best.url)) {
      best = { id: page.id, wordCount: wc, url };
    }
  }
  return best?.id;
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
 * Classify templates only — no tier scoring.
 * Re-groups pages by URL prefix and names templates via AI.
 * Preserves existing content tiers.
 */
export async function runTemplateClassificationOnly(projectId: string) {
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
          analysisStep: "classifying",
          analysisError: undefined,
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    const result = await runClassifyAndScore(projectId, { classifyOnly: true });

    const [updated] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    // Restore previous status (classified or reviewing) rather than resetting
    const previousStatus = (currentProject.settings as Record<string, unknown>)?.analysisStep === "completed"
      ? "reviewing"
      : "classified";

    await db
      .update(projects)
      .set({
        status: previousStatus,
        settings: {
          ...(updated.settings as Record<string, unknown>),
          analysisStep: previousStatus === "reviewing" ? "completed" : "classified",
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
 * Re-score content tiers only — no template re-classification.
 * Preserves existing template assignments, re-runs tier scoring on all pages.
 */
export async function runTierScoringOnly(projectId: string) {
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
          analysisStep: "scoring",
          analysisError: undefined,
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    const projectPages = await db
      .select()
      .from(pages)
      .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

    const pageInputs = projectPages.map((p) => ({
      url: p.url,
      title: p.title,
      metaDescription: p.metaDescription,
      wordCount: p.wordCount,
      contentPreview: p.rawMarkdown?.slice(0, 500) ?? null,
    }));

    // Duplicate detection
    const duplicateUrls = new Set<string>();
    const hashCounts = new Map<string, number>();
    for (const p of projectPages) {
      if (p.contentHash) {
        hashCounts.set(p.contentHash, (hashCounts.get(p.contentHash) ?? 0) + 1);
      }
    }
    for (const p of projectPages) {
      if (p.contentHash && (hashCounts.get(p.contentHash) ?? 0) > 1) {
        duplicateUrls.add(p.url);
      }
    }

    // Score tiers
    await updateStep(projectId, "scoring", { completed: 0, total: projectPages.length });

    const nonDuplicateInputs = pageInputs.filter((p) => !duplicateUrls.has(p.url));
    const tierResults = await scoreTiersBatch(
      nonDuplicateInputs,
      projectId,
      (completed, total) => updateStep(projectId, "scoring", { completed, total })
    );

    const tierByUrl = new Map(tierResults.map((r) => [r.url, { tier: r.tier }]));

    // Listing pages always must_migrate
    const projectTemplates = await db
      .select()
      .from(templates)
      .where(eq(templates.projectId, projectId));

    const listingTemplateIds = new Set(
      projectTemplates
        .filter((t) => t.urlPattern && !t.urlPattern.endsWith("/*"))
        .map((t) => t.id)
    );
    for (const p of projectPages) {
      if (p.templateId && listingTemplateIds.has(p.templateId)) {
        tierByUrl.set(p.url, { tier: "must_migrate" });
      }
    }

    // Update pages with new tiers
    await updateStep(projectId, "saving");
    for (let i = 0; i < projectPages.length; i += 50) {
      const batch = projectPages.slice(i, i + 50);
      await Promise.all(
        batch.map((page) => {
          const isDuplicate = duplicateUrls.has(page.url);
          const tier: ContentTier = isDuplicate
            ? "consolidate"
            : tierByUrl.get(page.url)?.tier ?? "improve";

          return db
            .update(pages)
            .set({ contentTier: tier, isDuplicate })
            .where(eq(pages.id, page.id));
        })
      );
    }

    // Restore previous status
    const [updated] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const previousStatus = (currentProject.settings as Record<string, unknown>)?.analysisStep === "completed"
      ? "reviewing"
      : "classified";

    await db
      .update(projects)
      .set({
        status: previousStatus,
        settings: {
          ...(updated.settings as Record<string, unknown>),
          analysisStep: previousStatus === "reviewing" ? "completed" : "classified",
          analysisProgress: undefined,
        },
      })
      .where(eq(projects.id, projectId));

    return { scored: projectPages.length };
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
          analysisStep: "classifying",
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

export async function setRepresentativePage(templateId: string, pageId: string) {
  await db
    .update(templates)
    .set({ representativePageId: pageId })
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

export async function recaptureTemplateScreenshot(templateId: string) {
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!template) throw new Error("Template not found");
  if (!template.representativePageId) throw new Error("No representative page");

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, template.representativePageId))
    .limit(1);

  if (!page) throw new Error("Representative page not found");

  const { captureScreenshot, uploadScreenshot } = await import("@/services/screenshots");

  const screenshot = await captureScreenshot(page.url);
  if (!screenshot) throw new Error("Screenshot capture failed");

  const publicUrl = await uploadScreenshot(template.projectId, page.id, screenshot);
  if (!publicUrl) throw new Error("Screenshot upload failed");

  await db
    .update(pages)
    .set({ screenshotUrl: publicUrl })
    .where(eq(pages.id, page.id));

  revalidatePath(`/projects/${template.projectId}/analysis`);

  return publicUrl;
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
