import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("created"),
  reportShareId: varchar("report_share_id", { length: 50 }).unique(),
  reportPassword: varchar("report_password", { length: 100 }),
  settings: jsonb("settings").$type<{
    pageLimit?: number;
    notes?: string;
    firecrawlJobId?: string;
    excludePaths?: string[];
    analysisStep?: string;
    analysisError?: string;
    analysisProgress?: { completed: number; total: number };
    screenshotProgress?: { completed: number; total: number };
    scrapeProgress?: { completed: number; total: number };
    ahrefsUploads?: {
      topPages?: { rowCount: number; matchedCount: number; uploadedAt: string };
      bestLinks?: { rowCount: number; matchedCount: number; uploadedAt: string };
    };
    seoExtractionComplete?: boolean;
    seoExtractionProgress?: { completed: number; total: number };
    psiComplete?: boolean;
    psiProgress?: { completed: number; total: number };
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  crawlStartedAt: timestamp("crawl_started_at", { withTimezone: true }),
  crawlCompletedAt: timestamp("crawl_completed_at", { withTimezone: true }),
  analysisCompletedAt: timestamp("analysis_completed_at", { withTimezone: true }),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  confidence: varchar("confidence", { length: 50 }),
  pageCount: integer("page_count").default(0),
  representativePageId: uuid("representative_page_id"),
  description: text("description"),
  complexity: varchar("complexity", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  h1: text("h1"),
  wordCount: integer("word_count"),
  rawMarkdown: text("raw_markdown"),
  rawHtml: text("raw_html"),
  htmlSnapshotUrl: text("html_snapshot_url"),
  screenshotUrl: text("screenshot_url"),
  templateId: uuid("template_id").references(() => templates.id),
  contentTier: varchar("content_tier", { length: 50 }),
  navigationDepth: integer("navigation_depth"),
  excluded: boolean("excluded").default(false),
  isOrphan: boolean("is_orphan").default(false),
  isDuplicate: boolean("is_duplicate").default(false),
  contentHash: text("content_hash"),
  detectedSections: jsonb("detected_sections").$type<import("@/types/page-sections").PageSection[] | null>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  // On-page SEO signals (extracted from rawHtml)
  canonicalUrl: text("canonical_url"),
  metaRobots: text("meta_robots"),
  schemaOrgTypes: jsonb("schema_org_types").$type<string[]>(),
  internalLinkCount: integer("internal_link_count"),
  // Ahrefs data (from Top Pages CSV)
  organicTraffic: integer("organic_traffic"),
  trafficValueCents: integer("traffic_value_cents"),
  topKeyword: text("top_keyword"),
  topKeywordVolume: integer("top_keyword_volume"),
  topKeywordPosition: integer("top_keyword_position"),
  // Ahrefs data (from Best by Links CSV, or Top Pages — use max)
  referringDomains: integer("referring_domains"),
  // PageSpeed Insights
  psiScoreMobile: integer("psi_score_mobile"),
  psiScoreDesktop: integer("psi_score_desktop"),
  // Computed SEO
  seoScore: integer("seo_score"),
  isRedirectCritical: boolean("is_redirect_critical").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("pages_project_redirect_critical").on(table.projectId, table.isRedirectCritical),
  index("pages_project_seo_score").on(table.projectId, table.seoScore),
]);

export const apiUsage = pgTable("api_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  step: varchar("step", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costUsd: integer("cost_usd_micros").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sectionTypes = pgTable("section_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  svgContent: text("svg_content"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportSections = pgTable("report_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sectionType: varchar("section_type", { length: 100 }).notNull(),
  content: jsonb("content").$type<Record<string, unknown>>(),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
