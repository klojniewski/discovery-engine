import { getProject, getProjectPages } from "@/actions/projects";
import { notFound } from "next/navigation";
import { CrawlProgress } from "@/components/projects/crawl-progress";
import { CrawlResultsTable } from "@/components/projects/crawl-results-table";

export default async function CrawlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) return notFound();

  const crawlPages = await getProjectPages(id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Crawl</h2>
        <p className="text-muted-foreground text-sm">
          Crawl <strong>{project.websiteUrl}</strong> to discover pages for analysis.
        </p>
      </div>

      <CrawlProgress projectId={id} initialStatus={project.status} pageCount={crawlPages.length} />

      {crawlPages.length > 0 && <CrawlResultsTable pages={crawlPages} projectName={project.clientName} />}
    </div>
  );
}
