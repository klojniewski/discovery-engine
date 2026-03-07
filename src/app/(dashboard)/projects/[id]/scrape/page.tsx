import { getProject, getProjectPages } from "@/actions/projects";
import { notFound } from "next/navigation";
import { PageTree } from "@/components/projects/page-tree";
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
  const isScraping = project.status === "scraping";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Scrape</h2>
        <p className="text-muted-foreground text-sm">
          Select pages to scrape from <strong>{project.websiteUrl}</strong>, then capture content and screenshots.
        </p>
      </div>

      {isScraping && (
        <ScrapeRunner
          projectId={id}
          initialStatus={project.status}
          selectedCount={selectedPages.length}
          scrapedCount={scrapedPages.length}
        />
      )}

      {allPages.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted-foreground">
            No pages found. Go to the <strong>Crawl</strong> tab first to discover pages.
          </p>
        </div>
      ) : (
        <>
          {!isScraping && (
            <PageTree
              projectId={id}
              pages={allPages.map((p) => ({
                id: p.id,
                url: p.url,
                title: p.title,
                excluded: p.excluded,
              }))}
              initialStatus={project.status}
            />
          )}

          {scrapedPages.length > 0 && (
            <ScrapeResultsTable
              pages={scrapedPages.map((p) => ({
                id: p.id,
                url: p.url,
                title: p.title,
                wordCount: p.wordCount,
                screenshotUrl: p.screenshotUrl,
                hasMarkdown: !!p.rawMarkdown,
                rawMarkdown: p.rawMarkdown,
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}
