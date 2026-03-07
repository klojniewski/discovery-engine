import { getProject, getProjectPages } from "@/actions/projects";
import { notFound } from "next/navigation";
import { ScrapeRunner } from "@/components/projects/scrape-runner";
import { ScrapeResultsTable } from "@/components/projects/scrape-results-table";

export default async function ScrapePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) return notFound();

  const allPages = await getProjectPages(id);
  const selectedPages = allPages.filter((p) => !p.excluded);
  const scrapedPages = selectedPages.filter((p) => p.rawMarkdown || p.screenshotUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Scrape</h2>
        <p className="text-muted-foreground text-sm">
          Capture content and screenshots for selected pages from <strong>{project.websiteUrl}</strong>
        </p>
      </div>

      <ScrapeRunner
        projectId={id}
        initialStatus={project.status}
        selectedCount={selectedPages.length}
        scrapedCount={scrapedPages.length}
      />

      {scrapedPages.length > 0 && (
        <ScrapeResultsTable
          pages={scrapedPages.map((p) => ({
            id: p.id,
            url: p.url,
            title: p.title,
            wordCount: p.wordCount,
            screenshotUrl: p.screenshotUrl,
            hasMarkdown: !!p.rawMarkdown,
            hasHtml: !!p.rawHtml,
          }))}
        />
      )}
    </div>
  );
}
