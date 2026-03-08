"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/actions/projects";
import { useActionState } from "react";

interface ProjectFormProps {
  mode: "create" | "edit";
  projectId?: string;
  defaults?: {
    websiteUrl: string;
    clientName: string;
    clientEmail: string;
    pageLimit: number;
    excludePaths: string[];
    notes: string;
  };
}

export function ProjectForm({ mode, projectId, defaults }: ProjectFormProps) {
  function formAction(_prevState: { error: string } | null, formData: FormData) {
    if (mode === "edit" && projectId) {
      return updateProject(projectId, formData) as Promise<{ error: string } | null>;
    }
    return createProject(formData) as Promise<{ error: string } | null>;
  }

  const [state, action, isPending] = useActionState(formAction, null);

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="url">Website URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://example.com"
          defaultValue={defaults?.websiteUrl}
          required
          disabled={mode === "edit"}
        />
        {mode === "create" && (
          <p className="text-xs text-muted-foreground">
            The website to crawl and analyze for migration planning.
          </p>
        )}
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">
            URL cannot be changed after project creation.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            name="clientName"
            placeholder="Acme Corp"
            defaultValue={defaults?.clientName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientEmail">Client Email</Label>
          <Input
            id="clientEmail"
            name="clientEmail"
            type="email"
            placeholder="contact@acme.com"
            defaultValue={defaults?.clientEmail}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageLimit">Page Limit</Label>
        <Input
          id="pageLimit"
          name="pageLimit"
          type="number"
          defaultValue={defaults?.pageLimit ?? 500}
          min={10}
          max={2000}
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of pages to crawl (default: 500).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excludePaths">Exclude Paths</Label>
        <Textarea
          id="excludePaths"
          name="excludePaths"
          placeholder={"/blog/.*\n/news/.*\n/tag/.*"}
          defaultValue={defaults?.excludePaths?.join("\n")}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          URL path patterns to exclude from crawling (one per line, regex supported).
          E.g. <code className="text-xs">/blog/.*</code> excludes all blog pages.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any additional context about the project..."
          defaultValue={defaults?.notes}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? mode === "edit"
            ? "Saving..."
            : "Creating..."
          : mode === "edit"
            ? "Save Changes"
            : "Create Project"}
      </Button>
    </form>
  );
}
