import {
  getProject,
  getProjectPagesPaginated,
  getProjectPagesForTree,
} from "@/actions/projects";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  FolderTree,
  List,
  Map,
} from "lucide-react";
import { PageTreeView } from "@/components/pages/page-tree-view";
import { PagesTable } from "@/components/pages/pages-table";

export default async function PagesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; search?: string; view?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, search, view } = await searchParams;
  const project = await getProject(id);

  if (!project) return notFound();

  const isTreeView = view === "tree";
  const currentPage = Math.max(1, parseInt(pageParam ?? "1") || 1);

  // For tree view, load all pages with tier/template data
  // For list view, paginate as before
  const [result, treePages] = await Promise.all([
    isTreeView
      ? Promise.resolve(null)
      : getProjectPagesPaginated(id, currentPage, 50, search),
    isTreeView ? getProjectPagesForTree(id) : Promise.resolve(null),
  ]);

  const total = result?.total ?? treePages?.length ?? 0;

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("search", search);
    if (view) params.set("view", view);
    return `/projects/${id}/pages?${params.toString()}`;
  }

  function buildViewUrl(newView: string) {
    const params = new URLSearchParams();
    if (newView !== "list") params.set("view", newView);
    return `/projects/${id}/pages?${params.toString()}`;
  }

  const startItem = result ? (currentPage - 1) * 50 + 1 : 0;
  const endItem = result ? Math.min(currentPage * 50, result.total) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">Pages</h2>
          <p className="text-muted-foreground text-sm">
            {total} pages for <strong>{project.clientName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={buildViewUrl("list")}
            className={`inline-flex items-center justify-center rounded-md border h-8 w-8 ${
              !isTreeView ? "bg-muted" : "hover:bg-muted/50"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Link>
          <Link
            href={buildViewUrl("tree")}
            className={`inline-flex items-center justify-center rounded-md border h-8 w-8 ${
              isTreeView ? "bg-muted" : "hover:bg-muted/50"
            }`}
            title="Tree view"
          >
            <FolderTree className="h-4 w-4" />
          </Link>
          <Link
            href={`/projects/${id}/pages/sitemap`}
            className="inline-flex items-center justify-center rounded-md border h-8 w-8 hover:bg-muted/50"
            title="Visual sitemap"
          >
            <Map className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Search (list view only) */}
      {!isTreeView && (
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
      )}

      {/* Tree View */}
      {isTreeView && treePages && (
        <PageTreeView pages={treePages} projectId={id} />
      )}

      {/* List View */}
      {!isTreeView && result && (
        <>
          {result.total === 0 && search && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No pages matching &ldquo;{search}&rdquo;
            </p>
          )}

          {result.total > 0 && (
            <>
              <PagesTable pages={result.items} projectId={id} />

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
                      tabIndex={
                        currentPage >= result.totalPages ? -1 : undefined
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
