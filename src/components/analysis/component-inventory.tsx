import { Badge } from "@/components/ui/badge";

interface Component {
  id: string;
  type: string;
  styleDescription: string | null;
  position: string | null;
  complexity: string | null;
  frequency: number | null;
}

export function ComponentInventory({
  components,
}: {
  components: Component[];
}) {
  if (components.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No components detected yet. Run analysis first.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {components.map((comp) => (
        <div key={comp.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm capitalize">
              {comp.type.replace(/_/g, " ")}
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
            <p className="text-xs text-muted-foreground">
              {comp.styleDescription}
            </p>
          )}
          <div className="flex gap-2">
            {comp.position && (
              <Badge variant="outline" className="text-xs capitalize">
                {comp.position.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
