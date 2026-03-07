import { getProject } from "@/actions/projects";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) return notFound();

  const settings = project.settings as {
    pageLimit?: number;
    notes?: string;
    excludePaths?: string[];
  } | null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{project.clientName}</h2>
        <p className="text-muted-foreground">{project.websiteUrl}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge variant="outline" className="mt-1">{project.status}</Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Client Email</p>
          <p className="text-sm mt-1">{project.clientEmail}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Page Limit</p>
          <p className="text-sm mt-1">{settings?.pageLimit ?? 500}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="text-sm mt-1">{project.createdAt.toLocaleDateString("en-GB")}</p>
        </div>
      </div>

      {settings?.excludePaths && settings.excludePaths.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Excluded Paths</p>
          <div className="flex flex-wrap gap-1">
            {settings.excludePaths.map((path) => (
              <Badge key={path} variant="secondary" className="font-mono text-xs">
                {path}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {settings?.notes && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Notes</p>
          <p className="text-sm">{settings.notes}</p>
        </div>
      )}
    </div>
  );
}
