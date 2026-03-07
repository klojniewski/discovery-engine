import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const allProjects = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your website migration audits
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <FolderPlus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {allProjects.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first project to start analyzing a website.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {allProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">{project.clientName}</p>
                <p className="text-sm text-muted-foreground">{project.websiteUrl}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{project.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {project.createdAt.toLocaleDateString("en-GB")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
