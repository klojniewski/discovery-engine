import { Badge } from "@/components/ui/badge";

interface PageWithTier {
  id: string;
  url: string;
  title: string | null;
  contentTier: string | null;
  wordCount: number | null;
  isDuplicate: boolean | null;
}

const TIER_CONFIG = {
  must_migrate: { label: "Must Migrate", color: "bg-green-100 text-green-800" },
  improve: { label: "Improve", color: "bg-blue-100 text-blue-800" },
  consolidate: { label: "Consolidate", color: "bg-yellow-100 text-yellow-800" },
  archive: { label: "Archive", color: "bg-red-100 text-red-800" },
} as const;

export function ContentTiers({ pages }: { pages: PageWithTier[] }) {
  const tierCounts = {
    must_migrate: pages.filter((p) => p.contentTier === "must_migrate").length,
    improve: pages.filter((p) => p.contentTier === "improve").length,
    consolidate: pages.filter((p) => p.contentTier === "consolidate").length,
    archive: pages.filter((p) => p.contentTier === "archive").length,
    unscored: pages.filter((p) => !p.contentTier).length,
  };

  const total = pages.length || 1;

  return (
    <div className="space-y-6">
      {/* Tier breakdown bar */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Tier Breakdown</h4>
        <div className="flex h-8 rounded-md overflow-hidden border">
          {Object.entries(TIER_CONFIG).map(([key, config]) => {
            const count = tierCounts[key as keyof typeof tierCounts];
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className={`${config.color} flex items-center justify-center text-xs font-medium transition-all`}
                style={{ width: `${pct}%` }}
                title={`${config.label}: ${count} pages (${Math.round(pct)}%)`}
              >
                {pct > 8 && `${count}`}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(TIER_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${config.color}`} />
              <span>
                {config.label}: {tierCounts[key as keyof typeof tierCounts]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pages table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">URL</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-right p-3 font-medium">Words</th>
              <th className="text-left p-3 font-medium">Tier</th>
            </tr>
          </thead>
          <tbody>
            {pages
              .sort((a, b) => {
                const order = { must_migrate: 0, improve: 1, consolidate: 2, archive: 3 };
                return (
                  (order[a.contentTier as keyof typeof order] ?? 4) -
                  (order[b.contentTier as keyof typeof order] ?? 4)
                );
              })
              .map((page) => {
                const config =
                  TIER_CONFIG[page.contentTier as keyof typeof TIER_CONFIG];
                return (
                  <tr
                    key={page.id}
                    className="border-b last:border-0 hover:bg-muted/30"
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
                      {page.title || "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {page.wordCount ?? "—"}
                    </td>
                    <td className="p-3">
                      {config ? (
                        <Badge className={`${config.color} text-xs border-0`}>
                          {config.label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
