import { Badge } from "@/components/ui/badge";

interface SectionData {
  slug: string;
  name: string;
  category: string;
  svgContent: string | null;
  count: number;
}

export function SectionInventoryReport({
  sections,
  notes,
}: {
  sections: SectionData[];
  notes?: string | null;
}) {
  const totalInstances = sections.reduce((sum, s) => sum + s.count, 0);

  // Group by category
  const grouped = new Map<string, SectionData[]>();
  for (const s of sections) {
    const group = grouped.get(s.category) ?? [];
    group.push(s);
    grouped.set(s.category, group);
  }

  return (
    <section id="section-inventory" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sections</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {sections.length} unique section types detected across{" "}
          {totalInstances} instances
        </p>
      </div>

      {notes && (
        <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {[...grouped.entries()].map(([category, types]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {category}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {types
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <div key={s.slug} className="rounded-lg border overflow-hidden">
                  {s.svgContent ? (
                    <div
                      className="w-full bg-muted/30 overflow-hidden border-b [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
                      dangerouslySetInnerHTML={{
                        __html: s.svgContent.replace(
                          /width="280"\s+height="140"/,
                          'width="100%" viewBox="0 0 280 140" preserveAspectRatio="xMidYMid meet"'
                        ),
                      }}
                    />
                  ) : (
                    <div className="w-full h-20 bg-muted flex items-center justify-center text-xs text-muted-foreground border-b">
                      No preview
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">
                        {s.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs shrink-0 ml-1">
                        {s.count}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}
