import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
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
  htmlSnapshotUrl: text("html_snapshot_url"),
  screenshotUrl: text("screenshot_url"),
  templateId: uuid("template_id").references(() => templates.id),
  contentTier: varchar("content_tier", { length: 50 }),
  navigationDepth: integer("navigation_depth"),
  isOrphan: boolean("is_orphan").default(false),
  isDuplicate: boolean("is_duplicate").default(false),
  contentHash: text("content_hash"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const components = pgTable("components", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  styleDescription: text("style_description"),
  frequency: integer("frequency").default(0),
  screenshotUrl: text("screenshot_url"),
  position: varchar("position", { length: 50 }),
  complexity: varchar("complexity", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const componentPages = pgTable("component_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentId: uuid("component_id")
    .notNull()
    .references(() => components.id, { onDelete: "cascade" }),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
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
