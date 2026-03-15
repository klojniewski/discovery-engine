"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { runPsiForPage } from "@/actions/seo";

export function PsiRerunButton({ pageId }: { pageId: string }) {
  const [running, setRunning] = useState(false);

  return (
    <button
      disabled={running}
      onClick={async (e) => {
        e.stopPropagation();
        setRunning(true);
        await runPsiForPage(pageId);
        window.location.reload();
      }}
      className="inline-flex items-center justify-center rounded-md h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none"
      title="Re-run PSI for this page"
    >
      <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
    </button>
  );
}
