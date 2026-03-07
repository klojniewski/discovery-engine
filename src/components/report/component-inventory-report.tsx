import { Badge } from "@/components/ui/badge";

interface ComponentData {
  type: string;
  count: number;
  complexity: string | null;
  position: string | null;
  styleDescription: string | null;
  screenshotUrl: string | null;
}

const POSITION_CROP: Record<string, string> = {
  header: "top",
  above_fold: "top",
  mid_page: "center",
  below_fold: "70% 0",
  footer: "bottom",
};

export function ComponentInventoryReport({
  components,
  notes,
}: {
  components: ComponentData[];
  notes?: string | null;
}) {
  const totalInstances = components.reduce((sum, c) => sum + c.count, 0);

  return (
    <section id="component-inventory" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Components</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {components.length} unique component types detected across{" "}
          {totalInstances} instances
        </p>
      </div>

      {notes && (
        <div className="rounded-lg border bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Summary by complexity */}
      <div className="grid grid-cols-3 gap-4">
        {(["complex", "moderate", "simple"] as const).map((level) => {
          const count = components.filter((c) => c.complexity === level).length;
          return (
            <div key={level} className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {level}
              </p>
            </div>
          );
        })}
      </div>

      {/* Component grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {components.map((comp) => {
          const crop = POSITION_CROP[comp.position ?? "mid_page"] ?? "center";
          return (
            <div
              key={comp.type}
              className="rounded-lg border overflow-hidden"
            >
              {comp.screenshotUrl && (
                <div className="relative h-28 bg-muted overflow-hidden border-b">
                  <img
                    src={comp.screenshotUrl}
                    alt={`${comp.type} component`}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: crop }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm capitalize">
                    {comp.type.replace(/_/g, " ")}
                    {comp.count > 1 && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({comp.count})
                      </span>
                    )}
                  </h4>
                  {comp.complexity && (
                    <Badge
                      variant={
                        comp.complexity === "complex"
                          ? "destructive"
                          : comp.complexity === "moderate"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {comp.complexity}
                    </Badge>
                  )}
                </div>
                {comp.styleDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {comp.styleDescription}
                  </p>
                )}
                {comp.position && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {comp.position.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
