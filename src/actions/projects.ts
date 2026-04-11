"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { projects, pages, templates } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  startCrawl as firecrawlStart,
  getCrawlStatus as firecrawlStatus,
  getAllCrawlResults,
} from "@/services/firecrawl";
import { captureScreenshot, uploadScreenshot } from "@/services/screenshots";
import crypto from "crypto";
import { normalizeUrl } from "@/lib/url";

export async function createProject(formData: FormData) {
  const url = formData.get("url") as string;
  const clientName = formData.get("clientName") as string;
  const clientEmail = formData.get("clientEmail") as string;
  const pageLimit = parseInt(formData.get("pageLimit") as string) || 1000;
  const notes = (formData.get("notes") as string) || undefined;
  const excludePaths = (formData.get("excludePaths") as string) || undefined;

  if (!url || !clientName) {
    return { error: "URL and client name are required" };
  }

  const parsedExcludePaths = excludePaths
    ? excludePaths
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
    : undefined;

  const [project] = await db
    .insert(projects)
    .values({
      websiteUrl: url,
      clientName,
      clientEmail: clientEmail || "",
      settings: {
        pageLimit,
        notes,
        excludePaths: parsedExcludePaths,
      },
    })
    .returning();

  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const clientName = formData.get("clientName") as string;
  const clientEmail = formData.get("clientEmail") as string;
  const pageLimit = parseInt(formData.get("pageLimit") as string) || 1000;
  const notes = (formData.get("notes") as string) || undefined;
  const excludePaths = (formData.get("excludePaths") as string) || undefined;

  if (!clientName) {
    return { error: "Client name is required" };
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) return { error: "Project not found" };

  const parsedExcludePaths = excludePaths
    ? excludePaths
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean)
    : undefined;

  await db
    .update(projects)
    .set({
      clientName,
      clientEmail: clientEmail || "",
      settings: {
        ...(project.settings as Record<string, unknown>),
        pageLimit,
        notes,
        excludePaths: parsedExcludePaths,
      },
    })
    .where(eq(projects.id, projectId));

  redirect(`/projects/${projectId}`);
}

export async function startProjectCrawl(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");
  if (project.status !== "created" && project.status !== "crawl_failed") {
    throw new Error(`Cannot start crawl in status: ${project.status}`);
  }

  const settings = project.settings as {
    pageLimit?: number;
    excludePaths?: string[];
  } | null;

  // Always exclude non-HTML resources from crawl (Firecrawl excludePaths uses regex on URL pathname)
  const defaultExcludes = [".*\\.pdf$", ".*\\.zip$", ".*\\.docx?$", ".*\\.xlsx?$", ".*\\.pptx?$"];
  const userExcludes = settings?.excludePaths ?? [];
  const allExcludes = [...defaultExcludes, ...userExcludes];

  const { jobId } = await firecrawlStart({
    url: project.websiteUrl,
    limit: settings?.pageLimit ?? 500,
    excludePaths: allExcludes,
  });

  await db
    .update(projects)
    .set({
      status: "crawling",
      crawlStartedAt: new Date(),
      settings: { ...settings, firecrawlJobId: jobId },
    })
    .where(eq(projects.id, projectId));

  return { jobId };
}

export async function pollCrawlStatus(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const settings = project.settings as {
    firecrawlJobId?: string;
  } | null;

  if (!settings?.firecrawlJobId) {
    return { status: project.status, total: 0, completed: 0 };
  }

  const crawlStatus = await firecrawlStatus(settings.firecrawlJobId);

  if (crawlStatus.status === "completed" && project.status === "crawling") {
    await storeCrawlResults(projectId, settings.firecrawlJobId);
  }

  if (crawlStatus.status === "failed" && project.status === "crawling") {
    await db
      .update(projects)
      .set({ status: "crawl_failed" })
      .where(eq(projects.id, projectId));
  }

  return {
    status: crawlStatus.status === "completed" ? "crawled" : crawlStatus.status === "failed" ? "crawl_failed" : "crawling",
    total: crawlStatus.total,
    completed: crawlStatus.completed,
  };
}

const JUNK_URL_PATTERNS = [
  /\.pdf$/i,
  /\.zip$/i,
  /\.doc[x]?$/i,
  /\.xls[x]?$/i,
  /\.ppt[x]?$/i,
  /\.xml$/i,
  /\.txt$/i,
  /\.json$/i,
  /\/feed\/?$/i,
  /\/rss\/?$/i,
  /\/wp-json(\/|$)/i,
  /\/wp-admin(\/|$)/i,
  /\/wp-login\.php/i,
  /\/wp-cron\.php/i,
  /\/xmlrpc\.php/i,
  /\/page\/\d+\/?$/i,            // WordPress pagination: /author/foo/page/2
  /\/tag\//i,                     // Tag archives
  /\/category\/.*\/page\//i,      // Category pagination
  /\/author\/.*\/page\//i,        // Author pagination
];

function isJunkUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return JUNK_URL_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

async function storeCrawlResults(projectId: string, jobId: string) {
  const crawlPages = await getAllCrawlResults(jobId);

  const pageRecords = crawlPages
    .filter((p) => p.metadata?.sourceURL && !isJunkUrl(p.metadata.sourceURL))
    .map((p) => {
      const markdown = p.markdown ?? "";
      const wordCount = markdown.split(/\s+/).filter(Boolean).length;
      const contentHash = crypto
        .createHash("md5")
        .update(markdown.slice(0, 500))
        .digest("hex");

      return {
        projectId,
        url: normalizeUrl(p.metadata!.sourceURL!),
        title: (Array.isArray(p.metadata?.title) ? p.metadata.title[0] : p.metadata?.title) ?? null,
        metaDescription: (Array.isArray(p.metadata?.description) ? p.metadata.description[0] : p.metadata?.description) ?? null,
        h1: null as string | null,
        wordCount,
        contentHash,
        rawMarkdown: markdown || null,
        rawHtml: p.html || null,
        metadata: {
          language: p.metadata?.language,
          ogTitle: p.metadata?.ogTitle,
          ogDescription: p.metadata?.ogDescription,
        },
      };
    });

  // Deduplicate by normalized URL — keep the version with the most content
  const deduped = new Map<string, (typeof pageRecords)[number]>();
  for (const record of pageRecords) {
    const existing = deduped.get(record.url);
    if (!existing || (record.wordCount ?? 0) > (existing.wordCount ?? 0)) {
      deduped.set(record.url, record);
    }
  }
  const uniqueRecords = Array.from(deduped.values());

  if (uniqueRecords.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < uniqueRecords.length; i += 50) {
      const batch = uniqueRecords.slice(i, i + 50);
      await db.insert(pages).values(batch);
    }
  }

  await db
    .update(projects)
    .set({
      status: "crawled",
      crawlCompletedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

export async function getProject(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  return project ?? null;
}

export async function getProjectPages(projectId: string) {
  return db
    .select()
    .from(pages)
    .where(eq(pages.projectId, projectId));
}

export async function getProjectPagesForExport(projectId: string) {
  return db
    .select({
      url: pages.url,
      title: pages.title,
      wordCount: pages.wordCount,
    })
    .from(pages)
    .where(eq(pages.projectId, projectId))
    .orderBy(pages.url);
}

export async function getProjectPagesPaginated(
  projectId: string,
  page: number = 1,
  perPage: number = 50,
  search?: string
) {
  const offset = (page - 1) * perPage;

  const conditions = [eq(pages.projectId, projectId)];
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      sql`(${pages.url} ILIKE ${pattern} OR ${pages.title} ILIKE ${pattern})`
    );
  }
  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: pages.id,
        url: pages.url,
        title: pages.title,
        wordCount: pages.wordCount,
        rawMarkdown: pages.rawMarkdown,
        seoScore: pages.seoScore,
        isRedirectCritical: pages.isRedirectCritical,
      })
      .from(pages)
      .where(where)
      .orderBy(pages.url)
      .limit(perPage)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(where),
  ]);

  const total = Number(countResult[0].count);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getProjectPagesForTree(projectId: string) {
  const items = await db
    .select({
      id: pages.id,
      url: pages.url,
      title: pages.title,
      wordCount: pages.wordCount,
      contentTier: pages.contentTier,
      templateId: pages.templateId,
      excluded: pages.excluded,
      rawMarkdown: pages.rawMarkdown,
    })
    .from(pages)
    .where(eq(pages.projectId, projectId))
    .orderBy(pages.url);

  // Get template names for display
  const projectTemplates = await db
    .select({
      id: templates.id,
      displayName: templates.displayName,
      name: templates.name,
    })
    .from(templates)
    .where(eq(templates.projectId, projectId));

  const templateMap = new Map(
    projectTemplates.map((t) => [t.id, t.displayName || t.name])
  );

  return items.map((p) => ({
    ...p,
    templateName: p.templateId ? templateMap.get(p.templateId) ?? null : null,
  }));
}

export async function getProjectStats(projectId: string) {
  const [countResult, contentResult, wordResult, prefixResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(eq(pages.projectId, projectId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(and(eq(pages.projectId, projectId), sql`${pages.rawMarkdown} IS NOT NULL`)),
    db
      .select({
        avgWords: sql<number>`coalesce(avg(${pages.wordCount}), 0)`,
        maxWords: sql<number>`coalesce(max(${pages.wordCount}), 0)`,
      })
      .from(pages)
      .where(and(eq(pages.projectId, projectId), sql`${pages.wordCount} > 0`)),
    db
      .select({
        prefix: sql<string>`split_part(regexp_replace(${pages.url}, '^https?://[^/]+', ''), '/', 2)`.as("prefix"),
        count: sql<number>`count(*)`.as("cnt"),
      })
      .from(pages)
      .where(eq(pages.projectId, projectId))
      .groupBy(sql`prefix`)
      .orderBy(sql`cnt DESC`)
      .limit(8),
  ]);

  return {
    totalPages: Number(countResult[0].count),
    pagesWithContent: Number(contentResult[0].count),
    avgWordCount: Math.round(Number(wordResult[0].avgWords)),
    maxWordCount: Number(wordResult[0].maxWords),
    topPrefixes: prefixResult.map((r) => ({
      prefix: `/${r.prefix || "(root)"}`,
      count: Number(r.count),
    })),
  };
}

export async function startScreenshots(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const projectPages = await db
    .select()
    .from(pages)
    .where(eq(pages.projectId, projectId));

  const total = projectPages.length;
  let captured = 0;

  for (const page of projectPages) {
    if (page.screenshotUrl) captured++;
  }

  await db
    .update(projects)
    .set({
      status: "screenshotting",
      settings: {
        ...(project.settings as Record<string, unknown>),
        screenshotProgress: { completed: captured, total },
      },
    })
    .where(eq(projects.id, projectId));

  for (const page of projectPages) {
    if (page.screenshotUrl) continue;

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

    // Update progress
    const [current] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    await db
      .update(projects)
      .set({
        settings: {
          ...(current.settings as Record<string, unknown>),
          screenshotProgress: { completed: captured, total },
        },
      })
      .where(eq(projects.id, projectId));
  }

  // Done
  const [final] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  await db
    .update(projects)
    .set({
      status: "reviewing",
      settings: {
        ...(final.settings as Record<string, unknown>),
        screenshotProgress: undefined,
      },
    })
    .where(eq(projects.id, projectId));

  return { captured, total };
}

export async function getScreenshotProgress(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const settings = project.settings as {
    screenshotProgress?: { completed: number; total: number };
  } | null;

  return {
    status: project.status,
    progress: settings?.screenshotProgress ?? null,
  };
}

export async function retakeScreenshot(pageId: string) {
  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1);

  if (!page) throw new Error("Page not found");

  const screenshot = await captureScreenshot(page.url);
  if (!screenshot) throw new Error("Failed to capture screenshot");

  const publicUrl = await uploadScreenshot(page.projectId, page.id, screenshot);
  if (!publicUrl) throw new Error("Failed to upload screenshot");

  await db
    .update(pages)
    .set({ screenshotUrl: publicUrl })
    .where(eq(pages.id, pageId));

  return { screenshotUrl: publicUrl };
}

export async function togglePageExclusion(pageId: string, excluded: boolean) {
  await db
    .update(pages)
    .set({ excluded })
    .where(eq(pages.id, pageId));
}

export async function bulkToggleExclusion(
  pageIds: string[],
  excluded: boolean
) {
  if (pageIds.length === 0) return;
  await db
    .update(pages)
    .set({ excluded })
    .where(inArray(pages.id, pageIds));
}

export async function startScraping(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  // Only scrape non-excluded pages
  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  const total = projectPages.length;
  let completed = 0;

  // Screenshots are always re-captured; only skip content scraping for pages that have it


  await db
    .update(projects)
    .set({
      status: "scraping",
      settings: {
        ...(project.settings as Record<string, unknown>),
        scrapeProgress: { completed, total },
      },
    })
    .where(eq(projects.id, projectId));

  for (const page of projectPages) {
    // Scrape content if missing
    if (!page.rawMarkdown) {
      try {
        const { scrapeUrl } = await import("@/services/firecrawl");
        const result = await scrapeUrl(page.url);
        if (result) {
          await db
            .update(pages)
            .set({
              rawMarkdown: result.markdown || null,
              rawHtml: result.html || null,
              wordCount: result.markdown
                ? result.markdown.split(/\s+/).filter(Boolean).length
                : page.wordCount,
            })
            .where(eq(pages.id, page.id));
        }
      } catch (err) {
        console.error(`Scrape failed for ${page.url}:`, err);
      }
    }

    // Always capture/re-capture screenshot
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

    completed++;

    // Update progress
    const [current] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    await db
      .update(projects)
      .set({
        settings: {
          ...(current.settings as Record<string, unknown>),
          scrapeProgress: { completed, total },
        },
      })
      .where(eq(projects.id, projectId));
  }

  // Done
  const [final] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  await db
    .update(projects)
    .set({
      status: "reviewing",
      settings: {
        ...(final.settings as Record<string, unknown>),
        scrapeProgress: undefined,
      },
    })
    .where(eq(projects.id, projectId));

  return { completed, total };
}

export async function getScrapeProgress(projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const settings = project.settings as {
    scrapeProgress?: { completed: number; total: number };
  } | null;

  return {
    status: project.status,
    progress: settings?.scrapeProgress ?? null,
  };
}
