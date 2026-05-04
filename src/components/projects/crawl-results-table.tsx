"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { ContentPreviewPanel } from "./content-preview-panel";
import { ExportPagesButton } from "@/components/pages/export-pages-button";

interface CrawlPage {
  id: string;
  url: string;
  title: string | null;
  wordCount: number | null;
  rawMarkdown: string | null;
}

export function CrawlResultsTable({
  pages,
  projectName,
  totalCount,
  currentPage,
  totalPages,
  projectId,
  search,
}: {
  pages: CrawlPage[];
  projectName: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  projectId: string;
  search?: string;
}) {
  const [previewPage, setPreviewPage] = useState<CrawlPage | null>(null);
  const [searchValue, setSearchValue] = useState(search ?? "");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    }
    router.push(`/projects/${projectId}/crawl?${params.toString()}`);
  }

  function clearSearch() {
    setSearchValue("");
    router.push(`/projects/${projectId}/crawl`);
  }

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (search) params.set("search", search);
    return `/projects/${projectId}/crawl?${params.toString()}`;
  }

  const startItem = (currentPage - 1) * 50 + 1;
  const endItem = Math.min(currentPage * 50, totalCount);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">
          Crawled Pages ({totalCount})
          {search && (
            <span className="text-muted-foreground font-normal text-sm ml-2">
              filtered by &ldquo;{search}&rdquo;
            </span>
          )}
        </h3>
        <ExportPagesButton projectId={projectId} projectName={projectName} />
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by URL or title..."
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="secondary" size="default">
          Search
        </Button>
      </form>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
              <th className="text-center p-3 font-medium w-16">Content</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr
                key={page.id}
                className={`border-b last:border-0 hover:bg-muted/30 ${
                  previewPage?.id === page.id ? "bg-primary/5" : ""
                }`}
              >
                <td className="p-3 font-mono text-xs max-w-xs truncate">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {page.url}
                  </a>
                </td>
                <td className="p-3 max-w-xs truncate">
                  {page.title || "\u2014"}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {page.wordCount ?? "\u2014"}
                </td>
                <td className="p-3 text-center">
                  {page.rawMarkdown ? (
                    <button
                      onClick={() =>
                        setPreviewPage(
                          previewPage?.id === page.id ? null : page
                        )
                      }
                      className={`p-1 rounded hover:bg-muted ${
                        previewPage?.id === page.id
                          ? "text-primary bg-primary/10"
                          : "text-green-600"
                      }`}
                      title="Preview content"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-muted-foreground">
                      <FileText className="h-4 w-4 inline" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {totalCount}
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
            {generatePageNumbers(currentPage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
                  ...
                </span>
              ) : (
                <Link
                  key={p}
                  href={buildPageUrl(p as number)}
                  className={`inline-flex items-center justify-center rounded-md h-8 min-w-8 px-2 text-sm ${
                    p === currentPage
                      ? "bg-primary text-primary-foreground"
                      : "border hover:bg-muted"
                  }`}
                >
                  {p}
                </Link>
              )
            )}
            <Link
              href={buildPageUrl(currentPage + 1)}
              className={`inline-flex items-center justify-center rounded-md border h-8 w-8 ${
                currentPage >= totalPages
                  ? "pointer-events-none opacity-50"
                  : "hover:bg-muted"
              }`}
              aria-disabled={currentPage >= totalPages}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {previewPage && (
        <ContentPreviewPanel
          page={previewPage}
          onClose={() => setPreviewPage(null)}
        />
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
