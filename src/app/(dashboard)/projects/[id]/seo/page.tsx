import { getProject } from "@/actions/projects";
import { getSeoStatus, getRedirectCriticalPages } from "@/actions/seo";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AhrefsUpload } from "@/components/seo/ahrefs-upload";
import { SeoTable } from "@/components/seo/seo-table";
import {
  SeoExtractionButton,
  ComputeScoresButton,
} from "@/components/seo/seo-actions";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function SeoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; critical?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, critical } = await searchParams;
  const project = await getProject(id);

  if (!project) return notFound();

  const status = await getSeoStatus(id);
  const currentPage = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const onlyCritical = critical === "true";

  const seoData =
    status.seoScoredCount > 0
      ? await getRedirectCriticalPages(id, currentPage, 50, onlyCritical)
      : null;

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (onlyCritical) params.set("critical", "true");
    return `/projects/${id}/seo?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">SEO Baseline</h2>
        <p className="text-muted-foreground text-sm">
          Data-driven migration risk assessment for{" "}
          <strong>{project.clientName}</strong>
        </p>
      </div>

      {/* Section A: Data Sources */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">On-page SEO</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            {status.seoExtractionComplete ? (
              <Badge variant="secondary">
                Extracted ({status.extractedCount} pages)
              </Badge>
            ) : status.seoExtractionProgress ? (
              <Badge variant="outline">
                Extracting... {status.seoExtractionProgress.completed}/
                {status.seoExtractionProgress.total}
              </Badge>
            ) : (
              <Badge variant="outline">Not run</Badge>
            )}
          </div>
          <SeoExtractionButton
            projectId={id}
            done={status.seoExtractionComplete}
            hasPages={status.totalPagesWithHtml > 0}
            initialProgress={status.seoExtractionProgress}
          />
        </CardContent>
      </Card>

      {/* Ahrefs Upload */}
      <AhrefsUpload
        projectId={id}
        uploadStatus={status.ahrefsUploads}
      />

      {/* Compute Scores */}
      <div className="flex items-center gap-4">
        <ComputeScoresButton
          projectId={id}
          hasData={status.extractedCount > 0 || !!status.ahrefsUploads?.topPages}
        />
        {status.seoScoredCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {status.seoScoredCount} pages scored,{" "}
            {status.redirectCriticalCount} redirect-critical
          </p>
        )}
      </div>

      {/* Section B: Redirect-Critical Pages */}
      {seoData && seoData.items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {onlyCritical ? "Redirect-Critical Pages" : "All Scored Pages"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {seoData.redirectCriticalCount} of {seoData.total} pages are
                redirect-critical, representing{" "}
                <strong>
                  ${(seoData.totalTrafficValueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </strong>
                /mo in organic traffic value
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/projects/${id}/seo${onlyCritical ? "" : "?critical=true"}`}
                className="text-sm text-primary hover:underline"
              >
                {onlyCritical ? "Show all" : "Critical only"}
              </Link>
            </div>
          </div>

          <SeoTable pages={seoData.items} />

          {/* Pagination */}
          {seoData.totalPages > 1 && (() => {
            const startItem = (currentPage - 1) * 50 + 1;
            const endItem = Math.min(currentPage * 50, seoData.total);
            return (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startItem}–{endItem} of {seoData.total}
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
                    Page {currentPage} of {seoData.totalPages}
                  </span>
                  <Link
                    href={buildPageUrl(currentPage + 1)}
                    className={`inline-flex items-center justify-center rounded-md border h-8 w-8 ${
                      currentPage >= seoData.totalPages
                        ? "pointer-events-none opacity-50"
                        : "hover:bg-muted"
                    }`}
                    aria-disabled={currentPage >= seoData.totalPages}
                    tabIndex={currentPage >= seoData.totalPages ? -1 : undefined}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
