"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Check, X, RefreshCw, Loader2, Star } from "lucide-react";
import { renameTemplate, getTemplatePages, recaptureTemplateScreenshot, setRepresentativePage } from "@/actions/analysis";

interface Template {
  id: string;
  name: string;
  displayName: string | null;
  confidence: string | null;
  pageCount: number | null;
  description: string | null;
  complexity: string | null;
  urlPattern: string | null;
  representativePageId: string | null;
  representativeScreenshot?: string | null;
}

interface TemplatePage {
  id: string;
  url: string;
  title: string | null;
}

export function TemplateClusters({ templates }: { templates: Template[] }) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [modalPages, setModalPages] = useState<TemplatePage[] | null>(null);
  const [modalTemplate, setModalTemplate] = useState<string | null>(null);
  const [modalTemplateId, setModalTemplateId] = useState<string | null>(null);
  const [representatives, setRepresentatives] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const t of templates) map[t.id] = t.representativePageId;
    return map;
  });
  const [isPending, startTransition] = useTransition();
  const [recapturing, setRecapturing] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates detected yet. Run analysis first.
      </p>
    );
  }

  function startEdit(template: Template) {
    setEditing(template.id);
    setEditValue(names[template.id] || template.displayName || template.name);
  }

  function saveEdit(templateId: string) {
    const newName = editValue.trim();
    if (!newName) return;
    setNames((prev) => ({ ...prev, [templateId]: newName }));
    setEditing(null);
    startTransition(async () => {
      await renameTemplate(templateId, newName);
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function handleRecapture(templateId: string) {
    setRecapturing(templateId);
    try {
      const newUrl = await recaptureTemplateScreenshot(templateId);
      setScreenshots((prev) => ({ ...prev, [templateId]: newUrl }));
    } catch (err) {
      console.error("Recapture failed:", err);
    } finally {
      setRecapturing(null);
    }
  }

  function showPages(template: Template) {
    setModalTemplate(names[template.id] || template.displayName || template.name);
    setModalTemplateId(template.id);
    startTransition(async () => {
      const pages = await getTemplatePages(template.id);
      setModalPages(pages);
    });
  }

  function handleSetRepresentative(templateId: string, pageId: string) {
    setRepresentatives((prev) => ({ ...prev, [templateId]: pageId }));
    startTransition(async () => {
      await setRepresentativePage(templateId, pageId);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates
          .sort((a, b) => {
            const aName = (names[a.id] || a.displayName || a.name).toLowerCase();
            const bName = (names[b.id] || b.displayName || b.name).toLowerCase();
            if (aName === "homepage") return -1;
            if (bName === "homepage") return 1;
            return aName.localeCompare(bName);
          })
          .map((template) => {
            const displayName =
              names[template.id] || template.displayName || template.name;

            return (
              <div
                key={template.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="aspect-video rounded-md overflow-hidden bg-muted relative group">
                  {(screenshots[template.id] || template.representativeScreenshot) ? (
                    <img
                      src={screenshots[template.id] || template.representativeScreenshot!}
                      alt={displayName}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <svg className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={() => handleRecapture(template.id)}
                    disabled={recapturing === template.id}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background disabled:opacity-100"
                    title={screenshots[template.id] || template.representativeScreenshot ? "Recapture screenshot" : "Capture screenshot"}
                  >
                    {recapturing === template.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    {editing === template.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(template.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(template.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-muted-foreground hover:bg-muted rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-sm">{displayName}</h4>
                        <button
                          onClick={() => startEdit(template)}
                          className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                          title="Rename template"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <button onClick={() => showPages(template)}>
                      <Badge
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-muted"
                      >
                        {template.pageCount} pages
                      </Badge>
                    </button>
                  </div>
                  {template.urlPattern && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {template.urlPattern}
                    </span>
                  )}
                  {template.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {template.complexity && (
                      <Badge variant="outline" className="text-xs">
                        {template.complexity}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Pages modal */}
      <Dialog
        open={modalPages !== null}
        onOpenChange={() => setModalPages(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalTemplate} Pages</DialogTitle>
          </DialogHeader>
          {modalPages && (
            <div className="space-y-1">
              {modalPages.map((page) => {
                const isRep = modalTemplateId
                  ? representatives[modalTemplateId] === page.id
                  : false;
                return (
                  <div
                    key={page.id}
                    className={`flex items-start gap-2 rounded-md p-2 hover:bg-muted text-sm group ${isRep ? "bg-muted/50 ring-1 ring-primary/20" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      {page.title && (
                        <div className="text-sm font-medium truncate" title={page.title}>
                          {page.title.length > 50 ? page.title.slice(0, 50) + "..." : page.title}
                        </div>
                      )}
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-muted-foreground hover:text-primary truncate block"
                        title={page.url}
                      >
                        {(() => {
                          try {
                            const { hostname, pathname, search } = new URL(page.url);
                            const full = hostname + pathname + search;
                            return full.length > 60
                              ? full.slice(0, 57) + "..."
                              : full;
                          } catch {
                            return page.url.length > 60
                              ? page.url.slice(0, 57) + "..."
                              : page.url;
                          }
                        })()}
                      </a>
                    </div>
                    <button
                      onClick={() => modalTemplateId && handleSetRepresentative(modalTemplateId, page.id)}
                      className={`shrink-0 p-1 rounded transition-colors ${isRep ? "text-primary" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-primary"}`}
                      title={isRep ? "Current representative" : "Set as representative page"}
                    >
                      <Star className={`h-3.5 w-3.5 ${isRep ? "fill-current" : ""}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
