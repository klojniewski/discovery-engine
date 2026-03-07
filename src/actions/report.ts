"use server";

import { db } from "@/db";
import { projects, reportSections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assembleReportData } from "@/services/report-data";
import type { ReportSectionType } from "@/types/report";
import crypto from "crypto";

export async function generateReport(projectId: string) {
  const reportData = await assembleReportData(projectId);

  // Clear existing sections
  await db
    .delete(reportSections)
    .where(eq(reportSections.projectId, projectId));

  const sections: {
    type: ReportSectionType;
    content: Record<string, unknown>;
    order: number;
  }[] = [
    {
      type: "executive_summary",
      content: {
        stats: reportData.stats,
        project: reportData.project,
      },
      order: 0,
    },
    {
      type: "template_inventory",
      content: {
        templates: reportData.templates,
      },
      order: 1,
    },
    {
      type: "site_architecture",
      content: {
        tree: reportData.siteArchitecture,
      },
      order: 2,
    },
    {
      type: "content_audit",
      content: {
        audit: reportData.contentAudit,
      },
      order: 3,
    },
  ];

  for (const section of sections) {
    await db.insert(reportSections).values({
      projectId,
      sectionType: section.type,
      content: section.content,
      sortOrder: section.order,
    });
  }

  return { sections: sections.length };
}

export async function getReportSections(projectId: string) {
  return db
    .select()
    .from(reportSections)
    .where(eq(reportSections.projectId, projectId))
    .orderBy(reportSections.sortOrder);
}

export async function saveNotes(sectionId: string, notes: string) {
  await db
    .update(reportSections)
    .set({ notes, updatedAt: new Date() })
    .where(eq(reportSections.id, sectionId));
}

export async function publishReport(
  projectId: string,
  password?: string
) {
  const shareId = crypto.randomBytes(6).toString("base64url");

  await db
    .update(projects)
    .set({
      status: "published",
      reportShareId: shareId,
      reportPassword: password || null,
      publishedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  return { shareId };
}

export async function unpublishReport(projectId: string) {
  await db
    .update(projects)
    .set({
      status: "reviewing",
      reportShareId: null,
      reportPassword: null,
      publishedAt: null,
    })
    .where(eq(projects.id, projectId));
}

export async function getPublicReport(shareId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.reportShareId, shareId))
    .limit(1);

  if (!project) return null;

  const sections = await db
    .select()
    .from(reportSections)
    .where(eq(reportSections.projectId, project.id))
    .orderBy(reportSections.sortOrder);

  return {
    project: {
      id: project.id,
      clientName: project.clientName,
      websiteUrl: project.websiteUrl,
      hasPassword: !!project.reportPassword,
      publishedAt: project.publishedAt,
    },
    sections,
  };
}

export async function verifyReportPassword(
  shareId: string,
  password: string
) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.reportShareId, shareId))
    .limit(1);

  if (!project) return false;
  if (!project.reportPassword) return true;
  return project.reportPassword === password;
}
