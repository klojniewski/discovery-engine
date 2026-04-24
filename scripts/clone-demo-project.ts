/**
 * Clone a Discovery project and rebrand it for demo use.
 *
 * Copies projects, templates, pages, and report_sections from a source
 * project to a fresh one. Rewrites host and word-level brand markers so the
 * demo reads as a different company. Handles the circular FK between pages
 * and templates with a two-pass insert inside a single transaction.
 *
 * Screenshots and html snapshots are not copied — the new pages reference
 * the same Supabase Storage URLs as the source. This is intentional; see
 * docs/plans/2026-04-24-feat-meridian-demo-project-plan.md.
 *
 * Usage:
 *   DATABASE_URL="..." pnpm tsx scripts/clone-demo-project.ts \
 *     --source=<uuid> \
 *     --name=Meridian \
 *     --url=https://meridian.ai \
 *     [--force]
 */

import crypto from "crypto";
import readline from "readline/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import {
  projects,
  templates,
  pages,
  reportSections,
} from "@/db/schema";
import {
  substituteString as _substituteString,
  substituteJson as _substituteJson,
  rewriteUrlHost,
  DEMO_PROJECT_SUBSTITUTIONS,
} from "@/lib/demo-clone";

// Bind the full substitution list once so every call-site here runs the
// brand + author + podcast rules together.
const substituteString = (s: string) =>
  _substituteString(s, DEMO_PROJECT_SUBSTITUTIONS);
const substituteJson = <T>(v: T) =>
  _substituteJson(v, DEMO_PROJECT_SUBSTITUTIONS);

interface Args {
  source: string;
  name: string;
  url: string;
  force: boolean;
}

function parseArgs(): Args {
  const args: Partial<Args> = { force: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--force") args.force = true;
    else if (arg.startsWith("--source=")) args.source = arg.slice("--source=".length);
    else if (arg.startsWith("--name=")) args.name = arg.slice("--name=".length);
    else if (arg.startsWith("--url=")) args.url = arg.slice("--url=".length);
  }
  if (!args.source || !args.name || !args.url) {
    console.error(
      "Usage: --source=<uuid> --name=<label> --url=<https://...> [--force]"
    );
    process.exit(2);
  }
  return args as Args;
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(prompt);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function main() {
  const args = parseArgs();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(connectionString, {
    prepare: false,
    idle_timeout: 0,
    connect_timeout: 60,
    max: 1,
  });
  const db = drizzle(client);

  try {
    const [sourceProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, args.source));

    if (!sourceProject) {
      console.error(`Source project ${args.source} not found`);
      process.exit(1);
    }
    console.log(
      `Source: ${sourceProject.clientName} (${sourceProject.websiteUrl})`
    );

    const existing = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.clientName, args.name));

    if (existing.length > 0) {
      console.log(
        `Existing ${args.name} project(s) found: ${existing.map((e) => e.id).join(", ")}`
      );
      if (!args.force) {
        const ok = await confirm("Delete existing and recreate? [y/N] ");
        if (!ok) {
          console.log("Aborted.");
          process.exit(0);
        }
      }
      for (const e of existing) {
        await db.delete(projects).where(eq(projects.id, e.id));
      }
      console.log(`Deleted ${existing.length} existing project(s).`);
    }

    const newHost = new URL(args.url).host;

    let newProjectId = "";
    let pageCount = 0;
    let templateCount = 0;
    let reportSectionCount = 0;

    await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          clientName: args.name,
          clientEmail: sourceProject.clientEmail,
          websiteUrl: args.url,
          status: sourceProject.status,
          reportShareId: crypto.randomBytes(6).toString("base64url"),
          reportPassword: null,
          settings: sourceProject.settings
            ? substituteJson(sourceProject.settings)
            : null,
          publishedAt: sourceProject.publishedAt,
          crawlStartedAt: sourceProject.crawlStartedAt,
          crawlCompletedAt: sourceProject.crawlCompletedAt,
          analysisCompletedAt: sourceProject.analysisCompletedAt,
        })
        .returning();
      newProjectId = newProject.id;

      const sourceTemplates = await tx
        .select()
        .from(templates)
        .where(eq(templates.projectId, args.source));

      const templateMap = new Map<string, string>();
      for (const t of sourceTemplates) {
        const [newT] = await tx
          .insert(templates)
          .values({
            projectId: newProjectId,
            name: substituteString(t.name),
            displayName: t.displayName ? substituteString(t.displayName) : null,
            confidence: t.confidence,
            pageCount: t.pageCount,
            representativePageId: null,
            description: t.description ? substituteString(t.description) : null,
            complexity: t.complexity,
            urlPattern: t.urlPattern ? substituteString(t.urlPattern) : null,
          })
          .returning();
        templateMap.set(t.id, newT.id);
      }
      templateCount = sourceTemplates.length;

      const sourcePages = await tx
        .select()
        .from(pages)
        .where(eq(pages.projectId, args.source));

      const pageValues = sourcePages.map((p) => ({
        projectId: newProjectId,
        url: substituteString(rewriteUrlHost(p.url, newHost)),
        title: p.title ? substituteString(p.title) : null,
        metaDescription: p.metaDescription
          ? substituteString(p.metaDescription)
          : null,
        h1: p.h1 ? substituteString(p.h1) : null,
        wordCount: p.wordCount,
        rawMarkdown: p.rawMarkdown ? substituteString(p.rawMarkdown) : null,
        rawHtml: p.rawHtml ? substituteString(p.rawHtml) : null,
        htmlSnapshotUrl: p.htmlSnapshotUrl,
        screenshotUrl: p.screenshotUrl,
        templateId: p.templateId ? (templateMap.get(p.templateId) ?? null) : null,
        contentTier: p.contentTier,
        navigationDepth: p.navigationDepth,
        excluded: p.excluded,
        isOrphan: p.isOrphan,
        isDuplicate: p.isDuplicate,
        contentHash: p.contentHash,
        detectedSections: p.detectedSections
          ? substituteJson(p.detectedSections)
          : null,
        metadata: p.metadata ? substituteJson(p.metadata) : null,
        canonicalUrl: p.canonicalUrl
          ? substituteString(rewriteUrlHost(p.canonicalUrl, newHost))
          : null,
        metaRobots: p.metaRobots,
        schemaOrgTypes: p.schemaOrgTypes
          ? substituteJson(p.schemaOrgTypes)
          : null,
        internalLinkCount: p.internalLinkCount,
        organicTraffic: p.organicTraffic,
        trafficValueCents: p.trafficValueCents,
        topKeyword: p.topKeyword ? substituteString(p.topKeyword) : null,
        topKeywordVolume: p.topKeywordVolume,
        topKeywordPosition: p.topKeywordPosition,
        referringDomains: p.referringDomains,
        psiScoreMobile: p.psiScoreMobile,
        psiScoreDesktop: p.psiScoreDesktop,
        seoScore: p.seoScore,
        isRedirectCritical: p.isRedirectCritical,
      }));

      // Chunked batch insert — a single INSERT for 1300+ pages with large
      // rawHtml payloads can exceed Postgres' 65k parameter limit, and a long
      // sequential loop risks the pooler closing the connection mid-transaction.
      // Chunks of 100 balance payload size against round-trip count.
      const pageMap = new Map<string, string>();
      const CHUNK = 100;
      for (let i = 0; i < pageValues.length; i += CHUNK) {
        const chunk = pageValues.slice(i, i + CHUNK);
        const inserted = await tx.insert(pages).values(chunk).returning({ id: pages.id });
        for (let j = 0; j < chunk.length; j++) {
          pageMap.set(sourcePages[i + j].id, inserted[j].id);
        }
      }
      pageCount = sourcePages.length;

      for (const t of sourceTemplates) {
        if (!t.representativePageId) continue;
        const newTemplateId = templateMap.get(t.id);
        const newRepPageId = pageMap.get(t.representativePageId);
        if (newTemplateId && newRepPageId) {
          await tx
            .update(templates)
            .set({ representativePageId: newRepPageId })
            .where(eq(templates.id, newTemplateId));
        }
      }

      const sourceSections = await tx
        .select()
        .from(reportSections)
        .where(eq(reportSections.projectId, args.source));

      for (const s of sourceSections) {
        await tx.insert(reportSections).values({
          projectId: newProjectId,
          sectionType: s.sectionType,
          content: s.content ? substituteJson(s.content) : null,
          sortOrder: s.sortOrder,
          notes: s.notes ? substituteString(s.notes) : null,
        });
      }
      reportSectionCount = sourceSections.length;
    });

    console.log(`\nCloned into new project:`);
    console.log(`  ID:               ${newProjectId}`);
    console.log(`  Name:             ${args.name}`);
    console.log(`  URL:              ${args.url}`);
    console.log(`  Pages:            ${pageCount}`);
    console.log(`  Templates:        ${templateCount}`);
    console.log(`  Report sections:  ${reportSectionCount}`);
    console.log(`\nDemo ready at: http://localhost:3000/projects/${newProjectId}`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
