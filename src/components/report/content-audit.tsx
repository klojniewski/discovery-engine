import { Badge } from "@/components/ui/badge";
import type { ContentAuditSection } from "@/types/report";

interface ContentAuditProps {
  audit: ContentAuditSection;
  notes?: string | null;
  clientView?: boolean;
}

const PAGES_PER_TIER_CLIENT = 20;

const TIER_CONFIG = {
  must_migrate: { label: "Must Migrate", color: "bg-green-100 text-green-800", barColor: "bg-green-500" },
  improve: { label: "Improve", color: "bg-blue-100 text-blue-800", barColor: "bg-blue-500" },
  consolidate: { label: "Consolidate", color: "bg-yellow-100 text-yellow-800", barColor: "bg-yellow-500" },
  archive: { label: "Archive", color: "bg-red-100 text-red-800", barColor: "bg-red-500" },
} as const;

export function ContentAudit({ audit, notes, clientView }: ContentAuditProps) {
  const total = audit.pages.length || 1;

  const tierOrder = ["must_migrate", "improve", "consolidate", "archive"] as const;
  const sortedPages = [...audit.pages].sort((a, b) => {
    const order = { must_migrate: 0, improve: 1, consolidate: 2, archive: 3 };
    return (
      (order[a.contentTier as keyof typeof order] ?? 4) -
      (order[b.contentTier as keyof typeof order] ?? 4)
    );
  });

  // In client view, show only top N pages per tier
  const displayPages = clientView
    ? tierOrder.flatMap((tier) => {
        const tierPages = sortedPages.filter((p) => p.contentTier === tier);
        return tierPages.slice(0, PAGES_PER_TIER_CLIENT);
      })
    : sortedPages;

  const hiddenCount = sortedPages.length - displayPages.length;

  return (
    <section id="content-audit">
      <h2 className="text-2xl font-bold mb-2">Content Audit</h2>
      <p className="text-muted-foreground mb-6">
        {audit.pages.length} pages scored across 4 content tiers
        {audit.duplicateCount > 0 && (
          <> — {audit.duplicateCount} duplicates detected</>
        )}
      </p>

      {/* Tier breakdown */}
      <div className="mb-8 space-y-3">
        <div className="flex h-10 rounded-lg overflow-hidden border">
          {tierOrder.map((tier) => {
            const count = audit.tiers[tier];
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            const config = TIER_CONFIG[tier];
            return (
              <div
                key={tier}
                className={`${config.barColor} flex items-center justify-center text-white text-xs font-medium transition-all`}
                style={{ width: `${pct}%` }}
                title={`${config.label}: ${count} pages (${Math.round(pct)}%)`}
              >
                {pct > 10 && `${count}`}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tierOrder.map((tier) => {
            const count = audit.tiers[tier];
            const pct = Math.round((count / total) * 100);
            const config = TIER_CONFIG[tier];
            return (
              <div
                key={tier}
                className="rounded-lg border p-3 text-center"
              >
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.label} ({pct}%)
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pages table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Template</th>
              <th className="text-right p-3 font-medium">Words</th>
              <th className="text-left p-3 font-medium">Tier</th>
            </tr>
          </thead>
          <tbody>
            {displayPages.map((page) => {
              const config =
                TIER_CONFIG[page.contentTier as keyof typeof TIER_CONFIG];
              return (
                <tr
                  key={page.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="p-3 font-mono text-xs max-w-[200px] truncate">
                    {page.url}
                  </td>
                  <td className="p-3 max-w-[200px] truncate text-xs">
                    {page.title || "\u2014"}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {page.templateName || "\u2014"}
                  </td>
                  <td className="p-3 text-right tabular-nums text-xs">
                    {page.wordCount ?? "\u2014"}
                  </td>
                  <td className="p-3">
                    {config ? (
                      <Badge
                        className={`${config.color} text-[10px] border-0`}
                      >
                        {config.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {"\u2014"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        <p className="mt-3 text-sm text-muted-foreground text-center">
          Showing top {PAGES_PER_TIER_CLIENT} pages per tier. {hiddenCount} additional pages not shown.
        </p>
      )}

      {notes && (
        <div className="mt-6 rounded-lg border bg-amber-50/50 p-4 text-sm">
          <p className="font-medium text-amber-900 mb-1">Notes</p>
          <p className="text-amber-800 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </section>
  );
}
