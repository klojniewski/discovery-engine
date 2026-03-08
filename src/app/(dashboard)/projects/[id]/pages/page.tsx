import { getProject, getProjectPagesPaginated } from "@/actions/projects";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default async function PagesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, search } = await searchParams;
  const project = await getProject(id);

  if (!project) return notFound();

  const currentPage = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const result = await getProjectPagesPaginated(id, currentPage, 50, search);

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("search", search);
    return `/projects/${id}/pages?${params.toString()}`;
  }

  const startItem = (currentPage - 1) * 50 + 1;
  const endItem = Math.min(currentPage * 50, result.total);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Pages</h2>
        <p className="text-muted-foreground text-sm">
          All {result.total} pages for <strong>{project.clientName}</strong>
        </p>
      </div>

      <form className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search by URL or title..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {result.total === 0 && search && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No pages matching &ldquo;{search}&rdquo;
        </p>
      )}

      {result.total > 0 && (
        <>
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
                {result.items.map((page) => (
                  <tr key={page.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs max-w-xs truncate">
                      <Link
                        href={`/projects/${id}/pages/${page.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {page.url}
                      </Link>
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {page.title || "\u2014"}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {page.wordCount ?? "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startItem}–{endItem} of {result.total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className={`inline-flex items-center justify-center rounded-md border h-8 w-8 ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-muted"
                  }`}
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {currentPage} of {result.totalPages}
                </span>
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className={`inline-flex items-center justify-center rounded-md border h-8 w-8 ${
                    currentPage >= result.totalPages
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-muted"
                  }`}
                  aria-disabled={currentPage >= result.totalPages}
                  tabIndex={currentPage >= result.totalPages ? -1 : undefined}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
