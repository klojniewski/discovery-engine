export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Project Overview</h2>
      <p className="text-muted-foreground">Project ID: {id}</p>
      <p className="text-sm text-muted-foreground mt-2">
        Project details will appear here once the database is connected.
      </p>
    </div>
  );
}
