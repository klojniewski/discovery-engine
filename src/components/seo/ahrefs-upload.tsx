"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadAhrefsCsv, clearAhrefsData } from "@/actions/seo";

interface AhrefsUploadStatus {
  topPages?: { rowCount: number; matchedCount: number; uploadedAt: string };
  bestLinks?: { rowCount: number; matchedCount: number; uploadedAt: string };
}

interface UploadResult {
  fileType: string;
  rowCount: number;
  matchedCount: number;
  unmatchedCount: number;
  parseErrors: number;
  error?: string;
}

export function AhrefsUpload({
  projectId,
  uploadStatus,
}: {
  projectId: string;
  uploadStatus: AhrefsUploadStatus | undefined;
}) {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      setError(null);
      const newResults: UploadResult[] = [];

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const result = await uploadAhrefsCsv(projectId, formData);
          if (result.error) {
            setError(result.error);
          } else {
            newResults.push(result as UploadResult);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Upload failed"
          );
        }
      }

      setResults(newResults);
      setUploading(false);
      // Refresh page to update status cards
      if (newResults.length > 0) {
        window.location.reload();
      }
    },
    [projectId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleClear = async (fileType: "top_pages" | "best_links") => {
    await clearAhrefsData(projectId, fileType);
    window.location.reload();
  };

  const fileTypeLabel = (ft: string) =>
    ft === "top_pages" ? "Top Pages" : "Best by Links";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ahrefs Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current upload status */}
        <div className="flex flex-wrap gap-2">
          {uploadStatus?.topPages ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Top Pages: {uploadStatus.topPages.matchedCount}/
                {uploadStatus.topPages.rowCount} matched
              </Badge>
              <button
                onClick={() => handleClear("top_pages")}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            </div>
          ) : (
            <Badge variant="outline">Top Pages: Not uploaded</Badge>
          )}
          {uploadStatus?.bestLinks ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Best by Links: {uploadStatus.bestLinks.matchedCount}/
                {uploadStatus.bestLinks.rowCount} matched
              </Badge>
              <button
                onClick={() => handleClear("best_links")}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            </div>
          ) : (
            <Badge variant="outline">Best by Links: Not uploaded</Badge>
          )}
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <p className="text-sm text-muted-foreground mb-2">
            {uploading
              ? "Uploading..."
              : "Drop Ahrefs CSV/TSV files here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Accepts Top Pages and Best by Links exports. Auto-detects file type.
          </p>
          <input
            type="file"
            accept=".csv,.tsv"
            multiple
            id="ahrefs-upload"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("ahrefs-upload")?.click()}
          >
            {uploading ? "Processing..." : "Choose Files"}
          </Button>
        </div>

        {/* Results */}
        {results.map((r, i) => (
          <div
            key={i}
            className="text-sm bg-muted/50 rounded-md p-3"
          >
            <p className="font-medium">
              Detected: {fileTypeLabel(r.fileType)}
            </p>
            <p className="text-muted-foreground">
              {r.rowCount} rows, {r.matchedCount} matched (
              {Math.round((r.matchedCount / r.rowCount) * 100)}%)
              {r.unmatchedCount > 0 && (
                <span>
                  , {r.unmatchedCount} unmatched
                </span>
              )}
              {r.parseErrors > 0 && (
                <span className="text-amber-600">
                  , {r.parseErrors} parse errors
                </span>
              )}
            </p>
            {r.matchedCount / r.rowCount < 0.7 && (
              <p className="text-amber-600 text-xs mt-1">
                Low match rate. Ensure the export is for this domain.
              </p>
            )}
          </div>
        ))}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
