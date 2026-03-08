export interface ReportData {
  project: {
    id: string;
    clientName: string;
    clientEmail: string;
    websiteUrl: string;
    createdAt: Date;
    analysisCompletedAt: Date | null;
  };
  stats: {
    totalPages: number;
    scrapedPages: number;
    templateCount: number;
    sectionTypeCount: number;
    totalWords: number;
    avgWordsPerPage: number;
  };
  templates: TemplateSection[];
  contentAudit: ContentAuditSection;
  siteArchitecture: SiteArchitectureNode[];
  sectionInventory: ReportSectionInventoryItem[];
}

export interface TemplateSection {
  id: string;
  name: string;
  displayName: string | null;
  confidence: string | null;
  pageCount: number;
  description: string | null;
  complexity: string | null;
  representativeScreenshot: string | null;
  pages: { id: string; url: string; title: string | null }[];
}

export interface ContentAuditSection {
  tiers: {
    must_migrate: number;
    improve: number;
    consolidate: number;
    archive: number;
    unscored: number;
  };
  duplicateCount: number;
  pages: {
    id: string;
    url: string;
    title: string | null;
    wordCount: number | null;
    contentTier: string | null;
    isDuplicate: boolean | null;
    templateName: string | null;
  }[];
}

export interface SiteArchitectureNode {
  segment: string;
  fullPath: string;
  page: {
    id: string;
    url: string;
    title: string | null;
    contentTier: string | null;
    templateName: string | null;
    wordCount: number | null;
  } | null;
  children: SiteArchitectureNode[];
}

export interface ReportSectionInventoryItem {
  slug: string;
  name: string;
  category: string;
  svgContent: string | null;
  count: number;
}

export type ReportSectionType =
  | "executive_summary"
  | "template_inventory"
  | "site_architecture"
  | "content_audit"
  | "section_inventory";
