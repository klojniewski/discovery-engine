import { notFound } from "next/navigation";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getReportSections } from "@/actions/report";
import { ReportGenerator } from "@/components/report/report-generator";
import { PublishButton } from "@/components/report/publish-button";
import { ReportLayout } from "@/components/report/report-layout";
import { ExecutiveSummary } from "@/components/report/executive-summary";
import { TemplateInventory } from "@/components/report/template-inventory";
import { SiteArchitecture } from "@/components/report/site-architecture";
import { ContentAudit } from "@/components/report/content-audit";
import { SectionInventoryReport } from "@/components/report/section-inventory-report";
import { SectionNotes } from "@/components/report/section-notes";
import { SeoBaselineReport } from "@/components/report/seo-baseline-report";
import type { SeoBaselineData } from "@/types/report";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) return notFound();

  const sections = await getReportSections(id);
  const hasReport = sections.length > 0;

  const getSection = (type: string) =>
    sections.find((s) => s.sectionType === type);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Report</h2>
          <p className="text-muted-foreground text-sm">
            Migration audit report for{" "}
            <strong>{project.websiteUrl}</strong>
          </p>
        </div>
        {hasReport && (
          <PublishButton
            projectId={id}
            shareId={project.reportShareId}
            isPublished={project.status === "published"}
          />
        )}
      </div>

      <ReportGenerator projectId={id} hasExistingReport={hasReport} />

      {hasReport && (
        <div className="rounded-xl border">
          <ReportLayout
            clientName={project.clientName}
            websiteUrl={project.websiteUrl}
            date={formatDate(
              project.analysisCompletedAt ?? project.createdAt
            )}
            showBranding={true}
          >
            {/* Executive Summary */}
            {(() => {
              const section = getSection("executive_summary");
              if (!section) return null;
              const content = section.content as {
                stats: ExecutiveSummaryStats;
                project: Record<string, string>;
              };
              return (
                <div>
                  <ExecutiveSummary
                    stats={content.stats}
                    websiteUrl={project.websiteUrl}
                    analysisDate={
                      project.analysisCompletedAt
                        ? formatDate(project.analysisCompletedAt)
                        : null
                    }
                  />
                  <SectionNotes
                    sectionId={section.id}
                    initialNotes={section.notes}
                  />
                </div>
              );
            })()}

            {/* Template Inventory */}
            {(() => {
              const section = getSection("template_inventory");
              if (!section) return null;
              const content = section.content as {
                templates: TemplateData[];
              };
              return (
                <div>
                  <TemplateInventory templates={content.templates} />
                  <SectionNotes
                    sectionId={section.id}
                    initialNotes={section.notes}
                  />
                </div>
              );
            })()}

            {/* Section Inventory */}
            {(() => {
              const section = getSection("section_inventory");
              if (!section) return null;
              const content = section.content as {
                sections: SectionReportData[];
              };
              return (
                <div>
                  <SectionInventoryReport
                    sections={content.sections}
                  />
                  <SectionNotes
                    sectionId={section.id}
                    initialNotes={section.notes}
                  />
                </div>
              );
            })()}

            {/* Site Architecture */}
            {(() => {
              const section = getSection("site_architecture");
              if (!section) return null;
              const content = section.content as {
                tree: SiteArchitectureData[];
              };
              return (
                <div>
                  <SiteArchitecture tree={content.tree} />
                  <SectionNotes
                    sectionId={section.id}
                    initialNotes={section.notes}
                  />
                </div>
              );
            })()}

            {/* Content Audit */}
            {(() => {
              const section = getSection("content_audit");
              if (!section) return null;
              const content = section.content as {
                audit: ContentAuditData;
              };
              return (
                <div>
                  <ContentAudit audit={content.audit} />
                  <SectionNotes
                    sectionId={section.id}
                    initialNotes={section.notes}
                  />
                </div>
              );
            })()}

            {/* SEO Baseline */}
            {(() => {
              const section = getSection("seo_baseline");
              if (!section) return null;
              const content = section.content as {
                seoBaseline: SeoBaselineData;
              };
              return (
                <div>
                  <SeoBaselineReport data={content.seoBaseline} />
                  <SectionNotes
                    sectionId={section.id}
                    initialNotes={section.notes}
                  />
                </div>
              );
            })()}
          </ReportLayout>
        </div>
      )}
    </div>
  );
}

// Type aliases for JSONB content
type ExecutiveSummaryStats = {
  totalPages: number;
  scrapedPages: number;
  templateCount: number;
  sectionTypeCount: number;
  totalWords: number;
  avgWordsPerPage: number;
};

type TemplateData = {
  id: string;
  name: string;
  displayName: string | null;
  confidence: string | null;
  pageCount: number;
  description: string | null;
  complexity: string | null;
  representativeScreenshot: string | null;
  pages: { id: string; url: string; title: string | null }[];
};

type SiteArchitectureData = {
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
  children: SiteArchitectureData[];
};

type SectionReportData = {
  slug: string;
  name: string;
  category: string;
  svgContent: string | null;
  count: number;
};

type ContentAuditData = {
  tiers: { must_migrate: number; improve: number; consolidate: number; archive: number; unscored: number };
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
};
