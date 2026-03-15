import { db } from "@/db";
import { projects, pages, templates, sectionTypes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type {
  ReportData,
  TemplateSection,
  ContentAuditSection,
  SiteArchitectureNode,
  ReportSectionInventoryItem,
  SeoBaselineData,
} from "@/types/report";
import type { PageSection } from "@/types/page-sections";

export async function assembleReportData(
  projectId: string
): Promise<ReportData> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const projectPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.projectId, projectId), eq(pages.excluded, false)));

  const projectTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.projectId, projectId));

  // Aggregate detected sections across all pages
  const allSectionTypes = await db
    .select()
    .from(sectionTypes)
    .orderBy(asc(sectionTypes.sortOrder));

  const sectionCounts = new Map<string, number>();
  for (const page of projectPages) {
    const detected = page.detectedSections as PageSection[] | null;
    if (!detected) continue;
    for (const section of detected) {
      if (section.sectionType) {
        sectionCounts.set(
          section.sectionType,
          (sectionCounts.get(section.sectionType) ?? 0) + 1
        );
      }
    }
  }

  const sectionInventory: ReportSectionInventoryItem[] = allSectionTypes
    .filter((st) => sectionCounts.has(st.slug))
    .map((st) => ({
      slug: st.slug,
      name: st.name,
      category: st.category,
      svgContent: st.svgContent,
      count: sectionCounts.get(st.slug) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Stats
  const totalWords = projectPages.reduce(
    (sum, p) => sum + (p.wordCount ?? 0),
    0
  );

  const stats = {
    totalPages: projectPages.length,
    scrapedPages: projectPages.filter((p) => p.rawMarkdown).length,
    templateCount: projectTemplates.length,
    sectionTypeCount: sectionInventory.length,
    totalWords,
    avgWordsPerPage:
      projectPages.length > 0
        ? Math.round(totalWords / projectPages.length)
        : 0,
  };

  // Templates with their pages
  const templateSections: TemplateSection[] = projectTemplates.map((t) => {
    const repPage = t.representativePageId
      ? projectPages.find((p) => p.id === t.representativePageId)
      : null;

    const templatePages = projectPages
      .filter((p) => p.templateId === t.id)
      .map((p) => ({ id: p.id, url: p.url, title: p.title }));

    return {
      id: t.id,
      name: t.name,
      displayName: t.displayName,
      confidence: t.confidence,
      pageCount: t.pageCount ?? templatePages.length,
      description: t.description,
      complexity: t.complexity,
      representativeScreenshot: repPage?.screenshotUrl ?? null,
      pages: templatePages,
    };
  });

  // Content audit
  const contentAudit: ContentAuditSection = {
    tiers: {
      must_migrate: projectPages.filter(
        (p) => p.contentTier === "must_migrate"
      ).length,
      improve: projectPages.filter((p) => p.contentTier === "improve").length,
      consolidate: projectPages.filter((p) => p.contentTier === "consolidate")
        .length,
      archive: projectPages.filter((p) => p.contentTier === "archive").length,
      unscored: projectPages.filter((p) => !p.contentTier).length,
    },
    duplicateCount: projectPages.filter((p) => p.isDuplicate).length,
    pages: projectPages.map((p) => {
      const tmpl = projectTemplates.find((t) => t.id === p.templateId);
      return {
        id: p.id,
        url: p.url,
        title: p.title,
        wordCount: p.wordCount,
        contentTier: p.contentTier,
        isDuplicate: p.isDuplicate,
        templateName: tmpl?.displayName ?? tmpl?.name ?? null,
      };
    }),
  };

  // Site architecture tree
  const siteArchitecture = buildSiteTree(projectPages, projectTemplates);

  // SEO baseline
  const seoBaseline = assembleSeoBaselineData(projectPages, projectTemplates);

  return {
    project: {
      id: project.id,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      websiteUrl: project.websiteUrl,
      createdAt: project.createdAt,
      analysisCompletedAt: project.analysisCompletedAt,
    },
    stats,
    templates: templateSections,
    contentAudit,
    siteArchitecture,
    sectionInventory,
    seoBaseline,
  };
}

function assembleSeoBaselineData(
  projectPages: (typeof pages.$inferSelect)[],
  projectTemplates: (typeof templates.$inferSelect)[]
): SeoBaselineData | null {
  const scoredPages = projectPages.filter((p) => p.seoScore !== null);
  if (scoredPages.length === 0) return null;

  const criticalPages = scoredPages
    .filter((p) => p.isRedirectCritical)
    .sort((a, b) => (b.seoScore ?? 0) - (a.seoScore ?? 0));

  const totalTrafficValue = scoredPages.reduce(
    (sum, p) => sum + (p.trafficValueCents ?? 0),
    0
  );

  const psiPages = projectPages.filter((p) => p.psiScoreMobile !== null);
  const avgPsiMobile =
    psiPages.length > 0
      ? Math.round(
          psiPages.reduce((s, p) => s + (p.psiScoreMobile ?? 0), 0) /
            psiPages.length
        )
      : null;
  const avgPsiDesktop =
    psiPages.length > 0
      ? Math.round(
          psiPages.reduce((s, p) => s + (p.psiScoreDesktop ?? 0), 0) /
            psiPages.length
        )
      : null;

  const hasAhrefsData = scoredPages.some(
    (p) => p.trafficValueCents !== null || p.referringDomains !== null
  );

  // On-page issues
  const pagesWithHtml = projectPages.filter((p) => p.rawHtml);
  const missingH1 = pagesWithHtml.filter((p) => !p.h1).length;
  const missingCanonical = pagesWithHtml.filter(
    (p) => !p.canonicalUrl
  ).length;
  const noindexPages = projectPages.filter((p) =>
    p.metaRobots?.toLowerCase().includes("noindex")
  ).length;
  const missingSchemaOrg = pagesWithHtml.filter(
    (p) =>
      !p.schemaOrgTypes ||
      (p.schemaOrgTypes as string[]).length === 0
  ).length;

  return {
    hasAhrefsData,
    hasPsiData: psiPages.length > 0,
    summary: {
      totalPagesScored: scoredPages.length,
      redirectCriticalCount: criticalPages.length,
      totalTrafficValue,
      avgPsiMobile,
      avgPsiDesktop,
    },
    redirectCriticalPages: criticalPages.map((p) => {
      const tmpl = projectTemplates.find((t) => t.id === p.templateId);
      return {
        url: p.url,
        seoScore: p.seoScore!,
        organicTraffic: p.organicTraffic,
        trafficValueCents: p.trafficValueCents,
        referringDomains: p.referringDomains,
        topKeyword: p.topKeyword,
        contentTier: p.contentTier,
      };
    }),
    preMigrationIssues: [], // Populated from Best by Links HTTP codes (requires separate query)
    onPageIssues: {
      missingH1,
      missingCanonical,
      noindexPages,
      missingSchemaOrg,
    },
  };
}

function buildSiteTree(
  pageList: (typeof pages.$inferSelect)[],
  templateList: (typeof templates.$inferSelect)[]
): SiteArchitectureNode[] {
  const root: SiteArchitectureNode[] = [];

  for (const page of pageList) {
    try {
      const url = new URL(page.url);
      const segments = url.pathname
        .split("/")
        .filter(Boolean);

      const tmpl = templateList.find((t) => t.id === page.templateId);
      const pageData = {
        id: page.id,
        url: page.url,
        title: page.title,
        contentTier: page.contentTier,
        templateName: tmpl?.displayName ?? tmpl?.name ?? null,
        wordCount: page.wordCount,
      };

      if (segments.length === 0) {
        const existing = root.find((n) => n.segment === "/");
        if (existing) {
          existing.page = pageData;
        } else {
          root.push({
            segment: "/",
            fullPath: "/",
            page: pageData,
            children: [],
          });
        }
        continue;
      }

      let currentLevel = root;
      let currentPath = "";

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        currentPath += `/${seg}`;
        const isLast = i === segments.length - 1;

        let node = currentLevel.find((n) => n.segment === seg);
        if (!node) {
          node = {
            segment: seg,
            fullPath: currentPath,
            page: null,
            children: [],
          };
          currentLevel.push(node);
        }

        if (isLast) {
          node.page = pageData;
        }

        currentLevel = node.children;
      }
    } catch {
      // Skip invalid URLs
    }
  }

  const sortNodes = (nodes: SiteArchitectureNode[]) => {
    nodes.sort((a, b) => {
      if (a.segment === "/") return -1;
      if (b.segment === "/") return 1;
      return a.segment.localeCompare(b.segment);
    });
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(root);

  return root;
}
