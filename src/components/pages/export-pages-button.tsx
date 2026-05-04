"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectPagesForExport } from "@/actions/projects";

export function ExportPagesButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    try {
      const allPages = await getProjectPagesForExport(projectId);
      const header = "URL,Title,Word Count";
      const rows = allPages.map((p) => {
        const title = (p.title ?? "").replace(/"/g, '""');
        return `"${p.url}","${title}",${p.wordCount ?? ""}`;
      });
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${slug}-pages-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
      {exporting ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-1" />
      )}
      {exporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
