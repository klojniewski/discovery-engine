import { db } from "@/db";
import { projects, pages, templates, components, componentPages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  ReportData,
  TemplateSection,
  ContentAuditSection,
  SiteArchitectureNode,
  ComponentSection,
} from "@/types/report";

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

  const projectComponents = await db
    .select()
    .from(components)
    .where(eq(components.projectId, projectId));

  // Stats
  const totalWords = projectPages.reduce(
    (sum, p) => sum + (p.wordCount ?? 0),
    0
  );

  const stats = {
    totalPages: projectPages.length,
    scrapedPages: projectPages.filter((p) => p.rawMarkdown).length,
    templateCount: projectTemplates.length,
    componentCount: projectComponents.length,
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

  // Component inventory — grouped by type with screenshot URLs
  const cpLinks = await db
    .select({
      componentId: componentPages.componentId,
      screenshotUrl: pages.screenshotUrl,
    })
    .from(componentPages)
    .innerJoin(pages, eq(componentPages.pageId, pages.id));

  const compScreenshots = new Map<string, string>();
  for (const link of cpLinks) {
    if (link.screenshotUrl && !compScreenshots.has(link.componentId)) {
      compScreenshots.set(link.componentId, link.screenshotUrl);
    }
  }

  const compGroups = new Map<string, typeof projectComponents>();
  for (const comp of projectComponents) {
    const group = compGroups.get(comp.type) ?? [];
    group.push(comp);
    compGroups.set(comp.type, group);
  }

  const complexityOrder: Record<string, number> = { complex: 0, moderate: 1, simple: 2 };
  const componentInventory: ComponentSection[] = [...compGroups.entries()]
    .map(([type, group]) => {
      const rep = [...group].sort((a, b) => {
        const aHasImg = compScreenshots.has(a.id) ? 0 : 1;
        const bHasImg = compScreenshots.has(b.id) ? 0 : 1;
        if (aHasImg !== bHasImg) return aHasImg - bHasImg;
        return (complexityOrder[a.complexity ?? "moderate"] ?? 1) -
          (complexityOrder[b.complexity ?? "moderate"] ?? 1);
      })[0];
      return {
        type,
        count: group.length,
        complexity: rep.complexity,
        position: rep.position,
        styleDescription: rep.styleDescription,
        screenshotUrl: compScreenshots.get(rep.id) ?? null,
      };
    })
    .sort((a, b) => {
      const ca = complexityOrder[a.complexity ?? "moderate"] ?? 1;
      const cb = complexityOrder[b.complexity ?? "moderate"] ?? 1;
      if (ca !== cb) return ca - cb;
      return b.count - a.count;
    });

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
    componentInventory,
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
        // Homepage
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

  // Sort nodes alphabetically, homepage first
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
