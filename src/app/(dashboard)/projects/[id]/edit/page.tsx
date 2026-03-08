import { getProject } from "@/actions/projects";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";

export default async function EditProjectPage({
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
    <div className="max-w-xl">
      <h2 className="text-xl font-bold mb-6">Edit Project</h2>
      <ProjectForm
        mode="edit"
        projectId={project.id}
        defaults={{
          websiteUrl: project.websiteUrl,
          clientName: project.clientName,
          clientEmail: project.clientEmail,
          pageLimit: settings?.pageLimit ?? 500,
          excludePaths: settings?.excludePaths ?? [],
          notes: settings?.notes ?? "",
        }}
      />
    </div>
  );
}
