import Link from "next/link";
import { getProject } from "@/actions/projects";
import { getProjectCosts } from "@/actions/costs";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Cpu, ArrowRight, Pencil } from "lucide-react";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, costs] = await Promise.all([
    getProject(id),
    getProjectCosts(id),
  ]);

  if (!project) return notFound();

  const settings = project.settings as {
    pageLimit?: number;
    notes?: string;
    excludePaths?: string[];
  } | null;

  const STEP_LABELS: Record<string, string> = {
    classification: "Classification",
    scoring: "Content Scoring",
    sections: "Section Detection",
    report: "Report Generation",
    unknown: "Other",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{project.clientName}</h2>
          <p className="text-muted-foreground">{project.websiteUrl}</p>
        </div>
        <Link
          href={`/projects/${id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
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

      {/* API Cost Tracking */}
      {costs.callCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">API Usage</h3>
          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Total Cost</span>
                </div>
                <p className="text-lg font-bold tabular-nums">
                  ${costs.totalCostUsd.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Cpu className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">API Calls</span>
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {costs.callCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Tokens</span>
                </div>
                <p className="text-lg font-bold tabular-nums">
                  {((costs.totalInputTokens + costs.totalOutputTokens) / 1000).toFixed(0)}k
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border overflow-hidden max-w-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Step</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Calls</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody>
                {costs.byStep
                  .sort((a, b) => b.costUsd - a.costUsd)
                  .map((s) => (
                    <tr key={s.step} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        {STEP_LABELS[s.step] ?? s.step}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {s.callCount}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {((s.inputTokens + s.outputTokens) / 1000).toFixed(0)}k
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        ${s.costUsd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
