import { getProject, getProjectPagesForTree } from "@/actions/projects";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SitemapTreemap } from "@/components/pages/sitemap-treemap";

export default async function SitemapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) return notFound();

  const pages = await getProjectPagesForTree(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${id}/pages`}
          className="inline-flex items-center justify-center rounded-md border h-8 w-8 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold">Visual Sitemap</h2>
          <p className="text-muted-foreground text-sm">
            {pages.length} pages for <strong>{project.clientName}</strong> — sized by page count, colored by content tier
          </p>
        </div>
      </div>

      <SitemapTreemap pages={pages} projectId={id} />
    </div>
  );
}
