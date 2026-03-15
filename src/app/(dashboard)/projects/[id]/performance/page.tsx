import { getProject } from "@/actions/projects";
import {
  getSeoStatus,
  getPsiPages,
  getPsiCandidatePages,
} from "@/actions/seo";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PsiButton } from "@/components/seo/seo-actions";

function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 90) return "bg-green-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) return notFound();

  const status = await getSeoStatus(id);
  const psiData = status.psiComplete ? await getPsiPages(id) : null;
  const candidates = !status.psiComplete
    ? await getPsiCandidatePages(id)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Performance</h2>
        <p className="text-muted-foreground text-sm">
          PageSpeed Insights scores for representative pages of{" "}
          <strong>{project.clientName}</strong>
        </p>
      </div>

      {/* Status + Action */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">PageSpeed Insights</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            {status.psiComplete ? (
              <Badge variant="secondary">
                {status.psiScoredCount} pages scored
              </Badge>
            ) : status.psiProgress ? (
              <Badge variant="outline">
                Running... {status.psiProgress.completed}/
                {status.psiProgress.total}
              </Badge>
            ) : (
              <Badge variant="outline">
                {status.hasPsiKey ? "Not run" : "Not configured"}
              </Badge>
            )}
          </div>
          <PsiButton
            projectId={id}
            done={status.psiComplete}
            hasKey={status.hasPsiKey}
          />
        </CardContent>
      </Card>

      {/* Before running: show candidate pages */}
      {!status.psiComplete && candidates && candidates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Pages to be scored ({candidates.length})
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These are representative pages — one per template, selected
            during analysis. Each page has a screenshot, indicating it
            represents a distinct page type on the site.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">URL</th>
                  <th className="py-2 pr-4 font-medium">Title</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((page) => (
                  <tr key={page.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 pr-4 max-w-[400px]">
                      <span
                        className="truncate block text-xs"
                        title={page.url}
                      >
                        {urlPath(page.url)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 max-w-[300px]">
                      <span className="truncate block text-xs text-muted-foreground">
                        {page.title || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!status.psiComplete &&
        candidates &&
        candidates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No representative pages found. Run the analysis pipeline first to
            generate screenshots.
          </p>
        )}

      {/* After running: show results */}
      {psiData && psiData.items.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p
                  className={`text-3xl font-bold ${scoreColor(psiData.avgMobile)}`}
                >
                  {psiData.avgMobile ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Average mobile score
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p
                  className={`text-3xl font-bold ${scoreColor(psiData.avgDesktop)}`}
                >
                  {psiData.avgDesktop ?? "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Average desktop score
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">
              Pages by Performance
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sorted by mobile score (worst first). Slow pages are migration
              opportunities — they&apos;ll get faster on a modern stack.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">URL</th>
                    <th className="py-2 pr-4 font-medium text-center">
                      Mobile
                    </th>
                    <th className="py-2 pr-4 font-medium text-center">
                      Desktop
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {psiData.items.map((page) => (
                    <tr key={page.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-4 max-w-[400px]">
                        <span
                          className="truncate block text-xs"
                          title={page.url}
                        >
                          {urlPath(page.url)}
                        </span>
                        {page.title && (
                          <span className="truncate block text-xs text-muted-foreground">
                            {page.title}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-center">
                        <span
                          className={`inline-block w-10 py-0.5 rounded text-xs font-medium ${scoreBg(page.psiScoreMobile)} ${scoreColor(page.psiScoreMobile)}`}
                        >
                          {page.psiScoreMobile ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-center">
                        <span
                          className={`inline-block w-10 py-0.5 rounded text-xs font-medium ${scoreBg(page.psiScoreDesktop)} ${scoreColor(page.psiScoreDesktop)}`}
                        >
                          {page.psiScoreDesktop ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
