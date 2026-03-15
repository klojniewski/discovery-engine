"use server";

import { db } from "@/db";
import { projects, pages, templates } from "@/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { extractOnPageSeo, computeSeoScore } from "@/services/seo";
import {
  parseAhrefsCsv,
  type TopPageRow,
  type BestLinksRow,
} from "@/services/ahrefs-parser";
import { normalizeUrl } from "@/lib/url";
import { runPageSpeedInsights } from "@/services/pagespeed";
import {
  fetchCruxOrigin,
  fetchCruxHistory,
  type CruxOriginData,
  type CruxHistoryData,
} from "@/services/crux";

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

export async function uploadAhrefsCsv(projectId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const buffer = await file.arrayBuffer();
  const parsed = parseAhrefsCsv(buffer);

  // Get project to check domain
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) throw new Error("Project not found");

  const projectDomain = new URL(project.websiteUrl).hostname.toLowerCase();

  // Build URL → page ID lookup from crawled pages
  const projectPages = await db
    .select({ id: pages.id, url: pages.url })
    .from(pages)
    .where(eq(pages.projectId, projectId));

  const urlToPageId = new Map<string, string>();
  for (const p of projectPages) {
    urlToPageId.set(normalizeUrl(p.url), p.id);
  }

  if (parsed.fileType === "top_pages") {
    const rows = parsed.rows as TopPageRow[];

    // Domain validation: check >30% of URLs match project domain
    const domainMatches = rows.filter((r) => {
      try {
        return new URL(r.url).hostname.toLowerCase().includes(projectDomain);
      } catch {
        return false;
      }
    });
    if (rows.length > 0 && domainMatches.length / rows.length < 0.3) {
      return {
        error: "This export appears to be for a different domain.",
        fileType: parsed.fileType,
      };
    }

    // Clear previous top pages data
    await db
      .update(pages)
      .set({
        organicTraffic: null,
        trafficValueCents: null,
        topKeyword: null,
        topKeywordVolume: null,
        topKeywordPosition: null,
      })
      .where(eq(pages.projectId, projectId));

    // Deduplicate by normalized URL, keeping highest traffic value
    const deduped = new Map<string, TopPageRow>();
    for (const row of rows) {
      const norm = normalizeUrl(row.url);
      const existing = deduped.get(norm);
      if (!existing || row.currentTrafficValue > existing.currentTrafficValue) {
        deduped.set(norm, row);
      }
    }

    let matchedCount = 0;
    for (const [normUrl, row] of deduped) {
      const pageId = urlToPageId.get(normUrl);
      if (!pageId) continue;
      await db
        .update(pages)
        .set({
          organicTraffic: row.currentTraffic,
          trafficValueCents: Math.round(row.currentTrafficValue * 100),
          topKeyword: row.currentTopKeyword || null,
          topKeywordVolume: row.currentTopKeywordVolume || null,
          topKeywordPosition: row.currentTopKeywordPosition || null,
          referringDomains: sql`GREATEST(${pages.referringDomains}, ${row.currentReferringDomains})`,
        })
        .where(eq(pages.id, pageId));
      matchedCount++;
    }

    await updateProjectSettings(projectId, null, {
      ahrefsUploads: {
        ...((project.settings as Record<string, unknown>)?.ahrefsUploads as Record<string, unknown> ?? {}),
        topPages: {
          rowCount: parsed.rowCount,
          matchedCount,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    return {
      fileType: parsed.fileType,
      rowCount: parsed.rowCount,
      matchedCount,
      unmatchedCount: deduped.size - matchedCount,
      parseErrors: parsed.parseErrors,
    };
  } else {
    const rows = parsed.rows as BestLinksRow[];

    // Domain validation
    const domainMatches = rows.filter((r) => {
      try {
        return new URL(r.pageUrl).hostname.toLowerCase().includes(projectDomain);
      } catch {
        return false;
      }
    });
    if (rows.length > 0 && domainMatches.length / rows.length < 0.3) {
      return {
        error: "This export appears to be for a different domain.",
        fileType: parsed.fileType,
      };
    }

    // Deduplicate by normalized URL, keeping highest referring domains
    const deduped = new Map<string, BestLinksRow>();
    for (const row of rows) {
      const norm = normalizeUrl(row.pageUrl);
      const existing = deduped.get(norm);
      if (!existing || row.referringDomains > existing.referringDomains) {
        deduped.set(norm, row);
      }
    }

    let matchedCount = 0;
    for (const [normUrl, row] of deduped) {
      const pageId = urlToPageId.get(normUrl);
      if (!pageId) continue;
      await db
        .update(pages)
        .set({
          referringDomains: sql`GREATEST(${pages.referringDomains}, ${row.referringDomains})`,
        })
        .where(eq(pages.id, pageId));
      matchedCount++;
    }

    await updateProjectSettings(projectId, null, {
      ahrefsUploads: {
        ...((project.settings as Record<string, unknown>)?.ahrefsUploads as Record<string, unknown> ?? {}),
        bestLinks: {
          rowCount: parsed.rowCount,
          matchedCount,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    return {
      fileType: parsed.fileType,
      rowCount: parsed.rowCount,
      matchedCount,
      unmatchedCount: deduped.size - matchedCount,
      parseErrors: parsed.parseErrors,
    };
  }
}

export async function clearAhrefsData(
  projectId: string,
  fileType: "top_pages" | "best_links"
) {
  if (fileType === "top_pages") {
    await db
      .update(pages)
      .set({
        organicTraffic: null,
        trafficValueCents: null,
        topKeyword: null,
        topKeywordVolume: null,
        topKeywordPosition: null,
      })
      .where(eq(pages.projectId, projectId));
  }
  // For best_links, clear referring domains (unless top_pages also set them)
  if (fileType === "best_links") {
    await db
      .update(pages)
      .set({ referringDomains: null })
      .where(eq(pages.projectId, projectId));
  }

  const [project] = await db
    .select({ settings: projects.settings })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  const settings = (project?.settings ?? {}) as Record<string, unknown>;
  const uploads = (settings.ahrefsUploads ?? {}) as Record<string, unknown>;
  const key = fileType === "top_pages" ? "topPages" : "bestLinks";
  delete uploads[key];

  await updateProjectSettings(projectId, null, { ahrefsUploads: uploads });
}

export async function getSeoStatus(projectId: string) {
  const [project] = await db
    .select({ settings: projects.settings })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const settings = project.settings as Record<string, unknown> | null;

  // Count pages with on-page extraction
  const [extractionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(
      and(eq(pages.projectId, projectId), isNotNull(pages.internalLinkCount))
    );

  // Count pages with PSI scores
  const [psiCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(
      and(eq(pages.projectId, projectId), isNotNull(pages.psiScoreMobile))
    );

  // Count pages with SEO scores
  const [scoredCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(
      and(eq(pages.projectId, projectId), isNotNull(pages.seoScore))
    );

  // Count redirect-critical pages
  const [criticalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pages)
    .where(
      and(eq(pages.projectId, projectId), eq(pages.isRedirectCritical, true))
    );

  return {
    seoExtractionComplete: !!settings?.seoExtractionComplete,
    seoExtractionProgress: settings?.seoExtractionProgress as
      | { completed: number; total: number }
      | undefined,
    psiComplete: !!settings?.psiComplete,
    psiProgress: settings?.psiProgress as
      | { completed: number; total: number }
      | undefined,
    hasPsiKey: !!process.env.PAGESPEED_API_KEY,
    ahrefsUploads: settings?.ahrefsUploads as
      | {
          topPages?: { rowCount: number; matchedCount: number; uploadedAt: string };
          bestLinks?: { rowCount: number; matchedCount: number; uploadedAt: string };
        }
      | undefined,
    extractedCount: Number(extractionCount.count),
    psiScoredCount: Number(psiCount.count),
    seoScoredCount: Number(scoredCount.count),
    redirectCriticalCount: Number(criticalCount.count),
  };
}

export async function getRedirectCriticalPages(
  projectId: string,
  page: number = 1,
  perPage: number = 50,
  onlyCritical: boolean = false
) {
  const offset = (page - 1) * perPage;

  const conditions = [
    eq(pages.projectId, projectId),
    isNotNull(pages.seoScore),
  ];
  if (onlyCritical) {
    conditions.push(eq(pages.isRedirectCritical, true));
  }
  const where = and(...conditions);

  const [items, countResult, trafficSum] = await Promise.all([
    db
      .select({
        id: pages.id,
        url: pages.url,
        title: pages.title,
        organicTraffic: pages.organicTraffic,
        trafficValueCents: pages.trafficValueCents,
        referringDomains: pages.referringDomains,
        topKeyword: pages.topKeyword,
        seoScore: pages.seoScore,
        contentTier: pages.contentTier,
        isRedirectCritical: pages.isRedirectCritical,
        psiScoreMobile: pages.psiScoreMobile,
        psiScoreDesktop: pages.psiScoreDesktop,
      })
      .from(pages)
      .where(where)
      .orderBy(sql`${pages.seoScore} DESC NULLS LAST`)
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(where),
    db
      .select({
        totalTrafficValue: sql<number>`coalesce(sum(${pages.trafficValueCents}), 0)`,
        criticalCount: sql<number>`count(*) filter (where ${pages.isRedirectCritical} = true)`,
      })
      .from(pages)
      .where(
        and(eq(pages.projectId, projectId), isNotNull(pages.seoScore))
      ),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    perPage,
    totalPages: Math.ceil(Number(countResult[0].count) / perPage),
    totalTrafficValueCents: Number(trafficSum[0].totalTrafficValue),
    redirectCriticalCount: Number(trafficSum[0].criticalCount),
  };
}

/**
 * Select representative pages for PSI scoring:
 * 1. One page per template (via templates.representativePageId)
 * 2. If fewer than 25, pad with top pages by internal link count
 */
async function selectRepresentativePages(projectId: string) {
  // Get template representative pages
  const templateReps = await db
    .select({
      id: pages.id,
      url: pages.url,
      title: pages.title,
    })
    .from(templates)
    .innerJoin(pages, eq(templates.representativePageId, pages.id))
    .where(eq(templates.projectId, projectId));

  const selectedIds = new Set(templateReps.map((p) => p.id));

  // If fewer than 25, pad with top pages by internal link count
  let extra: typeof templateReps = [];
  if (selectedIds.size < 25) {
    extra = await db
      .select({
        id: pages.id,
        url: pages.url,
        title: pages.title,
      })
      .from(pages)
      .where(
        and(
          eq(pages.projectId, projectId),
          isNotNull(pages.internalLinkCount)
        )
      )
      .orderBy(sql`${pages.internalLinkCount} DESC NULLS LAST`)
      .limit(25);
    extra = extra.filter((p) => !selectedIds.has(p.id));
  }

  return [...templateReps, ...extra].slice(0, 25);
}

export async function getPsiCandidatePages(projectId: string) {
  return selectRepresentativePages(projectId);
}

export async function getPsiPages(projectId: string) {
  const items = await db
    .select({
      id: pages.id,
      url: pages.url,
      title: pages.title,
      psiScoreMobile: pages.psiScoreMobile,
      psiScoreDesktop: pages.psiScoreDesktop,
    })
    .from(pages)
    .where(
      and(eq(pages.projectId, projectId), isNotNull(pages.psiScoreMobile))
    )
    .orderBy(sql`${pages.psiScoreMobile} ASC NULLS LAST`);

  const avgMobile =
    items.length > 0
      ? Math.round(
          items.reduce((s, p) => s + (p.psiScoreMobile ?? 0), 0) / items.length
        )
      : null;
  const avgDesktop =
    items.length > 0
      ? Math.round(
          items.reduce((s, p) => s + (p.psiScoreDesktop ?? 0), 0) / items.length
        )
      : null;

  return { items, avgMobile, avgDesktop };
}

export async function fetchCruxData(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) throw new Error("Project not found");

  const origin = project.websiteUrl;
  const [originResult, historyResult] = await Promise.all([
    fetchCruxOrigin(origin),
    fetchCruxHistory(origin),
  ]);

  const updates: Record<string, unknown> = {};

  if ("error" in originResult) {
    return { error: originResult.error };
  }
  updates.cruxOrigin = originResult;

  if (!("error" in historyResult)) {
    updates.cruxHistory = historyResult;
  }

  await updateProjectSettings(projectId, null, updates);

  return {
    origin: originResult,
    history: "error" in historyResult ? null : historyResult,
    historyError: "error" in historyResult ? historyResult.error : null,
  };
}

export async function getCruxData(projectId: string) {
  const [project] = await db
    .select({ settings: projects.settings })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) return null;

  const settings = project.settings as Record<string, unknown> | null;
  return {
    origin: (settings?.cruxOrigin as CruxOriginData) ?? null,
    history: (settings?.cruxHistory as CruxHistoryData) ?? null,
  };
}

export async function runPsiForPage(pageId: string) {
  const [page] = await db
    .select({ id: pages.id, url: pages.url })
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);
  if (!page) throw new Error("Page not found");

  const [mobile, desktop] = await Promise.all([
    runPageSpeedInsights(page.url, "mobile"),
    runPageSpeedInsights(page.url, "desktop"),
  ]);

  await db
    .update(pages)
    .set({ psiScoreMobile: mobile, psiScoreDesktop: desktop })
    .where(eq(pages.id, pageId));

  return { mobile, desktop };
}

export async function runPsiAnalysis(projectId: string) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return { error: "PAGESPEED_API_KEY not configured" };
  }

  const repPages = await selectRepresentativePages(projectId);

  const total = repPages.length;
  let completed = 0;

  await updateProjectSettings(projectId, null, {
    psiProgress: { completed: 0, total },
  });

  for (const page of repPages) {
    const [mobile, desktop] = await Promise.all([
      runPageSpeedInsights(page.url, "mobile"),
      runPageSpeedInsights(page.url, "desktop"),
    ]);

    if (mobile !== null || desktop !== null) {
      await db
        .update(pages)
        .set({
          psiScoreMobile: mobile,
          psiScoreDesktop: desktop,
        })
        .where(eq(pages.id, page.id));
    }

    completed++;
    await updateProjectSettings(projectId, null, {
      psiProgress: { completed, total },
    });
  }

  await updateProjectSettings(projectId, null, {
    psiComplete: true,
    psiProgress: undefined,
  });

  return { completed, total };
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
