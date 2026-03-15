import { notFound } from "next/navigation";
import { getPublicReport, getReportSections } from "@/actions/report";
import { PasswordGate } from "@/components/report/password-gate";
import { ReportLayout } from "@/components/report/report-layout";
import { ExecutiveSummary } from "@/components/report/executive-summary";
import { TemplateInventory } from "@/components/report/template-inventory";
import { SiteArchitecture } from "@/components/report/site-architecture";
import { ContentAudit } from "@/components/report/content-audit";
import { SectionInventoryReport } from "@/components/report/section-inventory-report";
import { ReportCtaBar } from "@/components/report/report-cta-bar";
import { SeoBaselineReport } from "@/components/report/seo-baseline-report";
import type { SeoBaselineData } from "@/types/report";

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const report = await getPublicReport(shareId);
  if (!report) return notFound();

  const { project, sections } = report;

  const getSection = (type: string) =>
    sections.find((s) => s.sectionType === type);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  const reportContent = (
    <>
      <ReportLayout
        clientName={project.clientName}
        websiteUrl={project.websiteUrl}
        date={formatDate(project.publishedAt)}
        showBranding={true}
      >
        {(() => {
          const section = getSection("executive_summary");
          if (!section) return null;
          const content = section.content as {
            stats: {
              totalPages: number;
              scrapedPages: number;
              templateCount: number;
              sectionTypeCount: number;
              totalWords: number;
              avgWordsPerPage: number;
            };
          };
          return (
            <ExecutiveSummary
              stats={content.stats}
              websiteUrl={project.websiteUrl}
              analysisDate={formatDate(project.publishedAt)}
              notes={section.notes}
            />
          );
        })()}

        {(() => {
          const section = getSection("template_inventory");
          if (!section) return null;
          const content = section.content as { templates: TemplateData[] };
          return (
            <TemplateInventory
              templates={content.templates}
              notes={section.notes}
            />
          );
        })()}

        {(() => {
          const section = getSection("section_inventory");
          if (!section) return null;
          const content = section.content as { sections: SectionReportData[] };
          return (
            <SectionInventoryReport
              sections={content.sections}
              notes={section.notes}
            />
          );
        })()}

        {(() => {
          const section = getSection("site_architecture");
          if (!section) return null;
          const content = section.content as {
            tree: SiteArchitectureData[];
          };
          return (
            <SiteArchitecture tree={content.tree} notes={section.notes} />
          );
        })()}

        {(() => {
          const section = getSection("content_audit");
          if (!section) return null;
          const content = section.content as { audit: ContentAuditData };
          return (
            <ContentAudit audit={content.audit} notes={section.notes} />
          );
        })()}

        {(() => {
          const section = getSection("seo_baseline");
          if (!section) return null;
          const content = section.content as {
            seoBaseline: SeoBaselineData;
          };
          return (
            <SeoBaselineReport data={content.seoBaseline} />
          );
        })()}
      </ReportLayout>
      <div className="pb-16" /> {/* Space for CTA bar */}
      <ReportCtaBar />
    </>
  );

  if (project.hasPassword) {
    return (
      <PasswordGate shareId={shareId}>{reportContent}</PasswordGate>
    );
  }

  return reportContent;
}

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
