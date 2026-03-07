import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  displayName: string | null;
  confidence: string | null;
  pageCount: number | null;
  description: string | null;
  complexity: string | null;
  representativeScreenshot?: string | null;
}

export function TemplateClusters({ templates }: { templates: Template[] }) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates detected yet. Run analysis first.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates
        .sort((a, b) => (b.pageCount ?? 0) - (a.pageCount ?? 0))
        .map((template) => (
          <div key={template.id} className="rounded-lg border p-4 space-y-3">
            {template.representativeScreenshot && (
              <div className="aspect-video rounded-md overflow-hidden bg-muted">
                <img
                  src={template.representativeScreenshot}
                  alt={template.displayName ?? template.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">
                  {template.displayName ?? template.name}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {template.pageCount} pages
                </Badge>
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {template.description}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {template.confidence && (
                  <Badge
                    variant={
                      template.confidence === "high"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {template.confidence}
                  </Badge>
                )}
                {template.complexity && (
                  <Badge variant="outline" className="text-xs">
                    {template.complexity}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
