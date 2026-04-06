import { getProject } from "@/actions/projects";
import {
  getSeoStatus,
  getPsiPages,
  getPsiCandidatePages,
  getCruxData,
} from "@/actions/seo";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PsiButton } from "@/components/seo/seo-actions";
import { CruxOverview } from "@/components/seo/crux-overview";
import { PsiRerunButton } from "@/components/seo/psi-rerun-button";

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

  const [status, crux, candidates] = await Promise.all([
    getSeoStatus(id),
    getCruxData(id),
    getPsiCandidatePages(id),
  ]);
  const psiData = status.psiComplete ? await getPsiPages(id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Performance</h2>
        <p className="text-muted-foreground text-sm">
          Real user experience and lab scores for{" "}
          <strong>{project.clientName}</strong>
        </p>
      </div>

      {/* CrUX Origin Data */}
      <CruxOverview
        projectId={id}
        initialOrigin={crux?.origin ?? null}
        initialHistory={crux?.history ?? null}
      />

      {/* PSI Status + Action */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            PageSpeed Insights (Lab Data)
          </CardTitle>
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
            hasCandidates={candidates.length > 0}
            initialProgress={status.psiProgress}
          />
        </CardContent>
      </Card>

      {/* Before running: show candidate pages */}
      {!status.psiComplete && candidates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Pages to be scored ({candidates.length})
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These are representative pages — one per template, selected
            during analysis. Each page represents a distinct page type on
            the site.
          </p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">URL</th>
                  <th className="text-left p-3 font-medium">Title</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((page) => (
                  <tr
                    key={page.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-3 font-mono text-xs max-w-[400px] truncate">
                      {urlPath(page.url)}
                    </td>
                    <td className="p-3 max-w-[300px] truncate text-muted-foreground">
                      {page.title || "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!status.psiComplete && candidates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No representative pages found. Run the analysis pipeline first to
          identify templates.
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
                  {psiData.avgMobile ?? "\u2014"}
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
                  {psiData.avgDesktop ?? "\u2014"}
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
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Page</th>
                    <th className="text-left p-3 font-medium">Template</th>
                    <th className="text-center p-3 font-medium">Mobile</th>
                    <th className="text-center p-3 font-medium">Desktop</th>
                    <th className="p-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {psiData.items.map((page) => (
                    <tr
                      key={page.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-3 max-w-[400px]">
                        <span className="truncate block text-sm font-medium">
                          {page.title || urlPath(page.url)}
                        </span>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-muted-foreground hover:text-primary truncate block"
                          title={page.url}
                        >
                          {urlPath(page.url)}
                        </a>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground">
                          {page.templateDisplayName || "\u2014"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block w-10 py-0.5 rounded text-xs font-medium ${scoreBg(page.psiScoreMobile)} ${scoreColor(page.psiScoreMobile)}`}
                        >
                          {page.psiScoreMobile ?? "\u2014"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block w-10 py-0.5 rounded text-xs font-medium ${scoreBg(page.psiScoreDesktop)} ${scoreColor(page.psiScoreDesktop)}`}
                        >
                          {page.psiScoreDesktop ?? "\u2014"}
                        </span>
                      </td>
                      <td className="p-3">
                        <PsiRerunButton pageId={page.id} />
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
