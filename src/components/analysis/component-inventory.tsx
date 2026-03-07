"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Component {
  id: string;
  type: string;
  styleDescription: string | null;
  position: string | null;
  complexity: string | null;
  frequency: number | null;
  sourceScreenshotUrl: string | null;
}

// Map position to CSS crop region (top percentage of screenshot to show)
const POSITION_CROP: Record<string, { objectPosition: string }> = {
  header: { objectPosition: "top" },
  above_fold: { objectPosition: "top" },
  mid_page: { objectPosition: "center" },
  below_fold: { objectPosition: "70% 0" },
  footer: { objectPosition: "bottom" },
};

const COMPLEXITY_ORDER = { complex: 0, moderate: 1, simple: 2 };

export function ComponentInventory({
  components,
}: {
  components: Component[];
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (components.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No components detected yet. Run analysis first.
      </p>
    );
  }

  // Group by type
  const groups = new Map<string, Component[]>();
  for (const comp of components) {
    const key = comp.type;
    const group = groups.get(key) ?? [];
    group.push(comp);
    groups.set(key, group);
  }

  // Sort groups: complex first, then by count
  const sortedGroups = [...groups.entries()].sort((a, b) => {
    const maxComplexityA = Math.min(
      ...a[1].map((c) => COMPLEXITY_ORDER[c.complexity as keyof typeof COMPLEXITY_ORDER] ?? 1)
    );
    const maxComplexityB = Math.min(
      ...b[1].map((c) => COMPLEXITY_ORDER[c.complexity as keyof typeof COMPLEXITY_ORDER] ?? 1)
    );
    if (maxComplexityA !== maxComplexityB) return maxComplexityA - maxComplexityB;
    return b[1].length - a[1].length;
  });

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Pick best representative for a group (prefer one with screenshot, highest complexity)
  const getRepresentative = (group: Component[]) => {
    return [...group].sort((a, b) => {
      if (a.sourceScreenshotUrl && !b.sourceScreenshotUrl) return -1;
      if (!a.sourceScreenshotUrl && b.sourceScreenshotUrl) return 1;
      return (COMPLEXITY_ORDER[a.complexity as keyof typeof COMPLEXITY_ORDER] ?? 1) -
        (COMPLEXITY_ORDER[b.complexity as keyof typeof COMPLEXITY_ORDER] ?? 1);
    })[0];
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {sortedGroups.length} unique component types detected across {components.length} instances
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedGroups.map(([type, group]) => {
          const rep = getRepresentative(group);
          const isExpanded = expandedGroups.has(type);
          const crop = POSITION_CROP[rep.position ?? "mid_page"] ?? POSITION_CROP.mid_page;

          return (
            <div key={type} className="rounded-lg border overflow-hidden">
              {/* Screenshot crop */}
              {rep.sourceScreenshotUrl && (
                <div className="relative h-32 bg-muted overflow-hidden border-b">
                  <img
                    src={rep.sourceScreenshotUrl}
                    alt={`${type} component`}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: crop.objectPosition }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
                </div>
              )}

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm capitalize">
                    {type.replace(/_/g, " ")}
                    {group.length > 1 && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({group.length})
                      </span>
                    )}
                  </h4>
                  {rep.complexity && (
                    <Badge
                      variant={
                        rep.complexity === "complex"
                          ? "destructive"
                          : rep.complexity === "moderate"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {rep.complexity}
                    </Badge>
                  )}
                </div>

                {rep.styleDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {rep.styleDescription}
                  </p>
                )}

                {rep.position && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {rep.position.replace(/_/g, " ")}
                  </Badge>
                )}

                {/* Expand to see variants */}
                {group.length > 1 && (
                  <div>
                    <button
                      onClick={() => toggleGroup(type)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {group.length - 1} more variant{group.length > 2 ? "s" : ""}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-2 border-t pt-2">
                        {group
                          .filter((c) => c.id !== rep.id)
                          .map((variant) => (
                            <div key={variant.id} className="text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground capitalize">
                                  {variant.position?.replace(/_/g, " ") ?? "unknown"}
                                </span>
                                {variant.complexity && (
                                  <Badge
                                    variant={
                                      variant.complexity === "complex"
                                        ? "destructive"
                                        : variant.complexity === "moderate"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {variant.complexity}
                                  </Badge>
                                )}
                              </div>
                              {variant.styleDescription && (
                                <p className="text-muted-foreground line-clamp-1">
                                  {variant.styleDescription}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
