"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe,
  Loader2,
  Copy,
  Check,
  EyeOff,
  Link as LinkIcon,
} from "lucide-react";
import { publishReport, unpublishReport } from "@/actions/report";
import { useRouter } from "next/navigation";

interface PublishButtonProps {
  projectId: string;
  shareId: string | null;
  isPublished: boolean;
}

export function PublishButton({
  projectId,
  shareId,
  isPublished,
}: PublishButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const shareUrl = shareId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/reports/${shareId}`
    : null;

  function handlePublish() {
    startTransition(async () => {
      await publishReport(projectId, password || undefined);
      setShowModal(false);
      router.refresh();
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      await unpublishReport(projectId);
      router.refresh();
    });
  }

  function handleCopy() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isPublished && shareUrl) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-green-50 px-3 py-2 text-sm">
          <Globe className="h-4 w-4 text-green-600" />
          <span className="text-green-800 font-medium">Published</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-mono text-xs">
          <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[300px]">{shareUrl}</span>
          <button
            onClick={handleCopy}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnpublish}
          disabled={isPending}
        >
          <EyeOff className="h-3.5 w-3.5 mr-1" />
          Unpublish
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Globe className="h-4 w-4 mr-2" />
        Publish Report
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Publish Report</h3>
            <p className="text-sm text-muted-foreground">
              This will create a public link anyone can access.
            </p>
            <div className="space-y-2">
              <Label htmlFor="report-password">
                Password protection (optional)
              </Label>
              <Input
                id="report-password"
                type="text"
                placeholder="Leave empty for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
