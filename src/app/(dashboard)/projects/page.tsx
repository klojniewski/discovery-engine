import Link from "next/link";
import { FolderPlus } from "lucide-react";

export default function ProjectsPage() {
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
    </div>
  );
}
