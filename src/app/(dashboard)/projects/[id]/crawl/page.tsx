import { getProject, getProjectPagesPaginated } from "@/actions/projects";
import { notFound } from "next/navigation";
import { CrawlProgress } from "@/components/projects/crawl-progress";
import { CrawlResultsTable } from "@/components/projects/crawl-results-table";

export default async function CrawlPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const project = await getProject(id);

  if (!project) return notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const result = await getProjectPagesPaginated(id, currentPage, 50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Crawl</h2>
        <p className="text-muted-foreground text-sm">
          Crawl <strong>{project.websiteUrl}</strong> to discover pages.
        </p>
      </div>

      <CrawlProgress projectId={id} initialStatus={project.status} pageCount={result.total} />

      {result.total > 0 && (
        <CrawlResultsTable
          pages={result.items.map((p) => ({
            id: p.id,
            url: p.url,
            title: p.title,
            wordCount: p.wordCount,
            rawMarkdown: p.rawMarkdown,
          }))}
          projectName={project.clientName}
          totalCount={result.total}
          currentPage={result.page}
          totalPages={result.totalPages}
          projectId={id}
        />
      )}
    </div>
  );
}
