import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TemplateSection } from "@/types/report";

interface TemplateInventoryProps {
  templates: TemplateSection[];
  notes?: string | null;
  clientView?: boolean;
}

const MAX_TEMPLATES_CLIENT = 15;

export function TemplateInventory({
  templates,
  notes,
  clientView,
}: TemplateInventoryProps) {
  const sorted = [...templates].sort(
    (a, b) => (b.pageCount ?? 0) - (a.pageCount ?? 0)
  );

  const displayTemplates = clientView
    ? sorted.slice(0, MAX_TEMPLATES_CLIENT)
    : sorted;
  const hiddenTemplates = clientView
    ? sorted.slice(MAX_TEMPLATES_CLIENT)
    : [];
  const hiddenPageCount = hiddenTemplates.reduce(
    (sum, t) => sum + (t.pageCount ?? 0),
    0
  );

  return (
    <section id="template-inventory">
      <h2 className="text-2xl font-bold mb-2">Template Inventory</h2>
      <p className="text-muted-foreground mb-6">
        {templates.length} unique templates identified across the site
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            {template.representativeScreenshot && (
              <div className="aspect-video bg-muted overflow-hidden border-b">
                <img
                  src={template.representativeScreenshot}
                  alt={template.displayName ?? template.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="truncate">
                {template.displayName ?? template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {template.pageCount}{" "}
                  {template.pageCount === 1 ? "page" : "pages"}
                </span>
                {template.complexity && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {template.complexity}
                  </span>
                )}
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {template.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {hiddenTemplates.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          + {hiddenTemplates.length} more templates covering {hiddenPageCount} pages
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
