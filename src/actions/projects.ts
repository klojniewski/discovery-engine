"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { projects, pages } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  startCrawl as firecrawlStart,
  getCrawlStatus as firecrawlStatus,
  getAllCrawlResults,
} from "@/services/firecrawl";
import crypto from "crypto";

export async function createProject(formData: FormData) {
  const url = formData.get("url") as string;
  const clientName = formData.get("clientName") as string;
  const clientEmail = formData.get("clientEmail") as string;
  const pageLimit = parseInt(formData.get("pageLimit") as string) || 500;
  const notes = (formData.get("notes") as string) || undefined;
  const excludePaths = (formData.get("excludePaths") as string) || undefined;

  if (!url || !clientName || !clientEmail) {
    return { error: "URL, client name, and client email are required" };
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
      clientEmail,
      settings: {
        pageLimit,
        notes,
        excludePaths: parsedExcludePaths,
      },
    })
    .returning();

  redirect(`/projects/${project.id}`);
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

  const { jobId } = await firecrawlStart({
    url: project.websiteUrl,
    limit: settings?.pageLimit ?? 500,
    excludePaths: settings?.excludePaths,
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
    status: crawlStatus.status === "completed" ? "analyzing" : crawlStatus.status === "failed" ? "crawl_failed" : "crawling",
    total: crawlStatus.total,
    completed: crawlStatus.completed,
  };
}

async function storeCrawlResults(projectId: string, jobId: string) {
  const crawlPages = await getAllCrawlResults(jobId);

  const pageRecords = crawlPages
    .filter((p) => p.metadata?.sourceURL)
    .map((p) => {
      const markdown = p.markdown ?? "";
      const wordCount = markdown.split(/\s+/).filter(Boolean).length;
      const contentHash = crypto
        .createHash("md5")
        .update(markdown.slice(0, 500))
        .digest("hex");

      return {
        projectId,
        url: p.metadata!.sourceURL!,
        title: (Array.isArray(p.metadata?.title) ? p.metadata.title[0] : p.metadata?.title) ?? null,
        metaDescription: (Array.isArray(p.metadata?.description) ? p.metadata.description[0] : p.metadata?.description) ?? null,
        h1: null as string | null,
        wordCount,
        contentHash,
        metadata: {
          language: p.metadata?.language,
          ogTitle: p.metadata?.ogTitle,
          ogDescription: p.metadata?.ogDescription,
          markdown: markdown.slice(0, 10000),
        },
      };
    });

  if (pageRecords.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < pageRecords.length; i += 50) {
      const batch = pageRecords.slice(i, i + 50);
      await db.insert(pages).values(batch);
    }
  }

  await db
    .update(projects)
    .set({
      status: "reviewing",
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
