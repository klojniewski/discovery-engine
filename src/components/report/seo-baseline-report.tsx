import type { SeoBaselineData } from "@/types/report";
import { Badge } from "@/components/ui/badge";

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function formatNumber(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US");
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function psiColor(score: number | null): string {
  if (score === null) return "";
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function tierLabel(tier: string | null): string {
  if (!tier) return "";
  return tier.replace("_", " ");
}

export function SeoBaselineReport({ data }: { data: SeoBaselineData }) {
  return (
    <section id="seo-baseline" className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">SEO Baseline</h2>
        <p className="text-muted-foreground">
          {data.hasAhrefsData
            ? "SEO analysis with organic traffic, link equity, and on-page health data"
            : "On-page analysis only — traffic and link equity data not yet available"}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{data.summary.redirectCriticalCount}</p>
          <p className="text-sm text-muted-foreground">Redirect-critical pages</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">
            {formatDollars(data.summary.totalTrafficValue)}
          </p>
          <p className="text-sm text-muted-foreground">Monthly traffic value</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{data.summary.totalPagesScored}</p>
          <p className="text-sm text-muted-foreground">Pages scored</p>
        </div>
        {data.hasPsiData && (
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold flex items-center gap-1">
              <span className={psiColor(data.summary.avgPsiMobile)}>{data.summary.avgPsiMobile ?? "—"}</span>
              <span className="text-muted-foreground font-normal">/</span>
              <span className={psiColor(data.summary.avgPsiDesktop)}>{data.summary.avgPsiDesktop ?? "—"}</span>
            </p>
            <p className="text-sm text-muted-foreground">Avg PSI (mobile / desktop)</p>
          </div>
        )}
      </div>

      {/* Redirect-Critical Pages Table */}
      {data.redirectCriticalPages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-1">Redirect-Critical Pages</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These {data.redirectCriticalPages.length} pages must have proper
            redirects configured during migration to preserve SEO value.
            Failing to redirect these pages will result in immediate organic traffic loss
            and forfeiture of accumulated link equity.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">URL</th>
                  <th className="py-2 pr-4 font-medium text-right">Traffic</th>
                  <th className="py-2 pr-4 font-medium text-right">Value</th>
                  <th className="py-2 pr-4 font-medium text-right">RDs</th>
                  <th className="py-2 pr-4 font-medium">Top Keyword</th>
                  <th className="py-2 pr-4 font-medium text-right">Score</th>
                  <th className="py-2 pr-4 font-medium">Tier</th>
                </tr>
              </thead>
              <tbody>
                {data.redirectCriticalPages.map((page, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 pr-4 max-w-[300px]">
                      <span className="truncate block text-xs" title={page.url}>
                        {urlPath(page.url)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatNumber(page.organicTraffic)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {page.trafficValueCents !== null
                        ? formatDollars(page.trafficValueCents)
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatNumber(page.referringDomains)}
                    </td>
                    <td className="py-2 pr-4 max-w-[200px]">
                      <span className="truncate block text-xs text-muted-foreground">
                        {page.topKeyword || "—"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-medium tabular-nums">
                      {page.seoScore}
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {tierLabel(page.contentTier)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* On-Page Technical Debt */}
      <div>
        <h3 className="text-lg font-semibold mb-1">On-Page Technical Debt</h3>
        <p className="text-sm text-muted-foreground mb-3">
          SEO issues that should be resolved during migration. These represent quick wins for improving search visibility on the new platform.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">{data.onPageIssues.missingH1}</p>
            <p className="text-sm text-muted-foreground">Missing H1</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">{data.onPageIssues.missingCanonical}</p>
            <p className="text-sm text-muted-foreground">Missing canonical</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">{data.onPageIssues.noindexPages}</p>
            <p className="text-sm text-muted-foreground">Noindex pages</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-2xl font-bold">{data.onPageIssues.missingSchemaOrg}</p>
            <p className="text-sm text-muted-foreground">Missing Schema.org</p>
          </div>
        </div>
      </div>

      {/* Pre-Migration Issues */}
      {data.preMigrationIssues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Pre-Migration Issues</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These pages already have HTTP errors but have inbound links.
            Migration is an opportunity to fix them.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">URL</th>
                  <th className="py-2 pr-4 font-medium text-right">HTTP Code</th>
                  <th className="py-2 pr-4 font-medium text-right">Referring Domains</th>
                </tr>
              </thead>
              <tbody>
                {data.preMigrationIssues.map((issue, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 pr-4 text-xs">{urlPath(issue.url)}</td>
                    <td className="py-2 pr-4 text-right">
                      <Badge variant="destructive">{issue.httpCode}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {issue.referringDomains}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
