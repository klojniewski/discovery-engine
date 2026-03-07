import { getProject, getProjectPages } from "@/actions/projects";
import { notFound } from "next/navigation";
import { CrawlProgress } from "@/components/projects/crawl-progress";

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

      <CrawlProgress projectId={id} initialStatus={project.status} />

      {crawlPages.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">
            Crawled Pages ({crawlPages.length})
          </h3>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">URL</th>
                  <th className="text-left p-3 font-medium">Title</th>
                  <th className="text-right p-3 font-medium">Words</th>
                </tr>
              </thead>
              <tbody>
                {crawlPages.map((page) => (
                  <tr key={page.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs max-w-xs truncate">
                      {page.url}
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {page.title || "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {page.wordCount ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
