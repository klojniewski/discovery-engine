export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4">Migration Audit Report</h1>
      <p className="text-muted-foreground">Report: {shareId}</p>
      <p className="text-sm text-muted-foreground mt-2">
        Public report viewer coming soon.
      </p>
    </div>
  );
}
