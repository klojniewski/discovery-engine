import { Badge } from "@/components/ui/badge";

interface SectionTypeWithCount {
  slug: string;
  name: string;
  category: string;
  svgContent: string | null;
  count: number;
}

interface SectionInventoryProps {
  sectionTypes: SectionTypeWithCount[];
  unmatchedCount: number;
  totalPages: number;
  pagesWithSections: number;
}

export function SectionInventory({
  sectionTypes,
  unmatchedCount,
  totalPages,
  pagesWithSections,
}: SectionInventoryProps) {
  if (pagesWithSections === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No sections detected yet. Run analysis to detect sections across all pages.
      </p>
    );
  }

  // Group by category
  const grouped = new Map<string, SectionTypeWithCount[]>();
  for (const st of sectionTypes) {
    const group = grouped.get(st.category) ?? [];
    group.push(st);
    grouped.set(st.category, group);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {sectionTypes.length} section types detected across {pagesWithSections}/{totalPages} pages
        {unmatchedCount > 0 && ` (${unmatchedCount} unmatched sections)`}
      </p>

      {[...grouped.entries()].map(([category, types]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {category}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {types
              .sort((a, b) => b.count - a.count)
              .map((st) => (
                <div
                  key={st.slug}
                  className="rounded-lg border p-3 space-y-2"
                >
                  {st.svgContent ? (
                    <div
                      className="w-full rounded bg-muted/30 overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
                      dangerouslySetInnerHTML={{
                        __html: st.svgContent.replace(
                          /width="280"\s+height="140"/,
                          'width="100%" viewBox="0 0 280 140" preserveAspectRatio="xMidYMid meet"'
                        ),
                      }}
                    />
                  ) : (
                    <div className="w-full h-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No SVG
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{st.name}</p>
                    <Badge variant="secondary" className="text-xs shrink-0 ml-1">
                      {st.count}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
