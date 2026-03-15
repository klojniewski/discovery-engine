"use server";

import { db } from "@/db";
import { projects, pages } from "@/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { extractOnPageSeo, computeSeoScore } from "@/services/seo";

export async function runOnPageSeoExtraction(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const projectPages = await db
    .select({ id: pages.id, url: pages.url, rawHtml: pages.rawHtml })
    .from(pages)
    .where(
      and(eq(pages.projectId, projectId), isNotNull(pages.rawHtml))
    );

  const total = projectPages.length;
  let completed = 0;

  // Update progress
  await updateProjectSettings(projectId, project.settings, {
    seoExtractionProgress: { completed: 0, total },
  });

  // Process in batches of 50
  for (let i = 0; i < projectPages.length; i += 50) {
    const batch = projectPages.slice(i, i + 50);

    for (const page of batch) {
      if (!page.rawHtml) continue;
      const signals = extractOnPageSeo(page.rawHtml, page.url);
      await db
        .update(pages)
        .set({
          h1: signals.h1,
          canonicalUrl: signals.canonicalUrl,
          metaRobots: signals.metaRobots,
          schemaOrgTypes: signals.schemaOrgTypes,
          internalLinkCount: signals.internalLinkCount,
        })
        .where(eq(pages.id, page.id));
      completed++;
    }

    await updateProjectSettings(projectId, null, {
      seoExtractionProgress: { completed, total },
    });
  }

  await updateProjectSettings(projectId, null, {
    seoExtractionComplete: true,
    seoExtractionProgress: undefined,
  });

  return { completed, total };
}

export async function computeSeoScores(projectId: string) {
  const projectPages = await db
    .select({
      id: pages.id,
      trafficValueCents: pages.trafficValueCents,
      referringDomains: pages.referringDomains,
      organicTraffic: pages.organicTraffic,
    })
    .from(pages)
    .where(eq(pages.projectId, projectId));

  let scored = 0;
  for (const page of projectPages) {
    const { score, isRedirectCritical } = computeSeoScore(page);
    if (
      page.trafficValueCents !== null ||
      page.referringDomains !== null ||
      page.organicTraffic !== null
    ) {
      await db
        .update(pages)
        .set({ seoScore: score, isRedirectCritical })
        .where(eq(pages.id, page.id));
      scored++;
    }
  }

  return { scored, total: projectPages.length };
}

/** Helper to merge settings without overwriting unrelated keys */
async function updateProjectSettings(
  projectId: string,
  existingSettings: Record<string, unknown> | null,
  updates: Record<string, unknown>
) {
  if (!existingSettings) {
    const [project] = await db
      .select({ settings: projects.settings })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    existingSettings = (project?.settings as Record<string, unknown>) ?? {};
  }
  await db
    .update(projects)
    .set({
      settings: { ...existingSettings, ...updates },
    })
    .where(eq(projects.id, projectId));
}
